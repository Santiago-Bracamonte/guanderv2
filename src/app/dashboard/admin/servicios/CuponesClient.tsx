'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { Search, Tag, X, CheckCircle, XCircle } from 'lucide-react';
import type { CouponRow } from '@/app/api/admin/coupons/route';

/* --- Toast --- */
interface ToastMsg { id: number; type: 'success' | 'error'; text: string; }
function ToastContainer({ toasts, dismiss }: { toasts: ToastMsg[]; dismiss: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto ${t.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
          {t.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          <span>{t.text}</span>
          <button onClick={() => dismiss(t.id)} className="ml-2 hover:opacity-70"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}
function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const counter = useRef(0);
  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    const id = ++counter.current;
    setToasts((p) => [...p, { id, type, text }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);
  const dismiss = useCallback((id: number) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  return { toasts, showToast, dismiss };
}

type FilterType = 'todos' | 'local' | 'profesional';

export default function CuponesClient({ initialCoupons }: { initialCoupons: CouponRow[] }) {
  const [coupons] = useState<CouponRow[]>(initialCoupons);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('todos');
  const { toasts, dismiss } = useToast();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return coupons.filter((c) => {
      const matchType = filterType === 'todos' || c.owner_type === filterType;
      const matchSearch =
        !q ||
        c.owner_name.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.code_coupon.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [coupons, search, filterType]);

  function formatDate(d: string) {
    if (!d) return '-';
    const parts = d.split('-');
    if (parts.length !== 3) return d;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function isExpired(d: string) {
    if (!d) return false;
    return new Date(d) < new Date();
  }

  const typeFilters: { label: string; value: FilterType }[] = [
    { label: 'Todos', value: 'todos' },
    { label: 'Locales', value: 'local' },
    { label: 'Profesionales', value: 'profesional' },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold" style={{ color: 'var(--guander-ink)' }}>
        Cupones
      </h1>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--guander-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por dueño, nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ border: '1px solid var(--guander-border)', color: 'var(--guander-ink)', background: 'white' }}
          />
        </div>

        {/* Type filter */}
        <div className="flex gap-1.5">
          {typeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterType(f.value)}
              className="px-3.5 py-2 rounded-xl text-sm font-medium transition cursor-pointer"
              style={
                filterType === f.value
                  ? { backgroundColor: 'var(--guander-forest)', color: 'white' }
                  : { backgroundColor: 'var(--guander-mint)', color: 'var(--guander-forest)' }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-sm" style={{ color: 'var(--guander-muted)' }}>
        {filtered.length} cupón{filtered.length !== 1 ? 'es' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid var(--guander-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--guander-border)', backgroundColor: 'var(--guander-mint)' }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--guander-ink)' }}>Dueño</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--guander-ink)' }}>Cupón</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--guander-ink)' }}>Código</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--guander-ink)' }}>Descuento</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--guander-ink)' }}>Puntos req.</th>
                <th className="text-center px-4 py-3 font-semibold" style={{ color: 'var(--guander-ink)' }}>Vencimiento</th>
                <th className="text-center px-4 py-3 font-semibold" style={{ color: 'var(--guander-ink)' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12" style={{ color: 'var(--guander-muted)' }}>
                    <Tag size={32} className="mx-auto mb-2 opacity-40" />
                    No se encontraron cupones
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => (
                  <tr
                    key={`${c.owner_type}-${c.id_coupon}`}
                    style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid var(--guander-border)' : 'none',
                    }}
                    className="hover:bg-[#f5f9f7] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={
                            c.owner_type === 'local'
                              ? { backgroundColor: '#d6e7de', color: 'var(--guander-forest)' }
                              : { backgroundColor: '#e8f0fe', color: '#1a56db' }
                          }
                        >
                          {c.owner_type === 'local' ? 'Local' : 'Prof.'}
                        </span>
                        <span style={{ color: 'var(--guander-ink)' }}>{c.owner_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium" style={{ color: 'var(--guander-ink)' }}>{c.name}</p>
                      {c.description && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--guander-muted)' }}>{c.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--guander-mint)', color: 'var(--guander-forest)' }}>
                        {c.code_coupon}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--guander-ink)' }}>
                      {c.amount}%
                    </td>
                    <td className="px-4 py-3 text-right" style={{ color: 'var(--guander-muted)' }}>
                      {c.point_req}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className="text-xs"
                        style={{ color: isExpired(c.expiration_date) ? '#c62828' : 'var(--guander-muted)' }}
                      >
                        {formatDate(c.expiration_date)}
                        {isExpired(c.expiration_date) && ' (vencido)'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={
                          c.state_name?.toLowerCase() === 'activo'
                            ? { backgroundColor: '#d1fae5', color: '#065f46' }
                            : { backgroundColor: '#fee2e2', color: '#991b1b' }
                        }
                      >
                        {c.state_name ?? '-'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
