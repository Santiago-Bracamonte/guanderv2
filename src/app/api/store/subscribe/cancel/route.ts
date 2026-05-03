import { NextRequest, NextResponse } from "next/server";
import { getStoreOwnerContext } from "@/lib/store-owner-context";
import { queryD1 } from "@/lib/cloudflare-d1";
import { ensureStoreSubPayoutColumn } from "@/lib/sub-payouts";

export async function POST(request: NextRequest) {
  const ctx = await getStoreOwnerContext();
  if (!ctx.ok) return ctx.response;
  
  const storeId = ctx.context.storeId;
  
  try {
    await ensureStoreSubPayoutColumn();
    // Buscar la suscripción de este local
    const storeRows = await queryD1<{ fk_store_sub_id: number }>(
      "SELECT fk_store_sub_id FROM stores WHERE id_store = ? LIMIT 1",
      [storeId],
      { revalidate: false }
    );
    
    if (storeRows.length === 0) {
      return NextResponse.json({ error: "Local no encontrado." }, { status: 404 });
    }
    
    const storeSubId = storeRows[0].fk_store_sub_id;
    
    // Buscar el plan más barato/gratis (usualmente id=1 o el de menor amount)
    const cheapPlanRows = await queryD1<{ id_subscription: number }>(
      "SELECT id_subscription FROM subscription ORDER BY amount ASC LIMIT 1",
      [],
      { revalidate: false }
    );
    
    const targetPlanId = cheapPlanRows.length > 0 ? cheapPlanRows[0].id_subscription : 1;
    
    // Actualizar el registro a cancelado y asignarle el plan gratuito
    // Alternativamente, sólo podríamos marcar state_payout = 'cancelado' sin cambiar el plan,
    // pero si cancelan se asume que al menos pierden los beneficios, o que su pago cesa y su estado es "cancelado"
    await queryD1(
      "UPDATE store_sub SET state_payout = 'cancelado', fk_subscription_id = ? WHERE id_store_sub = ?",
      [targetPlanId, storeSubId]
    );

    return NextResponse.json({ success: true, message: "Suscripción cancelada correctamente." });
  } catch (error) {
    console.error("Error al cancelar la suscripción:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
