import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { queryD1 } from "@/lib/cloudflare-d1";

async function ensureRequestsTable() {
  try {
    await queryD1(
      `CREATE TABLE IF NOT EXISTS store_registration_requests (
        id_request        INTEGER PRIMARY KEY AUTOINCREMENT,
        fk_user           INTEGER NOT NULL,
        user_email        TEXT NOT NULL,
        -- Datos del local/profesional
        business_name     TEXT NOT NULL,
        description       TEXT,
        address           TEXT NOT NULL,
        location          TEXT,
        fk_category       INTEGER,
        -- Datos fiscales / legales
        cuit_cuil         TEXT,
        matricula         TEXT,
        razon_social      TEXT,
        -- Horarios
        schedule_week     TEXT,
        schedule_weekend  TEXT,
        schedule_sunday   TEXT,
        -- Imagen
        image_url         TEXT,
        -- Estado del pedido
        status            TEXT NOT NULL DEFAULT 'pending',
        notes             TEXT,
        created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      [],
      { revalidate: false },
    );
  } catch {
    /* table already exists */
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const user = token ? verifyToken(token) : null;

  if (!user || (user.role !== "store_owner" && user.role !== "professional")) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: {
    business_name?: string;
    description?: string;
    address?: string;
    location?: string;
    fk_category?: number;
    cuit_cuil?: string;
    matricula?: string;
    razon_social?: string;
    schedule_week?: string;
    schedule_weekend?: string;
    schedule_sunday?: string;
    image_url?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  if (!body.business_name?.trim()) {
    return NextResponse.json(
      { error: "El nombre del local es requerido" },
      { status: 400 },
    );
  }
  if (!body.address?.trim()) {
    return NextResponse.json(
      { error: "La dirección es requerida" },
      { status: 400 },
    );
  }

  try {
    await ensureRequestsTable();

    // Check if this user already has a pending request
    const existing = await queryD1<{ id_request: number }>(
      `SELECT id_request FROM store_registration_requests WHERE fk_user = ? AND status = 'pending' LIMIT 1`,
      [user.id],
      { revalidate: false },
    );
    if (existing.length > 0) {
      return NextResponse.json(
        {
          error:
            "Ya tenés una solicitud pendiente de revisión. El administrador la procesará pronto.",
        },
        { status: 409 },
      );
    }

    // Fetch user email
    const emailRows = await queryD1<{ email: string }>(
      `SELECT ud.email FROM users u JOIN user_data ud ON u.fk_user_data = ud.id_user_data WHERE u.id_user = ? LIMIT 1`,
      [user.id],
      { revalidate: false },
    );
    const userEmail = emailRows[0]?.email ?? "";

    await queryD1(
      `INSERT INTO store_registration_requests
        (fk_user, user_email, business_name, description, address, location, fk_category, cuit_cuil, matricula, razon_social, schedule_week, schedule_weekend, schedule_sunday, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        userEmail,
        body.business_name.trim(),
        body.description?.trim() ?? "",
        body.address.trim(),
        body.location?.trim() ?? "",
        body.fk_category ?? null,
        body.cuit_cuil?.trim() ?? "",
        body.matricula?.trim() ?? "",
        body.razon_social?.trim() ?? "",
        body.schedule_week?.trim() ?? "",
        body.schedule_weekend?.trim() ?? "",
        body.schedule_sunday?.trim() ?? "",
        body.image_url?.trim() ?? null,
      ],
      { revalidate: false },
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error creating registration request:", e);
    return NextResponse.json(
      { error: "Error al enviar la solicitud", detail: String(e) },
      { status: 500 },
    );
  }
}

export async function GET() {
  // For checking current request status
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const user = token ? verifyToken(token) : null;

  if (!user || (user.role !== "store_owner" && user.role !== "professional")) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const rows = await queryD1<{
      id_request: number;
      status: string;
      notes: string | null;
      created_at: string;
    }>(
      `SELECT id_request, status, notes, created_at
       FROM store_registration_requests
       WHERE fk_user = ?
       ORDER BY id_request DESC
       LIMIT 1`,
      [user.id],
      { revalidate: false },
    );
    return NextResponse.json({ success: true, request: rows[0] ?? null });
  } catch {
    return NextResponse.json({ success: true, request: null });
  }
}
