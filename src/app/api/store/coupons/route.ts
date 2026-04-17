import { NextRequest, NextResponse } from "next/server";
import { queryD1 } from "@/lib/cloudflare-d1";
import { getStoreOwnerContext } from "@/lib/store-owner-context";

type CouponInput = {
  idCoupon?: number;
  name?: string;
  description?: string;
  expirationDate?: string;
  pointReq?: number;
  amount?: number;
  codeCoupon?: string;
  couponStateId?: number;
  enabled?: boolean;
};

function toSafeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function toPositiveInt(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function toNonNegativeInt(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
}

function toPositiveAmount(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Number(parsed.toFixed(2));
}

function normalizeDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;

  const date = new Date(`${trimmed}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;

  return trimmed;
}

function toCodeChunk(value: string, fallback: string): string {
  const cleaned = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);
  return cleaned || fallback;
}

function randomCodeChunk(length = 8): string {
  const random = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "");
  return random.slice(0, length);
}

function normalizeCouponCode(inputCode: string): string {
  const base = inputCode.toUpperCase().trim();
  const rawChunk = base.startsWith("GUANDER-") ? base.slice(8) : base;
  const chunk = toCodeChunk(rawChunk, randomCodeChunk(8));
  return `GUANDER-${chunk}`;
}

function randomCode(): string {
  return `GUANDER-${randomCodeChunk(8)}`;
}

async function findDefaultCouponStateId(): Promise<number | null> {
  const preferred = await queryD1<{ id_coupon_state: number }>(
    `SELECT id_coupon_state
     FROM coupon_state
     WHERE LOWER(name) IN ('activo', 'active')
     LIMIT 1`,
    [],
    { revalidate: false },
  );

  if (preferred[0]?.id_coupon_state) {
    return preferred[0].id_coupon_state;
  }

  const fallback = await queryD1<{ id_coupon_state: number }>(
    "SELECT id_coupon_state FROM coupon_state ORDER BY id_coupon_state ASC LIMIT 1",
    [],
    { revalidate: false },
  );

  return fallback[0]?.id_coupon_state ?? null;
}

async function generateUniqueCode(): Promise<string> {
  for (let i = 0; i < 5; i += 1) {
    const candidate = randomCode();
    const existing = await queryD1<{ id_coupon: number }>(
      "SELECT id_coupon FROM coupon_store WHERE code_coupon = ? LIMIT 1",
      [candidate],
      { revalidate: false },
    );
    if (existing.length === 0) {
      return candidate;
    }
  }

  throw new Error("No se pudo generar un codigo de cupon unico");
}

async function ensureUniqueCouponCode(
  desiredCode: string,
  idCouponToExclude?: number,
): Promise<string> {
  for (let i = 0; i < 6; i += 1) {
    const candidate = i === 0 ? desiredCode : randomCode();
    const existing = await queryD1<{ id_coupon: number }>(
      "SELECT id_coupon FROM coupon_store WHERE code_coupon = ? LIMIT 1",
      [candidate],
      { revalidate: false },
    );

    if (
      existing.length === 0 ||
      (idCouponToExclude && existing[0].id_coupon === idCouponToExclude)
    ) {
      return candidate;
    }
  }

  throw new Error("No se pudo generar un codigo unico para el cupon");
}

export async function GET() {
  const auth = await getStoreOwnerContext();
  if (!auth.ok) return auth.response;

  const { context } = auth;

  const [coupons, couponStates] = await Promise.all([
    queryD1<{
      id_coupon: number;
      name: string;
      description: string;
      expiration_date: string;
      point_req: number;
      code_coupon: string;
      amount: number;
      fk_coupon_state: number;
      state: number;
      coupon_state_name: string | null;
      redemptions: number;
    }>(
      `SELECT
        cs.id_coupon,
        cs.name,
        cs.description,
        cs.expiration_date,
        cs.point_req,
        cs.code_coupon,
        cs.amount,
        cs.fk_coupon_state,
        cs.state,
        cst.name AS coupon_state_name,
        COALESCE(cbs.redemptions, 0) AS redemptions
      FROM coupon_store cs
      LEFT JOIN coupon_state cst ON cst.id_coupon_state = cs.fk_coupon_state
      LEFT JOIN (
        SELECT fk_coupon_id, COUNT(*) AS redemptions
        FROM coupon_buy_store
        GROUP BY fk_coupon_id
      ) cbs ON cbs.fk_coupon_id = cs.id_coupon
      WHERE cs.fk_store = ?
      ORDER BY cs.id_coupon DESC`,
      [context.storeId],
      { revalidate: false },
    ),
    queryD1<{ id_coupon_state: number; name: string; description: string }>(
      "SELECT id_coupon_state, name, description FROM coupon_state ORDER BY id_coupon_state ASC",
      [],
      { revalidate: false },
    ),
  ]);

  const normalizedCoupons = [];
  for (const coupon of coupons) {
    let normalizedCode = coupon.code_coupon;

    if (!/^GUANDER-[A-Z0-9]+$/.test(coupon.code_coupon)) {
      const desiredCode = normalizeCouponCode(coupon.code_coupon);
      normalizedCode = await ensureUniqueCouponCode(desiredCode, coupon.id_coupon);

      await queryD1(
        `UPDATE coupon_store
         SET code_coupon = ?
         WHERE id_coupon = ?
           AND fk_store = ?`,
        [normalizedCode, coupon.id_coupon, context.storeId],
        { revalidate: false },
      );
    }

    normalizedCoupons.push({
      ...coupon,
      code_coupon: normalizedCode,
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      coupons: normalizedCoupons,
      couponStates,
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await getStoreOwnerContext();
  if (!auth.ok) return auth.response;

  const { context } = auth;

  let body: CouponInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON invalido" }, { status: 400 });
  }

  const name = toSafeText(body.name, 120);
  const description = toSafeText(body.description, 350);
  const expirationDate = normalizeDate(body.expirationDate);
  const pointReq = toNonNegativeInt(body.pointReq);
  const amount = toPositiveAmount(body.amount);
  const explicitCode = toSafeText(body.codeCoupon, 80);

  if (!name || !description || !expirationDate || pointReq === null || amount === null) {
    return NextResponse.json(
      { error: "name, description, expirationDate, pointReq y amount son obligatorios" },
      { status: 400 },
    );
  }

  const couponStateId = toPositiveInt(body.couponStateId) ?? (await findDefaultCouponStateId());
  if (!couponStateId) {
    return NextResponse.json(
      { error: "No existe configuracion de estados de cupon (coupon_state)" },
      { status: 400 },
    );
  }

  let codeCoupon = explicitCode;
  if (!codeCoupon) {
    codeCoupon = await generateUniqueCode();
  } else {
    codeCoupon = normalizeCouponCode(codeCoupon);
  }

  codeCoupon = await ensureUniqueCouponCode(codeCoupon);

  await queryD1(
    `INSERT INTO coupon_store (
      name,
      description,
      state,
      expiration_date,
      point_req,
      code_coupon,
      amount,
      fk_store,
      fk_coupon_state
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      description,
      body.enabled === false ? 0 : 1,
      expirationDate,
      pointReq,
      codeCoupon,
      amount,
      context.storeId,
      couponStateId,
    ],
    { revalidate: false },
  );

  return NextResponse.json({ success: true, codeCoupon });
}

export async function PUT(request: NextRequest) {
  const auth = await getStoreOwnerContext();
  if (!auth.ok) return auth.response;

  const { context } = auth;

  let body: CouponInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON invalido" }, { status: 400 });
  }

  const idCoupon = toPositiveInt(body.idCoupon);
  const name = toSafeText(body.name, 120);
  const description = toSafeText(body.description, 350);
  const expirationDate = normalizeDate(body.expirationDate);
  const pointReq = toNonNegativeInt(body.pointReq);
  const amount = toPositiveAmount(body.amount);
  const couponStateId = toPositiveInt(body.couponStateId);
  const explicitCode = toSafeText(body.codeCoupon, 80);

  if (
    !idCoupon ||
    !name ||
    !description ||
    !expirationDate ||
    pointReq === null ||
    amount === null ||
    !couponStateId
  ) {
    return NextResponse.json(
      {
        error:
          "idCoupon, name, description, expirationDate, pointReq, amount y couponStateId son obligatorios",
      },
      { status: 400 },
    );
  }

  const existing = await queryD1<{ id_coupon: number; code_coupon: string }>(
    `SELECT id_coupon
            , code_coupon
     FROM coupon_store
     WHERE id_coupon = ?
       AND fk_store = ?
     LIMIT 1`,
    [idCoupon, context.storeId],
    { revalidate: false },
  );

  if (existing.length === 0) {
    return NextResponse.json(
      { error: "Cupon no encontrado o no pertenece a tu local" },
      { status: 404 },
    );
  }

  let codeCoupon = explicitCode;
  if (!codeCoupon) {
    codeCoupon = existing[0].code_coupon || (await generateUniqueCode());
  } else {
    codeCoupon = normalizeCouponCode(codeCoupon);
  }

  codeCoupon = await ensureUniqueCouponCode(codeCoupon, idCoupon);

  await queryD1(
    `UPDATE coupon_store
     SET name = ?,
         description = ?,
         state = ?,
         expiration_date = ?,
         point_req = ?,
         code_coupon = ?,
         amount = ?,
         fk_coupon_state = ?
     WHERE id_coupon = ?
       AND fk_store = ?`,
    [
      name,
      description,
      body.enabled === false ? 0 : 1,
      expirationDate,
      pointReq,
      codeCoupon,
      amount,
      couponStateId,
      idCoupon,
      context.storeId,
    ],
    { revalidate: false },
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await getStoreOwnerContext();
  if (!auth.ok) return auth.response;

  const { context } = auth;

  const { searchParams } = new URL(request.url);
  const idCoupon = toPositiveInt(searchParams.get("idCoupon"));

  if (!idCoupon) {
    return NextResponse.json({ error: "idCoupon es obligatorio" }, { status: 400 });
  }

  const existing = await queryD1<{ id_coupon: number }>(
    `SELECT id_coupon
     FROM coupon_store
     WHERE id_coupon = ?
       AND fk_store = ?
     LIMIT 1`,
    [idCoupon, context.storeId],
    { revalidate: false },
  );

  if (existing.length === 0) {
    return NextResponse.json(
      { error: "Cupon no encontrado o no pertenece a tu local" },
      { status: 404 },
    );
  }

  await queryD1(
    `DELETE FROM coupon_store
     WHERE id_coupon = ?
       AND fk_store = ?`,
    [idCoupon, context.storeId],
    { revalidate: false },
  );

  return NextResponse.json({ success: true });
}
