import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { queryD1 } from "@/lib/cloudflare-d1";
import { solicitudesPatchSchema, solicitudesStatusSchema } from "@/lib/validation/admin";
import { parseJson, parseSearchParams } from "@/lib/validation/parse";

async function ensureRequestsTable() {
  try {
    await queryD1(
      `CREATE TABLE IF NOT EXISTS store_registration_requests (
        id_request        INTEGER PRIMARY KEY AUTOINCREMENT,
        fk_user           INTEGER NOT NULL,
        user_email        TEXT NOT NULL,
        business_name     TEXT NOT NULL,
        description       TEXT,
        address           TEXT NOT NULL,
        location          TEXT,
        fk_category       INTEGER,
        cuit_cuil         TEXT,
        matricula         TEXT,
        razon_social      TEXT,
        schedule_week     TEXT,
        schedule_weekend  TEXT,
        schedule_sunday   TEXT,
        image_url         TEXT,
        status            TEXT NOT NULL DEFAULT 'pending',
        notes             TEXT,
        created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      [],
      { revalidate: false },
    );
  } catch {
    /* already exists */
  }
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const user = token ? verifyToken(token) : null;
  if (!user || user.role !== "admin") return null;
  return user;
}

function parseLatLng(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const parts = raw.split(",").map((p) => Number(p.trim()));
  if (parts.length !== 2) return null;
  const [lat, lng] = parts;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  return `${lat},${lng}`;
}

// GET /api/admin/solicitudes — list all requests (filtered by status query param)
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = parseSearchParams(
    { status: searchParams.get("status") },
    solicitudesStatusSchema,
  );
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const statusFilter = parsed.data.status; // pending | approved | rejected | all

  await ensureRequestsTable();

  try {
    let query =
      `SELECT id_request, fk_user, user_email, business_name, description, address, location,
              fk_category, cuit_cuil, matricula, razon_social,
              schedule_week, schedule_weekend, schedule_sunday,
              image_url, status, notes, created_at
       FROM store_registration_requests`;

    const params: (string | number)[] = [];
    if (statusFilter && statusFilter !== "all") {
      query += " WHERE status = ?";
      params.push(statusFilter);
    }
    query += " ORDER BY id_request DESC";

    const rows = await queryD1<Record<string, unknown>>(query, params, { revalidate: false });
    return NextResponse.json({ success: true, data: rows });
  } catch (e) {
    return NextResponse.json({ error: "Error al obtener solicitudes", detail: String(e) }, { status: 500 });
  }
}

// PATCH /api/admin/solicitudes — approve or reject a request
export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const parsed = await parseJson(request, solicitudesPatchSchema, "Datos inválidos");
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { id_request, action, notes } = parsed.data;

  await ensureRequestsTable();

  try {
    // Fetch the request
    const rows = await queryD1<{
      id_request: number;
      fk_user: number;
      user_email: string;
      business_name: string;
      description: string | null;
      address: string;
      location: string | null;
      fk_category: number | null;
      image_url: string | null;
      schedule_week: string | null;
      schedule_weekend: string | null;
      schedule_sunday: string | null;
      fk_subscription_id: number | null;
      status: string;
    }>(
      `SELECT id_request, fk_user, user_email, business_name, description, address, location,
              fk_category, image_url, schedule_week, schedule_weekend, schedule_sunday, fk_subscription_id, status
       FROM store_registration_requests WHERE id_request = ? LIMIT 1`,
      [id_request] as any[],
      { revalidate: false },
    );

    const req = rows[0];
    if (!req) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }
    if (req.status !== "pending") {
      return NextResponse.json({ error: "La solicitud ya fue procesada" }, { status: 409 });
    }

    if (action === "reject") {
      await queryD1(
        `UPDATE store_registration_requests SET status = 'rejected', notes = ? WHERE id_request = ?`,
        [notes ?? "", id_request] as any[],
        { revalidate: false },
      );
      return NextResponse.json({ success: true, action: "rejected" });
    }

    // APPROVE: create the schedule row, then the store
    // 1. Create schedule
    let fk_schedule: number = 1;
    try {
      const schedResult = await queryD1<{ id_schedule: number }>(
        `INSERT INTO schedule (week, weekend, sunday) VALUES (?, ?, ?) RETURNING id_schedule`,
        [
          req.schedule_week ?? "09:00-18:00",
          req.schedule_weekend ?? "09:00-15:00",
          req.schedule_sunday ?? "Cerrado",
        ],
        { revalidate: false },
      );
      fk_schedule = schedResult[0]?.id_schedule ?? 1;
    } catch {
      // fallback: use first schedule
      try {
        const s = await queryD1<{ id_schedule: number }>(
          "SELECT id_schedule FROM schedule LIMIT 1",
          [],
          { revalidate: false },
        );
        fk_schedule = s[0]?.id_schedule ?? 1;
      } catch { /* use 1 */ }
    }

    // 2. Get or create store_sub using the plan the user selected (or cheapest if none)
    let fk_store_sub_id: number = 1;
    try {
      // Use the plan chosen by the user, or fall back to cheapest
      let subPlanId: number;
      if (req.fk_subscription_id) {
        subPlanId = req.fk_subscription_id;
      } else {
        const subPlanRows = await queryD1<{ id_subscription: number }>(
          `SELECT id_subscription FROM subscription ORDER BY amount ASC LIMIT 1`,
          [],
          { revalidate: false },
        );
        subPlanId = subPlanRows[0]?.id_subscription ?? 1;
      }

      const now = new Date();
      const expiry = new Date(now);
      expiry.setFullYear(expiry.getFullYear() + 1);

      const subResult = await queryD1<{ id_store_sub: number }>(
        `INSERT INTO store_sub (state_payout, expiration_date, upgrade_date, fk_subscription_id)
         VALUES ('pendiente', ?, ?, ?) RETURNING id_store_sub`,
        [
          expiry.toISOString().slice(0, 10),
          now.toISOString().slice(0, 10),
          subPlanId,
        ],
        { revalidate: false },
      );
      fk_store_sub_id = subResult[0]?.id_store_sub ?? 1;
    } catch {
      try {
        const s = await queryD1<{ id_store_sub: number }>(
          "SELECT id_store_sub FROM store_sub LIMIT 1",
          [],
          { revalidate: false },
        );
        fk_store_sub_id = s[0]?.id_store_sub ?? 1;
      } catch { /* use 1 */ }
    }

    // 3. Create store
    const locationToSave = parseLatLng(req.location) ?? "0,0";

    await queryD1(
      `INSERT INTO stores (name, description, address, location, stars, fk_user, fk_category, fk_schedule, fk_store_sub_id, image_url)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
      [
        req.business_name,
        req.description ?? "",
        req.address,
        locationToSave,
        req.fk_user,
        req.fk_category ?? 1,
        fk_schedule,
        fk_store_sub_id,
        req.image_url ?? null,
      ],
      { revalidate: false },
    );

    // 4. Mark request as approved
    await queryD1(
      `UPDATE store_registration_requests SET status = 'approved', notes = ? WHERE id_request = ?`,
      [notes ?? "", id_request] as any[],
      { revalidate: false },
    );

    return NextResponse.json({ success: true, action: "approved" });
  } catch (e) {
    console.error("Error processing solicitud:", e);
    return NextResponse.json({ error: "Error al procesar la solicitud", detail: String(e) }, { status: 500 });
  }
}
