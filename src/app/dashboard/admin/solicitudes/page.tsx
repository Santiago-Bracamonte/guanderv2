import { queryD1 } from "@/lib/cloudflare-d1";
import SolicitudesClient, { type SolicitudItem } from "./SolicitudesClient";

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

export default async function SolicitudesPage() {
  let data: SolicitudItem[] = [];

  try {
    await ensureRequestsTable();
    const rows = await queryD1<SolicitudItem>(
      `SELECT id_request, fk_user, user_email, business_name, description, address, location,
              fk_category, cuit_cuil, matricula, razon_social,
              schedule_week, schedule_weekend, schedule_sunday,
              image_url, status, notes, created_at
       FROM store_registration_requests
       WHERE status = 'pending'
       ORDER BY id_request DESC`,
      [],
      { revalidate: false },
    );
    data = rows;
  } catch {
    data = [];
  }

  return <SolicitudesClient initialData={data} />;
}
