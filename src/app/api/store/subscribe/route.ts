import { NextRequest, NextResponse } from "next/server";
import { getStoreOwnerContext } from "@/lib/store-owner-context";
import { subscriptionPreferenceSchema } from "@/lib/validation/store";
import { parseJson } from "@/lib/validation/parse";

type PreferenceItem = {
  id: string;
  title: string;
  description: string;
  quantity: number;
  currency_id: string;
  unit_price: number;
};

type MPPreferenceBody = {
  items: PreferenceItem[];
  payer?: { email: string };
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return?: string;
  metadata: Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  const ctx = await getStoreOwnerContext();
  if (!ctx.ok) return ctx.response;

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Payment gateway not configured." },
      { status: 500 }
    );
  }

  const parsed = await parseJson(request, subscriptionPreferenceSchema, "Datos inválidos");
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { planId, planName, planDescription, amount } = parsed.data;

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

  const preference: MPPreferenceBody = {
    items: [
      {
        id: String(planId),
        title: `Guander - ${planName.trim()}`,
        description:
          typeof planDescription === "string" && planDescription.trim()
            ? planDescription.trim().slice(0, 256)
            : `Suscripcion al plan ${planName.trim()} de Guander`,
        quantity: 1,
        currency_id: "ARS",
        unit_price: Math.round(Number(amount)),
      },
    ],
    back_urls: {
      success: `${siteUrl}/dashboard/store/payment/success`,
      failure: `${siteUrl}/dashboard/store/payment/failure`,
      pending: `${siteUrl}/dashboard/store/payment/pending`,
    },
    metadata: {
      store_id: ctx.context.storeId,
      plan_id: planId,
    },
  };

  const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(preference),
  });

  if (!mpResponse.ok) {
    const errorBody = await mpResponse.text();
    console.error("MercadoPago error:", mpResponse.status, errorBody);
    let detail = "";
    try {
      const parsed = JSON.parse(errorBody) as { message?: string; cause?: Array<{ description?: string }> };
      detail = parsed.message ?? "";
      if (parsed.cause?.length) {
        detail += " – " + parsed.cause.map((c) => c.description).join(", ");
      }
    } catch {
      detail = errorBody.slice(0, 200);
    }
    return NextResponse.json(
      { error: `No se pudo crear la preferencia de pago${detail ? `: ${detail}` : "."}` },
      { status: 502 }
    );
  }

  const mpData = (await mpResponse.json()) as {
    id: string;
    init_point: string;
    sandbox_init_point: string;
  };

  // In test mode always redirect to sandbox_init_point
  const checkoutUrl =
    accessToken.startsWith("TEST-") ? mpData.sandbox_init_point : mpData.init_point;

  return NextResponse.json({ checkoutUrl });
}
