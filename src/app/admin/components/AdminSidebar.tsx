'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  ShoppingBag,
  BarChart3,
  Settings,
  MessageSquare,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Gestión de Usuarios', href: '/admin/usuarios', icon: Users },
  { label: 'Gestión de locales', href: '/admin/locales', icon: Building2 },
  { label: 'Planes de Suscripción', href: '/admin/planes', icon: Shield },
  { label: 'Servicios/Productos', href: '/admin/servicios', icon: ShoppingBag },
  { label: 'Estadísticas Globales', href: '/admin/estadisticas', icon: BarChart3 },
  { label: 'Configuración General', href: '/admin/configuracion', icon: Settings },
  { label: 'Mensajes', href: '/admin/mensajes', icon: MessageSquare, badge: 5 },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className="w-[220px] min-w-[220px] min-h-full bg-white flex flex-col border-r"
      style={{ borderColor: 'var(--guander-border)' }}
    >
      <nav className="flex-1 py-4 px-3">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors mb-0.5 no-underline ${
                active
                  ? 'text-[var(--guander-forest)]'
                  : 'text-[var(--guander-ink)] hover:bg-[var(--guander-cream)]'
              }`}
              style={active ? { backgroundColor: 'var(--guander-mint)' } : undefined}
            >
              <item.icon size={18} strokeWidth={active ? 2.5 : 2} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span
                  className="text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold"
                  style={{ backgroundColor: 'var(--guander-forest)' }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t text-xs" style={{ borderColor: 'var(--guander-border)' }}>
        <div className="flex justify-between py-1.5">
          <span style={{ color: 'var(--guander-muted)' }}>Usuarios Online</span>
          <span className="font-bold" style={{ color: 'var(--guander-ink)' }}>234</span>
        </div>
        <div className="flex justify-between py-1.5">
          <span style={{ color: 'var(--guander-muted)' }}>Sistema</span>
          <span className="font-bold text-green-600">✓ OK</span>
        </div>
      </div>
    </aside>
  );
}
