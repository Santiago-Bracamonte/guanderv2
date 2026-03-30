'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Users, UserPlus, Search, ImageIcon, Download, Settings, X } from 'lucide-react';

export interface UserItem {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default function UsuariosClient({ initialUsers, totalUsers: initialTotal }: { initialUsers: UserItem[]; totalUsers: number }) {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [totalUsers, setTotalUsers] = useState(initialTotal);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      openAdd();
    }
  }, [searchParams]);

  const openAdd = () => {
    setFormName('');
    setFormEmail('');
    setShowAdd(true);
  };

  const handleAdd = async () => {
    if (!formName.trim() || !formEmail.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, email: formEmail }),
      });
      const newUser: UserItem = {
        id: Date.now(),
        name: formName,
        email: formEmail,
        created_at: new Date().toISOString().split('T')[0],
      };
      setUsers((prev) => [newUser, ...prev]);
      setTotalUsers((prev) => prev + 1);
      setShowAdd(false);
    } catch {
      alert('Error al crear usuario');
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter((u) => {
    if (search.trim() === '') return true;
    const q = search.toLowerCase();
    return (u.name?.toLowerCase().includes(q)) || (u.email?.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--guander-ink)' }}>
          Gestión de Usuarios
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

      {/* Summary Card */}
      <div className="bg-white rounded-2xl p-5 flex items-center gap-4" style={{ border: '1px solid var(--guander-border)' }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#d4edda' }}>
          <Users size={22} color="#1f4b3b" />
        </div>
        <div>
          <p className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--guander-muted)' }}>Total Usuarios Registrados</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--guander-ink)' }}>{totalUsers.toLocaleString('es-AR')}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--guander-muted)' }} />
          <input type="text" placeholder="Buscar usuario..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition bg-white"
            style={{ border: '1px solid var(--guander-border)', color: 'var(--guander-ink)' }}
          />
        </div>
        <button onClick={openAdd}
          className="px-5 py-3 rounded-xl text-sm font-semibold text-white flex items-center gap-2 shrink-0 cursor-pointer transition hover:opacity-90"
          style={{ backgroundColor: 'var(--guander-forest)' }}
        >
          <UserPlus size={16} />
          Agregar Usuario
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid var(--guander-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--guander-mint)' }}>
              <th className="text-left px-5 py-3 font-semibold" style={{ color: 'var(--guander-forest)' }}>ID</th>
              <th className="text-left px-5 py-3 font-semibold" style={{ color: 'var(--guander-forest)' }}>Nombre</th>
              <th className="text-left px-5 py-3 font-semibold" style={{ color: 'var(--guander-forest)' }}>Email</th>
              <th className="text-left px-5 py-3 font-semibold" style={{ color: 'var(--guander-forest)' }}>Fecha Registro</th>
              <th className="text-left px-5 py-3 font-semibold" style={{ color: 'var(--guander-forest)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-t" style={{ borderColor: 'var(--guander-border)' }}>
                <td className="px-5 py-3" style={{ color: 'var(--guander-ink)' }}>{user.id}</td>
                <td className="px-5 py-3 font-medium" style={{ color: 'var(--guander-ink)' }}>{user.name}</td>
                <td className="px-5 py-3" style={{ color: 'var(--guander-muted)' }}>{user.email}</td>
                <td className="px-5 py-3" style={{ color: 'var(--guander-muted)' }}>{user.created_at ?? '—'}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-90" style={{ backgroundColor: '#c5cdb3', color: '#3d4f35' }}>Ver</button>
                    <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition hover:opacity-90" style={{ backgroundColor: 'var(--guander-forest)' }}>Editar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)}>
        <div className="p-6 pb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: 'var(--guander-ink)' }}>Agregar Nuevo Usuario</h2>
          <button onClick={() => setShowAdd(false)} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition"><X size={16} /></button>
        </div>
        <div className="space-y-4 p-6 pt-0">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--guander-ink)' }}>Nombre *</label>
            <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ border: '1px solid var(--guander-border)', color: 'var(--guander-ink)' }}
              placeholder="Nombre completo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--guander-ink)' }}>Email *</label>
            <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ border: '1px solid var(--guander-border)', color: 'var(--guander-ink)' }}
              placeholder="usuario@email.com"
            />
          </div>
        </div>
        <div className="p-6 pt-2 flex gap-3">
          <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90" style={{ backgroundColor: '#c5cdb3', color: '#3d4f35' }}>Cancelar</button>
          <button onClick={handleAdd} disabled={saving || !formName.trim() || !formEmail.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition cursor-pointer hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--guander-forest)' }}
          >{saving ? 'Creando...' : 'Crear Usuario'}</button>
        </div>
      </Modal>
    </div>
  );
}
