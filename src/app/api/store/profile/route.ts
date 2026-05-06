import { NextRequest, NextResponse } from "next/server";
import { queryD1 } from "@/lib/cloudflare-d1";
import { getStoreOwnerContext } from "@/lib/store-owner-context";
import { storeProfileUpdateSchema } from "@/lib/validation/store";
import { parseJson } from "@/lib/validation/parse";

async function ensureImageUrlColumn() {
  for (const col of ["image_url", "gallery_urls", "social_web", "social_instagram", "social_twitter", "social_whatsapp"]) {
    try {
      await queryD1(`ALTER TABLE stores ADD COLUMN ${col} TEXT`, [], { revalidate: false });
    } catch { /* already exists */ }
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
    gallery_urls: string | null;
    fk_category: number;
    schedule_week: string | null;
    schedule_weekend: string | null;
    schedule_sunday: string | null;
    social_web: string | null;
    social_instagram: string | null;
    social_twitter: string | null;
    social_whatsapp: string | null;
  }>(
    `SELECT
       s.id_store, s.name, s.description, s.address, s.location, s.image_url, s.gallery_urls, s.fk_category,
       sc.week    AS schedule_week,
       sc.weekend AS schedule_weekend,
       sc.sunday  AS schedule_sunday,
       s.social_web, s.social_instagram, s.social_twitter, s.social_whatsapp
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

  // Parse gallery_urls from JSON; fall back to [image_url] for backward compat
  let parsedGallery: string[] = [];
  if (store.gallery_urls) {
    try { parsedGallery = JSON.parse(store.gallery_urls) as string[]; } catch { /* invalid JSON */ }
  }
  if (parsedGallery.length === 0 && store.image_url) {
    parsedGallery = [store.image_url];
  }

  const categories = await queryD1<{ id_category: number; name: string }>(
    "SELECT id_category, name FROM category ORDER BY name ASC",
    [],
    { revalidate: false },
  );

  return NextResponse.json({
    success: true,
    data: { store: { ...store, gallery_urls: parsedGallery }, categories },
  });
}

export async function PUT(request: NextRequest) {
  const auth = await getStoreOwnerContext();
  if (!auth.ok) return auth.response;
  const { context } = auth;

  const parsed = await parseJson(request, storeProfileUpdateSchema, "Datos inválidos");
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const body = parsed.data;

  await ensureImageUrlColumn();

  const currentRows = await queryD1<{
    name: string;
    description: string;
    address: string;
    location: string;
    image_url: string | null;
    gallery_urls: string | null;
    fk_category: number;
    fk_schedule: number | null;
  }>(
    `SELECT name, description, address, location, image_url, gallery_urls, fk_category, fk_schedule
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

  // Gallery: use submitted array, validate it's all strings
  const galleryUrls: string[] = Array.isArray(body.gallery_urls)
    ? body.gallery_urls.filter((u): u is string => typeof u === "string")
    : [];
  // Derive cover image from gallery[0] for backward compat
  const nextImageUrl = galleryUrls[0] ?? (body.image_url !== undefined ? body.image_url : current.image_url);
  const nextGalleryJson = JSON.stringify(galleryUrls);

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
     SET name = ?, description = ?, address = ?, location = ?, image_url = ?, gallery_urls = ?,
         fk_category = ?,
         social_web = ?, social_instagram = ?, social_twitter = ?, social_whatsapp = ?
     WHERE id_store = ?`,
    [
      nextName,
      nextDescription,
      nextAddress,
      locationToSave,
      nextImageUrl,
      nextGalleryJson,
      nextCategory,
      body.social_web !== undefined ? (body.social_web?.trim() || null) : null,
      body.social_instagram !== undefined ? (body.social_instagram?.trim() || null) : null,
      body.social_twitter !== undefined ? (body.social_twitter?.trim() || null) : null,
      body.social_whatsapp !== undefined ? (body.social_whatsapp?.trim() || null) : null,
      context.storeId,
    ] as any[],
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
