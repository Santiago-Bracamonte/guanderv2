import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { contactSchema } from '@/lib/validation/contact';
import { parseJson } from '@/lib/validation/parse';

const CONTACT_TO = 'tomas.gonzalezz@davinci.edu.ar';

export async function POST(request: Request) {
  const parsed = await parseJson(request, contactSchema, 'Datos inválidos');
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { name, email, subject, message } = parsed.data;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY not configured');
    return NextResponse.json({ error: 'Servicio de correo no configurado' }, { status: 503 });
  }

  const resend = new Resend(apiKey);

  const mailSubject = subject?.trim()
    ? `[Guander Contacto] ${subject.trim()}`
    : `[Guander Contacto] Mensaje de ${name.trim()}`;

  const htmlBody = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1b3c;">
      <div style="background:#43D696;padding:24px 32px;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;color:#fff;font-size:22px;">✶ Guander — Nuevo mensaje de contacto</h1>
      </div>
      <div style="background:#f9fafb;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;font-weight:600;color:#6b7280;font-size:13px;width:120px;">Nombre</td><td style="padding:8px 0;font-size:15px;">${escapeHtml(name.trim())}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600;color:#6b7280;font-size:13px;">Email</td><td style="padding:8px 0;font-size:15px;"><a href="mailto:${escapeHtml(email.trim())}" style="color:#43D696;">${escapeHtml(email.trim())}</a></td></tr>
          ${subject?.trim() ? `<tr><td style="padding:8px 0;font-weight:600;color:#6b7280;font-size:13px;">Asunto</td><td style="padding:8px 0;font-size:15px;">${escapeHtml(subject.trim())}</td></tr>` : ''}
        </table>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
        <p style="font-weight:600;color:#6b7280;font-size:13px;margin:0 0 8px;">Mensaje</p>
        <p style="font-size:15px;line-height:1.7;white-space:pre-wrap;margin:0;">${escapeHtml(message.trim())}</p>
      </div>
    </div>
  `;

  try {
    const { error } = await resend.emails.send({
      from: 'Guander Contacto <onboarding@resend.dev>',
      to: CONTACT_TO,
      replyTo: email.trim(),
      subject: mailSubject,
      html: htmlBody,
    });
    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Error al enviar el mensaje. Intentá de nuevo.' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Contact email error:', err);
    return NextResponse.json({ error: 'Error al enviar el mensaje. Intentá de nuevo.' }, { status: 500 });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
