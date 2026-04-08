'use client';

import { useMemo, useState } from 'react';
import { Shield, Plus, ImageIcon, Download, Settings, X } from 'lucide-react';

export interface SubscriptionItem {
  id_subscription: number;
  name: string;
  description: string;
  state: string;
  amount: number;
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default function PlanesClient({ initialPlans }: { initialPlans: SubscriptionItem[] }) {
  const [plans, setPlans] = useState<SubscriptionItem[]>(initialPlans);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionItem | null>(null);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formState, setFormState] = useState<'activo' | 'inactivo'>('activo');
  const [formAmount, setFormAmount] = useState('');

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => a.amount - b.amount),
    [plans],
  );

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormState('activo');
    setFormAmount('');
  };

  const openAdd = () => {
    resetForm();
    setEditingPlan(null);
    setShowAdd(true);
  };

  const openEdit = (plan: SubscriptionItem) => {
    setFormName(plan.name);
    setFormDescription(plan.description);
    setFormState(plan.state === 'inactivo' ? 'inactivo' : 'activo');
    setFormAmount(String(plan.amount));
    setEditingPlan(plan);
  };

  const closeAll = () => {
    setShowAdd(false);
    setEditingPlan(null);
  };

  const handleCreate = async () => {
    const amount = Number(formAmount);
    if (!formName.trim() || !Number.isFinite(amount) || amount < 0) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim(),
          state: formState,
          amount,
        }),
      });
      const data = (await res.json()) as { id_subscription?: number; error?: string };
      if (!res.ok || data.error) {
        alert(data.error ?? 'No se pudo crear el plan');
        return;
      }

      const newItem: SubscriptionItem = {
        id_subscription: data.id_subscription ?? Date.now(),
        name: formName.trim(),
        description: formDescription.trim(),
        state: formState,
        amount,
      };
      setPlans((prev) => [...prev, newItem]);
      closeAll();
    } catch {
      alert('No se pudo crear el plan');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingPlan) return;
    const amount = Number(formAmount);
    if (!formName.trim() || !Number.isFinite(amount) || amount < 0) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_subscription: editingPlan.id_subscription,
          name: formName.trim(),
          description: formDescription.trim(),
          state: formState,
          amount,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok || data.error) {
        alert(data.error ?? 'No se pudo actualizar el plan');
        return;
      }

      setPlans((prev) =>
        prev.map((item) =>
          item.id_subscription === editingPlan.id_subscription
            ? {
                ...item,
                name: formName.trim(),
                description: formDescription.trim(),
                state: formState,
                amount,
              }
            : item,
        ),
      );
      closeAll();
    } catch {
      alert('No se pudo actualizar el plan');
    } finally {
      setSaving(false);
    }
  };

  const renderForm = () => (
    <div className="space-y-4 p-6 pt-0">
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--guander-ink)' }}>Nombre *</label>
        <input
          type="text"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{ border: '1px solid var(--guander-border)', color: 'var(--guander-ink)' }}
          placeholder="Ej. Profesional"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--guander-ink)' }}>Descripción</label>
        <textarea
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
          style={{ border: '1px solid var(--guander-border)', color: 'var(--guander-ink)' }}
          placeholder="Detalle del plan"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--guander-ink)' }}>Estado</label>
          <select
            value={formState}
            onChange={(e) => setFormState(e.target.value === 'inactivo' ? 'inactivo' : 'activo')}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none bg-white cursor-pointer"
            style={{ border: '1px solid var(--guander-border)', color: 'var(--guander-ink)' }}
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--guander-ink)' }}>Monto mensual *</label>
          <input
            type="number"
            min="0"
            step="1"
            value={formAmount}
            onChange={(e) => setFormAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ border: '1px solid var(--guander-border)', color: 'var(--guander-ink)' }}
            placeholder="5000"
          />
        </div>
      </div>
    </div>
  );

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
          onClick={openAdd}
          className="px-5 py-3 rounded-xl text-sm font-semibold text-white flex items-center gap-2 cursor-pointer transition hover:opacity-90"
          style={{ backgroundColor: 'var(--guander-forest)' }}
        >
          <Plus size={16} />
          Nuevo Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedPlans.map((plan) => (
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
              <button
                onClick={() => openEdit(plan)}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition hover:opacity-90"
                style={{ backgroundColor: '#c5cdb3', color: '#3d4f35' }}
              >
                Ver
              </button>
              <button
                onClick={() => openEdit(plan)}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: 'var(--guander-forest)' }}
              >
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showAdd} onClose={closeAll}>
        <div className="p-6 pb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: 'var(--guander-ink)' }}>Crear Plan</h2>
          <button onClick={closeAll} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition"><X size={16} /></button>
        </div>
        {renderForm()}
        <div className="p-6 pt-2 flex gap-3">
          <button onClick={closeAll} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90" style={{ backgroundColor: '#c5cdb3', color: '#3d4f35' }}>Cancelar</button>
          <button
            onClick={handleCreate}
            disabled={saving || !formName.trim() || formAmount.trim() === ''}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition cursor-pointer hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--guander-forest)' }}
          >
            {saving ? 'Creando...' : 'Crear Plan'}
          </button>
        </div>
      </Modal>

      <Modal open={!!editingPlan} onClose={closeAll}>
        <div className="p-6 pb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: 'var(--guander-ink)' }}>Editar Plan</h2>
          <button onClick={closeAll} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition"><X size={16} /></button>
        </div>
        {renderForm()}
        <div className="p-6 pt-2 flex gap-3">
          <button onClick={closeAll} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90" style={{ backgroundColor: '#c5cdb3', color: '#3d4f35' }}>Cancelar</button>
          <button
            onClick={handleUpdate}
            disabled={saving || !formName.trim() || formAmount.trim() === ''}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition cursor-pointer hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--guander-forest)' }}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
