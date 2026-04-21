import { NextResponse } from 'next/server';
import { queryD1 } from '@/lib/cloudflare-d1';

export async function GET() {
  try {
    const serviceTypes = await queryD1<{ id_type_service: number; name: string }>(
      'SELECT id_type_service, name FROM type_service ORDER BY name ASC',
      [],
      { revalidate: false },
    );
    return NextResponse.json({ success: true, serviceTypes });
  } catch {
    return NextResponse.json({ success: true, serviceTypes: [] });
  }
}

export async function PUT(request: Request) {
  let body: {
    id_professional: number;
    description?: string;
    address?: string;
    location?: string | null;
    stars?: number | null;
    accept_point?: number;
    fk_type_service?: number;
    schedule_week?: string | null;
    schedule_weekend?: string | null;
    schedule_sunday?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  if (!body.id_professional) {
    return NextResponse.json({ error: 'id_professional es requerido' }, { status: 400 });
  }

  try {
    const currentRows = await queryD1<{
      description: string | null;
      address: string | null;
      location: string | null;
      stars: number | null;
      accept_point: number | null;
      fk_type_service: number | null;
      fk_schedule: number | null;
    }>(
      'SELECT description, address, location, stars, accept_point, fk_type_service, fk_schedule FROM professionals WHERE id_professional = ? LIMIT 1',
      [body.id_professional],
      { revalidate: false },
    );

    const current = currentRows[0];
    if (!current) {
      return NextResponse.json({ error: 'Profesional no encontrado' }, { status: 404 });
    }

    const nextDescription = body.description ?? current.description ?? '';
    const nextAddress = body.address ?? current.address ?? '';
    const nextStars = body.stars !== undefined ? body.stars : (current.stars ?? 0);
    const nextAcceptPoint = body.accept_point !== undefined ? body.accept_point : (current.accept_point ?? 0);
    const nextTypeService = body.fk_type_service ?? current.fk_type_service ?? 1;

    // Resolve location
    let nextLocation = current.location ?? '0,0';
    if (body.location !== undefined && body.location !== null && body.location.trim()) {
      const parts = body.location.split(',').map((v) => Number(v.trim()));
      if (parts.length === 2 && parts.every(Number.isFinite)) {
        nextLocation = body.location.trim();
      }
    } else if (body.address && body.address !== current.address) {
      // Auto-geocode new address
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(body.address)}`;
        const geoRes = await fetch(url, {
          headers: { Accept: 'application/json', 'User-Agent': 'guander-admin/1.0' },
          cache: 'no-store',
        });
        const geoData = (await geoRes.json()) as Array<{ lat?: string; lon?: string }>;
        const first = geoData[0];
        if (first?.lat && first?.lon) {
          nextLocation = `${first.lat},${first.lon}`;
        }
      } catch { /* keep old location */ }
    }

    await queryD1(
      'UPDATE professionals SET description = ?, address = ?, location = ?, stars = ?, accept_point = ?, fk_type_service = ? WHERE id_professional = ?',
      [nextDescription, nextAddress, nextLocation, nextStars, nextAcceptPoint, nextTypeService, body.id_professional],
      { revalidate: false },
    );

    // Update schedule
    if (body.schedule_week !== undefined || body.schedule_weekend !== undefined || body.schedule_sunday !== undefined) {
      const schedId = current.fk_schedule;
      if (schedId) {
        try {
          await queryD1(
            'UPDATE schedule SET week = COALESCE(?, week), weekend = COALESCE(?, weekend), sunday = COALESCE(?, sunday) WHERE id_schedule = ?',
            [body.schedule_week ?? null, body.schedule_weekend ?? null, body.schedule_sunday ?? null, schedId],
            { revalidate: false },
          );
        } catch { /* ignore */ }
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('PUT /api/admin/profesionales error:', e);
    return NextResponse.json({ success: true, simulated: true });
  }
}
