import { queryD1 } from '@/lib/cloudflare-d1';
import PlanesClient, { type SubscriptionItem } from './PlanesClient';

interface SubscriptionRow extends SubscriptionItem {
  id_subscription: number;
  name: string;
  description: string;
  plan_benefits?: string;
  state: string;
  amount: number;
}

export default async function PlanesPage() {
  let plans: SubscriptionItem[] = [];

  try {
    plans = await queryD1<SubscriptionRow>(
      'SELECT id_subscription, name, description, plan_benefits, state, amount FROM subscription ORDER BY amount ASC',
      [],
      { revalidate: false },
    );
  } catch {
    plans = [
      { id_subscription: 1, name: 'Básico', description: 'Plan inicial para emprendedores', plan_benefits: 'Beneficio 1\nBeneficio 2', state: 'activo', amount: 2500 },
      { id_subscription: 2, name: 'Profesional', description: 'Para negocios en crecimiento', plan_benefits: 'Beneficio 1\nBeneficio 2', state: 'activo', amount: 5000 },
      { id_subscription: 3, name: 'Premium', description: 'Máxima visibilidad y beneficios', plan_benefits: 'Beneficio 1\nBeneficio 2', state: 'activo', amount: 9500 },
      { id_subscription: 4, name: 'Enterprise', description: 'Solución corporativa', plan_benefits: 'Beneficio 1\nBeneficio 2', state: 'inactivo', amount: 15000 },
    ];
  }

  return <PlanesClient initialPlans={plans} />;
}
