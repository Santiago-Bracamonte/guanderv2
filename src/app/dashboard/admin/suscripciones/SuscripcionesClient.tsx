"use client";

import { useEffect, useState, useCallback } from "react";
import { CreditCard, Plus, X, RefreshCw, ChevronDown, ChevronUp, History } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface SubscriptionInstance {
  id_store_sub: number;
  state_payout: string;
  expiration_date: string;
  upgrade_date: string;
  fk_subscription_id: number;
  plan_name: string;
  plan_amount: number;
  entity_type: "store" | "professional";
  entity_id: number;
  entity_name: string;
  owner_name: string;
  owner_email: string;
  payout_count: number;
  last_payout_date: string | null;
  last_payout_amount: number | null;
}

interface PlanOption {
  id_subscription: number;
  name: string;
  amount: number;
}

interface Payout {
  id_sub_payout: number;
  date: string;
  amount: number;
  description: string | null;
  user_name: string;
  user_email: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const money = (v: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(v);

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  const [y, m, day] = d.slice(0, 10).split("-");
  return `${day}/${m}/${y}`;
};

const isExpired = (d: string) => new Date(d) < new Date();

function computePayStatus(lastPayoutDate: string | null, expirationDate: string): "activo" | "pendiente" | "inactivo" {
  if (!lastPayoutDate) return "inactivo";
  const now = new Date();
  const last = new Date(lastPayoutDate);
  const monthsAgo =
    (now.getFullYear() - last.getFullYear()) * 12 + (now.getMonth() - last.getMonth());
  if (monthsAgo <= 0) return "activo";
  if (monthsAgo === 1) {
    // If the subscription hasn't expired yet, treat as active
    const expired = new Date(expirationDate) < now;
    return expired ? "pendiente" : "activo";
  }
  return "inactivo";
}

const STATE_LABELS: Record<string, { label: string; color: string }> = {
  activo: { label: "Activo", color: "bg-green-100 text-green-800" },
  inactivo: { label: "Inactivo", color: "bg-gray-100 text-gray-700" },
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  vencido: { label: "Vencido", color: "bg-red-100 text-red-700" },
};

function StateBadge({ state }: { state: string }) {
  const cfg = STATE_LABELS[state.toLowerCase()] ?? { label: state, color: "bg-gray-100 text-gray-700" };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-lg text-[var(--guander-ink)]">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Detail Drawer ──────────────────────────────────────────────────────────
function DetailDrawer({
  instance,
  plans,
  onClose,
  onUpdated,
}: {
  instance: SubscriptionInstance;
  plans: PlanOption[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [payouts, setPayouts] = useState<Payout[] | null>(null);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [editExpiration, setEditExpiration] = useState(instance.expiration_date?.slice(0, 10) ?? "");
  const computedStatus = computePayStatus(instance.last_payout_date, instance.expiration_date);
  const [editPlan, setEditPlan] = useState(String(instance.fk_subscription_id));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Payment form
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payDesc, setPayDesc] = useState("");
  const [addingPay, setAddingPay] = useState(false);
  const [payError, setPayError] = useState("");

  const loadPayouts = useCallback(async () => {
    setLoadingPayouts(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/instances?id=${instance.id_store_sub}`);
      const data = await res.json();
      setPayouts(data.payouts ?? []);
    } catch {
      setPayouts([]);
    } finally {
      setLoadingPayouts(false);
    }
  }, [instance.id_store_sub]);

  useEffect(() => { loadPayouts(); }, [loadPayouts]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/admin/subscriptions/instances", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_store_sub: instance.id_store_sub,
          expiration_date: editExpiration,
          fk_subscription_id: Number(editPlan),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.error ?? "Error al guardar");
      } else {
        onUpdated();
      }
    } catch {
      setSaveError("Error de red");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPay = async () => {
    setAddingPay(true);
    setPayError("");
    const amount = parseFloat(payAmount.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      setPayError("Ingresá un monto válido");
      setAddingPay(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/subscriptions/instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_store_sub: instance.id_store_sub,
          amount,
          date: payDate,
          description: payDesc.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setPayError(d.error ?? "Error al registrar");
      } else {
        setShowPayForm(false);
        setPayAmount("");
        setPayDesc("");
        loadPayouts();
        onUpdated();
      }
    } catch {
      setPayError("Error de red");
    } finally {
      setAddingPay(false);
    }
  };

  const entityLabel = instance.entity_type === "store" ? "Local" : "Profesional";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white h-full w-full max-w-lg shadow-2xl overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">{entityLabel}</p>
            <h2 className="font-bold text-lg text-[var(--guander-ink)] leading-tight">
              {instance.entity_name || "Sin nombre"}
            </h2>
            <p className="text-sm text-gray-500">{instance.owner_name} · {instance.owner_email}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Edit fields */}
        <div className="px-6 py-4 space-y-4 border-b">
          <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Editar suscripción</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Estado de pago</label>
              <div className="flex items-center h-[38px]">
                <StateBadge state={computedStatus} />
                <span className="ml-2 text-xs text-gray-400">
                  {computedStatus === "activo" && "Pagó este mes"}
                  {computedStatus === "pendiente" && "No pagó este mes"}
                  {computedStatus === "inactivo" && "Sin pagos recientes"}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vencimiento</label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--guander-forest)]"
                value={editExpiration}
                onChange={(e) => setEditExpiration(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Plan</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--guander-forest)]"
              value={editPlan}
              onChange={(e) => setEditPlan(e.target.value)}
            >
              {plans.map((p) => (
                <option key={p.id_subscription} value={p.id_subscription}>
                  {p.name} — {money(p.amount)}
                </option>
              ))}
            </select>
          </div>

          {saveError && <p className="text-red-500 text-xs">{saveError}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2 rounded-lg bg-[var(--guander-forest)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>

        {/* Payment history */}
        <div className="px-6 py-4 flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide flex items-center gap-2">
              <History size={14} /> Historial de pagos
            </h3>
            <button
              onClick={() => setShowPayForm((v) => !v)}
              className="flex items-center gap-1 text-xs font-semibold text-[var(--guander-forest)] border border-[var(--guander-forest)] rounded-lg px-3 py-1 hover:bg-[var(--guander-forest)] hover:text-white transition-colors"
            >
              <Plus size={13} /> Registrar pago
            </button>
          </div>

          {showPayForm && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3 border">
              <p className="text-sm font-semibold text-[var(--guander-ink)]">Nuevo pago</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Monto (ARS)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--guander-forest)]"
                    placeholder="0.00"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Fecha</label>
                  <input
                    type="date"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--guander-forest)]"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Notas (opcional)</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--guander-forest)]"
                  placeholder="Descripción del pago…"
                  value={payDesc}
                  onChange={(e) => setPayDesc(e.target.value)}
                />
              </div>
              {payError && <p className="text-red-500 text-xs">{payError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleAddPay}
                  disabled={addingPay}
                  className="flex-1 py-2 rounded-lg bg-[var(--guander-forest)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {addingPay ? "Guardando…" : "Confirmar pago"}
                </button>
                <button
                  onClick={() => setShowPayForm(false)}
                  className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {loadingPayouts ? (
            <p className="text-sm text-gray-400 py-4 text-center">Cargando…</p>
          ) : payouts && payouts.length > 0 ? (
            <div className="space-y-2">
              {payouts.map((p) => (
                <div key={p.id_sub_payout} className="flex items-start justify-between bg-gray-50 rounded-xl px-4 py-3 border">
                  <div>
                    <p className="text-sm font-semibold text-[var(--guander-ink)]">{money(p.amount)}</p>
                    <p className="text-xs text-gray-400">{fmtDate(p.date)}</p>
                    {p.description && (
                      <p className="text-xs text-gray-500 mt-0.5 italic">{p.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Registrado por</p>
                    <p className="text-xs text-gray-600">{p.user_name}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">Sin pagos registrados</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function SuscripcionesClient({
  initialInstances,
  initialPlans,
}: {
  initialInstances: SubscriptionInstance[];
  initialPlans: PlanOption[];
}) {
  const [instances, setInstances] = useState<SubscriptionInstance[]>(initialInstances);
  const [plans] = useState<PlanOption[]>(initialPlans);
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState("todos");
  const [filterType, setFilterType] = useState("todos");
  const [sortBy, setSortBy] = useState<"expiration" | "name" | "plan">("expiration");
  const [sortAsc, setSortAsc] = useState(true);
  const [selected, setSelected] = useState<SubscriptionInstance | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/subscriptions/instances");
      const data = await res.json();
      if (data.instances) setInstances(data.instances);
    } catch {/* silently fail */}
    finally { setRefreshing(false); }
  };

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortAsc((v) => !v);
    else { setSortBy(col); setSortAsc(true); }
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) =>
    sortBy === col ? (
      sortAsc ? <ChevronUp size={13} className="inline-block" /> : <ChevronDown size={13} className="inline-block" />
    ) : null;

  const filtered = instances
    .filter((i) => {
      const q = search.toLowerCase();
      if (q && !i.entity_name?.toLowerCase().includes(q) && !i.owner_name?.toLowerCase().includes(q) && !i.owner_email?.toLowerCase().includes(q)) return false;
      if (filterState !== "todos" && computePayStatus(i.last_payout_date, i.expiration_date) !== filterState) return false;
      if (filterType !== "todos" && i.entity_type !== filterType) return false;
      return true;
    })
    .sort((a, b) => {
      let v = 0;
      if (sortBy === "expiration") v = (a.expiration_date ?? "").localeCompare(b.expiration_date ?? "");
      else if (sortBy === "name") v = (a.entity_name ?? "").localeCompare(b.entity_name ?? "");
      else if (sortBy === "plan") v = a.plan_amount - b.plan_amount;
      return sortAsc ? v : -v;
    });

  // Counters
  const total = instances.length;
  const active = instances.filter((i) => computePayStatus(i.last_payout_date, i.expiration_date) === "activo").length;
  const expiredCount = instances.filter((i) => isExpired(i.expiration_date)).length;
  const pendingCount = instances.filter((i) => computePayStatus(i.last_payout_date, i.expiration_date) === "pendiente").length;

  return (
    <div className="min-h-screen bg-[var(--guander-cream,#f8f6f1)] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CreditCard size={28} className="text-[var(--guander-forest)]" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--guander-ink)]">Suscripciones</h1>
            <p className="text-sm text-gray-500">Gestión de suscripciones y pagos</p>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-white text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: total, color: "text-[var(--guander-forest)]" },
          { label: "Activos", value: active, color: "text-green-600" },
          { label: "Vencidos", value: expiredCount, color: "text-red-500" },
          { label: "Pendientes", value: pendingCount, color: "text-yellow-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border shadow-sm">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Buscar por nombre, propietario o email…"
          className="flex-1 min-w-48 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--guander-forest)]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--guander-forest)]"
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
        >
          <option value="todos">Todos los estados</option>
          <option value="activo">Activo (pagó este mes)</option>
          <option value="pendiente">Pendiente (no pagó este mes)</option>
          <option value="inactivo">Inactivo (sin pagos)</option>
        </select>
        <select
          className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--guander-forest)]"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="todos">Locales y Profesionales</option>
          <option value="store">Solo Locales</option>
          <option value="professional">Solo Profesionales</option>
        </select>
        <span className="text-sm text-gray-400 ml-auto">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                <th
                  className="px-4 py-3 text-left font-semibold cursor-pointer hover:text-[var(--guander-forest)] select-none"
                  onClick={() => toggleSort("name")}
                >
                  Nombre <SortIcon col="name" />
                </th>
                <th className="px-4 py-3 text-left font-semibold">Propietario</th>
                <th
                  className="px-4 py-3 text-left font-semibold cursor-pointer hover:text-[var(--guander-forest)] select-none"
                  onClick={() => toggleSort("plan")}
                >
                  Plan <SortIcon col="plan" />
                </th>
                <th className="px-4 py-3 text-left font-semibold">Estado</th>
                <th
                  className="px-4 py-3 text-left font-semibold cursor-pointer hover:text-[var(--guander-forest)] select-none"
                  onClick={() => toggleSort("expiration")}
                >
                  Vencimiento <SortIcon col="expiration" />
                </th>
                <th className="px-4 py-3 text-left font-semibold">Pagos</th>
                <th className="px-4 py-3 text-left font-semibold">Último pago</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">
                    No se encontraron suscripciones
                  </td>
                </tr>
              ) : (
                filtered.map((inst) => (
                  <tr
                    key={inst.id_store_sub}
                    className="border-b last:border-0 hover:bg-[var(--guander-cream,#f8f6f1)] transition-colors cursor-pointer"
                    onClick={() => setSelected(inst)}
                  >
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${inst.entity_type === "store" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                        {inst.entity_type === "store" ? "Local" : "Profesional"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--guander-ink)]">
                      {inst.entity_name || <span className="text-gray-400 italic">Sin nombre</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      <div>{inst.owner_name}</div>
                      <div className="text-gray-400">{inst.owner_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{inst.plan_name}</div>
                      <div className="text-xs text-gray-400">{money(inst.plan_amount)}/mes</div>
                    </td>
                    <td className="px-4 py-3">
                      <StateBadge state={computePayStatus(inst.last_payout_date, inst.expiration_date)} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={isExpired(inst.expiration_date) ? "text-red-500 font-semibold" : "text-gray-600"}>
                        {fmtDate(inst.expiration_date)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">
                      {inst.payout_count}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {inst.last_payout_amount != null
                        ? <><div className="font-medium">{money(inst.last_payout_amount)}</div><div className="text-gray-400">{fmtDate(inst.last_payout_date)}</div></>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelected(inst); }}
                        className="px-3 py-1 rounded-lg border text-xs font-medium hover:bg-[var(--guander-forest)] hover:text-white hover:border-[var(--guander-forest)] transition-colors"
                      >
                        Gestionar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <DetailDrawer
          instance={selected}
          plans={plans}
          onClose={() => setSelected(null)}
          onUpdated={() => {
            setSelected(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
