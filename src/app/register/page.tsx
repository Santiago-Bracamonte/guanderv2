"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("customer");
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
    <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100">
      <div className="w-full max-w-md px-6">
        {/* Tarjeta del Formulario */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Encabezado Verde */}
          <div className="bg-emerald-50 border-2 border-emerald-400 rounded-lg p-4 mb-8 text-center">
            <p className="text-emerald-900 font-semibold text-base">
              Registro de Local/Profesional
            </p>
          </div>

          {/* Mostrar errores */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p className="font-semibold text-sm">{error}</p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleRegister} className="flex flex-col space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs text-gray-600 mb-2 font-medium"
              >
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

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs text-gray-600 mb-2 font-medium"
              >
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full appearance-none rounded-lg border-2 border-gray-200 px-4 py-3 placeholder-gray-400 text-gray-900 focus:border-emerald-500 focus:outline-none transition-colors duration-200 text-sm hover:border-gray-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs text-gray-600 mb-2 font-medium"
                >
                  Nombre
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full appearance-none rounded-lg border-2 border-gray-200 px-4 py-3 placeholder-gray-400 text-gray-900 focus:border-emerald-500 focus:outline-none transition-colors duration-200 text-sm hover:border-gray-300"
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-xs text-gray-600 mb-2 font-medium"
                >
                  Apellido
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Tu apellido"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full appearance-none rounded-lg border-2 border-gray-200 px-4 py-3 placeholder-gray-400 text-gray-900 focus:border-emerald-500 focus:outline-none transition-colors duration-200 text-sm hover:border-gray-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="tel"
                  className="block text-xs text-gray-600 mb-2 font-medium"
                >
                  Teléfono
                </label>
                <input
                  id="tel"
                  name="tel"
                  type="tel"
                  placeholder="+54..."
                  value={tel}
                  onChange={(e) => setTel(e.target.value)}
                  className="w-full appearance-none rounded-lg border-2 border-gray-200 px-4 py-3 placeholder-gray-400 text-gray-900 focus:border-emerald-500 focus:outline-none transition-colors duration-200 text-sm hover:border-gray-300"
                />
              </div>
              <div>
                <label
                  htmlFor="address"
                  className="block text-xs text-gray-600 mb-2 font-medium"
                >
                  Dirección
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="Tu dirección"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full appearance-none rounded-lg border-2 border-gray-200 px-4 py-3 placeholder-gray-400 text-gray-900 focus:border-emerald-500 focus:outline-none transition-colors duration-200 text-sm hover:border-gray-300"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="role"
                className="block text-xs text-gray-600 mb-2 font-medium"
              >
                ¿Qué eres?
              </label>
              <select
                id="role"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full appearance-none rounded-lg border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-emerald-500 focus:outline-none transition-colors duration-200 text-sm hover:border-gray-300 bg-white"
              >
                <option value="customer">Cliente / Tienda</option>
                <option value="professional">Profesional</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? "Registrando..." : "Registrarse"}
            </button>

            <p className="text-center text-sm text-gray-600 mt-6">
              {"¿Ya tienes cuenta? "}
              <Link
                href="/login"
                className="font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </form>

          {/* Pie de página */}
          <p className="text-xs text-gray-500 text-center mt-8">
            Al registrarte aceptas nuestros términos y condiciones de servicio
          </p>
        </div>
      </div>
    </div>
  );
}
