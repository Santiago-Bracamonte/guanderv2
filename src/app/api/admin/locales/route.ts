import { NextResponse } from 'next/server';
import { queryD1 } from '@/lib/cloudflare-d1';

function parseLatLng(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const parts = raw.split(',').map((part) => Number(part.trim()));
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
        Accept: 'application/json',
        'User-Agent': 'guander-admin-locales/1.0',
      },
      cache: 'no-store',
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

async function ensureImageUrlColumn() {
  try {
    await queryD1('ALTER TABLE stores ADD COLUMN image_url TEXT', [], { revalidate: false });
  } catch { /* column already exists */ }
}

export async function GET() {
  try {
    const stores = await queryD1<Record<string, unknown>>(
      'SELECT id_store, name, description, address, location, stars, fk_category, image_url FROM stores ORDER BY id_store DESC',
      [],
      { revalidate: false },
    );
    return NextResponse.json({ success: true, data: stores });
  } catch {
    return NextResponse.json({
      success: true,
      data: [
        { id_store: 1, name: 'Veterinaria PetCare', description: 'Atención veterinaria integral', address: 'Av. Corrientes 1234, CABA', stars: 4.9, fk_category: 1 },
        { id_store: 2, name: 'Cafetería Guau', description: 'Cafetería pet-friendly', address: 'Av. Santa Fe 567, CABA', stars: 4.8, fk_category: 3 },
        { id_store: 3, name: 'Pet Shop Central', description: 'Todo para tu mascota', address: 'Av. Rivadavia 890, CABA', stars: 4.9, fk_category: 2 },
        { id_store: 4, name: 'Grooming Elegante', description: 'Peluquería y spa canino', address: 'Calle Florida 321, CABA', stars: 4.5, fk_category: 5 },
        { id_store: 5, name: 'Resort Canino', description: 'Hospedaje de primera para mascotas', address: 'Ruta 2 km 45, Pilar', stars: 4.7, fk_category: 6 },
        { id_store: 6, name: 'Restaurante DogFriendly', description: 'Restaurante con espacio para mascotas', address: 'Av. Callao 123, CABA', stars: 4.6, fk_category: 4 },
      ],
    });
  }
}

export async function POST(request: Request) {
  let body: {
    name?: string;
    description?: string;
    address?: string;
    location?: string | null;
    fk_category?: number;
    stars?: number;
    user_email?: string;
    image_url?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const { name, description, address, location, fk_category, stars, user_email, image_url } = body;
  if (!name) {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
  }

  try {
    await ensureImageUrlColumn();

    // Look up fk_user from email, fallback to 1
    let fk_user = 1;
    if (user_email) {
      const userRows = await queryD1<{ id_user: number }>(
        `SELECT u.id_user FROM users u
         JOIN user_data ud ON u.fk_user_data = ud.id_user_data
         WHERE ud.email = ? LIMIT 1`,
        [user_email],
        { revalidate: false },
      );
      if (userRows.length > 0) fk_user = userRows[0].id_user;
    }

    // Get first available schedule
    let fk_schedule = 1;
    try {
      const schedRows = await queryD1<{ id_schedule: number }>(
        'SELECT id_schedule FROM schedule LIMIT 1', [], { revalidate: false },
      );
      if (schedRows.length > 0) fk_schedule = schedRows[0].id_schedule;
    } catch { /* use default 1 */ }

    // Get first available store_sub
    let fk_store_sub_id = 1;
    try {
      const subRows = await queryD1<{ id_store_sub: number }>(
        'SELECT id_store_sub FROM store_sub LIMIT 1', [], { revalidate: false },
      );
      if (subRows.length > 0) fk_store_sub_id = subRows[0].id_store_sub;
    } catch { /* use default 1 */ }

    const manualLocation = parseLatLng(location ?? null);
    const geocodedLocation = manualLocation ? null : await geocodeAddress(address ?? '');
    const locationToSave = manualLocation ?? geocodedLocation ?? '0,0';

    await queryD1(
      `INSERT INTO stores (name, description, address, location, stars, fk_user, fk_category, fk_schedule, fk_store_sub_id, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description ?? '',
        address ?? '',
        locationToSave,
        stars ?? 0,
        fk_user,
        fk_category ?? 1,
        fk_schedule,
        fk_store_sub_id,
        image_url ?? null,
      ],
      { revalidate: false },
    );

    const newRows = await queryD1<{ id_store: number }>(
      'SELECT id_store FROM stores WHERE name = ? ORDER BY id_store DESC LIMIT 1',
      [name],
      { revalidate: false },
    );

    return NextResponse.json({ success: true, id_store: newRows[0]?.id_store ?? null });
  } catch (e) {
    console.error('Error creating store:', e);
    return NextResponse.json({ error: 'Error al crear el local', detail: String(e) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  let body: {
    id_store: number;
    name?: string;
    description?: string;
    address?: string;
    location?: string | null;
    stars?: number;
    fk_category?: number;
    image_url?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  if (!body.id_store) {
    return NextResponse.json({ error: 'id_store es requerido' }, { status: 400 });
  }

  try {
    await ensureImageUrlColumn();

    const currentRows = await queryD1<{
      name: string | null;
      description: string | null;
      address: string | null;
      location: string | null;
      stars: number | null;
      fk_category: number | null;
      image_url: string | null;
    }>(
      'SELECT name, description, address, location, stars, fk_category, image_url FROM stores WHERE id_store = ? LIMIT 1',
      [body.id_store],
      { revalidate: false },
    );

    const current = currentRows[0];
    if (!current) {
      return NextResponse.json({ error: 'Local no encontrado' }, { status: 404 });
    }

    const nextName = body.name ?? current.name;
    const nextDescription = body.description ?? current.description;
    const nextAddress = body.address ?? current.address;
    const nextStars = body.stars ?? current.stars;
    const nextCategory = body.fk_category ?? current.fk_category;
    const nextImage = body.image_url ?? current.image_url;

    const manualLocation = parseLatLng(body.location ?? current.location);
    const geocodedLocation = manualLocation ? null : await geocodeAddress(nextAddress ?? '');
    const locationToSave = manualLocation ?? geocodedLocation ?? '0,0';

    await queryD1(
      'UPDATE stores SET name = ?, description = ?, address = ?, location = ?, stars = ?, fk_category = ?, image_url = ? WHERE id_store = ?',
      [
        nextName,
        nextDescription,
        nextAddress,
        locationToSave,
        nextStars,
        nextCategory,
        nextImage,
        body.id_store,
      ],
      { revalidate: false },
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true, simulated: true });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
  }

  try {
    await queryD1('DELETE FROM stores WHERE id_store = ?', [Number(id)], { revalidate: false });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true, simulated: true });
  }
}
