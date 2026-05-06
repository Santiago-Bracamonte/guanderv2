import { NextRequest, NextResponse } from "next/server";
import { queryD1 } from "@/lib/cloudflare-d1";
import { ensureBenefitStoreTable } from "@/lib/benefit-store";
import { getStoreOwnerContext } from "@/lib/store-owner-context";
import {
  promotionCreateSchema,
  promotionDeleteSchema,
  promotionUpdateSchema,
} from "@/lib/validation/store";
import { parseJson, parseSearchParams } from "@/lib/validation/parse";

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

  const parsed = await parseJson(request, promotionCreateSchema, "Datos inválidos");
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { description, reqPoint, percentage } = parsed.data;

  await queryD1(
    `INSERT INTO benefit_store (description, req_point, percentage, fk_store)
     VALUES (?, ?, ?, ?)`,
    [description, reqPoint, percentage, context.storeId] as any[],
    { revalidate: false },
  );

  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest) {
  const auth = await getStoreOwnerContext();
  if (!auth.ok) return auth.response;

  await ensureBenefitStoreTable();

  const { context } = auth;

  const parsed = await parseJson(request, promotionUpdateSchema, "Datos inválidos");
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { idBenefitStore, description, reqPoint, percentage } = parsed.data;

  const existing = await queryD1<{ id_benefit_store: number }>(
    `SELECT id_benefit_store
     FROM benefit_store
     WHERE id_benefit_store = ?
       AND fk_store = ?
     LIMIT 1`,
    [idBenefitStore, context.storeId] as any[],
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
    [description, reqPoint, percentage, idBenefitStore, context.storeId] as any[],
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
  const parsed = parseSearchParams(
    { idBenefitStore: searchParams.get("idBenefitStore") },
    promotionDeleteSchema,
    "Datos inválidos",
  );
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { idBenefitStore } = parsed.data;

  const existing = await queryD1<{ id_benefit_store: number }>(
    `SELECT id_benefit_store
     FROM benefit_store
     WHERE id_benefit_store = ?
       AND fk_store = ?
     LIMIT 1`,
    [idBenefitStore, context.storeId] as any[],
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
    [idBenefitStore, context.storeId] as any[],
    { revalidate: false },
  );

  return NextResponse.json({ success: true });
}
