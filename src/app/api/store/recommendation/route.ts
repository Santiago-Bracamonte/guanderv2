import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { queryD1 } from "@/lib/cloudflare-d1";
import { getStoreOwnerContext } from "@/lib/store-owner-context";

type RecommendationInput = {
  email?: string;
  recommendation?: string;
};

const RECOMMENDATION_TO = "tomas.gonzalezz@davinci.edu.ar";

function toSafeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: NextRequest) {
  const auth = await getStoreOwnerContext();
  if (!auth.ok) return auth.response;

  const { context } = auth;

  let body: RecommendationInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON invalido" }, { status: 400 });
  }

  const email = toSafeText(body.email, 180).toLowerCase();
  const recommendation = toSafeText(body.recommendation, 1200);

  if (!email || !recommendation) {
    return NextResponse.json(
      { error: "email y recommendation son obligatorios" },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Email invalido" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Servicio de correo no configurado" },
      { status: 503 },
    );
  }

  const storeRows = await queryD1<{
    name: string;
    plan_name: string | null;
  }>(
    `SELECT
      s.name,
      sub.name AS plan_name
     FROM stores s
     LEFT JOIN store_sub ss ON ss.id_store_sub = s.fk_store_sub_id
     LEFT JOIN subscription sub ON sub.id_subscription = ss.fk_subscription_id
     WHERE s.id_store = ?
     LIMIT 1`,
    [context.storeId],
    { revalidate: false },
  );

  const storeName = storeRows[0]?.name ?? context.storeName;
  const planName = storeRows[0]?.plan_name ?? "Sin plan";

  const resend = new Resend(apiKey);

  const htmlBody = `
    <div style="font-family:sans-serif;max-width:620px;margin:0 auto;color:#173a2d;">
      <div style="background:#1f4b3b;padding:20px 26px;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;color:#fff;font-size:21px;">Sugerencia de local (plan maximo)</h1>
      </div>
      <div style="background:#f7fbf8;padding:24px 26px;border-radius:0 0 12px 12px;border:1px solid #d6e4da;border-top:none;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;font-weight:600;color:#4b675b;font-size:13px;width:140px;">Local</td><td style="padding:6px 0;font-size:14px;">${escapeHtml(storeName)}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;color:#4b675b;font-size:13px;">Plan actual</td><td style="padding:6px 0;font-size:14px;">${escapeHtml(planName)}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;color:#4b675b;font-size:13px;">Email remitente</td><td style="padding:6px 0;font-size:14px;">${escapeHtml(email)}</td></tr>
        </table>
        <hr style="border:none;border-top:1px solid #d6e4da;margin:18px 0;" />
        <p style="font-weight:600;color:#4b675b;font-size:13px;margin:0 0 8px;">Sugerencia</p>
        <p style="font-size:15px;line-height:1.7;white-space:pre-wrap;margin:0;">${escapeHtml(recommendation)}</p>
      </div>
    </div>
  `;

  try {
    const { error } = await resend.emails.send({
      from: "Guander Local <onboarding@resend.dev>",
      to: RECOMMENDATION_TO,
      replyTo: email,
      subject: `[Guander Sugerencia] ${storeName}`,
      html: htmlBody,
    });

    if (error) {
      return NextResponse.json(
        { error: "No se pudo enviar la sugerencia" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error inesperado al enviar la sugerencia" },
      { status: 500 },
    );
  }
}
