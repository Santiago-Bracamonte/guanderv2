import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { queryD1 } from '@/lib/cloudflare-d1';
import { hashPassword } from '@/lib/auth';
import { resetPasswordSchema } from '@/lib/validation/auth';
import { parseJson } from '@/lib/validation/parse';

export async function POST(request: Request) {
  const parsed = await parseJson(request, resetPasswordSchema, 'Datos inválidos');
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { token, password } = parsed.data;

  const jwtSecret = process.env.JWT_SECRET || 'dev-insecure-jwt-secret-change-me';

  let payload: { email: string; purpose: string };
  try {
    payload = jwt.verify(token.trim(), jwtSecret) as { email: string; purpose: string };
  } catch {
    return NextResponse.json({ error: 'El enlace expiró o es inválido. Solicitá uno nuevo.' }, { status: 400 });
  }

  if (payload.purpose !== 'password-reset') {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
  }

  const email = payload.email.toLowerCase();

  try {
    // Get user_data id by email
    const users = await queryD1<{ id_user_data: number }>(
      'SELECT id_user_data FROM user_data WHERE LOWER(email) = ?',
      [email],
      { revalidate: false },
    );

    if (users.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { id_user_data } = users[0];
    const newHash = await hashPassword(password);

    await queryD1(
      'UPDATE user_data SET password_hash = ? WHERE id_user_data = ?',
      [newHash, id_user_data],
      { revalidate: false },
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
