import { queryD1 } from '@/lib/cloudflare-d1';
import PlanesClient, { type SubscriptionItem } from './PlanesClient';

interface SubscriptionRow extends SubscriptionItem {
  id_subscription: number;
  name: string;
  description: string;
  state: string;
  amount: number;
  plan_benefits: string;
}

export default async function PlanesPage() {
  let plans: SubscriptionItem[] = [];

  try {
    plans = await queryD1<SubscriptionRow>(
      'SELECT id_subscription, name, description, state, amount, plan_benefits FROM subscription ORDER BY amount ASC',
      [],
      { revalidate: false },
    );
  } catch {
    plans = [
      { id_subscription: 1, name: 'Básico', description: 'Plan inicial para emprendedores', state: 'activo', amount: 2500, plan_benefits: '' },
      { id_subscription: 2, name: 'Profesional', description: 'Para negocios en crecimiento', state: 'activo', amount: 5000, plan_benefits: '' },
      { id_subscription: 3, name: 'Premium', description: 'Máxima visibilidad y beneficios', state: 'activo', amount: 9500, plan_benefits: '' },
      { id_subscription: 4, name: 'Enterprise', description: 'Solución corporativa', state: 'inactivo', amount: 15000, plan_benefits: '' },
    ];
  }

  return <PlanesClient initialPlans={plans} />;
}
