import { queryD1 } from '@/lib/cloudflare-d1';
import { ShoppingBag, Plus, ImageIcon, Download, Settings } from 'lucide-react';

interface BenefitRow {
  id_benefit_prof?: number;
  id_benefit_store?: number;
  title?: string;
  name?: string;
  store_name?: string;
  professional_name?: string;
  professional_last_name?: string;
  professional_description?: string;
  description?: string;
  percentage?: number | null;
  tag?: string;
}

export default async function ServiciosPage() {
  let profesionales: BenefitRow[] = [];
  let tiendas: BenefitRow[] = [];

  try {
    profesionales = await queryD1<BenefitRow>(
      `SELECT
         bp.id_benefit_prof,
         bp.description,
         bp.percentage,
         ud.name AS professional_name,
         ud.last_name AS professional_last_name,
         p.description AS professional_description
       FROM benefit_prof bp
       LEFT JOIN professionals p ON p.id_professional = bp.fk_professional
       LEFT JOIN users u ON u.id_user = p.fk_user_id
       LEFT JOIN user_data ud ON ud.id_user_data = u.fk_user_data
       ORDER BY bp.id_benefit_prof DESC
       LIMIT 12`,
      [],
      { revalidate: false },
    );
  } catch { /* fallback */ }

  try {
    tiendas = await queryD1<BenefitRow>(
      `SELECT
         bs.id_benefit_store,
         bs.description,
         bs.percentage,
         s.name AS store_name
       FROM benefit_store bs
       LEFT JOIN stores s ON s.id_store = bs.fk_store
       ORDER BY bs.id_benefit_store DESC
       LIMIT 12`,
      [],
      { revalidate: false },
    );
  } catch { /* fallback */ }

  const allItems = [
    ...profesionales.map((b) => ({ ...b, source: 'Profesional' as const })),
    ...tiendas.map((b) => ({ ...b, source: 'Tienda' as const })),
  ];

  if (allItems.length === 0) {
    for (let i = 1; i <= 6; i++) {
      allItems.push({
        id_benefit_prof: i,
        name: `Servicio ${i}`,
        description: 'Descripción del servicio o producto',
        percentage: i * 5,
        source: i % 2 === 0 ? 'Tienda' : 'Profesional',
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--guander-ink)' }}>
          Servicios/Productos
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

      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--guander-muted)' }}>
          {allItems.length} beneficios registrados
        </p>
        <button
          className="px-5 py-3 rounded-xl text-sm font-semibold text-white flex items-center gap-2 cursor-pointer transition hover:opacity-90"
          style={{ backgroundColor: 'var(--guander-forest)' }}
        >
          <Plus size={16} />
          Nuevo Beneficio
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allItems.map((item, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5"
            style={{ border: '1px solid var(--guander-border)' }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#deebdf' }}>
                  <ShoppingBag size={18} color="#3d6b4f" />
                </div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--guander-ink)' }}>
                  {item.name
                    || item.title
                    || item.store_name
                    || [item.professional_name, item.professional_last_name].filter(Boolean).join(' ')
                    || item.professional_description
                    || 'Sin nombre'}
                </h3>
              </div>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide"
                style={{
                  backgroundColor: item.source === 'Profesional' ? '#3d6b6b' : '#7d8b6a',
                  color: '#ffffff',
                }}
              >
                {item.source}
              </span>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--guander-muted)' }}>
              {item.description || 'Sin descripción'}
            </p>
            {item.percentage != null && (
              <p className="text-lg font-bold mb-3" style={{ color: 'var(--guander-forest)' }}>
                {item.percentage}% descuento
              </p>
            )}
            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-xl text-xs font-semibold transition hover:opacity-90" style={{ backgroundColor: '#c5cdb3', color: '#3d4f35' }}>Ver</button>
              <button className="flex-1 py-2 rounded-xl text-xs font-semibold text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--guander-forest)' }}>Editar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
