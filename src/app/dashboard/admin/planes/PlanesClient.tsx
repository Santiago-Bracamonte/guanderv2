"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { Shield, X, ChevronRight, CheckCircle, XCircle, Plus, Trash2 } from "lucide-react";

interface BenefitItem { benefit: string; detail?: string; }

function parseBenefits(raw: string): BenefitItem[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as BenefitItem[];
  } catch { /* fall through */ }
  // fallback: plain text lines
  return raw.split(/\n/).map((b) => ({ benefit: b.trim() })).filter((b) => b.benefit);
}

function serializeBenefits(items: BenefitItem[]): string {
  return JSON.stringify(items);
}

export interface SubscriptionItem {
  id_subscription: number;
  name: string;
  description: string;
  state: string;
  amount: number;
  plan_benefits: string;
}

function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── Toast ─── */
interface ToastMsg { id: number; type: "success" | "error"; text: string; }
function ToastContainer({ toasts, dismiss }: { toasts: ToastMsg[]; dismiss: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto ${
          t.type === "success" ? "bg-green-600 text-white" : "bg-red-500 text-white"
        }`}>
          {t.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
          <span>{t.text}</span>
          <button onClick={() => dismiss(t.id)} className="ml-2 hover:opacity-70"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}
function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const counterRef = useRef(0);
  const showToast = useCallback((type: "success" | "error", text: string) => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  const dismiss = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);
  return { toasts, showToast, dismiss };
}

export default function PlanesClient({
  initialPlans,
}: {
  initialPlans: SubscriptionItem[];
}) {
  const [plans, setPlans] = useState<SubscriptionItem[]>(initialPlans);
  const [saving, setSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionItem | null>(null);
  const { toasts, showToast, dismiss } = useToast();

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formState, setFormState] = useState<"activo" | "inactivo">("activo");
  const [formAmount, setFormAmount] = useState("");
  const [formBenefits, setFormBenefits] = useState<BenefitItem[]>([]);
  const [newBenefit, setNewBenefit] = useState("");
  const [newDetail, setNewDetail] = useState("");

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => a.amount - b.amount),
    [plans],
  );

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormState("activo");
    setFormAmount("");
    setFormBenefits([]);
    setNewBenefit("");
    setNewDetail("");
  };

  const openEdit = (plan: SubscriptionItem) => {
    setFormName(plan.name);
    setFormDescription(plan.description);
    setFormState(plan.state === "inactivo" ? "inactivo" : "activo");
    setFormAmount(String(plan.amount));
    setFormBenefits(parseBenefits(plan.plan_benefits));
    setNewBenefit("");
    setNewDetail("");
    setEditingPlan(plan);
  };

  const closeAll = () => {
    setEditingPlan(null);
  };

  const handleUpdate = async () => {
    if (!editingPlan) return;
    const amount = Number(formAmount);
    if (!formName.trim() || !Number.isFinite(amount) || amount < 0) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_subscription: editingPlan.id_subscription,
          name: formName.trim(),
          description: formDescription.trim(),
          state: formState,
          amount,
          plan_benefits: serializeBenefits(formBenefits),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok || data.error) {
        showToast("error", data.error ?? "No se pudo actualizar el plan");
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
                amount,                plan_benefits: serializeBenefits(formBenefits),              }
            : item,
        ),
      );
      closeAll();
      showToast("success", "Plan actualizado correctamente");
    } catch {
      showToast("error", "No se pudo actualizar el plan");
    } finally {
      setSaving(false);
    }
  };

  const addBenefit = () => {
    const b = newBenefit.trim();
    if (!b) return;
    setFormBenefits((prev) => [...prev, { benefit: b, detail: newDetail.trim() || undefined }]);
    setNewBenefit("");
    setNewDetail("");
  };

  const removeBenefit = (idx: number) =>
    setFormBenefits((prev) => prev.filter((_, i) => i !== idx));

  const renderForm = () => (
    <div className="space-y-4 p-6 pt-0">
      <div>
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--guander-ink)" }}
        >
          Nombre *
        </label>
        <input
          type="text"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{
            border: "1px solid var(--guander-border)",
            color: "var(--guander-ink)",
          }}
          placeholder="Ej. Profesional"
        />
      </div>
      <div>
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--guander-ink)" }}
        >
          Descripción
        </label>
        <textarea
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
          style={{
            border: "1px solid var(--guander-border)",
            color: "var(--guander-ink)",
          }}
          placeholder="Detalle del plan"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--guander-ink)" }}
          >
            Estado
          </label>
          <select
            value={formState}
            onChange={(e) =>
              setFormState(
                e.target.value === "inactivo" ? "inactivo" : "activo",
              )
            }
            className="w-full px-4 py-3 rounded-xl text-sm outline-none bg-white cursor-pointer"
            style={{
              border: "1px solid var(--guander-border)",
              color: "var(--guander-ink)",
            }}
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--guander-ink)" }}
          >
            Monto mensual *
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={formAmount}
            onChange={(e) => setFormAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              border: "1px solid var(--guander-border)",
              color: "var(--guander-ink)",
            }}
            placeholder="5000"
          />
        </div>
      </div>

      {/* Benefits builder */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--guander-ink)" }}>
          Beneficios del plan
        </label>

        {/* Existing benefits */}
        {formBenefits.length > 0 && (
          <ul className="mb-3 space-y-1.5">
            {formBenefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2 px-3 py-2 rounded-xl text-sm" style={{ backgroundColor: "var(--guander-mint)" }}>
                <span style={{ color: "var(--guander-forest)" }} className="mt-0.5 shrink-0">✓</span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium" style={{ color: "var(--guander-ink)" }}>{b.benefit}</span>
                  {b.detail && <span className="ml-1 text-xs" style={{ color: "var(--guander-muted)" }}>— {b.detail}</span>}
                </div>
                <button type="button" onClick={() => removeBenefit(i)} className="shrink-0 hover:opacity-70 transition cursor-pointer">
                  <Trash2 size={14} color="#c0392b" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add new benefit */}
        <div className="space-y-2">
          <input
            type="text"
            value={newBenefit}
            onChange={(e) => setNewBenefit(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBenefit())}
            placeholder="Ej. Perfil destacado"
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ border: "1px solid var(--guander-border)", color: "var(--guander-ink)" }}
          />
          <input
            type="text"
            value={newDetail}
            onChange={(e) => setNewDetail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBenefit())}
            placeholder="Detalle opcional (ej. hasta 5 fotos)"
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ border: "1px solid var(--guander-border)", color: "var(--guander-ink)" }}
          />
          <button
            type="button"
            onClick={addBenefit}
            disabled={!newBenefit.trim()}
            className="w-full py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition hover:opacity-90 cursor-pointer disabled:opacity-40"
            style={{ backgroundColor: "var(--guander-mint)", color: "var(--guander-forest)" }}
          >
            <Plus size={14} /> Agregar beneficio
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1
        className="text-xl font-bold"
        style={{ color: "var(--guander-ink)" }}
      >
        Planes de Suscripción
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedPlans.map((plan) => (
          <div
            key={plan.id_subscription}
            className="bg-white rounded-2xl p-6"
            style={{ border: "1px solid var(--guander-border)" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "#d4e8f0" }}
              >
                <Shield size={18} color="#1d5a7a" />
              </div>
              <div>
                <h3
                  className="text-base font-bold"
                  style={{ color: "var(--guander-ink)" }}
                >
                  {plan.name}
                </h3>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide"
                  style={{
                    backgroundColor:
                      plan.state === "activo" ? "#d4edda" : "#fde2e2",
                    color: plan.state === "activo" ? "#1f4b3b" : "#c0392b",
                  }}
                >
                  {plan.state}
                </span>
              </div>
            </div>
              {plan.description && (
                <p
                  className="text-sm mb-3"
                  style={{ color: "var(--guander-muted)" }}
                >
                  {plan.description}
                </p>
              )}
              {plan.plan_benefits && parseBenefits(plan.plan_benefits).length > 0 && (
                <ul className="text-xs mb-4 space-y-1.5" style={{ color: "var(--guander-ink)" }}>
                  {parseBenefits(plan.plan_benefits).map((b, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span style={{ color: "var(--guander-forest)" }} className="shrink-0 mt-0.5">✓</span>
                      <span>
                        <span className="font-medium">{b.benefit}</span>
                        {b.detail && <span className="ml-1" style={{ color: "var(--guander-muted)" }}>— {b.detail}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            <p
              className="text-2xl font-bold mb-4"
              style={{ color: "var(--guander-ink)" }}
            >
              ${plan.amount.toLocaleString("es-AR")}
              <span
                className="text-sm font-normal"
                style={{ color: "var(--guander-muted)" }}
              >
                /mes
              </span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => openEdit(plan)}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 transition hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: "var(--guander-forest)" }}
              >
                Gestionar <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!editingPlan} onClose={closeAll}>
        <div className="p-6 pb-3 flex items-center justify-between">
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--guander-ink)" }}
          >
            Editar Plan
          </h2>
          <button
            onClick={closeAll}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition"
          >
            <X size={16} />
          </button>
        </div>
        {renderForm()}
        <div className="p-6 pt-2 flex gap-3">
          <button
            onClick={closeAll}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90"
            style={{ backgroundColor: "#c5cdb3", color: "#3d4f35" }}
          >
            Cancelar
          </button>
          <button
            onClick={handleUpdate}
            disabled={saving || !formName.trim() || formAmount.trim() === ""}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition cursor-pointer hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "var(--guander-forest)" }}
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
