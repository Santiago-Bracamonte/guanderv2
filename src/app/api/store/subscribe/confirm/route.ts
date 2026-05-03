import { NextRequest, NextResponse } from "next/server";
import { queryD1 } from "@/lib/cloudflare-d1";
import { getStoreOwnerContext } from "@/lib/store-owner-context";
import { ensureSubPayoutTable, ensureStoreSubPayoutColumn } from "@/lib/sub-payouts";

type MpPayment = {
  status: string;
  transaction_amount: number;
  metadata?: { store_id?: number; plan_id?: number };
};

export async function GET(request: NextRequest) {
  const ctx = await getStoreOwnerContext();
  if (!ctx.ok) return ctx.response;

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Payment gateway not configured." },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get("payment_id");
  if (!paymentId) {
    return NextResponse.json({ error: "payment_id requerido" }, { status: 400 });
  }

  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!mpRes.ok) {
    const text = await mpRes.text();
    return NextResponse.json(
      { error: `No se pudo validar el pago: ${text.slice(0, 200)}` },
      { status: 502 },
    );
  }

  const payment = (await mpRes.json()) as MpPayment;
  if (payment.status !== "approved") {
    return NextResponse.json(
      { error: `Pago no aprobado (${payment.status})` },
      { status: 400 },
    );
  }

  const planId = Number(payment.metadata?.plan_id);
  const storeId = Number(payment.metadata?.store_id);
  if (!Number.isFinite(planId) || !Number.isFinite(storeId)) {
    return NextResponse.json(
      { error: "Metadata de pago incompleta" },
      { status: 400 },
    );
  }

  if (storeId !== ctx.context.storeId) {
    return NextResponse.json(
      { error: "El pago no corresponde a este local" },
      { status: 403 },
    );
  }

  await ensureSubPayoutTable();
  await ensureStoreSubPayoutColumn();

  const today = new Date();
  const newExpiry = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  newExpiry.setUTCMonth(newExpiry.getUTCMonth() + 1);

  await queryD1(
    `UPDATE store_sub
     SET fk_subscription_id = ?,
         upgrade_date = ?,
         expiration_date = ?,
         state_payout = 'paid'
     WHERE id_store_sub = ?`,
    [
      planId,
      today.toISOString().slice(0, 10),
      newExpiry.toISOString().slice(0, 10),
      ctx.context.storeSubId,
    ],
    { revalidate: false },
  );

  await queryD1(
    `INSERT INTO sub_payout (date, amount, description, fk_store_sub, fk_user, status)
     VALUES (?, ?, ?, ?, ?, 'approved')`,
    [
      today.toISOString().slice(0, 10),
      Math.round(payment.transaction_amount ?? 0),
      `Pago MercadoPago ${paymentId}`,
      ctx.context.storeSubId,
      ctx.context.userId,
    ],
    { revalidate: false },
  );

  return NextResponse.json({ success: true });
}
