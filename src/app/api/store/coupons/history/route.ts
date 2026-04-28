import { NextResponse } from "next/server";
import { queryD1 } from "@/lib/cloudflare-d1";
import { getStoreOwnerContext } from "@/lib/store-owner-context";

export async function GET() {
  const auth = await getStoreOwnerContext();
  if (!auth.ok) return auth.response;

  const { context } = auth;

  // Emitted coupons — all coupons ever created for this store
  const emitted = await queryD1<{
    id_coupon: number;
    name: string;
    description: string;
    code_coupon: string;
    amount: number;
    expiration_date: string;
    state: number;
    point_req: number;
    coupon_state_name: string;
  }>(
    `SELECT
       cs.id_coupon,
       cs.name,
       cs.description,
       cs.code_coupon,
       cs.amount,
       cs.expiration_date,
       cs.state,
       cs.point_req,
       cst.name AS coupon_state_name
     FROM coupon_store cs
     LEFT JOIN coupon_state cst ON cst.id_coupon_state = cs.fk_coupon_state
     WHERE cs.fk_store = ?
     ORDER BY cs.id_coupon DESC`,
    [context.storeId],
    { revalidate: false },
  );

  // Used coupons — from coupon_usage_log (table may not exist yet)
  let used: {
    id_usage: number;
    fk_coupon_id: number;
    coupon_name: string;
    code_coupon: string;
    consumption_code: string;
    customer_email: string | null;
    customer_name: string | null;
    subtotal: number;
    discount_amount: number;
    final_amount: number;
    used_at: string;
  }[] = [];

  try {
    used = await queryD1<{
      id_usage: number;
      fk_coupon_id: number;
      coupon_name: string;
      code_coupon: string;
      consumption_code: string;
      customer_email: string | null;
      customer_name: string | null;
      subtotal: number;
      discount_amount: number;
      final_amount: number;
      used_at: string;
    }>(
      `SELECT
         ul.id_usage,
         ul.fk_coupon_id,
         cs.name  AS coupon_name,
         cs.code_coupon,
         ul.consumption_code,
         ul.customer_email,
         ul.customer_name,
         ul.subtotal,
         ul.discount_amount,
         ul.final_amount,
         ul.used_at
       FROM coupon_usage_log ul
       LEFT JOIN coupon_store cs ON cs.id_coupon = ul.fk_coupon_id
       WHERE ul.fk_store_id = ?
       ORDER BY ul.used_at DESC`,
      [context.storeId],
      { revalidate: false },
    );
  } catch {
    // table hasn't been created yet — return empty array
    used = [];
  }

  return NextResponse.json({ emitted, used });
}
