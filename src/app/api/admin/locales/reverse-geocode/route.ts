import { NextResponse } from 'next/server';

interface NominatimReverseResponse {
  display_name?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ address: '' }, { status: 400 });
  }

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
