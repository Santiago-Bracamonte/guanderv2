"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, LogOut } from "lucide-react";

interface AdminNavbarProps {
  adminName?: string;
  adminRole?: string;
  onMenuClick?: () => void;
}

export default function AdminNavbar({
  adminName = "Administrador",
  adminRole = "Administrador del Sistema",
  onMenuClick,
}: AdminNavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <header
      className="h-14 md:h-16 border-b flex items-center px-4 md:px-6 justify-between shrink-0 z-20"
      style={{
        borderColor: "rgba(255,255,255,0.14)",
        backgroundColor: "var(--guander-forest)",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition cursor-pointer"
          aria-label="Abrir menú"
        >
          <Menu size={20} style={{ color: "#ffffff" }} />
        </button>

        <Link
          href="/dashboard/admin"
          className="flex items-center gap-2 no-underline"
        >
          <span
            className="font-bold text-base md:text-lg"
            style={{ color: "#ffffff" }}
          >
            Guander
          </span>
          <span
            className="text-white text-[10px] px-2 py-0.5 rounded font-semibold tracking-wide"
            style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
          >
            Admin
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-6 ml-4">
          <Link
            href="/dashboard/admin"
            className="text-sm font-medium no-underline hover:opacity-70 transition"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            Inicio
          </Link>
          <Link
            href="/dashboard/admin/configuracion"
            className="text-sm font-medium no-underline hover:opacity-70 transition"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            Configuración
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* User info — hide on very small screens */}
        <div className="hidden sm:block text-right">
          <div
            className="text-sm font-semibold truncate max-w-[160px]"
            style={{ color: "#ffffff" }}
          >
            {adminName}
          </div>
          <div
            className="text-[11px]"
            style={{ color: "rgba(255,255,255,0.72)" }}
          >
            {adminRole}
          </div>
        </div>
        {/* Desktop: full button — Mobile: icon only */}
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer
            w-9 h-9 flex items-center justify-center
            sm:w-auto sm:h-auto sm:px-4 sm:py-2"
          aria-label="Cerrar Sesión"
        >
          <LogOut size={16} className="sm:hidden" />
          <span className="hidden sm:inline">Cerrar Sesión</span>
        </button>
      </div>
    </header>
  );
}
