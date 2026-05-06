import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseSearchParams } from '@/lib/validation/parse';

interface NominatimReverseResponse {
  display_name?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = parseSearchParams(
    { lat: searchParams.get('lat'), lng: searchParams.get('lng') },
    z.object({
      lat: z.preprocess((v) => Number(v), z.number()),
      lng: z.preprocess((v) => Number(v), z.number()),
    }),
  );
  if (!parsed.data || !Number.isFinite(parsed.data.lat) || !Number.isFinite(parsed.data.lng)) {
    return NextResponse.json({ address: '' }, { status: 400 });
  }

  const { lat, lng } = parsed.data;

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'guander-admin-locales/1.0',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ address: '' });
    }

    const data = (await res.json()) as NominatimReverseResponse;
    return NextResponse.json({ address: data.display_name ?? '' });
  } catch {
    return NextResponse.json({ address: '' });
  }
}
