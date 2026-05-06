import { NextRequest, NextResponse } from "next/server";
import { queryD1 } from "@/lib/cloudflare-d1";
import { getStoreOwnerContext } from "@/lib/store-owner-context"; 

export async function POST(request: NextRequest) {
  try {
    // 1. Validar usuario autenticado
    const auth = await getStoreOwnerContext();
    
    // Si la autenticación falla, devolvemos la respuesta de error 
    if (!auth.ok) return auth.response;

    // 2. Extraemos el context de auth
    const { context } = auth;
    
    // Aquí sacamos los IDs correctamente desde el context
    const userId = context.userId; // (si en tu helper se llama 'id', cambialo a context.id)
    const subIdFromAuth = context.storeSubId;

    // 3. Extraer el FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    
    // Priorizamos el storeSubId que venga del formulario, o usamos el de la sesión como respaldo
    const rawStoreSubId = formData.get("storeSubId") as string | null;
    const storeSubId = rawStoreSubId || subIdFromAuth;
    if (rawStoreSubId && !Number.isFinite(Number(rawStoreSubId))) {
      return NextResponse.json({ error: "storeSubId inválido." }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó un archivo válido." }, { status: 400 });
    }

    if (!storeSubId) {
      return NextResponse.json({ error: "No hay una suscripción activa especificada." }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "No se pudo identificar al usuario." }, { status: 401 });
    }

    // 4. Procesamiento del archivo
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    if (buffer.length > 1000000) { 
        return NextResponse.json({ error: "El archivo es muy pesado. Máximo 1MB." }, { status: 400 });
    }

    const base64File = `data:${file.type};base64,${buffer.toString("base64")}`;

    // 5. Guardar en Base de Datos
    await queryD1(
      `INSERT INTO sub_payout (date, amount, description, proof_url, status, fk_store_sub, fk_user)
       VALUES (datetime('now'), 0, 'Suscripción - Carga Manual', ?, 'pending', ?, ?)`,
      [base64File, storeSubId, userId] 
    );

    await queryD1(
      `UPDATE store_sub 
       SET payment_proof = ?, state_payout = 'pendiente' 
       WHERE id_store_sub = ?`,
      [base64File, storeSubId]
    );

    return NextResponse.json({ success: true, message: "Comprobante subido exitosamente." });

  } catch (error) {
    console.error("Error al subir comprobante:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}