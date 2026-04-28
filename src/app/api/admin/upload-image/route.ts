import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export async function POST(req: NextRequest) {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    return NextResponse.json({ error: 'Cloudinary credentials not configured' }, { status: 500 });
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

  // Build signed upload params
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'guander/locales';
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash('sha256')
    .update(paramsToSign + API_SECRET)
    .digest('hex');

  const cfForm = new FormData();
  cfForm.append('file', file);
  cfForm.append('api_key', API_KEY);
  cfForm.append('timestamp', String(timestamp));
  cfForm.append('signature', signature);
  cfForm.append('folder', folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: cfForm },
  );

  const data = await res.json() as {
    secure_url?: string;
    public_id?: string;
    error?: { message: string };
  };

  if (!res.ok || !data.secure_url) {
    const msg = data.error?.message ?? 'Upload failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ url: data.secure_url, id: data.public_id });
}
