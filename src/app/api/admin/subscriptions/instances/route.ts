import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { queryD1 } from '@/lib/cloudflare-d1';
import { z } from 'zod';
import { positiveIntSchema } from '@/lib/validation/common';
import {
  subscriptionInstancePaymentSchema,
  subscriptionInstanceUpdateSchema,
} from '@/lib/validation/admin';
import { parseJson, parseSearchParams } from '@/lib/validation/parse';

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const session = token ? verifyToken(token) : null;
  if (!session || session.role !== 'admin') return null;
  return session;
}

// ── GET: list all store_sub instances ─────────────────────────────────────
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get('id');
  const parsed = idParam
    ? parseSearchParams(
        { id: idParam },
        z.object({ id: positiveIntSchema('id') }),
      )
    : null;
  if (parsed && !parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const id = parsed?.data?.id ?? null;

  // Fetch payout history for a specific instance
  if (id) {
    const storeSubId = Number(id);
    if (!Number.isInteger(storeSubId) || storeSubId <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const payouts = await queryD1<{
      id_sub_payout: number;
      date: string;
      amount: number;
      description: string | null;
      fk_user: number;
      user_name: string;
      user_email: string;
    }>(
      `SELECT
         sp.id_sub_payout,
         sp.date,
         sp.amount,
         sp.description,
         sp.fk_user,
         ud.name   || ' ' || ud.last_name AS user_name,
         ud.email  AS user_email
       FROM sub_payout sp
       INNER JOIN users    u  ON u.id_user        = sp.fk_user
       INNER JOIN user_data ud ON ud.id_user_data  = u.fk_user_data
       WHERE sp.fk_store_sub = ?
       ORDER BY sp.date DESC`,
      [storeSubId],
      { revalidate: false },
    );

    return NextResponse.json({ payouts });
  }

  // List all instances with entity info
  const instances = await queryD1<{
    id_store_sub: number;
    state_payout: string;
    expiration_date: string;
    upgrade_date: string;
    fk_subscription_id: number;
    plan_name: string;
    plan_amount: number;
    entity_type: string;
    entity_id: number;
    entity_name: string;
    owner_name: string;
    owner_email: string;
    payout_count: number;
    last_payout_date: string | null;
    last_payout_amount: number | null;
  }>(
    `SELECT
       ss.id_store_sub,
       ss.state_payout,
       ss.expiration_date,
       ss.upgrade_date,
       ss.fk_subscription_id,
       sub.name   AS plan_name,
       sub.amount AS plan_amount,
       CASE WHEN st.id_store IS NOT NULL THEN 'store' ELSE 'professional' END AS entity_type,
       COALESCE(st.id_store, pr.id_professional) AS entity_id,
       COALESCE(st.name, ts.name) AS entity_name,
       ud.name || ' ' || ud.last_name AS owner_name,
       ud.email AS owner_email,
       COALESCE(pc.payout_count, 0) AS payout_count,
       lp.last_payout_date,
       lp.last_payout_amount
     FROM store_sub ss
     INNER JOIN subscription sub ON sub.id_subscription = ss.fk_subscription_id
     LEFT JOIN stores       st ON st.fk_store_sub_id = ss.id_store_sub
     LEFT JOIN professionals pr ON pr.fk_store_sub_id = ss.id_store_sub
       AND st.id_store IS NULL
     LEFT JOIN type_service ts ON ts.id_type_service = pr.fk_type_service
     LEFT JOIN users u ON (
       CASE WHEN st.id_store IS NOT NULL THEN st.fk_user ELSE pr.fk_user_id END = u.id_user
     )
     LEFT JOIN user_data ud ON ud.id_user_data = u.fk_user_data
     LEFT JOIN (
       SELECT fk_store_sub, COUNT(*) AS payout_count
       FROM sub_payout
       GROUP BY fk_store_sub
     ) pc ON pc.fk_store_sub = ss.id_store_sub
     LEFT JOIN (
       SELECT fk_store_sub,
              MAX(date)   AS last_payout_date,
              amount      AS last_payout_amount
       FROM sub_payout
       GROUP BY fk_store_sub
     ) lp ON lp.fk_store_sub = ss.id_store_sub
     ORDER BY ss.expiration_date ASC`,
    [],
    { revalidate: false },
  );

  const plans = await queryD1<{ id_subscription: number; name: string; amount: number }>(
    'SELECT id_subscription, name, amount FROM subscription WHERE state = \'activo\' ORDER BY amount ASC',
    [],
    { revalidate: false },
  );

  return NextResponse.json({ instances, plans });
}

// ── PUT: update a store_sub instance ──────────────────────────────────────
export async function PUT(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const parsed = await parseJson(request, subscriptionInstanceUpdateSchema, 'Datos inválidos');
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { id_store_sub, state_payout, expiration_date, fk_subscription_id } = parsed.data;

  const updates: string[] = [];
  const args: (string | number)[] = [];

  if (state_payout) {
    updates.push('state_payout = ?');
    args.push(state_payout.toLowerCase());
  }

  if (expiration_date) {
    updates.push('expiration_date = ?');
    args.push(expiration_date);
  }

  if (fk_subscription_id) {
    updates.push('fk_subscription_id = ?');
    args.push(Number(fk_subscription_id));    
    updates.push('upgrade_date = ?');
    args.push(new Date().toISOString().slice(0, 10));
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
  }

args.push(Number(id_store_sub));
  await queryD1(
    `UPDATE store_sub SET ${updates.join(', ')} WHERE id_store_sub = ?`,
    args,
    { revalidate: false },
  );

  return NextResponse.json({ success: true });
}

// ── POST: register a payment for a store_sub ──────────────────────────────
export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const parsed = await parseJson(request, subscriptionInstancePaymentSchema, 'Datos inválidos');
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { id_store_sub, amount, date, description } = parsed.data;
  const payDate = date ?? new Date().toISOString().slice(0, 10);

  // Resolve admin user id from session
  const adminRows = await queryD1<{ id_user: number }>(
    `SELECT u.id_user FROM users u
     INNER JOIN user_data ud ON ud.id_user_data = u.fk_user_data
     WHERE LOWER(ud.email) = ?
     LIMIT 1`,
    [session.email.toLowerCase()],
    { revalidate: false },
  );

  const adminUserId = adminRows[0]?.id_user;
  if (!adminUserId) {
    return NextResponse.json({ error: 'No se pudo resolver el usuario admin' }, { status: 500 });
  }

  await queryD1(
    `INSERT INTO sub_payout (date, amount, description, fk_store_sub, fk_user)
     VALUES (?, ?, ?, ?, ?)`,
    [payDate, amount, description ?? null, id_store_sub, adminUserId] as any[],
    { revalidate: false },
  );

  // Auto-extend expiration if the subscription was expired at the time of payment
  const subRows = await queryD1<{ expiration_date: string }>(
    'SELECT expiration_date FROM store_sub WHERE id_store_sub = ? LIMIT 1',
    [id_store_sub] as any[],
    { revalidate: false },
  );
  const currentExpiry = subRows[0]?.expiration_date;
  if (currentExpiry && new Date(currentExpiry) < new Date()) {
    const base = new Date(`${payDate}T00:00:00Z`);
    base.setMonth(base.getMonth() + 1);
    const newExpiry = base.toISOString().slice(0, 10);
    await queryD1(
      'UPDATE store_sub SET expiration_date = ? WHERE id_store_sub = ?',
      [newExpiry, id_store_sub] as any[],
      { revalidate: false },
    );
  }

  return NextResponse.json({ success: true });
}
