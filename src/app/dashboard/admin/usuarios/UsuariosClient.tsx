"use client";

import { useState, useCallback, useRef } from "react";
import {
  Users,
  UserPlus,
  Search,
  X,
  Pencil,
  Trash2,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

export interface UserItem {
  id_user: number;
  username: string;
  date_reg: string;
  state: number;
  name: string;
  last_name: string;
  email: string;
  tel: string;
  rol: string;
}

interface ToastMsg {
  id: number;
  type: "success" | "error";
  text: string;
}

function ToastContainer({ toasts, dismiss }: { toasts: ToastMsg[]; dismiss: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto ${
            t.type === "success" ? "bg-green-600 text-white" : "bg-red-500 text-white"
          }`}
        >
          {t.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          <span>{t.text}</span>
          <button onClick={() => dismiss(t.id)} className="ml-2 hover:opacity-70 transition-opacity">
            <X size={14} />
          </button>
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

function ProgressBar({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[70] h-0.5 overflow-hidden">
      <div
        className="h-full rounded-full animate-pulse"
        style={{ backgroundColor: "var(--guander-forest)", width: "100%" }}
      />
    </div>
  );
}

function ConfirmModal({
  open, onClose, onConfirm, title, message,
  confirmLabel = "Confirmar", danger = false, loading = false,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; confirmLabel?: string; danger?: boolean; loading?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: danger ? "#fde8e8" : "#d4edda" }}>
            <AlertTriangle size={18} color={danger ? "#c0392b" : "#1f4b3b"} />
          </div>
          <div>
            <h3 className="font-bold text-base" style={{ color: "var(--guander-ink)" }}>{title}</h3>
            <p className="text-sm mt-1" style={{ color: "var(--guander-muted)" }}>{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90"
            style={{ backgroundColor: "#c5cdb3", color: "#3d4f35" }}>Cancelar</button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition cursor-pointer hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: danger ? "#c0392b" : "var(--guander-forest)" }}>
            {loading ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function UserDrawer({
  user, onClose, onUpdated, showToast,
}: {
  user: UserItem; onClose: () => void;
  onUpdated: (updated: UserItem) => void;
  showToast: (type: "success" | "error", text: string) => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editLastName, setEditLastName] = useState(user.last_name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editTel, setEditTel] = useState(user.tel);
  const [editState, setEditState] = useState(user.state);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [confirmEdit, setConfirmEdit] = useState(false);

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_user: user.id_user, name: editName, lastName: editLastName, email: editEmail, tel: editTel, state: editState }),
      });
      if (!res.ok) { showToast("error", "Error al actualizar el usuario"); return; }
      onUpdated({ ...user, name: editName, last_name: editLastName, email: editEmail, tel: editTel, state: editState });
      showToast("success", "Usuario actualizado correctamente");
      setEditMode(false);
      setConfirmEdit(false);
    } catch { showToast("error", "Error de red"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users?id=${user.id_user}`, { method: "DELETE" });
      if (!res.ok) { showToast("error", "Error al eliminar el usuario"); return; }
      showToast("success", "Usuario eliminado correctamente");
      onUpdated({ ...user, state: 0 });
      onClose();
    } catch { showToast("error", "Error de red"); }
    finally { setActionLoading(false); setConfirmDelete(false); }
  };

  const handleToggleState = async () => {
    setActionLoading(true);
    const newState = user.state === 1 ? 0 : 1;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_user: user.id_user, state: newState }),
      });
      if (!res.ok) { showToast("error", "Error al cambiar el estado"); return; }
      onUpdated({ ...user, state: newState });
      showToast("success", newState === 1 ? "Usuario activado" : "Usuario desactivado");
      setConfirmToggle(false);
      onClose();
    } catch { showToast("error", "Error de red"); }
    finally { setActionLoading(false); }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-end" onClick={onClose}>
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative bg-white h-full w-full max-w-md shadow-2xl overflow-y-auto flex flex-col"
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10"
            style={{ borderColor: "var(--guander-border)" }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--guander-muted)" }}>Usuario #{user.id_user}</p>
              <h2 className="font-bold text-lg leading-tight" style={{ color: "var(--guander-ink)" }}>{user.name} {user.last_name}</h2>
              <p className="text-sm" style={{ color: "var(--guander-muted)" }}>@{user.username}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><X size={20} /></button>
          </div>

          <div className="px-6 py-4 flex-1">
            {!editMode ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Email", value: user.email || "—" },
                    { label: "Teléfono", value: user.tel || "—" },
                    { label: "Rol", value: user.rol || "—" },
                    { label: "Registro", value: user.date_reg?.split("T")[0] ?? "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl p-3"
                      style={{ backgroundColor: "var(--guander-mint)", border: "1px solid var(--guander-border)" }}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--guander-muted)" }}>{label}</p>
                      <p className="text-sm font-medium mt-0.5 break-all" style={{ color: "var(--guander-ink)" }}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-3"
                  style={{ backgroundColor: user.state === 1 ? "#d4edda" : "#fde8e8", border: "1px solid var(--guander-border)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: user.state === 1 ? "#1f4b3b" : "#7b1c1c" }}>Estado</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: user.state === 1 ? "#1f4b3b" : "#c0392b" }}>
                    {user.state === 1 ? "Activo" : "Inactivo"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: "var(--guander-ink)" }}>Nombre</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ border: "1px solid var(--guander-border)", color: "var(--guander-ink)" }} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: "var(--guander-ink)" }}>Apellido</label>
                    <input type="text" value={editLastName} onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ border: "1px solid var(--guander-border)", color: "var(--guander-ink)" }} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--guander-ink)" }}>Email</label>
                  <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: "1px solid var(--guander-border)", color: "var(--guander-ink)" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--guander-ink)" }}>Teléfono</label>
                  <input type="tel" value={editTel} onChange={(e) => setEditTel(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: "1px solid var(--guander-border)", color: "var(--guander-ink)" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--guander-ink)" }}>Estado</label>
                  <select value={editState} onChange={(e) => setEditState(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                    style={{ border: "1px solid var(--guander-border)", color: "var(--guander-ink)" }}>
                    <option value={1}>Activo</option>
                    <option value={0}>Inactivo</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t space-y-2" style={{ borderColor: "var(--guander-border)" }}>
            {!editMode ? (
              <>
                <button onClick={() => setEditMode(true)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition cursor-pointer"
                  style={{ backgroundColor: "var(--guander-forest)" }}>
                  <Pencil size={15} /> Editar datos
                </button>
                <button onClick={() => setConfirmToggle(true)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition cursor-pointer"
                  style={{ backgroundColor: user.state === 1 ? "#fde8e8" : "#d4edda", color: user.state === 1 ? "#c0392b" : "#1f4b3b" }}>
                  {user.state === 1 ? <><XCircle size={15} /> Desactivar cuenta</> : <><CheckCircle2 size={15} /> Activar cuenta</>}
                </button>
                <button onClick={() => setConfirmDelete(true)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition cursor-pointer"
                  style={{ backgroundColor: "#c0392b" }}>
                  <Trash2 size={15} /> Eliminar usuario
                </button>
              </>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => setEditMode(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: "#c5cdb3", color: "#3d4f35" }}>Cancelar</button>
                <button onClick={() => setConfirmEdit(true)} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition cursor-pointer hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "var(--guander-forest)" }}>
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal open={confirmEdit} onClose={() => setConfirmEdit(false)} onConfirm={handleSaveEdit}
        title="Confirmar edición" message={`¿Guardar los cambios para ${user.name} ${user.last_name}?`}
        confirmLabel="Guardar" loading={saving} />
      <ConfirmModal open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={handleDelete}
        title="Eliminar usuario" message={`Esta acción desactivará la cuenta de ${user.name} ${user.last_name}. ¿Confirmar?`}
        confirmLabel="Eliminar" danger loading={actionLoading} />
      <ConfirmModal open={confirmToggle} onClose={() => setConfirmToggle(false)} onConfirm={handleToggleState}
        title={user.state === 1 ? "Desactivar cuenta" : "Activar cuenta"}
        message={user.state === 1
          ? `¿Desactivar la cuenta de ${user.name} ${user.last_name}? El usuario no podrá acceder a la plataforma.`
          : `¿Activar la cuenta de ${user.name} ${user.last_name}?`}
        confirmLabel={user.state === 1 ? "Desactivar" : "Activar"}
        danger={user.state === 1} loading={actionLoading} />
    </>
  );
}

export default function UsuariosClient({
  initialUsers,
  totalUsers: initialTotal,
}: {
  initialUsers: UserItem[];
  totalUsers: number;
}) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [totalUsers, setTotalUsers] = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [filterRol, setFilterRol] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formName, setFormName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTel, setFormTel] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formRol, setFormRol] = useState<"admin" | "customer" | "store_owner" | "professional">("customer");
  const { toasts, showToast, dismiss } = useToast();

  const openAdd = () => {
    setFormName(""); setFormLastName(""); setFormEmail(""); setFormTel(""); setFormUsername(""); setFormRol("customer");
    setShowAdd(true);
  };

  const handleAdd = async () => {
    if (!formName.trim() || !formEmail.trim() || !formUsername.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, lastName: formLastName, email: formEmail, tel: formTel, username: formUsername, rol: formRol }),
      });
      if (!res.ok) { showToast("error", "Error al crear usuario"); return; }
      const newUser: UserItem = {
        id_user: Date.now(), username: formUsername,
        date_reg: new Date().toISOString().split("T")[0], state: 1,
        name: formName, last_name: formLastName, email: formEmail, tel: formTel, rol: formRol,
      };
      setUsers((prev) => [newUser, ...prev]);
      setTotalUsers((prev) => prev + 1);
      setShowAdd(false);
      showToast("success", "Usuario creado correctamente");
    } catch { showToast("error", "Error de red"); }
    finally { setLoading(false); }
  };

  const handleUserUpdated = useCallback((updated: UserItem) => {
    setUsers((prev) => prev.map((u) => u.id_user === updated.id_user ? updated : u));
    setSelectedUser((prev) => prev?.id_user === updated.id_user ? updated : prev);
  }, []);

  const filtered = users.filter((u) => {
    if (filterRol && u.rol !== filterRol) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.tel?.toLowerCase().includes(q) ||
      u.rol?.toLowerCase().includes(q) ||
      String(u.id_user).includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filtered.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div className="space-y-6">
      <ProgressBar active={loading} />
      <ToastContainer toasts={toasts} dismiss={dismiss} />

      <h1 className="text-xl font-bold" style={{ color: "var(--guander-ink)" }}>Gestión de Usuarios</h1>

      <div className="bg-white rounded-2xl p-5 flex items-center gap-4" style={{ border: "1px solid var(--guander-border)" }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#d4edda" }}>
          <Users size={22} color="#1f4b3b" />
        </div>
        <div>
          <p className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: "var(--guander-muted)" }}>Total Usuarios Registrados</p>
          <p className="text-2xl font-bold" style={{ color: "var(--guander-ink)" }}>{totalUsers.toLocaleString("es-AR")}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--guander-muted)" }} />
          <input type="text" placeholder="Buscar usuario..." value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition bg-white"
            style={{ border: "1px solid var(--guander-border)", color: "var(--guander-ink)" }} />
        </div>
        <select value={filterRol} onChange={(e) => { setFilterRol(e.target.value); setCurrentPage(1); }}
          className="px-4 py-3 rounded-xl text-sm outline-none cursor-pointer"
          style={{ border: "1px solid var(--guander-border)", color: "var(--guander-ink)" }}>
          <option value="">Todos los roles</option>
          <option value="admin">Admin</option>
          <option value="customer">Customer</option>
          <option value="store_owner">Store Owner</option>
          <option value="professional">Professional</option>
        </select>
        <button onClick={openAdd}
          className="px-5 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 cursor-pointer transition hover:opacity-90"
          style={{ backgroundColor: "var(--guander-forest)" }}>
          <UserPlus size={16} /> Agregar Usuario
        </button>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--guander-border)" }}>
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "var(--guander-mint)" }}>
                {["ID", "Nombre", "Email", "Rol", "Estado", "Registro", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3 font-semibold" style={{ color: "var(--guander-forest)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-sm" style={{ color: "var(--guander-muted)" }}>No se encontraron usuarios.</td></tr>
              )}
              {paginatedItems.map((user) => (
                <tr key={user.id_user}
                  className="border-t hover:bg-[var(--guander-cream)] transition-colors cursor-pointer"
                  style={{ borderColor: "var(--guander-border)" }}
                  onClick={() => setSelectedUser(user)}>
                  <td className="px-5 py-3" style={{ color: "var(--guander-ink)" }}>{user.id_user}</td>
                  <td className="px-5 py-3 font-medium" style={{ color: "var(--guander-ink)" }}>
                    {user.name} {user.last_name}
                    <span className="block text-xs font-normal" style={{ color: "var(--guander-muted)" }}>@{user.username}</span>
                  </td>
                  <td className="px-5 py-3" style={{ color: "var(--guander-muted)" }}>{user.email || "—"}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#d4edda", color: "#1f4b3b" }}>{user.rol || "—"}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${user.state === 1 ? "text-green-800" : "text-red-800"}`}
                      style={{ backgroundColor: user.state === 1 ? "#d4edda" : "#fde8e8" }}>
                      {user.state === 1 ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: "var(--guander-muted)" }}>{user.date_reg?.split("T")[0] ?? "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ backgroundColor: "var(--guander-mint)", color: "var(--guander-forest)" }}>
                      Gestionar <ChevronRight size={13} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden space-y-3 p-4">
          {filtered.length === 0 && <p className="text-center py-8 text-sm" style={{ color: "var(--guander-muted)" }}>No se encontraron usuarios.</p>}
          {paginatedItems.map((user) => (
            <div key={user.id_user} className="rounded-xl p-4 cursor-pointer"
              style={{ backgroundColor: "var(--guander-mint)", border: "1px solid var(--guander-border)" }}
              onClick={() => setSelectedUser(user)}>
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="flex-1">
                  <p className="font-bold text-sm" style={{ color: "var(--guander-ink)" }}>{user.name} {user.last_name}</p>
                  <p className="text-xs" style={{ color: "var(--guander-muted)" }}>@{user.username}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "#d4edda", color: "#1f4b3b" }}>{user.rol || "—"}</span>
              </div>
              <p className="text-xs mb-2" style={{ color: "var(--guander-ink)" }}>{user.email || "—"}</p>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${user.state === 1 ? "text-green-800" : "text-red-800"}`}
                  style={{ backgroundColor: user.state === 1 ? "#d4edda" : "#fde8e8" }}>
                  {user.state === 1 ? "Activo" : "Inactivo"}
                </span>
                <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--guander-forest)" }}>
                  Gestionar <ChevronRight size={12} />
                </span>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="px-5 py-4 border-t flex items-center justify-between" style={{ borderColor: "var(--guander-border)" }}>
            <p className="text-sm" style={{ color: "var(--guander-muted)" }}>Página {currentPage} de {totalPages} ({filtered.length} resultados)</p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                style={{ backgroundColor: "var(--guander-mint)", color: "var(--guander-forest)" }}>Anterior</button>
              <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50"
                style={{ backgroundColor: "var(--guander-forest)" }}>Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {selectedUser && (
        <UserDrawer user={selectedUser} onClose={() => setSelectedUser(null)}
          onUpdated={handleUserUpdated} showToast={showToast} />
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)}>
        <div className="p-6 pb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "var(--guander-ink)" }}>Agregar Nuevo Usuario</h2>
          <button onClick={() => setShowAdd(false)} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition"><X size={16} /></button>
        </div>
        <div className="space-y-4 px-6 pb-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--guander-ink)" }}>Nombre *</label>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: "1px solid var(--guander-border)", color: "var(--guander-ink)" }} placeholder="Juan" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--guander-ink)" }}>Apellido</label>
              <input type="text" value={formLastName} onChange={(e) => setFormLastName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ border: "1px solid var(--guander-border)", color: "var(--guander-ink)" }} placeholder="Pérez" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--guander-ink)" }}>Username *</label>
            <input type="text" value={formUsername} onChange={(e) => setFormUsername(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: "1px solid var(--guander-border)", color: "var(--guander-ink)" }} placeholder="juanperez" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--guander-ink)" }}>Email *</label>
            <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: "1px solid var(--guander-border)", color: "var(--guander-ink)" }} placeholder="juan@email.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--guander-ink)" }}>Teléfono</label>
            <input type="tel" value={formTel} onChange={(e) => setFormTel(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: "1px solid var(--guander-border)", color: "var(--guander-ink)" }} placeholder="+54 11 1234-5678" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--guander-ink)" }}>Rol *</label>
            <select value={formRol} onChange={(e) => setFormRol(e.target.value as typeof formRol)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
              style={{ border: "1px solid var(--guander-border)", color: "var(--guander-ink)" }}>
              <option value="admin">Admin</option>
              <option value="customer">Customer</option>
              <option value="store_owner">Store Owner</option>
              <option value="professional">Profesional</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowAdd(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90"
              style={{ backgroundColor: "#c5cdb3", color: "#3d4f35" }}>Cancelar</button>
            <button onClick={handleAdd} disabled={loading || !formName.trim() || !formEmail.trim() || !formUsername.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition cursor-pointer hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "var(--guander-forest)" }}>
              {loading ? "Creando..." : "Crear Usuario"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}