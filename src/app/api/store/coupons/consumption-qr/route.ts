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
  const items = Array.isArray(body.items) ? body.items : [];

  if (!customerEmail) {
    return NextResponse.json({ error: "El email del cliente es obligatorio" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customerEmail)) {
    return NextResponse.json({ error: "Email de cliente invalido" }, { status: 400 });
  }

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
  const pointsEarn = normalizedItems.reduce((acc, item) => acc + item.pointsEarn, 0);
  const consumptionCode = buildConsumptionCode();

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
    summary: {
      subtotal,
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
      pointsEarn,
      services: normalizedItems,
      qrPayload,
    },
  });
}
