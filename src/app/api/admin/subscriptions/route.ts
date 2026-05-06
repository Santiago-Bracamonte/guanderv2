import { NextResponse } from 'next/server';
import { queryD1 } from '@/lib/cloudflare-d1';
import { ensureSubscriptionBenefitsColumn } from '@/lib/subscription-benefits';
import { subscriptionCreateSchema, subscriptionUpdateSchema } from '@/lib/validation/admin';
import { parseJson } from '@/lib/validation/parse';

function normalizeState(raw: string | undefined): string {
  const value = (raw ?? '').toLowerCase();
  return value === 'inactivo' ? 'inactivo' : 'activo';
}

export async function GET() {
  try {
    await ensureSubscriptionBenefitsColumn();
    const plans = await queryD1(
      'SELECT id_subscription, name, description, plan_benefits, state, amount FROM subscription ORDER BY amount ASC',
      [],
      { revalidate: false },
    );
    return NextResponse.json({ success: true, data: plans });
  } catch {
    return NextResponse.json({ error: 'No se pudieron cargar los planes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const parsed = await parseJson(request, subscriptionCreateSchema, 'Datos inválidos');
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { name, description, plan_benefits, amount, state: rawState } = parsed.data;
  const planBenefits = plan_benefits?.trim() ?? '';
  const state = normalizeState(rawState);

  try {
    await ensureSubscriptionBenefitsColumn();
    await queryD1(
      'INSERT INTO subscription (name, description, plan_benefits, state, amount) VALUES (?, ?, ?, ?, ?)',
      [name, description, planBenefits, state, amount] as any[],
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
  const parsed = await parseJson(request, subscriptionUpdateSchema, 'Datos inválidos');
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { id_subscription: id, name, description, plan_benefits, amount, state: rawState } =
    parsed.data;
  const planBenefits = plan_benefits?.trim() ?? '';
  const state = normalizeState(rawState);

  try {
    await ensureSubscriptionBenefitsColumn();
    await queryD1(
      'UPDATE subscription SET name = ?, description = ?, plan_benefits = ?, state = ?, amount = ? WHERE id_subscription = ?',
      [name, description, planBenefits, state, amount, id] as any[],
      { revalidate: false },
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'No se pudo actualizar el plan' }, { status: 500 });
  }
}
