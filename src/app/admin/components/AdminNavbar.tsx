'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AdminNavbarProps {
  adminName?: string;
  adminRole?: string;
}

export default function AdminNavbar({
  adminName = 'Administrador',
  adminRole = 'Administrador del Sistema',
}: AdminNavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <header
      className="h-16 bg-white border-b flex items-center px-6 justify-between shrink-0"
      style={{ borderColor: 'var(--guander-border)' }}
    >
      <div className="flex items-center gap-6">
        <Link href="/admin" className="flex items-center gap-2 no-underline">
          <span className="font-bold text-lg" style={{ color: 'var(--guander-ink)' }}>
            Guander
          </span>
          <span
            className="text-white text-[10px] px-2 py-0.5 rounded font-semibold tracking-wide"
            style={{ backgroundColor: 'var(--guander-forest)' }}
          >
            Admin
          </span>
        </Link>

        <nav className="flex items-center gap-6 ml-6">
          <Link
            href="/admin"
            className="text-sm font-medium no-underline hover:opacity-70 transition"
            style={{ color: 'var(--guander-ink)' }}
          >
            Inicio
          </Link>
          <Link
            href="/admin/estadisticas"
            className="text-sm font-medium no-underline hover:opacity-70 transition"
            style={{ color: 'var(--guander-ink)' }}
          >
            Estadísticas
          </Link>
          <Link
            href="/admin/configuracion"
            className="text-sm font-medium no-underline hover:opacity-70 transition"
            style={{ color: 'var(--guander-ink)' }}
          >
            Configuración
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm font-semibold" style={{ color: 'var(--guander-ink)' }}>
            {adminName}
          </div>
          <div className="text-[11px]" style={{ color: 'var(--guander-muted)' }}>
            {adminRole}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
}
