import { NextRequest, NextResponse } from "next/server";
import { queryD1 } from "@/lib/cloudflare-d1";
import { getStoreOwnerContext } from "@/lib/store-owner-context";
import { consumptionQrSchema } from "@/lib/validation/store";
import { parseJson } from "@/lib/validation/parse";

function buildConsumptionCode(): string {
  const random = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  return `GUANDER-${random}`;
}

// ── Controlador Principal POST ────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // 1. Validar contexto y autenticación del negocio
    const auth = await getStoreOwnerContext();
    if (!auth.ok) return auth.response;

    const { context } = auth;

    // 2. Validar cuerpo de la petición
    const parsed = await parseJson(request, consumptionQrSchema, "Datos inválidos");
    if (!parsed.data) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { customerEmail, couponCode, items } = parsed.data;
    const couponCodeRaw = couponCode?.trim() ?? null;
    const parsedItems = items;
    const normalizedEmail = customerEmail ?? "";

    // 4. Validar que los servicios existan y pertenezcan al local
    const uniqueProfessionalIds = [...new Set(parsedItems.map((item: any) => Number(item.idProfessional)))];
    const placeholders = uniqueProfessionalIds.map(() => "?").join(", ");

    const availableServices = await queryD1<{
      id_professional: number;
      service_name: string;
      accept_point: number;
    }>(
      `SELECT
        p.id_professional,
        ts.name AS service_name,
        p.accept_point
      FROM professionals p
      INNER JOIN type_service ts ON ts.id_type_service = p.fk_type_service
      WHERE p.fk_store_sub_id = ?
        AND p.id_professional IN (${placeholders})`,
      [context.storeSubId, ...uniqueProfessionalIds] as any[],
      { revalidate: false }
    );

    if (availableServices.length !== uniqueProfessionalIds.length) {
      return NextResponse.json(
        { error: "Uno o más servicios no existen o no pertenecen a tu local" },
        { status: 400 }
      );
    }

    // 5. Buscar datos del cliente (si está registrado)
    const customerRows = await queryD1<{
      id_customer: number;
      name: string;
      last_name: string;
      email: string;
    }>(
      `SELECT
        c.id_customer,
        ud.name,
        ud.last_name,
        ud.email
      FROM customer c
      INNER JOIN users u ON u.id_user = c.fk_user
      INNER JOIN user_data ud ON ud.id_user_data = u.fk_user_data
      WHERE LOWER(ud.email) = ?
      LIMIT 1`,
      [normalizedEmail] as any[],
      { revalidate: false }
    );

    const customer = customerRows[0];
    const resolvedCustomerName = customer
      ? `${customer.name} ${customer.last_name}`.trim()
      : "Cliente sin registrar";
    const resolvedCustomerEmail = customer?.email ?? normalizedEmail;

    // 6. Normalizar datos, calcular subtotales y puntos por línea
    const servicesById = new Map(
      availableServices.map((service) => [service.id_professional, service])
    );

    // FIX: Agregamos : any al item y forzamos a Number para que TypeScript no arroje error
    const normalizedItems = parsedItems.map((item: any) => {
      const idProf = Number(item.idProfessional);
      const service = servicesById.get(idProf)!;
      
      const qty = Number(item.quantity);
      const unitAmt = Number(item.unitAmount);
      const lineTotal = Number((qty * unitAmt).toFixed(2));
      
      const pointsEarn = service.accept_point ? Math.floor(lineTotal / 1000) : 0;

      return {
        idProfessional: idProf,
        serviceName: service.service_name,
        quantity: qty,
        unitAmount: unitAmt,
        lineTotal,
        pointsEarn,
        acceptPoint: service.accept_point === 1,
      };
    });

    const subtotal = Number(
      normalizedItems.reduce((acc, item) => acc + item.lineTotal, 0).toFixed(2)
    );

    // 7. Lógica de Descuentos (Cupones)
    let couponDiscount = 0;
    let appliedCoupon: { id_coupon: number; name: string; amount: number } | null = null;
    
    if (couponCodeRaw) {
      const couponRows = await queryD1<{ id_coupon: number; name: string; amount: number }>(
        `SELECT id_coupon, name, amount
         FROM coupon_store
         WHERE code_coupon = ?
           AND fk_store = ?
           AND state = 1
           AND DATE(expiration_date) >= DATE('now')
         LIMIT 1`,
        [couponCodeRaw, context.storeId] as any[], // FIX: Agregado as any[]
        { revalidate: false }
      );
      
      if (couponRows[0]) {
        appliedCoupon = couponRows[0];
        // El amount es un porcentaje (1–100)
        couponDiscount = Number(((subtotal * appliedCoupon.amount) / 100).toFixed(2));
      }
    }

    const finalAmount = Number((subtotal - couponDiscount).toFixed(2));

    // 8. Recalcular PetPoints sobre el monto final elegible
    const pointEligibleBase = normalizedItems.reduce(
      (acc, item) => (item.acceptPoint ? acc + item.lineTotal : acc),
      0
    );
    const pointEligibleAfterDiscount =
      subtotal > 0
        ? Math.max(0, pointEligibleBase - couponDiscount * (pointEligibleBase / subtotal))
        : 0;
        
    const pointsEarn = Math.floor(pointEligibleAfterDiscount / 1000);
    const consumptionCode = buildConsumptionCode();

    // 9. Persistir el uso del cupón en la base de datos (si aplica)
    if (appliedCoupon) {
      await queryD1(
        `CREATE TABLE IF NOT EXISTS coupon_usage_log (
          id_usage         INTEGER PRIMARY KEY AUTOINCREMENT,
          fk_coupon_id     INTEGER NOT NULL,
          fk_store_id      INTEGER NOT NULL,
          consumption_code TEXT    NOT NULL,
          customer_email   TEXT,
          customer_name    TEXT,
          subtotal         REAL    NOT NULL,
          discount_amount  REAL    NOT NULL,
          final_amount     REAL    NOT NULL,
          used_at          TEXT    NOT NULL DEFAULT (datetime('now'))
        )`,
        [],
        { revalidate: false }
      );
      
      await queryD1(
        `INSERT INTO coupon_usage_log
           (fk_coupon_id, fk_store_id, consumption_code, customer_email, customer_name, subtotal, discount_amount, final_amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          appliedCoupon.id_coupon,
          context.storeId,
          consumptionCode,
          resolvedCustomerEmail || null,
          resolvedCustomerName || null,
          subtotal,
          couponDiscount,
          finalAmount,
        ] as any[], // FIX: Agregado as any[]
        { revalidate: false }
      );
    }

    // 10. Construir el Payload del QR final
    const qrPayload = {
      source: "guander-store-consumption",
      generatedAt: new Date().toISOString(),
      consumptionCode,
      storeId: context.storeId,
      customer: {
        idCustomer: customer?.id_customer ?? null,
        email: resolvedCustomerEmail,
        name: resolvedCustomerName,
      },
      coupon: appliedCoupon
        ? {
            id: appliedCoupon.id_coupon,
            name: appliedCoupon.name,
            discount: couponDiscount,
          }
        : null,
      summary: {
        subtotal,
        discountAmount: couponDiscount,
        finalAmount,
        pointsEarn,
        currency: "COP", // Ajusta la moneda si es necesario (ej. "ARS", "EUR")
      },
      services: normalizedItems,
    };

    // 11. Retornar la respuesta exitosa
    return NextResponse.json({
      success: true,
      data: {
        consumptionCode,
        customerName: resolvedCustomerName,
        customerEmail: resolvedCustomerEmail,
        subtotal,
        discountAmount: couponDiscount,
        finalAmount,
        pointsEarn,
        services: normalizedItems,
        qrPayload,
      },
    });

  } catch (error) {
    console.error("Error en consumption-qr:", error);
    return NextResponse.json(
      { error: "Ocurrió un error interno al procesar el consumo." },
      { status: 500 }
    );
  }
}