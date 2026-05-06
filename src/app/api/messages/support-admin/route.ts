import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { queryD1 } from '@/lib/cloudflare-d1';
import { adminMessageSchema } from '@/lib/validation/messages';
import { parseJson } from '@/lib/validation/parse';

async function getAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  const user = verifyToken(token);
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const tickets = await queryD1<{
      id_ticket: number;
      user_id: number;
      user_role: string;
      user_name: string;
      user_email: string;
      subject: string;
      status: string;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT id_ticket, user_id, user_role, user_name, user_email, subject, status, created_at, updated_at
       FROM support_ticket
       ORDER BY updated_at DESC`,
      [],
      { revalidate: false },
    );

    if (tickets.length === 0) return NextResponse.json({ tickets: [] });

    const ticketIds = tickets.map((t) => t.id_ticket);
    const allMessages = await queryD1<{
      id_message: number;
      fk_ticket: number;
      sender_role: string;
      sender_name: string;
      body: string;
      created_at: string;
    }>(
      `SELECT id_message, fk_ticket, sender_role, sender_name, body, created_at
       FROM support_message
       WHERE fk_ticket IN (${ticketIds.map(() => '?').join(',')})
       ORDER BY created_at ASC`,
      ticketIds,
      { revalidate: false },
    );

    const msgByTicket = allMessages.reduce<Record<number, typeof allMessages>>((acc, m) => {
      (acc[m.fk_ticket] ??= []).push(m);
      return acc;
    }, {});

    const result = tickets.map((t) => ({ ...t, messages: msgByTicket[t.id_ticket] ?? [] }));

    return NextResponse.json({ tickets: result });
  } catch (err) {
    console.error('[support-admin] GET error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const parsed = await parseJson(req, adminMessageSchema, 'Datos inválidos');
    if (!parsed.data) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { ticketId, message, status } = parsed.data;

    const ticket = await queryD1<{ id_ticket: number }>(
      `SELECT id_ticket FROM support_ticket WHERE id_ticket = ?`,
      [ticketId] as any[],
      { revalidate: false },
    );
    if (!ticket[0]) return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });

    await queryD1(
      `INSERT INTO support_message (fk_ticket, sender_role, sender_name, body)
       VALUES (?, 'admin', 'Soporte Guander', ?)`,
      [ticketId, message] as any[],
      { revalidate: false },
    );

    const newStatus = status === 'closed' ? 'closed' : 'answered';
    await queryD1(
      `UPDATE support_ticket SET updated_at = datetime('now'), status = ? WHERE id_ticket = ?`,
      [newStatus, ticketId] as any[],
      { revalidate: false },
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[support-admin] POST error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
