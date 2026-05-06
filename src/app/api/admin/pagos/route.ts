import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { queryD1 } from "@/lib/cloudflare-d1";
import { ensureSubPayoutTable, ensureStoreSubPayoutColumn } from "@/lib/sub-payouts";
import { pagosActionSchema } from "@/lib/validation/admin";
import { parseJson } from "@/lib/validation/parse";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureSubPayoutTable();
    await ensureStoreSubPayoutColumn();
    const payouts = await queryD1(
      `SELECT
         sp.id_sub_payout,
         sp.date,
         sp.amount,
         sp.description,
         sp.proof_url,
         sp.status,
         sp.fk_store_sub,
         sp.fk_user,
         u.username,
         COALESCE(st.name, ts.name) as store_name,
         sub.name as subscription_name
       FROM sub_payout sp
       JOIN users u ON sp.fk_user = u.id_user
       JOIN store_sub ssub ON sp.fk_store_sub = ssub.id_store_sub
       LEFT JOIN stores st ON st.fk_store_sub_id = ssub.id_store_sub
       LEFT JOIN professionals pr ON pr.fk_store_sub_id = ssub.id_store_sub AND st.id_store IS NULL
       LEFT JOIN type_service ts ON ts.id_type_service = pr.fk_type_service
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
    const parsed = await parseJson(request, pagosActionSchema, "Datos inválidos");
    if (!parsed.data) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { action, id_sub_payout, id_store_sub } = parsed.data;

    if (action === "approve") {
      // Approve payout
      await queryD1(
        "UPDATE sub_payout SET status = 'approved' WHERE id_sub_payout = ?",
        [id_sub_payout] as any[]
      );
      
      // Update store_sub
      // Typically we'd update expiration date and upgrade_date too, but basic is to set status
      await queryD1(
        "UPDATE store_sub SET state_payout = 'paid' WHERE id_store_sub = ?",
        [id_store_sub] as any[]
      );
      
      return NextResponse.json({ success: true, message: "Pago aprobado" });
    } else if (action === "reject") {
      await queryD1(
        "UPDATE sub_payout SET status = 'rejected' WHERE id_sub_payout = ?",
        [id_sub_payout] as any[]
      );
      return NextResponse.json({ success: true, message: "Pago rechazado" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
