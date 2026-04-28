"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Enlace inválido. Solicitá uno nuevo desde el login.");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
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
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al restablecer la contraseña");
        setLoading(false);
        return;
      }

      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo mobile */}
      <Link href="/" className="flex items-center gap-2 mb-8 md:hidden">
        <Image src="/LogoGuander.png" alt="Guander" width={28} height={28} className="object-contain" />
        <span className="text-xl font-black tracking-tight text-gray-900">Guander</span>
      </Link>

      {done ? (
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Contraseña actualizada!</h2>
          <p className="text-gray-500 text-sm mb-6">Serás redirigido al login en unos segundos...</p>
          <Link href="/login" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
            Ir al login ahora
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Nueva contraseña</h2>
            <p className="text-gray-500 text-sm mt-1">Ingresá tu nueva contraseña</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p className="text-sm">{error}</p>
              {error.includes("expiró") && (
                <Link href="/forgot-password" className="text-sm font-semibold underline mt-1 block">
                  Solicitar nuevo enlace
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
            <div>
              <label htmlFor="password" className="block text-xs text-gray-600 mb-2 font-medium">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full appearance-none rounded-lg border-2 border-gray-200 px-4 py-3 pr-11 placeholder-gray-400 text-gray-900 focus:border-emerald-500 focus:outline-none transition-colors duration-200 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Ocultar" : "Mostrar"}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7a9.956 9.956 0 015.525 1.662M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm" className="block text-xs text-gray-600 mb-2 font-medium">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full appearance-none rounded-lg border-2 border-gray-200 px-4 py-3 pr-11 placeholder-gray-400 text-gray-900 focus:border-emerald-500 focus:outline-none transition-colors duration-200 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showConfirm ? "Ocultar" : "Mostrar"}
                >
                  {showConfirm ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7a9.956 9.956 0 015.525 1.662M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="flex h-12 w-full items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? "Guardando..." : "Restablecer contraseña"}
            </button>

            <p className="text-center text-sm text-gray-600">
              <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">
                ← Volver al login
              </Link>
            </p>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex h-screen w-screen bg-white">
      {/* Columna izquierda */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-b from-emerald-900 to-emerald-950 text-white flex-col justify-between p-12">
        <div>
          <Link href="/" className="flex items-center gap-3 mb-6">
            <Image src="/LogoGuander.png" alt="Guander" width={44} height={44} className="object-contain" />
            <span className="text-2xl font-extrabold tracking-tight">Guander</span>
          </Link>
          <h1 className="text-4xl font-bold mb-6">Nueva contraseña</h1>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Elegí una contraseña segura de al menos 6 caracteres.
          </p>
        </div>
        <Link
          href="/login"
          className="block bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-3 px-8 rounded-full w-fit transition-colors duration-200 text-center"
        >
          ↶ Volver al Login
        </Link>
      </div>

      {/* Columna derecha */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <Suspense fallback={<div className="text-gray-500 text-sm">Cargando...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
