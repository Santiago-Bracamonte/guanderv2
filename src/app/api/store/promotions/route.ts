import { NextRequest, NextResponse } from "next/server";
import { queryD1 } from "@/lib/cloudflare-d1";
import { ensureBenefitStoreTable } from "@/lib/benefit-store";
import { getStoreOwnerContext } from "@/lib/store-owner-context";

type PromotionInput = {
  idBenefitStore?: number;
  description?: string;
  reqPoint?: number;
  percentage?: number;
};

function toSafeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function toNonNegativeInt(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
}

function toPercentage(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) return null;
  return parsed;
}

export async function GET() {
  const auth = await getStoreOwnerContext();
  if (!auth.ok) return auth.response;

  await ensureBenefitStoreTable();

  const { context } = auth;

  const promotions = await queryD1<{
    id_benefit_store: number;
    description: string;
    req_point: number;
    percentage: number;
  }>(
    `SELECT id_benefit_store, description, req_point, percentage
     FROM benefit_store
     WHERE fk_store = ?
     ORDER BY id_benefit_store DESC`,
    [context.storeId],
    { revalidate: false },
  );

  return NextResponse.json({ success: true, data: promotions });
}

export async function POST(request: NextRequest) {
  const auth = await getStoreOwnerContext();
  if (!auth.ok) return auth.response;

  await ensureBenefitStoreTable();

  const { context } = auth;

  let body: PromotionInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON invalido" }, { status: 400 });
  }

  const description = toSafeText(body.description, 300);
  const reqPoint = toNonNegativeInt(body.reqPoint);
  const percentage = toPercentage(body.percentage);

  if (!description || reqPoint === null || percentage === null) {
    return NextResponse.json(
      { error: "description, reqPoint y percentage son obligatorios" },
      { status: 400 },
    );
  }

  await queryD1(
    `INSERT INTO benefit_store (description, req_point, percentage, fk_store)
     VALUES (?, ?, ?, ?)`,
    [description, reqPoint, percentage, context.storeId],
    { revalidate: false },
  );

  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest) {
  const auth = await getStoreOwnerContext();
  if (!auth.ok) return auth.response;

  await ensureBenefitStoreTable();

  const { context } = auth;

  let body: PromotionInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON invalido" }, { status: 400 });
  }

  const idBenefitStore = toNonNegativeInt(body.idBenefitStore);
  const description = toSafeText(body.description, 300);
  const reqPoint = toNonNegativeInt(body.reqPoint);
  const percentage = toPercentage(body.percentage);

  if (!idBenefitStore || !description || reqPoint === null || percentage === null) {
    return NextResponse.json(
      { error: "idBenefitStore, description, reqPoint y percentage son obligatorios" },
      { status: 400 },
    );
  }

  const existing = await queryD1<{ id_benefit_store: number }>(
    `SELECT id_benefit_store
     FROM benefit_store
     WHERE id_benefit_store = ?
       AND fk_store = ?
     LIMIT 1`,
    [idBenefitStore, context.storeId],
    { revalidate: false },
  );

  if (existing.length === 0) {
    return NextResponse.json(
      { error: "Promocion no encontrada o no pertenece a tu local" },
      { status: 404 },
    );
  }

  await queryD1(
    `UPDATE benefit_store
     SET description = ?, req_point = ?, percentage = ?
     WHERE id_benefit_store = ?
       AND fk_store = ?`,
    [description, reqPoint, percentage, idBenefitStore, context.storeId],
    { revalidate: false },
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await getStoreOwnerContext();
  if (!auth.ok) return auth.response;

  await ensureBenefitStoreTable();

  const { context } = auth;

  const { searchParams } = new URL(request.url);
  const idBenefitStore = toNonNegativeInt(searchParams.get("idBenefitStore"));

  if (!idBenefitStore) {
    return NextResponse.json({ error: "idBenefitStore es obligatorio" }, { status: 400 });
  }

  const existing = await queryD1<{ id_benefit_store: number }>(
    `SELECT id_benefit_store
     FROM benefit_store
     WHERE id_benefit_store = ?
       AND fk_store = ?
     LIMIT 1`,
    [idBenefitStore, context.storeId],
    { revalidate: false },
  );

  if (existing.length === 0) {
    return NextResponse.json(
      { error: "Promocion no encontrada o no pertenece a tu local" },
      { status: 404 },
    );
  }

  await queryD1(
    `DELETE FROM benefit_store
     WHERE id_benefit_store = ?
       AND fk_store = ?`,
    [idBenefitStore, context.storeId],
    { revalidate: false },
  );

  return NextResponse.json({ success: true });
}
