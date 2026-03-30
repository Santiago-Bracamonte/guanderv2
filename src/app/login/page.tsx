"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const res: Response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data: Record<string, any> = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setError(data.error || "Email o contraseña incorrectos");
        } else if (res.status === 403) {
          setError(data.error || "Tu rol no tiene acceso al sistema");
        } else if (res.status === 500) {
          setError("Error en el servidor. Intenta más tarde.");
        } else {
          setError(data.error || "Error al iniciar sesión");
        }
        setLoading(false);
        return;
      }

      // Guardar token en localStorage (middleware usa cookies)
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirigir al dashboard según el rol
      const userRole = data.user?.role;

      if (userRole === "admin") {
        router.push("/dashboard/admin");
      } else if (userRole === "customer") {
        router.push("/dashboard/customer");
      } else if (userRole === "professional") {
        router.push("/dashboard/professional");
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
    <div className="flex h-screen w-screen bg-white">
      {/* COLUMNA IZQUIERDA - Verde Oscuro */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-b from-emerald-900 to-emerald-950 text-white flex-col justify-between p-12">
        <div>
          <h1 className="text-4xl font-bold mb-6">Portal de Gestión</h1>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Accede al panel de control para gestionar tu local, servicios,
            estadísticas y configuración
          </p>
          <p className="text-emerald-100 text-sm leading-relaxed mt-4">
            Si eres un profesional o local adherido desde aquí podrás
            administrar toda tu presencia en la plataforma.
          </p>
        </div>
        <Link
          href="/"
          className="block bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-3 px-8 rounded-full w-fit transition-colors duration-200 text-center"
        >
          ↶ Volver al Inicio
        </Link>
      </div>

      {/* COLUMNA DERECHA - Blanco con Formulario */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Encabezado Verde Claro */}
          <div className="bg-emerald-200 border-2 border-emerald-400 rounded-lg p-4 mb-8 text-center">
            <p className="text-emerald-900 font-semibold text-base">
              Local/Profesional
            </p>
          </div>

          {/* Mostrar errores */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p className="font-semibold text-sm">{error}</p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleLogin} className="flex flex-col space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs text-gray-600 mb-2 font-medium"
              >
                Email o Usuario
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full appearance-none rounded-lg border-2 border-gray-200 px-4 py-3 placeholder-gray-400 text-gray-900 focus:border-emerald-500 focus:outline-none transition-colors duration-200 text-sm hover:border-gray-300"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-xs text-gray-600 mb-2 font-medium"
              >
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
                className="w-full appearance-none rounded-lg border-2 border-gray-200 px-4 py-3 placeholder-gray-400 text-gray-900 focus:border-emerald-500 focus:outline-none transition-colors duration-200 text-sm hover:border-gray-300"
              />
            </div>

            <label className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 border-2 border-gray-300 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-600">Recuérdame</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>

            <p className="text-center text-sm text-gray-600 mt-6">
              {"¿No tienes cuenta? "}
              <Link
                href="/register"
                className="font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Regístrate aquí
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
