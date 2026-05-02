"use client";

import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Building2,
  FileText,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";

export interface SolicitudItem {
  id_request: number;
  fk_user: number;
  user_email: string;
  business_name: string;
  description: string | null;
  address: string;
  location: string | null;
  fk_category: number | null;
  cuit_cuil: string | null;
  matricula: string | null;
  razon_social: string | null;
  schedule_week: string | null;
  schedule_weekend: string | null;
  schedule_sunday: string | null;
  image_url: string | null;
  status: "pending" | "approved" | "rejected";
  notes: string | null;
  created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: "Pendiente", color: "#92610a", bg: "#fef9ec", icon: <Clock size={14} /> },
  approved: { label: "Aprobada", color: "#166534", bg: "#f0fdf4", icon: <CheckCircle size={14} /> },
  rejected: { label: "Rechazada", color: "#9b1c1c", bg: "#fef2f2", icon: <XCircle size={14} /> },
};

const CATEGORY_NAMES: Record<number, string> = {
  1: "Veterinaria",
  2: "Pet Shop",
  3: "Cafetería",
  4: "Restaurante",
  5: "Grooming",
  6: "Resort",
};

function Badge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? STATUS_LABELS.pending;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: s.color, backgroundColor: s.bg, border: `1px solid ${s.color}33` }}
    >
      {s.icon}
      {s.label}
    </span>
  );
}

function DataRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-[#5a766a] min-w-[160px] shrink-0">{label}</span>
      <span className="text-[#102920] font-medium break-all">{value}</span>
    </div>
  );
}

function SolicitudCard({
  item,
  onApprove,
  onReject,
}: {
  item: SolicitudItem;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const isPending = item.status === "pending";

  async function handleApprove() {
    setLoading(true);
    setActionError("");
    try {
      const res = await fetch("/api/admin/solicitudes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_request: item.id_request, action: "approve" }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) {
        setActionError(data.error ?? "Error");
      } else {
        onApprove(item.id_request);
      }
    } catch {
      setActionError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    setLoading(true);
    setActionError("");
    try {
      const res = await fetch("/api/admin/solicitudes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_request: item.id_request, action: "reject", notes: rejectNote }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) {
        setActionError(data.error ?? "Error");
      } else {
        onReject(item.id_request);
      }
    } catch {
      setActionError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="rounded-xl border bg-white overflow-hidden"
      style={{ borderColor: "#c7d8cf" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="font-bold text-[#102920] text-base truncate">{item.business_name}</span>
            <Badge status={item.status} />
            {item.fk_category && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#eef4f0] text-[#3a6b52] border border-[#c7d8cf]">
                {CATEGORY_NAMES[item.fk_category] ?? `Cat. ${item.fk_category}`}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[#5a766a]">
            <span>✉ {item.user_email}</span>
            <span>📍 {item.address}</span>
            <span>🗓 {new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(item.created_at))}</span>
          </div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="ml-2 p-1.5 rounded-lg hover:bg-[#eef4f0] text-[#5a766a]"
          title={expanded ? "Colapsar" : "Ver detalle"}
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Detail */}
      {expanded && (
        <div className="border-t px-5 py-4 space-y-4" style={{ borderColor: "#c7d8cf", backgroundColor: "#f8fcfa" }}>
          {item.image_url && (
            <img
              src={item.image_url}
              alt={item.business_name}
              className="w-full max-h-48 object-cover rounded-lg border"
              style={{ borderColor: "#c7d8cf" }}
            />
          )}

          {/* Datos del negocio */}
          <div>
            <p className="text-xs font-bold text-[#3a6b52] uppercase tracking-wider mb-2 flex items-center gap-1">
              <Building2 size={12} /> Datos del local
            </p>
            <div className="space-y-1">
              <DataRow label="Nombre" value={item.business_name} />
              <DataRow label="Descripción" value={item.description} />
              <DataRow label="Dirección" value={item.address} />
              {item.location && <DataRow label="Coordenadas" value={item.location} />}
            </div>
          </div>

          {/* Datos fiscales */}
          {(item.cuit_cuil || item.matricula || item.razon_social) && (
            <div>
              <p className="text-xs font-bold text-[#3a6b52] uppercase tracking-wider mb-2 flex items-center gap-1">
                <FileText size={12} /> Datos fiscales / ARCA
              </p>
              <div className="space-y-1">
                <DataRow label="CUIT / CUIL" value={item.cuit_cuil} />
                <DataRow label="Razón social" value={item.razon_social} />
                <DataRow label="Matrícula" value={item.matricula} />
              </div>
            </div>
          )}

          {/* Horarios */}
          {(item.schedule_week || item.schedule_weekend || item.schedule_sunday) && (
            <div>
              <p className="text-xs font-bold text-[#3a6b52] uppercase tracking-wider mb-2 flex items-center gap-1">
                <Calendar size={12} /> Horarios de atención
              </p>
              <div className="space-y-1">
                <DataRow label="Lunes a viernes" value={item.schedule_week} />
                <DataRow label="Sábados" value={item.schedule_weekend} />
                <DataRow label="Domingos" value={item.schedule_sunday} />
              </div>
            </div>
          )}

          {/* Notes if rejected */}
          {item.notes && item.status === "rejected" && (
            <div className="rounded-lg p-3 bg-[#fef2f2] border border-[#fca5a5] text-sm text-[#9b1c1c]">
              <span className="font-semibold">Motivo de rechazo: </span>{item.notes}
            </div>
          )}

          {/* Action error */}
          {actionError && (
            <div className="rounded-lg p-3 bg-[#fef2f2] border border-[#fca5a5] text-sm text-[#9b1c1c]">
              {actionError}
            </div>
          )}

          {/* Actions */}
          {isPending && (
            <div className="space-y-3">
              {!showRejectForm ? (
                <div className="flex gap-2 flex-wrap">
                  <button
                    disabled={loading}
                    onClick={handleApprove}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                    style={{ backgroundColor: "#166534" }}
                  >
                    <CheckCircle size={15} />
                    {loading ? "Procesando..." : "Aprobar y crear local"}
                  </button>
                  <button
                    disabled={loading}
                    onClick={() => setShowRejectForm(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                    style={{ backgroundColor: "#9b1c1c" }}
                  >
                    <XCircle size={15} />
                    Rechazar
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    className="w-full border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2"
                    style={{ borderColor: "#c7d8cf", minHeight: 72 }}
                    placeholder="Motivo del rechazo (opcional, se le mostrará al usuario)"
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    maxLength={400}
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={loading}
                      onClick={handleReject}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                      style={{ backgroundColor: "#9b1c1c" }}
                    >
                      <XCircle size={15} />
                      {loading ? "Procesando..." : "Confirmar rechazo"}
                    </button>
                    <button
                      disabled={loading}
                      onClick={() => { setShowRejectForm(false); setRejectNote(""); }}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-[#5a766a] hover:bg-[#eef4f0]"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SolicitudesClient({ initialData }: { initialData: SolicitudItem[] }) {
  const [items, setItems] = useState<SolicitudItem[]>(initialData);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [loadingFilter, setLoadingFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);
  const pendingCount = items.filter((i) => i.status === "pending").length;

  let displayedItems = filtered;
  let totalPages = 1;

  if (filter === "all") {
    totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    displayedItems = filtered.slice(startIndex, startIndex + itemsPerPage);
  }

  async function changeFilter(f: typeof filter) {
    setFilter(f);
    setCurrentPage(1);
    setLoadingFilter(true);
    try {
      const res = await fetch(`/api/admin/solicitudes?status=${f}`);
      const data = await res.json() as { success: boolean; data: SolicitudItem[] };
      if (data.success) setItems(data.data);
    } catch {
      // keep current
    } finally {
      setLoadingFilter(false);
    }
  }

  function handleApprove(id: number) {
    setItems((prev) =>
      prev.map((i) => (i.id_request === id ? { ...i, status: "approved" } : i)),
    );
  }

  function handleReject(id: number) {
    setItems((prev) =>
      prev.map((i) => (i.id_request === id ? { ...i, status: "rejected" } : i)),
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#102920]">Solicitudes de Alta</h1>
          <p className="text-sm text-[#5a766a] mt-0.5">
            Revisá y aprobá las solicitudes de nuevos locales y profesionales
          </p>
        </div>
        {pendingCount > 0 && (
          <span
            className="px-3 py-1 rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: "#92610a" }}
          >
            {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit" style={{ backgroundColor: "#d6e7de" }}>
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => changeFilter(f)}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            style={
              filter === f
                ? { backgroundColor: "#0f3b2f", color: "#fff" }
                : { color: "#3a6b52" }
            }
          >
            {f === "pending" ? "Pendientes" : f === "approved" ? "Aprobadas" : f === "rejected" ? "Rechazadas" : "Todas"}
          </button>
        ))}
      </div>

      {/* List */}
      {loadingFilter ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#0f3b2f] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-xl border p-10 text-center"
          style={{ borderColor: "#c7d8cf", backgroundColor: "#f8fcfa" }}
        >
          <p className="text-[#5a766a] text-sm">No hay solicitudes {filter !== "all" ? `con estado "${STATUS_LABELS[filter]?.label ?? filter}"` : ""}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {displayedItems.map((item) => (
              <SolicitudCard
                key={item.id_request}
                item={item}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>

          {/* Paginación solo para TODAS */}
          {filter === "all" && totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6 py-4">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 bg-white border rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50 transition-colors"
                style={{ borderColor: "#c7d8cf", color: "#3a6b52" }}
              >
                Anterior
              </button>
              <span className="text-sm font-medium" style={{ color: "#3a6b52" }}>
                Página {currentPage} de {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 bg-white border rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50 transition-colors"
                style={{ borderColor: "#c7d8cf", color: "#3a6b52" }}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
