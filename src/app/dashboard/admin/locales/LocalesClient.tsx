'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Star, ImageIcon, Download, Settings, Plus, X, MapPin, Building2 } from 'lucide-react';

/* ─── Types ─── */
export interface LocaleItem {
  id: number;
  name: string;
  email: string;
  category: string;
  categoryId: number | null;
  rating: number | null;
  favorites: number;
  type: 'Premium' | 'Profesional' | 'Free';
  description: string;
  address: string;
  image: string;
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  Premium: { bg: '#7d8b6a', text: '#ffffff' },
  Profesional: { bg: '#3d6b6b', text: '#ffffff' },
  Free: { bg: '#999999', text: '#ffffff' },
};

const CATEGORY_MAP: Record<number, string> = {
  1: 'Veterinaria',
  2: 'Pet Shop',
  3: 'Cafetería',
  4: 'Restaurante',
  5: 'Grooming',
  6: 'Resort',
};

const CATEGORIES = [
  'Todas las categorías',
  'Veterinaria',
  'Pet Shop',
  'Cafetería',
  'Restaurante',
  'Grooming',
  'Resort',
];

const PLACEHOLDER_IMAGES = [
  'https://placehold.co/400x200/1f4b3b/ffffff?text=Local+1',
  'https://placehold.co/400x200/3d6b4f/ffffff?text=Local+2',
  'https://placehold.co/400x200/7d8b6a/ffffff?text=Local+3',
  'https://placehold.co/400x200/3d6b6b/ffffff?text=Local+4',
  'https://placehold.co/400x200/173a2d/ffffff?text=Local+5',
  'https://placehold.co/400x200/5a7a5a/ffffff?text=Local+6',
];

/* ─── Modal ─── */
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function LocalesClient({ initialLocales }: { initialLocales: LocaleItem[] }) {
  const searchParams = useSearchParams();
  const [locales, setLocales] = useState<LocaleItem[]>(initialLocales);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas las categorías');
  const [viewLocale, setViewLocale] = useState<LocaleItem | null>(null);
  const [editLocale, setEditLocale] = useState<LocaleItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCategory, setFormCategory] = useState(1);
  const [formStars, setFormStars] = useState('');

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      openAdd();
    }
  }, [searchParams]);

  const openEdit = (locale: LocaleItem) => {
    setFormName(locale.name);
    setFormDescription(locale.description);
    setFormAddress(locale.address);
    setFormCategory(locale.categoryId ?? 1);
    setFormStars(locale.rating?.toString() ?? '');
    setEditLocale(locale);
  };

  const openAdd = () => {
    setFormName('');
    setFormDescription('');
    setFormAddress('');
    setFormCategory(1);
    setFormStars('');
    setShowAdd(true);
  };

  const handleSaveEdit = async () => {
    if (!editLocale || !formName.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/admin/locales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_store: editLocale.id,
          name: formName,
          description: formDescription,
          address: formAddress,
          stars: formStars ? parseFloat(formStars) : null,
          fk_category: formCategory,
        }),
      });
      setLocales((prev) =>
        prev.map((l) =>
          l.id === editLocale.id
            ? {
                ...l,
                name: formName,
                description: formDescription,
                address: formAddress,
                rating: formStars ? parseFloat(formStars) : null,
                category: CATEGORY_MAP[formCategory] ?? 'Sin categoría',
                categoryId: formCategory,
              }
            : l,
        ),
      );
      setEditLocale(null);
    } catch {
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/admin/locales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          address: formAddress,
          fk_category: formCategory,
        }),
      });
      const newLocale: LocaleItem = {
        id: Date.now(),
        name: formName,
        email: `${formName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'nuevo'}@gmail.com`,
        category: CATEGORY_MAP[formCategory] ?? 'Sin categoría',
        categoryId: formCategory,
        rating: formStars ? parseFloat(formStars) : null,
        favorites: 0,
        type: 'Free',
        description: formDescription,
        address: formAddress,
        image: PLACEHOLDER_IMAGES[locales.length % PLACEHOLDER_IMAGES.length],
      };
      setLocales((prev) => [newLocale, ...prev]);
      setShowAdd(false);
    } catch {
      alert('Error al crear local');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este local?')) return;
    try {
      await fetch(`/api/admin/locales?id=${id}`, { method: 'DELETE' });
      setLocales((prev) => prev.filter((l) => l.id !== id));
    } catch {
      alert('Error al eliminar');
    }
  };

  const filtered = locales.filter((locale) => {
    const matchSearch =
      search.trim() === '' ||
      locale.name.toLowerCase().includes(search.toLowerCase()) ||
      locale.email.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      category === 'Todas las categorías' || locale.category === category;
    return matchSearch && matchCategory;
  });

  const renderForm = () => (
    <div className="space-y-4 p-6 pt-0">
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--guander-ink)' }}>Nombre *</label>
        <input
          type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{ border: '1px solid var(--guander-border)', color: 'var(--guander-ink)' }}
          placeholder="Nombre del local"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--guander-ink)' }}>Descripción</label>
        <textarea
          value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={3}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
          style={{ border: '1px solid var(--guander-border)', color: 'var(--guander-ink)' }}
          placeholder="Descripción del local"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--guander-ink)' }}>Dirección</label>
        <input
          type="text" value={formAddress} onChange={(e) => setFormAddress(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{ border: '1px solid var(--guander-border)', color: 'var(--guander-ink)' }}
          placeholder="Av. Corrientes 1234, CABA"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--guander-ink)' }}>Categoría</label>
          <select
            value={formCategory} onChange={(e) => setFormCategory(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none bg-white cursor-pointer"
            style={{ border: '1px solid var(--guander-border)', color: 'var(--guander-ink)' }}
          >
            {Object.entries(CATEGORY_MAP).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--guander-ink)' }}>Valoración</label>
          <input
            type="number" step="0.1" min="0" max="5" value={formStars}
            onChange={(e) => setFormStars(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ border: '1px solid var(--guander-border)', color: 'var(--guander-ink)' }}
            placeholder="4.5"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--guander-ink)' }}>Imagen</label>
        <div
          className="rounded-xl overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition"
          style={{ border: '2px dashed var(--guander-border)', background: 'var(--guander-cream)', height: '120px' }}
        >
          <div className="text-center">
            <ImageIcon size={32} style={{ color: 'var(--guander-muted)' }} className="mx-auto mb-1" />
            <p className="text-xs" style={{ color: 'var(--guander-muted)' }}>Arrastra una imagen o click para subir</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--guander-ink)' }}>Gestión de Locales</h1>
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

      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--guander-muted)' }} />
          <input type="text" placeholder="Buscar local..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition bg-white"
            style={{ border: '1px solid var(--guander-border)', color: 'var(--guander-ink)' }}
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-3 rounded-xl text-sm outline-none bg-white cursor-pointer"
          style={{ border: '1px solid var(--guander-border)', color: 'var(--guander-ink)' }}
        >
          {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <button onClick={openAdd}
          className="px-5 py-3 rounded-xl text-sm font-semibold text-white flex items-center gap-2 shrink-0 cursor-pointer transition hover:opacity-90"
          style={{ backgroundColor: 'var(--guander-forest)' }}
        >
          <Plus size={16} /> Agregar Local
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '1px solid var(--guander-border)' }}>
          <p className="text-sm" style={{ color: 'var(--guander-muted)' }}>No se encontraron locales.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((locale) => {
            const typeStyle = TYPE_COLORS[locale.type] || TYPE_COLORS.Free;
            return (
              <div key={locale.id} className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid var(--guander-border)' }}>
                {/* Image */}
                <div className="relative h-36 overflow-hidden" style={{ backgroundColor: 'var(--guander-cream)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={locale.image} alt={locale.name} className="w-full h-full object-cover" />
                  <span
                    className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded tracking-wide uppercase"
                    style={{ backgroundColor: typeStyle.bg, color: typeStyle.text }}
                  >
                    {locale.type}
                  </span>
                </div>
                <div className="p-5">
                  <div className="mb-1">
                    <h3 className="text-base font-bold" style={{ color: 'var(--guander-ink)' }}>{locale.name}</h3>
                    <p className="text-xs" style={{ color: 'var(--guander-muted)' }}>{locale.email}</p>
                  </div>
                  <p className="text-sm mb-2" style={{ color: 'var(--guander-muted)' }}>{locale.category}</p>
                  <div className="flex items-center gap-6 mb-4">
                    <div className="flex items-center gap-1">
                      <span className="text-sm" style={{ color: 'var(--guander-muted)' }}>Valoración :</span>
                      {locale.rating != null && (
                        <>
                          <Star size={14} fill="#e3b75e" color="#e3b75e" />
                          <span className="text-sm font-bold" style={{ color: 'var(--guander-ink)' }}>{locale.rating.toFixed(1)}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm" style={{ color: 'var(--guander-muted)' }}>Favoritos :</span>
                      <span className="text-sm font-bold" style={{ color: 'var(--guander-ink)' }}>{locale.favorites}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setViewLocale(locale)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90"
                      style={{ backgroundColor: '#c5cdb3', color: '#3d4f35' }}
                    >Ver</button>
                    <button onClick={() => openEdit(locale)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition cursor-pointer hover:opacity-90"
                      style={{ backgroundColor: 'var(--guander-forest)' }}
                    >Editar</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── View Modal ─── */}
      <Modal open={!!viewLocale} onClose={() => setViewLocale(null)}>
        {viewLocale && (
          <>
            <div className="relative h-48 overflow-hidden rounded-t-2xl" style={{ backgroundColor: 'var(--guander-cream)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={viewLocale.image} alt={viewLocale.name} className="w-full h-full object-cover" />
              <button onClick={() => setViewLocale(null)}
                className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center cursor-pointer hover:bg-white transition"
              ><X size={16} /></button>
              <span className="absolute bottom-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded tracking-wide uppercase"
                style={{ backgroundColor: TYPE_COLORS[viewLocale.type]?.bg, color: '#fff' }}
              >{viewLocale.type}</span>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--guander-ink)' }}>{viewLocale.name}</h2>
              <p className="text-xs mb-4" style={{ color: 'var(--guander-muted)' }}>{viewLocale.email}</p>
              {viewLocale.description && (
                <p className="text-sm mb-4" style={{ color: 'var(--guander-ink)' }}>{viewLocale.description}</p>
              )}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--guander-cream)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 size={14} style={{ color: 'var(--guander-forest)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--guander-muted)' }}>Categoría</span>
                  </div>
                  <p className="text-sm font-bold" style={{ color: 'var(--guander-ink)' }}>{viewLocale.category}</p>
                </div>
                <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--guander-cream)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Star size={14} fill="#e3b75e" color="#e3b75e" />
                    <span className="text-xs font-semibold" style={{ color: 'var(--guander-muted)' }}>Valoración</span>
                  </div>
                  <p className="text-sm font-bold" style={{ color: 'var(--guander-ink)' }}>
                    {viewLocale.rating != null ? viewLocale.rating.toFixed(1) : 'Sin valorar'}
                  </p>
                </div>
              </div>
              {viewLocale.address && (
                <div className="flex items-start gap-2 mb-4">
                  <MapPin size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--guander-forest)' }} />
                  <p className="text-sm" style={{ color: 'var(--guander-ink)' }}>{viewLocale.address}</p>
                </div>
              )}
              <div className="flex items-center gap-4 text-sm mb-6" style={{ color: 'var(--guander-muted)' }}>
                <span>❤️ {viewLocale.favorites} favoritos</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setViewLocale(null); openEdit(viewLocale); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: 'var(--guander-forest)' }}
                >Editar Local</button>
                <button onClick={() => { handleDelete(viewLocale.id); setViewLocale(null); }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90 bg-red-50 text-red-600 border border-red-200"
                >Eliminar</button>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* ─── Edit Modal ─── */}
      <Modal open={!!editLocale} onClose={() => setEditLocale(null)}>
        <div className="p-6 pb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: 'var(--guander-ink)' }}>Editar Local</h2>
          <button onClick={() => setEditLocale(null)} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition"><X size={16} /></button>
        </div>
        {renderForm()}
        <div className="p-6 pt-2 flex gap-3">
          <button onClick={() => setEditLocale(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90" style={{ backgroundColor: '#c5cdb3', color: '#3d4f35' }}>Cancelar</button>
          <button onClick={handleSaveEdit} disabled={saving || !formName.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition cursor-pointer hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--guander-forest)' }}
          >{saving ? 'Guardando...' : 'Guardar Cambios'}</button>
        </div>
      </Modal>

      {/* ─── Add Modal ─── */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)}>
        <div className="p-6 pb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: 'var(--guander-ink)' }}>Agregar Nuevo Local</h2>
          <button onClick={() => setShowAdd(false)} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition"><X size={16} /></button>
        </div>
        {renderForm()}
        <div className="p-6 pt-2 flex gap-3">
          <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90" style={{ backgroundColor: '#c5cdb3', color: '#3d4f35' }}>Cancelar</button>
          <button onClick={handleAdd} disabled={saving || !formName.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition cursor-pointer hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--guander-forest)' }}
          >{saving ? 'Creando...' : 'Crear Local'}</button>
        </div>
      </Modal>
    </div>
  );
}
