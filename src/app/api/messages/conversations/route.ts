import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { queryD1 } from '@/lib/cloudflare-d1';

async function ensureTables() {
  await queryD1(
    `CREATE TABLE IF NOT EXISTS support_ticket (
      id_ticket   INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      user_role   TEXT    NOT NULL,
      user_name   TEXT    NOT NULL,
      user_email  TEXT    NOT NULL,
      subject     TEXT    NOT NULL,
      status      TEXT    NOT NULL DEFAULT 'open',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    )`,
    [],
    { revalidate: false },
  );
  await queryD1(
    `CREATE TABLE IF NOT EXISTS support_message (
      id_message  INTEGER PRIMARY KEY AUTOINCREMENT,
      fk_ticket   INTEGER NOT NULL,
      sender_role TEXT    NOT NULL,
      sender_name TEXT    NOT NULL,
      body        TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    )`,
    [],
    { revalidate: false },
  );
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const user = verifyToken(token);
    if (!user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 });

    await ensureTables();

    const tickets = await queryD1<{
      id_ticket: number;
      subject: string;
      status: string;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT id_ticket, subject, status, created_at, updated_at
       FROM support_ticket
       WHERE user_id = ?
       ORDER BY updated_at DESC`,
      [user.id],
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
    console.error('[conversations] GET error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
