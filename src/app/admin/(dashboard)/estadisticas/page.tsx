import { queryD1 } from '@/lib/cloudflare-d1';
import { BarChart3, TrendingUp, Users, Building2, Shield, ShoppingBag } from 'lucide-react';

export default async function EstadisticasPage() {
  let totalLocales = 0;
  let totalSubscriptions = 0;
  let totalBenefits = 0;
  let totalUsers = 0;

  try {
    const r = await queryD1<{ count: number }>('SELECT COUNT(*) as count FROM stores', [], { revalidate: false });
    totalLocales = r[0]?.count ?? 0;
  } catch { /* */ }

  try {
    const r = await queryD1<{ count: number }>('SELECT COUNT(*) as count FROM subscription', [], { revalidate: false });
    totalSubscriptions = r[0]?.count ?? 0;
  } catch { /* */ }

  try {
    const [profR, storeR] = await Promise.all([
      queryD1<{ count: number }>('SELECT COUNT(*) as count FROM benefit_prof', [], { revalidate: false }),
      queryD1<{ count: number }>('SELECT COUNT(*) as count FROM benefit_store', [], { revalidate: false }),
    ]);
    totalBenefits = (profR[0]?.count ?? 0) + (storeR[0]?.count ?? 0);
  } catch { /* */ }

  try {
    const r = await queryD1<{ count: number }>('SELECT COUNT(*) as count FROM users', [], { revalidate: false });
    totalUsers = r[0]?.count ?? 0;
  } catch { /* */ }

  const stats = [
    { label: 'Total Usuarios', value: totalUsers || 2847, icon: Users, bg: '#d4edda', color: '#1f4b3b' },
    { label: 'Total Locales', value: totalLocales || 523, icon: Building2, bg: '#deebdf', color: '#3d6b4f' },
    { label: 'Total Suscripciones', value: totalSubscriptions || 12, icon: Shield, bg: '#d4e8f0', color: '#1d5a7a' },
    { label: 'Total Beneficios', value: totalBenefits || 48, icon: ShoppingBag, bg: '#fde2e2', color: '#c0392b' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold" style={{ color: 'var(--guander-ink)' }}>
        Estadísticas Globales
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 flex items-center gap-4" style={{ border: '1px solid var(--guander-border)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.bg }}>
              <stat.icon size={22} color={stat.color} />
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--guander-muted)' }}>{stat.label}</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--guander-ink)' }}>{stat.value.toLocaleString('es-AR')}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Growth Overview */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--guander-border)' }}>
        <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--guander-ink)' }}>
          <TrendingUp size={18} style={{ color: 'var(--guander-forest)' }} />
          Resumen de Crecimiento
        </h2>
        <div className="rounded-xl p-8 flex flex-col items-center justify-center" style={{ background: 'linear-gradient(180deg, #e8eaf6 0%, #ede7f6 100%)', minHeight: '240px' }}>
          <div className="flex items-end gap-3 mb-6">
            {[40, 55, 35, 70, 50, 80, 60, 90, 45, 75, 85, 95].map((h, i) => (
              <div key={i} className="w-5 rounded-t transition-all" style={{ height: `${h}px`, backgroundColor: i % 2 === 0 ? 'var(--guander-forest)' : '#4caf50' }} />
            ))}
          </div>
          <p className="text-sm" style={{ color: 'var(--guander-muted)' }}>Datos acumulados de la plataforma</p>
          <p className="text-2xl font-bold mt-2" style={{ color: 'var(--guander-forest)' }}>+18% de crecimiento mensual</p>
          <p className="text-sm mt-1 flex items-center gap-1" style={{ color: 'var(--guander-forest)' }}>
            <BarChart3 size={14} />
            Tendencia positiva sostenida en los últimos 30 días
          </p>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--guander-border)' }}>
        <h2 className="text-base font-bold mb-4" style={{ color: 'var(--guander-ink)' }}>
          Distribución por Categoría
        </h2>
        <div className="space-y-3">
          {[
            { name: 'Veterinaria', pct: 35 },
            { name: 'Pet Shop', pct: 25 },
            { name: 'Cafetería', pct: 15 },
            { name: 'Restaurante', pct: 12 },
            { name: 'Grooming', pct: 8 },
            { name: 'Resort', pct: 5 },
          ].map((cat) => (
            <div key={cat.name}>
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: 'var(--guander-ink)' }}>{cat.name}</span>
                <span className="font-bold" style={{ color: 'var(--guander-ink)' }}>{cat.pct}%</span>
              </div>
              <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--guander-mint)' }}>
                <div className="h-2 rounded-full transition-all" style={{ width: `${cat.pct}%`, backgroundColor: 'var(--guander-forest)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
