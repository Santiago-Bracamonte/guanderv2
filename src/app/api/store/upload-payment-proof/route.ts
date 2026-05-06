import { NextResponse } from "next/server";
import { queryD1 } from "@/lib/cloudflare-d1";
import { getStoreOwnerContext } from "@/lib/store-owner-context";
import { ensureSubPayoutTable, ensureStoreSubPayoutColumn } from "@/lib/sub-payouts";
import { uploadPaymentProofSchema } from "@/lib/validation/store";
import { parseJson } from "@/lib/validation/parse";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const authContext = await getStoreOwnerContext();
    if (!authContext.ok) {
      return authContext.response;
    }
    const { storeSubId, userId } = authContext.context;
    
    let base64File = "";
    
    // Check if it's JSON (base64) or FormData
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const parsed = await parseJson(request, uploadPaymentProofSchema, "Datos inválidos");
      if (!parsed.data) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      base64File = parsed.data.paymentProof;
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        base64File = `data:${file.type};base64,${buffer.toString("base64")}`;
      }
    }

    if (!base64File) {
      return NextResponse.json(
        { error: "No se proporcionó un archivo válido." },
        { status: 400 }
      );
    }

    

    if (!storeSubId) {
        return NextResponse.json({ error: "No hay una suscripción activa." }, { status: 400 });
    }

    await ensureSubPayoutTable();
    await ensureStoreSubPayoutColumn();

    // Insert into sub_payout to queue approval process for admin
    await queryD1(
      `INSERT INTO sub_payout (date, amount, description, proof_url, status, fk_store_sub, fk_user)
       VALUES (datetime('now'), 0, 'Suscripción - Carga Manual', ?, 'pending', ?, ?)`,
      [base64File, storeSubId, userId]
    );

    // Also logically make the store_sub state pending review
    await queryD1(
      `UPDATE store_sub 
       SET payment_proof = ?, state_payout = 'pendiente' 
       WHERE id_store_sub = ?`,
      [base64File, storeSubId]
    );

    return NextResponse.json({ success: true, message: "Comprobante subido correctamente." });
  } catch (error: any) {
    console.error("Error al subir comprobante:", error);
    return NextResponse.json(
      { error: "No autorizado o error interno.", details: error.message },
      { status: 500 }
    );
  }
}
