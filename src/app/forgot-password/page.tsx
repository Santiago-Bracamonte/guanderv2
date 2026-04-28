"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al enviar el email");
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-screen bg-white">
      {/* Columna izquierda */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-b from-emerald-900 to-emerald-950 text-white flex-col justify-between p-12">
        <div>
          <Link href="/" className="flex items-center gap-3 mb-6">
            <Image src="/LogoGuander.png" alt="Guander" width={44} height={44} className="object-contain" />
            <span className="text-2xl font-extrabold tracking-tight">Guander</span>
          </Link>
          <h1 className="text-4xl font-bold mb-6">Recuperar acceso</h1>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
          </p>
          <p className="text-emerald-100 text-sm leading-relaxed mt-4">
            El enlace es válido por 15 minutos.
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
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <Link href="/" className="flex items-center gap-2 mb-8 md:hidden">
            <Image src="/LogoGuander.png" alt="Guander" width={28} height={28} className="object-contain" />
            <span className="text-xl font-black tracking-tight text-gray-900">Guander</span>
          </Link>

          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email enviado</h2>
              <p className="text-gray-500 text-sm mb-6">
                Si existe una cuenta con <strong>{email}</strong>, recibirás un email con el enlace para restablecer tu contraseña.
              </p>
              <p className="text-xs text-gray-400 mb-6">Revisá también tu carpeta de spam.</p>
              <Link
                href="/login"
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                ← Volver al login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">¿Olvidaste tu contraseña?</h2>
                <p className="text-gray-500 text-sm mt-1">Te enviamos un enlace de recuperación</p>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
                <div>
                  <label htmlFor="email" className="block text-xs text-gray-600 mb-2 font-medium">
                    Email de tu cuenta
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full appearance-none rounded-lg border-2 border-gray-200 px-4 py-3 placeholder-gray-400 text-gray-900 focus:border-emerald-500 focus:outline-none transition-colors duration-200 text-sm hover:border-gray-300"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {loading ? "Enviando..." : "Enviar enlace de recuperación"}
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
      </div>
    </div>
  );
}
