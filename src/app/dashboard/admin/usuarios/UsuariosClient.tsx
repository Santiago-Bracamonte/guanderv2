"use client";

import { useState } from "react";
import { Users, UserPlus, Search, X } from "lucide-react";

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
        className="relative bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: "var(--guander-muted)" }}
      >
        {label}
      </span>
      <span
        className="text-sm font-medium"
        style={{ color: "var(--guander-ink)" }}
      >
        {value || "—"}
      </span>
    </div>
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

  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formName, setFormName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTel, setFormTel] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formRol, setFormRol] = useState<
    "admin" | "customer" | "store_owner" | "professional"
  >("customer");

  const [viewUser, setViewUser] = useState<UserItem | null>(null);

  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editTel, setEditTel] = useState("");
  const [editState, setEditState] = useState(1);
  const [editSaving, setEditSaving] = useState(false);

  const openAdd = () => {
    setFormName("");
    setFormLastName("");
    setFormEmail("");
    setFormTel("");
    setFormUsername("");
    setFormRol("customer");
    setShowAdd(true);
  };

  const openEdit = (u: UserItem) => {
    setEditUser(u);
    setEditName(u.name);
    setEditLastName(u.last_name);
    setEditEmail(u.email);
    setEditTel(u.tel);
    setEditState(u.state);
  };

  const handleAdd = async () => {
    if (!formName.trim() || !formEmail.trim() || !formUsername.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          lastName: formLastName,
          email: formEmail,
          tel: formTel,
          username: formUsername,
          rol: formRol,
        }),
      });
      if (!res.ok) {
        alert("Error al crear usuario");
        return;
      }
      const newUser: UserItem = {
        id_user: Date.now(),
        username: formUsername,
        date_reg: new Date().toISOString().split("T")[0],
        state: 1,
        name: formName,
        last_name: formLastName,
        email: formEmail,
        tel: formTel,
        rol: formRol,
      };
      setUsers((prev) => [newUser, ...prev]);
      setTotalUsers((prev) => prev + 1);
      setShowAdd(false);
    } catch {
      alert("Error de red");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setEditSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_user: editUser.id_user,
          name: editName,
          lastName: editLastName,
          email: editEmail,
          tel: editTel,
          state: editState,
        }),
      });
      if (!res.ok) {
        alert("Error al actualizar usuario");
        return;
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id_user === editUser.id_user
            ? {
                ...u,
                name: editName,
                last_name: editLastName,
                email: editEmail,
                tel: editTel,
                state: editState,
              }
            : u,
        ),
      );
      setEditUser(null);
    } catch {
      alert("Error de red");
    } finally {
      setEditSaving(false);
    }
  };

  const filtered = users.filter((u) => {
    if (filterRol && u.rol !== filterRol) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filtered.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1
          className="text-xl font-bold"
          style={{ color: "var(--guander-ink)" }}
        >
          Gestión de Usuarios
        </h1>
      </div>

      <div
        className="bg-white rounded-2xl p-5 flex items-center gap-4"
        style={{ border: "1px solid var(--guander-border)" }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "#d4edda" }}
        >
          <Users size={22} color="#1f4b3b" />
        </div>
        <div>
          <p
            className="text-[11px] font-semibold tracking-wide uppercase"
            style={{ color: "var(--guander-muted)" }}
          >
            Total Usuarios Registrados
          </p>
          <p
            className="text-2xl font-bold"
            style={{ color: "var(--guander-ink)" }}
          >
            {totalUsers.toLocaleString("es-AR")}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2"
            style={{ color: "var(--guander-muted)" }}
          />
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition bg-white"
            style={{
              border: "1px solid var(--guander-border)",
              color: "var(--guander-ink)",
            }}
          />
        </div>
        <select
          value={filterRol}
          onChange={(e) => {
            setFilterRol(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-3 rounded-xl text-sm outline-none cursor-pointer"
          style={{
            border: "1px solid var(--guander-border)",
            color: "var(--guander-ink)",
          }}
        >
          <option value="">Todos los roles</option>
          <option value="admin">Admin</option>
          <option value="customer">Customer</option>
          <option value="store_owner">Store Owner</option>
          <option value="professional">Professional</option>
        </select>
        <button
          onClick={openAdd}
          className="px-5 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 cursor-pointer transition hover:opacity-90"
          style={{ backgroundColor: "var(--guander-forest)" }}
        >
          <UserPlus size={16} /> Agregar Usuario
        </button>
      </div>

      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--guander-border)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr style={{ backgroundColor: "var(--guander-mint)" }}>
                <th
                  className="text-left px-5 py-3 font-semibold"
                  style={{ color: "var(--guander-forest)" }}
                >
                  ID
                </th>
                <th
                  className="text-left px-5 py-3 font-semibold"
                  style={{ color: "var(--guander-forest)" }}
                >
                  Nombre
                </th>
                <th
                  className="text-left px-5 py-3 font-semibold"
                  style={{ color: "var(--guander-forest)" }}
                >
                  Email
                </th>
                <th
                  className="text-left px-5 py-3 font-semibold"
                  style={{ color: "var(--guander-forest)" }}
                >
                  Rol
                </th>
                <th
                  className="text-left px-5 py-3 font-semibold"
                  style={{ color: "var(--guander-forest)" }}
                >
                  Estado
                </th>
                <th
                  className="text-left px-5 py-3 font-semibold"
                  style={{ color: "var(--guander-forest)" }}
                >
                  Registro
                </th>
                <th
                  className="text-left px-5 py-3 font-semibold"
                  style={{ color: "var(--guander-forest)" }}
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-center text-sm"
                    style={{ color: "var(--guander-muted)" }}
                  >
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}
              {paginatedItems.map((user) => (
                <tr
                  key={user.id_user}
                  className="border-t"
                  style={{ borderColor: "var(--guander-border)" }}
                >
                  <td
                    className="px-5 py-3"
                    style={{ color: "var(--guander-ink)" }}
                  >
                    {user.id_user}
                  </td>
                  <td
                    className="px-5 py-3 font-medium"
                    style={{ color: "var(--guander-ink)" }}
                  >
                    {user.name} {user.last_name}
                    <span
                      className="block text-xs font-normal"
                      style={{ color: "var(--guander-muted)" }}
                    >
                      @{user.username}
                    </span>
                  </td>
                  <td
                    className="px-5 py-3"
                    style={{ color: "var(--guander-muted)" }}
                  >
                    {user.email || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: "#d4edda", color: "#1f4b3b" }}
                    >
                      {user.rol || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${user.state === 1 ? "text-green-800" : "text-red-800"}`}
                      style={{
                        backgroundColor:
                          user.state === 1 ? "#d4edda" : "#fde8e8",
                      }}
                    >
                      {user.state === 1 ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td
                    className="px-5 py-3 text-xs"
                    style={{ color: "var(--guander-muted)" }}
                  >
                    {user.date_reg?.split("T")[0] ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewUser(user)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-90 cursor-pointer"
                        style={{ backgroundColor: "#c5cdb3", color: "#3d4f35" }}
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => openEdit(user)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition hover:opacity-90 cursor-pointer"
                        style={{ backgroundColor: "var(--guander-forest)" }}
                      >
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t flex items-center justify-between" style={{ borderColor: "var(--guander-border)" }}>
            <p className="text-sm" style={{ color: "var(--guander-muted)" }}>
              Página {currentPage} de {totalPages} ({filtered.length} resultados)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "var(--guander-mint)", color: "var(--guander-forest)" }}
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "var(--guander-forest)" }}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ver Modal */}
      <Modal open={!!viewUser} onClose={() => setViewUser(null)}>
        <div className="p-6 pb-3 flex items-center justify-between">
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--guander-ink)" }}
          >
            Detalle de Usuario
          </h2>
          <button
            onClick={() => setViewUser(null)}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition"
          >
            <X size={16} />
          </button>
        </div>
        {viewUser && (
          <div className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <DetailRow label="ID" value={String(viewUser.id_user)} />
              <DetailRow label="Username" value={viewUser.username} />
              <DetailRow label="Nombre" value={viewUser.name} />
              <DetailRow label="Apellido" value={viewUser.last_name} />
              <DetailRow label="Email" value={viewUser.email} />
              <DetailRow label="Teléfono" value={viewUser.tel} />
              <DetailRow label="Rol" value={viewUser.rol} />
              <DetailRow
                label="Estado"
                value={viewUser.state === 1 ? "Activo" : "Inactivo"}
              />
              <DetailRow
                label="Fecha de registro"
                value={viewUser.date_reg?.split("T")[0] ?? "—"}
              />
            </div>
            <button
              onClick={() => setViewUser(null)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90 mt-2"
              style={{ backgroundColor: "#c5cdb3", color: "#3d4f35" }}
            >
              Cerrar
            </button>
          </div>
        )}
      </Modal>

      {/* Editar Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)}>
        <div className="p-6 pb-3 flex items-center justify-between">
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--guander-ink)" }}
          >
            Editar Usuario
          </h2>
          <button
            onClick={() => setEditUser(null)}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4 px-6 pb-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="block text-xs font-semibold mb-1"
                style={{ color: "var(--guander-ink)" }}
              >
                Nombre
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  border: "1px solid var(--guander-border)",
                  color: "var(--guander-ink)",
                }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold mb-1"
                style={{ color: "var(--guander-ink)" }}
              >
                Apellido
              </label>
              <input
                type="text"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  border: "1px solid var(--guander-border)",
                  color: "var(--guander-ink)",
                }}
              />
            </div>
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1"
              style={{ color: "var(--guander-ink)" }}
            >
              Email
            </label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                border: "1px solid var(--guander-border)",
                color: "var(--guander-ink)",
              }}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1"
              style={{ color: "var(--guander-ink)" }}
            >
              Teléfono
            </label>
            <input
              type="tel"
              value={editTel}
              onChange={(e) => setEditTel(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                border: "1px solid var(--guander-border)",
                color: "var(--guander-ink)",
              }}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1"
              style={{ color: "var(--guander-ink)" }}
            >
              Estado
            </label>
            <select
              value={editState}
              onChange={(e) => setEditState(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
              style={{
                border: "1px solid var(--guander-border)",
                color: "var(--guander-ink)",
              }}
            >
              <option value={1}>Activo</option>
              <option value={0}>Inactivo</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setEditUser(null)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90"
              style={{ backgroundColor: "#c5cdb3", color: "#3d4f35" }}
            >
              Cancelar
            </button>
            <button
              onClick={handleEdit}
              disabled={editSaving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition cursor-pointer hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "var(--guander-forest)" }}
            >
              {editSaving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Agregar Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)}>
        <div className="p-6 pb-3 flex items-center justify-between">
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--guander-ink)" }}
          >
            Agregar Nuevo Usuario
          </h2>
          <button
            onClick={() => setShowAdd(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4 px-6 pb-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="block text-xs font-semibold mb-1"
                style={{ color: "var(--guander-ink)" }}
              >
                Nombre *
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  border: "1px solid var(--guander-border)",
                  color: "var(--guander-ink)",
                }}
                placeholder="Juan"
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold mb-1"
                style={{ color: "var(--guander-ink)" }}
              >
                Apellido
              </label>
              <input
                type="text"
                value={formLastName}
                onChange={(e) => setFormLastName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  border: "1px solid var(--guander-border)",
                  color: "var(--guander-ink)",
                }}
                placeholder="Pérez"
              />
            </div>
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1"
              style={{ color: "var(--guander-ink)" }}
            >
              Username *
            </label>
            <input
              type="text"
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                border: "1px solid var(--guander-border)",
                color: "var(--guander-ink)",
              }}
              placeholder="juanperez"
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1"
              style={{ color: "var(--guander-ink)" }}
            >
              Email *
            </label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                border: "1px solid var(--guander-border)",
                color: "var(--guander-ink)",
              }}
              placeholder="juan@email.com"
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1"
              style={{ color: "var(--guander-ink)" }}
            >
              Teléfono
            </label>
            <input
              type="tel"
              value={formTel}
              onChange={(e) => setFormTel(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                border: "1px solid var(--guander-border)",
                color: "var(--guander-ink)",
              }}
              placeholder="+54 11 1234-5678"
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1"
              style={{ color: "var(--guander-ink)" }}
            >
              Rol *
            </label>
            <select
              value={formRol}
              onChange={(e) =>
                setFormRol(
                  e.target.value as
                    | "admin"
                    | "customer"
                    | "store_owner"
                    | "professional",
                )
              }
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
              style={{
                border: "1px solid var(--guander-border)",
                color: "var(--guander-ink)",
              }}
            >
              <option value="admin">Admin</option>
              <option value="customer">Customer</option>
              <option value="store_owner">Store Owner</option>
              <option value="professional">Profesional</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowAdd(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90"
              style={{ backgroundColor: "#c5cdb3", color: "#3d4f35" }}
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={
                saving ||
                !formName.trim() ||
                !formEmail.trim() ||
                !formUsername.trim()
              }
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition cursor-pointer hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "var(--guander-forest)" }}
            >
              {saving ? "Creando..." : "Crear Usuario"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
