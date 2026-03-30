import { queryD1 } from '@/lib/cloudflare-d1';
import { Shield, Plus, ImageIcon, Download, Settings } from 'lucide-react';

interface SubscriptionRow {
  id_subscription: number;
  name: string;
  description: string;
  state: string;
  amount: number;
}

export default async function PlanesPage() {
  let plans: SubscriptionRow[] = [];

  try {
    plans = await queryD1<SubscriptionRow>(
      'SELECT id_subscription, name, description, state, amount FROM subscription ORDER BY amount ASC',
      [],
      { revalidate: false },
    );
  } catch {
    plans = [
      { id_subscription: 1, name: 'Básico', description: 'Plan inicial para emprendedores', state: 'activo', amount: 2500 },
      { id_subscription: 2, name: 'Profesional', description: 'Para negocios en crecimiento', state: 'activo', amount: 5000 },
      { id_subscription: 3, name: 'Premium', description: 'Máxima visibilidad y beneficios', state: 'activo', amount: 9500 },
      { id_subscription: 4, name: 'Enterprise', description: 'Solución corporativa', state: 'inactivo', amount: 15000 },
    ];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--guander-ink)' }}>
          Planes de Suscripción
        </h1>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-lg border flex items-center justify-center hover:bg-white transition" style={{ borderColor: 'var(--guander-border)' }}>
            <ImageIcon size={16} style={{ color: 'var(--guander-muted)' }} />
          </button>
          <button className="w-9 h-9 rounded-lg border flex items-center justify-center hover:bg-white transition" style={{ borderColor: 'var(--guander-border)' }}>
            <Download size={16} style={{ color: 'var(--guander-muted)' }} />
          </button>
          <button className="w-9 h-9 rounded-lg border flex items-center justify-center hover:bg-white transition" style={{ borderColor: 'var(--guander-border)' }}>
            <Settings size={16} style={{ color: 'var(--guander-muted)' }} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <button
          className="px-5 py-3 rounded-xl text-sm font-semibold text-white flex items-center gap-2 cursor-pointer transition hover:opacity-90"
          style={{ backgroundColor: 'var(--guander-forest)' }}
        >
          <Plus size={16} />
          Nuevo Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id_subscription}
            className="bg-white rounded-2xl p-6"
            style={{ border: '1px solid var(--guander-border)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#d4e8f0' }}>
                <Shield size={18} color="#1d5a7a" />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: 'var(--guander-ink)' }}>{plan.name}</h3>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide"
                  style={{
                    backgroundColor: plan.state === 'activo' ? '#d4edda' : '#fde2e2',
                    color: plan.state === 'activo' ? '#1f4b3b' : '#c0392b',
                  }}
                >
                  {plan.state}
                </span>
              </div>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--guander-muted)' }}>{plan.description}</p>
            <p className="text-2xl font-bold mb-4" style={{ color: 'var(--guander-ink)' }}>
              ${plan.amount.toLocaleString('es-AR')}<span className="text-sm font-normal" style={{ color: 'var(--guander-muted)' }}>/mes</span>
            </p>
            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-xl text-sm font-semibold transition hover:opacity-90" style={{ backgroundColor: '#c5cdb3', color: '#3d4f35' }}>Ver</button>
              <button className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--guander-forest)' }}>Editar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
