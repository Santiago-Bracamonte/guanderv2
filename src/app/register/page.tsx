"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("professional");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [tel, setTel] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res: Response = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
          role,
          name,
          lastName,
          tel,
          address,
        }),
      });

      const data: Record<string, any> = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError(data.error || "El email ya está registrado");
        } else if (res.status === 400) {
          setError(data.error || "Datos inválidos. Verifica los campos.");
        } else if (res.status === 403) {
          setError(data.error || "No puedes registrarte con este rol");
        } else if (res.status === 500) {
          setError("Error en el servidor. Intenta más tarde.");
        } else {
          setError(data.error || "Error al registrar");
        }
        setLoading(false);
        return;
      }

      // Guardar token y usuario
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirigir al dashboard según el rol
      const userRole = data.user?.role;

      if (userRole === "admin") {
        window.location.href = "/dashboard/admin";
      } else if (userRole === "professional" || userRole === "store_owner") {
        window.location.href = "/dashboard/store";
      } else {
        setError("Rol no válido. Intenta de nuevo.");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error de conexión";
      if (errorMsg.includes("Failed to fetch")) {
        setError("No se puede conectar al servidor. Verifica tu conexión.");
      } else {
        setError(errorMsg);
      }
      setLoading(false);
    }
  }

  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-white">
      {/* COLUMNA IZQUIERDA */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-b from-emerald-900 to-emerald-950 text-white flex-col justify-between p-12 shrink-0">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-10">
            <span className="text-3xl font-black text-emerald-400">✶</span>
            <span className="text-2xl font-black tracking-tight">Guander</span>
          </Link>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Únete a la plataforma
          </h1>
          <p className="text-emerald-100 text-sm leading-relaxed mb-4">
            Registra tu local o perfil profesional y comenzá a gestionar servicios, cupones y suscripciones desde un solo lugar.
          </p>
          <div className="flex flex-col gap-3 mt-8">
            {[
              { text: "Gestión de locales y servicios" },
              { text: "Cupones y promociones propias" },
              { text: "Estadísticas en tiempo real" },
              { text: "Planes de suscripción flexibles" },
            ].map(({ text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-emerald-400 font-bold text-base leading-none">→</span>
                <span className="text-emerald-100 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-emerald-400 text-xs">© 2026 Guander — Todos los derechos reservados</p>
      </div>

      {/* COLUMNA DERECHA */}
      <div className="flex flex-1 flex-col justify-center items-center px-6 py-12 min-w-0">
        {/* Logo mobile */}
        <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <span className="text-2xl font-black text-emerald-600">✶</span>
          <span className="text-xl font-black tracking-tight text-gray-900">Guander</span>
        </Link>

        <div className="w-full max-w-lg">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Crear cuenta</h2>
            <p className="text-gray-500 text-sm mt-1">Completa los datos para comenzar</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Nombre
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Apellido
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Tu apellido"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-600 mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>

            {/* Tel y Dirección */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="tel" className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Teléfono
                </label>
                <input
                  id="tel"
                  name="tel"
                  type="tel"
                  placeholder="+54..."
                  value={tel}
                  onChange={(e) => setTel(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>
              <div>
                <label htmlFor="address" className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Dirección
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="Tu dirección"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>
            </div>

            {/* Contraseña y Confirmar */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Confirmar contraseña
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>
            </div>

            {/* Rol */}
            <div>
              <label htmlFor="role" className="block text-xs font-semibold text-gray-600 mb-1.5">
                ¿Qué eres?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "professional", label: "Profesional" },
                  { value: "store_owner", label: "Local / Tienda" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                      role === opt.value
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {loading ? "Registrando..." : "Crear cuenta"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Inicia sesión
            </Link>
          </p>

          <p className="text-xs text-gray-400 text-center mt-4">
            Al registrarte aceptas nuestros términos y condiciones de servicio
          </p>
        </div>
      </div>
    </div>
  );
}
