import { NextRequest, NextResponse } from "next/server";
import { queryD1 } from "@/lib/cloudflare-d1";
import { getStoreOwnerContext } from "@/lib/store-owner-context";

type ConsumptionInputItem = {
  idProfessional?: number;
  quantity?: number;
  unitAmount?: number;
};

type ConsumptionInput = {
  customerEmail?: string;
  couponCode?: string;
  items?: ConsumptionInputItem[];
};

function toPositiveInt(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function toPositiveAmount(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Number(parsed.toFixed(2));
}

function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function buildConsumptionCode(): string {
  const random = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  return `GUANDER-${random}`;
}

export async function POST(request: NextRequest) {
  const auth = await getStoreOwnerContext();
  if (!auth.ok) return auth.response;

  const { context } = auth;

  let body: ConsumptionInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON invalido" }, { status: 400 });
  }

  const customerEmail = normalizeEmail(body.customerEmail);
  const couponCodeRaw = typeof body.couponCode === "string" ? body.couponCode.trim() : null;
  const items = Array.isArray(body.items) ? body.items : [];

  if (items.length === 0) {
    return NextResponse.json(
      { error: "Debes agregar al menos un servicio al consumo" },
      { status: 400 },
    );
  }

  const parsedItems = items
    .map((item) => ({
      idProfessional: toPositiveInt(item.idProfessional),
      quantity: toPositiveInt(item.quantity),
      unitAmount: toPositiveAmount(item.unitAmount),
    }))
    .filter(
      (item): item is { idProfessional: number; quantity: number; unitAmount: number } =>
        item.idProfessional !== null && item.quantity !== null && item.unitAmount !== null,
    );

  if (parsedItems.length !== items.length) {
    return NextResponse.json(
      { error: "Cada servicio debe tener idProfessional, quantity y unitAmount validos" },
      { status: 400 },
    );
  }

  const uniqueProfessionalIds = [...new Set(parsedItems.map((item) => item.idProfessional))];
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
    [context.storeSubId, ...uniqueProfessionalIds],
    { revalidate: false },
  );

  if (availableServices.length !== uniqueProfessionalIds.length) {
    return NextResponse.json(
      { error: "Uno o mas servicios no existen o no pertenecen a tu local" },
      { status: 400 },
    );
  }

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
    [customerEmail],
    { revalidate: false },
  );

  const customer = customerRows[0];
  const resolvedCustomerName = customer
    ? `${customer.name} ${customer.last_name}`.trim()
    : "Cliente sin registrar";
  const resolvedCustomerEmail = customer?.email ?? customerEmail;

  const servicesById = new Map(
    availableServices.map((service) => [service.id_professional, service]),
  );

  const normalizedItems = parsedItems.map((item) => {
    const service = servicesById.get(item.idProfessional)!;
    const lineTotal = Number((item.quantity * item.unitAmount).toFixed(2));
    const pointsEarn = service.accept_point ? Math.floor(lineTotal / 1000) : 0;

    return {
      idProfessional: item.idProfessional,
      serviceName: service.service_name,
      quantity: item.quantity,
      unitAmount: item.unitAmount,
      lineTotal,
      pointsEarn,
      acceptPoint: service.accept_point === 1,
    };
  });

  const subtotal = Number(
    normalizedItems.reduce((acc, item) => acc + item.lineTotal, 0).toFixed(2),
  );

  // ── Coupon discount ───────────────────────────────────────────────────────
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
      [couponCodeRaw, context.storeId],
      { revalidate: false },
    );
    if (couponRows[0]) {
      appliedCoupon = couponRows[0];
      // amount is stored as a percentage (1–100)
      couponDiscount = Number((subtotal * appliedCoupon.amount / 100).toFixed(2));
    }
  }

  const finalAmount = Number((subtotal - couponDiscount).toFixed(2));

  // Recalculate points on the discounted eligible base
  const pointEligibleBase = normalizedItems.reduce(
    (acc, item) => (item.acceptPoint ? acc + item.lineTotal : acc),
    0,
  );
  const pointEligibleAfterDiscount =
    subtotal > 0
      ? Math.max(0, pointEligibleBase - couponDiscount * (pointEligibleBase / subtotal))
      : 0;
  const pointsEarn = Math.floor(pointEligibleAfterDiscount / 1000);
  const consumptionCode = buildConsumptionCode();

  // ── Persist coupon usage ──────────────────────────────────────────────────
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
      { revalidate: false },
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
      ],
      { revalidate: false },
    );
  }

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
      currency: "COP",
    },
    services: normalizedItems,
  };

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
}
