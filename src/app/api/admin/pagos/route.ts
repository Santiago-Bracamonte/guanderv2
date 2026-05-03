import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { queryD1 } from "@/lib/cloudflare-d1";
import { ensureSubPayoutTable, ensureStoreSubPayoutColumn } from "@/lib/sub-payouts";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureSubPayoutTable();
    await ensureStoreSubPayoutColumn();
    const payouts = await queryD1(
      `SELECT sp.*, u.username, st.name as store_name, sub.name as subscription_name 
       FROM sub_payout sp 
       JOIN users u ON sp.fk_user = u.id_user 
       JOIN store_sub ssub ON sp.fk_store_sub = ssub.id_store_sub
       JOIN stores st ON st.fk_store_sub_id = ssub.id_store_sub
       JOIN subscription sub ON ssub.fk_subscription_id = sub.id_subscription
       ORDER BY sp.id_sub_payout DESC`
    );
    return NextResponse.json({ payouts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureSubPayoutTable();
    await ensureStoreSubPayoutColumn();
    const { action, id_sub_payout, id_store_sub } = await request.json();

    if (action === "approve") {
      // Approve payout
      await queryD1(
        "UPDATE sub_payout SET status = 'approved' WHERE id_sub_payout = ?",
        [id_sub_payout]
      );
      
      // Update store_sub
      // Typically we'd update expiration date and upgrade_date too, but basic is to set status
      await queryD1(
        "UPDATE store_sub SET state_payout = 'paid' WHERE id_store_sub = ?",
        [id_store_sub]
      );
      
      return NextResponse.json({ success: true, message: "Pago aprobado" });
    } else if (action === "reject") {
      await queryD1(
        "UPDATE sub_payout SET status = 'rejected' WHERE id_sub_payout = ?",
        [id_sub_payout]
      );
      return NextResponse.json({ success: true, message: "Pago rechazado" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
