import { NextResponse } from 'next/server';
import { queryD1 } from '@/lib/cloudflare-d1';

interface SubscriptionPayload {
  id_subscription?: number;
  name?: string;
  description?: string;
  state?: string;
  amount?: number;
}

function normalizeState(raw: string | undefined): string {
  const value = (raw ?? '').toLowerCase();
  return value === 'inactivo' ? 'inactivo' : 'activo';
}

export async function GET() {
  try {
    const plans = await queryD1(
      'SELECT id_subscription, name, description, state, amount FROM subscription ORDER BY amount ASC',
      [],
      { revalidate: false },
    );
    return NextResponse.json({ success: true, data: plans });
  } catch {
    return NextResponse.json({ error: 'No se pudieron cargar los planes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: SubscriptionPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const name = body.name?.trim();
  const description = body.description?.trim() ?? '';
  const amount = Number(body.amount);
  const state = normalizeState(body.state);

  if (!name) {
    return NextResponse.json({ error: 'El nombre del plan es requerido' }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: 'El monto del plan es inválido' }, { status: 400 });
  }

  try {
    await queryD1(
      'INSERT INTO subscription (name, description, state, amount) VALUES (?, ?, ?, ?)',
      [name, description, state, amount],
      { revalidate: false },
    );

    const createdRows = await queryD1<{ id_subscription: number }>(
      'SELECT id_subscription FROM subscription WHERE name = ? ORDER BY id_subscription DESC LIMIT 1',
      [name],
      { revalidate: false },
    );

    return NextResponse.json({ success: true, id_subscription: createdRows[0]?.id_subscription ?? null });
  } catch {
    return NextResponse.json({ error: 'No se pudo crear el plan' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  let body: SubscriptionPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const id = Number(body.id_subscription);
  const name = body.name?.trim();
  const description = body.description?.trim() ?? '';
  const amount = Number(body.amount);
  const state = normalizeState(body.state);

  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: 'id_subscription inválido' }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: 'El nombre del plan es requerido' }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: 'El monto del plan es inválido' }, { status: 400 });
  }

  try {
    await queryD1(
      'UPDATE subscription SET name = ?, description = ?, state = ?, amount = ? WHERE id_subscription = ?',
      [name, description, state, amount, id],
      { revalidate: false },
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'No se pudo actualizar el plan' }, { status: 500 });
  }
}
