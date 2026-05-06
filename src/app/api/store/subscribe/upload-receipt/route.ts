import { NextRequest, NextResponse } from "next/server";
import { getStoreOwnerContext } from "@/lib/store-owner-context";
import { queryD1 } from "@/lib/cloudflare-d1";
import { ensureSubPayoutTable, ensureStoreSubPayoutColumn } from "@/lib/sub-payouts";
import { uploadReceiptSchema } from "@/lib/validation/store";
import { parseJson } from "@/lib/validation/parse";

export async function POST(request: NextRequest) {
  const ctx = await getStoreOwnerContext();
  if (!ctx.ok) return ctx.response;
  const userId = ctx.context.userId;
  const storeSubId = ctx.context.storeSubId;

  const parsed = await parseJson(request, uploadReceiptSchema, "Datos inválidos");
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { proofUrl, description } = parsed.data;

  await ensureSubPayoutTable();
  await ensureStoreSubPayoutColumn();

  // Insert pending sub_payout record
  const date = new Date().toISOString();
  
  await queryD1(
    `INSERT INTO sub_payout (date, amount, description, proof_url, status, fk_store_sub, fk_user) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [date, 0, description || "Pago manual subido", proofUrl, "pending", storeSubId, userId]
  );

  // Optionally change the state_payout of the store_sub to pending
  await queryD1(
    "UPDATE store_sub SET state_payout = ? WHERE id_store_sub = ?",
    ["pending_approval", storeSubId]
  );

  return NextResponse.json({ success: true, message: "Comprobante subido y pendiente de aprobación." });
}