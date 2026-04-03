import { NextRequest, NextResponse } from 'next/server';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

export async function POST(req: NextRequest) {
  if (!ACCOUNT_ID || !API_TOKEN) {
    return NextResponse.json({ error: 'Cloudflare credentials not configured' }, { status: 500 });
  }

  let file: File | null = null;
  try {
    const formData = await req.formData();
    file = formData.get('file') as File | null;
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de archivo no permitido. Use JPG, PNG, WEBP o GIF.' }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'La imagen no puede superar 10MB' }, { status: 400 });
  }

  const cfForm = new FormData();
  cfForm.append('file', file);

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      body: cfForm,
    },
  );

  const data = await res.json() as {
    success: boolean;
    result?: { id: string; variants: string[] };
    errors?: { message: string }[];
  };

  if (!data.success || !data.result) {
    const msg = data.errors?.[0]?.message ?? 'Upload failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const url = data.result.variants.find((v) => v.endsWith('/public')) ?? data.result.variants[0];
  return NextResponse.json({ url, id: data.result.id });
}
