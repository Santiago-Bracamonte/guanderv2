import { NextResponse } from 'next/server';

interface NominatimEntry {
  display_name?: string;
  lat?: string;
  lon?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (q.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(q)}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'guander-admin-locales/1.0',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ suggestions: [] });
    }

    const data = (await res.json()) as NominatimEntry[];
    const suggestions = data
      .map((item) => {
        const lat = Number(item.lat);
        const lng = Number(item.lon);
        if (!item.display_name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
          return null;
        }
        return {
          displayName: item.display_name,
          lat,
          lng,
        };
      })
      .filter((item): item is { displayName: string; lat: number; lng: number } => item !== null);

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
