import { NextRequest, NextResponse } from "next/server";
import { queryD1 } from "@/lib/cloudflare-d1";
import { getStoreOwnerContext } from "@/lib/store-owner-context";
import {
  couponCreateSchema,
  couponDeleteSchema,
  couponUpdateSchema,
} from "@/lib/validation/store";
import { parseJson, parseSearchParams } from "@/lib/validation/parse";

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

async function generateUniqueCode(table: "coupon_store" | "coupon_prof" = "coupon_store"): Promise<string> {
  for (let i = 0; i < 5; i += 1) {
    const candidate = randomCode();
    const existing = await queryD1<{ id_coupon: number }>(
      `SELECT id_coupon FROM ${table} WHERE code_coupon = ? LIMIT 1`,
      [candidate] as any[],
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
  table: "coupon_store" | "coupon_prof",
  idCouponToExclude?: number,
): Promise<string> {
  for (let i = 0; i < 6; i += 1) {
    const candidate = i === 0 ? desiredCode : randomCode();
    const existing = await queryD1<{ id_coupon: number }>(
      `SELECT id_coupon FROM ${table} WHERE code_coupon = ? LIMIT 1`,
      [candidate] as any[],
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
  const isProf = context.role === "professional" && context.professionalId;

  try {
    const couponsQuery = isProf
    ? queryD1<{
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
          cp.id_coupon,
          cp.name,
          cp.description,
          cp.expiration_date,
          cp.point_req,
          cp.code_coupon,
          cp.amount,
          cp.fk_coupon_state,
          1 AS state,
          cst.name AS coupon_state_name,
          0 AS redemptions
        FROM coupon_prof cp
        LEFT JOIN coupon_state cst ON cst.id_coupon_state = cp.fk_coupon_state
        WHERE cp.fk_professional_id = ?
        ORDER BY cp.id_coupon DESC`,
        [context.professionalId] as any[],
        { revalidate: false },
      )
    : queryD1<{
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
        [context.storeId] as any[],
        { revalidate: false },
      );

    const [coupons, couponStates] = await Promise.all([
      couponsQuery,
      queryD1<{ id_coupon_state: number; name: string; description: string }>(
        "SELECT id_coupon_state, name, description FROM coupon_state ORDER BY id_coupon_state ASC",
        [],
        { revalidate: false },
      ),
    ]);

  const table = isProf ? "coupon_prof" : "coupon_store";
  const ownerCol = isProf ? "fk_professional_id" : "fk_store";
  const ownerId = isProf ? context.professionalId : context.storeId;

    const normalizedCoupons = [];
    for (const coupon of coupons) {
      let normalizedCode = coupon.code_coupon;

      if (!/^GUANDER-[A-Z0-9]+$/.test(coupon.code_coupon)) {
        const desiredCode = normalizeCouponCode(coupon.code_coupon);
        normalizedCode = await ensureUniqueCouponCode(desiredCode, table, coupon.id_coupon);

        await queryD1(
          `UPDATE ${table} SET code_coupon = ? WHERE id_coupon = ? AND ${ownerCol} = ?`,
          [normalizedCode, coupon.id_coupon, ownerId] as any[],
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
  } catch (error) {
    console.error("GET /api/store/coupons error:", error);
    return NextResponse.json(
      { error: "No se pudieron cargar los cupones" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await getStoreOwnerContext();
  if (!auth.ok) return auth.response;

  const { context } = auth;
  const isProf = context.role === "professional" && context.professionalId;
  const table = isProf ? "coupon_prof" : "coupon_store";

  const parsed = await parseJson(request, couponCreateSchema, "Datos inválidos");
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const {
    name,
    description,
    expirationDate,
    pointReq,
    amount,
    codeCoupon: explicitCode,
    couponStateId: couponStateIdRaw,
    enabled,
  } = parsed.data;

  const couponStateId = couponStateIdRaw ?? (await findDefaultCouponStateId());
  if (!couponStateId) {
    return NextResponse.json(
      { error: "No existe configuracion de estados de cupon (coupon_state)" },
      { status: 400 },
    );
  }

  let codeCoupon = explicitCode ?? "";
  if (!codeCoupon.trim()) {
    codeCoupon = await generateUniqueCode(table);
  } else {
    codeCoupon = normalizeCouponCode(codeCoupon);
  }

  codeCoupon = await ensureUniqueCouponCode(codeCoupon, table);

  try {
    if (isProf) {
      await queryD1(
        `INSERT INTO coupon_prof (
          name,
          description,
          expiration_date,
          point_req,
          code_coupon,
          amount,
          fk_professional_id,
          fk_coupon_state
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          description,
          expirationDate,
          pointReq,
          codeCoupon,
          amount,
          context.professionalId,
          couponStateId,
        ] as any[],
        { revalidate: false },
      );
    } else {
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
          enabled === false ? 0 : 1,
          expirationDate,
          pointReq,
          codeCoupon,
          amount,
          context.storeId,
          couponStateId,
        ] as any[],
        { revalidate: false },
      );
    }

    return NextResponse.json({ success: true, codeCoupon });
  } catch (error) {
    console.error("POST /api/store/coupons error:", error);
    return NextResponse.json(
      { error: "No se pudo crear el cupon" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await getStoreOwnerContext();
  if (!auth.ok) return auth.response;

  const { context } = auth;
  const isProf = context.role === "professional" && context.professionalId;
  const table = isProf ? "coupon_prof" : "coupon_store";
  const ownerCol = isProf ? "fk_professional_id" : "fk_store";
  const ownerId = isProf ? context.professionalId : context.storeId;

  const parsed = await parseJson(request, couponUpdateSchema, "Datos inválidos");
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const {
    idCoupon,
    name,
    description,
    expirationDate,
    pointReq,
    amount,
    couponStateId,
    codeCoupon: explicitCode,
    enabled,
  } = parsed.data;

  try {
    const existing = await queryD1<{ id_coupon: number; code_coupon: string }>(
      `SELECT id_coupon, code_coupon FROM ${table} WHERE id_coupon = ? AND ${ownerCol} = ? LIMIT 1`,
      [idCoupon, ownerId] as any[],
      { revalidate: false },
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Cupon no encontrado o no te pertenece" },
        { status: 404 },
      );
    }

    let codeCoupon = explicitCode ?? "";
    if (!codeCoupon.trim()) {
      codeCoupon = existing[0].code_coupon || (await generateUniqueCode(table));
    } else {
      codeCoupon = normalizeCouponCode(codeCoupon);
    }

    // AQUI ESTABA EL ERROR: Cambiado de [] a () y limpiado el ownerId
    codeCoupon = await ensureUniqueCouponCode(codeCoupon, table, Number(idCoupon));

    if (isProf) {
      await queryD1(
        `UPDATE coupon_prof
         SET name = ?,
             description = ?,
             expiration_date = ?,
             point_req = ?,
             code_coupon = ?,
             amount = ?,
             fk_coupon_state = ?
         WHERE id_coupon = ?
           AND fk_professional_id = ?`,
        [name, description, expirationDate, pointReq, codeCoupon, amount, couponStateId, idCoupon, ownerId] as any[],
        { revalidate: false },
      );
    } else {
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
          enabled === false ? 0 : 1,
          expirationDate,
          pointReq,
          codeCoupon,
          amount,
          couponStateId,
          idCoupon,
          context.storeId,
        ] as any[],
        { revalidate: false },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/store/coupons error:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el cupon" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await getStoreOwnerContext();
  if (!auth.ok) return auth.response;

  const { context } = auth;
  const isProf = context.role === "professional" && context.professionalId;
  const table = isProf ? "coupon_prof" : "coupon_store";
  const ownerCol = isProf ? "fk_professional_id" : "fk_store";
  const ownerId = isProf ? context.professionalId : context.storeId;

  const { searchParams } = new URL(request.url);
  const parsed = parseSearchParams(
    { idCoupon: searchParams.get("idCoupon") },
    couponDeleteSchema,
    "Datos inválidos",
  );
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { idCoupon } = parsed.data;

  try {
    const existing = await queryD1<{ id_coupon: number }>(
      `SELECT id_coupon FROM ${table} WHERE id_coupon = ? AND ${ownerCol} = ? LIMIT 1`,
      [idCoupon, ownerId] as any[],
      { revalidate: false },
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Cupon no encontrado o no te pertenece" },
        { status: 404 },
      );
    }

    await queryD1(
      `DELETE FROM ${table} WHERE id_coupon = ? AND ${ownerCol} = ?`,
      [idCoupon, ownerId] as any[],
      { revalidate: false },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/store/coupons error:", error);
    return NextResponse.json(
      { error: "No se pudo eliminar el cupon" },
      { status: 500 },
    );
  }
}