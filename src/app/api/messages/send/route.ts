import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { queryD1 } from '@/lib/cloudflare-d1';
import { userMessageSchema } from '@/lib/validation/messages';
import { parseJson } from '@/lib/validation/parse';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const user = verifyToken(token);
    if (!user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 });

    const parsed = await parseJson(req, userMessageSchema, 'Datos inválidos');
    if (!parsed.data) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { subject, message, ticketId } = parsed.data;

    // Resolve display name + email from DB
    const userData = await queryD1<{ name: string; last_name: string; email: string }>(
      `SELECT ud.name, ud.last_name, ud.email
       FROM users u
       JOIN user_data ud ON ud.id_user_data = u.fk_user_data
       WHERE u.id_user = ?`,
      [user.id] as any[],
      { revalidate: false },
    );
    const userName = userData[0] ? `${userData[0].name} ${userData[0].last_name}` : user.email;
    const userEmail = userData[0]?.email ?? user.email;

    let resolvedTicketId: number;

    if (ticketId) {
      const existing = await queryD1<{ id_ticket: number }>(
        `SELECT id_ticket FROM support_ticket WHERE id_ticket = ? AND user_id = ?`,
        [ticketId, user.id] as any[],
        { revalidate: false },
      );
      if (!existing[0]) return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });

      // FIX: Forzamos el tipo a Number para cumplir con el contrato de la variable
      resolvedTicketId = Number(ticketId);
      
      await queryD1(
        `UPDATE support_ticket SET updated_at = datetime('now'), status = 'open' WHERE id_ticket = ?`,
        [ticketId] as any[],
        { revalidate: false },
      );
    } else {
      const subjectText = subject?.trim() || 'Consulta de soporte';

      await queryD1(
        `INSERT INTO support_ticket (user_id, user_role, user_name, user_email, subject)
         VALUES (?, ?, ?, ?, ?)`,
        [user.id, user.role, userName, userEmail, subjectText] as any[],
        { revalidate: false },
      );

      const newTicket = await queryD1<{ id_ticket: number }>(
        `SELECT id_ticket FROM support_ticket WHERE user_id = ? ORDER BY id_ticket DESC LIMIT 1`,
        [user.id] as any[], // Cambiado de 'as any' a 'as any[]' por consistencia
        { revalidate: false },
      );
      if (!newTicket[0]) throw new Error('No se pudo crear el ticket');
      resolvedTicketId = newTicket[0].id_ticket;
    }

    await queryD1(
      `INSERT INTO support_message (fk_ticket, sender_role, sender_name, body) VALUES (?, 'user', ?, ?)`,
      [resolvedTicketId, userName, message] as any[], // FIX: Agregado as any[]
      { revalidate: false },
    );

    return NextResponse.json({ ticketId: resolvedTicketId });
  } catch (err) {
    console.error('[send] POST error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}