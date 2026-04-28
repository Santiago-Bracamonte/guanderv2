import { NextRequest, NextResponse } from "next/server";
import { queryD1 } from "@/lib/cloudflare-d1";
import { getStoreOwnerContext } from "@/lib/store-owner-context";

async function ensureImageUrlColumn() {
  try {
    await queryD1("ALTER TABLE stores ADD COLUMN image_url TEXT", [], {
      revalidate: false,
    });
  } catch {
    // column already exists – ignore
  }
}

function parseLatLng(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const parts = raw.split(",").map((p) => Number(p.trim()));
  if (parts.length !== 2) return null;
  const [lat, lng] = parts;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  return `${lat},${lng}`;
}

async function geocodeAddress(address: string): Promise<string | null> {
  const query = address.trim();
  if (!query) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "guander-store-profile/1.0",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    const first = data[0];
    if (!first?.lat || !first?.lon) return null;
    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return `${lat},${lng}`;
  } catch {
    return null;
  }
}

export async function GET() {
  const auth = await getStoreOwnerContext();
  if (!auth.ok) return auth.response;
  const { context } = auth;

  await ensureImageUrlColumn();

  const storeRows = await queryD1<{
    id_store: number;
    name: string;
    description: string;
    address: string;
    location: string;
    image_url: string | null;
    fk_category: number;
    schedule_week: string | null;
    schedule_weekend: string | null;
    schedule_sunday: string | null;
  }>(
    `SELECT
       s.id_store, s.name, s.description, s.address, s.location, s.image_url, s.fk_category,
       sc.week    AS schedule_week,
       sc.weekend AS schedule_weekend,
       sc.sunday  AS schedule_sunday
     FROM stores s
     LEFT JOIN schedule sc ON sc.id_schedule = s.fk_schedule
     WHERE s.id_store = ?
     LIMIT 1`,
    [context.storeId],
    { revalidate: false },
  );

  const store = storeRows[0];
  if (!store) {
    return NextResponse.json({ error: "Local no encontrado" }, { status: 404 });
  }

  const categories = await queryD1<{ id_category: number; name: string }>(
    "SELECT id_category, name FROM category ORDER BY name ASC",
    [],
    { revalidate: false },
  );

  return NextResponse.json({ success: true, data: { store, categories } });
}

export async function PUT(request: NextRequest) {
  const auth = await getStoreOwnerContext();
  if (!auth.ok) return auth.response;
  const { context } = auth;

  let body: {
    name?: string;
    description?: string;
    address?: string;
    location?: string;
    image_url?: string | null;
    fk_category?: number;
    schedule_week?: string;
    schedule_weekend?: string;
    schedule_sunday?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON invalido" }, { status: 400 });
  }

  await ensureImageUrlColumn();

  const currentRows = await queryD1<{
    name: string;
    description: string;
    address: string;
    location: string;
    image_url: string | null;
    fk_category: number;
    fk_schedule: number | null;
  }>(
    `SELECT name, description, address, location, image_url, fk_category, fk_schedule
     FROM stores WHERE id_store = ? LIMIT 1`,
    [context.storeId],
    { revalidate: false },
  );

  const current = currentRows[0];
  if (!current) {
    return NextResponse.json({ error: "Local no encontrado" }, { status: 404 });
  }

  const nextName = (body.name ?? current.name).trim();
  const nextDescription = body.description ?? current.description;
  const nextAddress = (body.address ?? current.address).trim();
  const nextCategory = body.fk_category ?? current.fk_category;
  const nextImageUrl =
    body.image_url !== undefined ? body.image_url : current.image_url;

  if (!nextName) {
    return NextResponse.json(
      { error: "El nombre es requerido" },
      { status: 400 },
    );
  }

  // Resolve GPS coordinates: use explicitly provided value, keep existing if
  // valid, or geocode from the new address as a last resort.
  const providedLocation = parseLatLng(body.location);
  const locationToSave =
    providedLocation ??
    parseLatLng(current.location) ??
    (await geocodeAddress(nextAddress)) ??
    "0,0";

  await queryD1(
    `UPDATE stores
     SET name = ?, description = ?, address = ?, location = ?, image_url = ?, fk_category = ?
     WHERE id_store = ?`,
    [
      nextName,
      nextDescription,
      nextAddress,
      locationToSave,
      nextImageUrl,
      nextCategory,
      context.storeId,
    ],
    { revalidate: false },
  );

  // Update schedule rows only when schedule fields were supplied and the store
  // has an associated schedule record.
  if (
    (body.schedule_week !== undefined ||
      body.schedule_weekend !== undefined ||
      body.schedule_sunday !== undefined) &&
    current.fk_schedule
  ) {
    await queryD1(
      `UPDATE schedule
       SET week    = COALESCE(?, week),
           weekend = COALESCE(?, weekend),
           sunday  = COALESCE(?, sunday)
       WHERE id_schedule = ?`,
      [
        body.schedule_week ?? null,
        body.schedule_weekend ?? null,
        body.schedule_sunday ?? null,
        current.fk_schedule,
      ],
      { revalidate: false },
    );
  }

  return NextResponse.json({ success: true });
}
