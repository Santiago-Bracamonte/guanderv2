import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import jwt from 'jsonwebtoken';
import { queryD1 } from '@/lib/cloudflare-d1';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: 'El email es requerido' }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }

  // Check if user exists (always respond with success to prevent user enumeration)
  try {
    const users = await queryD1<{ email: string; name: string }>(
      'SELECT ud.email, ud.name FROM user_data ud JOIN users u ON u.fk_user_data = ud.id_user_data WHERE LOWER(ud.email) = ?',
      [email],
      { revalidate: false },
    );

    if (users.length === 0) {
      // Return success anyway to prevent user enumeration
      return NextResponse.json({ success: true });
    }

    const user = users[0];

    const jwtSecret = process.env.JWT_SECRET || 'dev-insecure-jwt-secret-change-me';
    const resetToken = jwt.sign(
      { email: user.email, purpose: 'password-reset' },
      jwtSecret,
      { expiresIn: '15m' },
    );

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return NextResponse.json({ error: 'Servicio de correo no configurado' }, { status: 503 });
    }

    const htmlBody = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1b3c;">
        <div style="background:#065f46;padding:24px 32px;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;color:#fff;font-size:22px;">✶ Guander — Recuperar contraseña</h1>
        </div>
        <div style="background:#f9fafb;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;">
          <p style="font-size:16px;margin:0 0 16px;">Hola${user.name ? ` <strong>${escapeHtml(user.name)}</strong>` : ''},</p>
          <p style="font-size:15px;color:#374151;margin:0 0 24px;line-height:1.6;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Guander</strong>.
            Si no fuiste vos, podés ignorar este email.
          </p>
          <a href="${resetLink}"
             style="display:inline-block;background:#059669;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;margin-bottom:24px;">
            Restablecer contraseña
          </a>
          <p style="font-size:13px;color:#6b7280;margin:0 0 8px;">
            El enlace expira en <strong>15 minutos</strong>.
          </p>
          <p style="font-size:13px;color:#6b7280;margin:0;">
            Si el botón no funciona, copiá este link en tu navegador:<br/>
            <a href="${resetLink}" style="color:#059669;word-break:break-all;">${resetLink}</a>
          </p>
        </div>
      </div>
    `;

    const resend = new Resend(resendApiKey);

    await resend.emails.send({
      from: 'Guander <noreply@guander.site>',
      to: user.email,
      subject: 'Restablecer contraseña — Guander',
      html: htmlBody,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Forgot password error:', msg);
    return NextResponse.json({ error: `Error interno: ${msg}` }, { status: 500 });
  }
}
