"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type Plan = {
  id_subscription: number;
  name: string;
  description: string;
  amount: number;
  plan_benefits: string;
};

type BenefitItem = { benefit: string; detail?: string };

function parseBenefits(raw: string): BenefitItem[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as BenefitItem[];
  } catch { /* fall through */ }
  return raw.split(/\n/).map((b) => ({ benefit: b.trim() })).filter((b) => b.benefit);
}

function formatAmount(n: number) {
  return `$${n.toLocaleString("es-AR")}`;
}

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

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

  useEffect(() => { setIsMounted(true); }, []);

  async function goToStep2() {
    if (password !== confirmPassword) { setError("Las contraseñas no coinciden"); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    if (!email.trim()) { setError("El email es requerido"); return; }
    setError("");
    setPlansLoading(true);
    try {
      const res = await fetch("/api/admin/subscriptions");
      const data = await res.json();
      setPlans((data.data ?? []).filter((p: Plan) => p.amount >= 0));
    } catch {
      setPlans([]);
    } finally {
      setPlansLoading(false);
    }
    setStep(2);
  }

  async function handleRegister() {
    setLoading(true);
    setError("");
    try {
      const res: Response = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirmPassword, role, name, lastName, tel, address }),
      });
      const data: Record<string, unknown> = await res.json();
      if (!res.ok) {
        if (res.status === 409) setError((data.error as string) || "El email ya está registrado");
        else if (res.status === 400) setError((data.error as string) || "Datos inválidos");
        else setError((data.error as string) || "Error al registrar");
        setLoading(false);
        setStep(1);
        return;
      }
      localStorage.setItem("token", data.token as string);
      localStorage.setItem("user", JSON.stringify(data.user));
      // Store selected plan for onboarding
      if (selectedPlanId !== null) {
        const plan = plans.find((p) => p.id_subscription === selectedPlanId);
        if (plan) {
          localStorage.setItem("guander_pending_plan", JSON.stringify({
            id: plan.id_subscription,
            name: plan.name,
            amount: plan.amount,
          }));
        }
      }
      const userRole = (data.user as { role: string })?.role;
      if (userRole === "admin") window.location.href = "/dashboard/admin";
      else if (userRole === "professional" || userRole === "store_owner") window.location.href = "/dashboard/store";
      else setError("Rol no válido.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
      setLoading(false);
    }
  }

  if (!isMounted) return null;

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-white">
      {/* COLUMNA IZQUIERDA */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-b from-emerald-900 to-emerald-950 text-white flex-col justify-between p-12 shrink-0">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-10">
            <Image src="/LogoGuander.png" alt="Guander" width={36} height={36} className="object-contain" />
            <span className="text-2xl font-black tracking-tight">Guander</span>
          </Link>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            {step === 1 ? "Únete a la plataforma" : "Elegí tu plan"}
          </h1>
          <p className="text-emerald-100 text-sm leading-relaxed mb-4">
            {step === 1
              ? "Registra tu local o perfil profesional y comenzá a gestionar servicios, cupones y suscripciones desde un solo lugar."
              : "Tu plan queda pendiente de pago. El equipo de Guander se comunicará con vos para coordinar el cobro."}
          </p>
          {step === 1 && (
            <div className="flex flex-col gap-3 mt-8">
              {["Gestión de locales y servicios", "Cupones y promociones propias", "Estadísticas en tiempo real", "Planes de suscripción flexibles"].map((t) => (
                <div key={t} className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold text-base">→</span>
                  <span className="text-emerald-100 text-sm">{t}</span>
                </div>
              ))}
            </div>
          )}
          {step === 2 && (
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3"><span className="text-emerald-400">✓</span><span className="text-emerald-100 text-sm">Podés cambiar de plan en cualquier momento</span></div>
              <div className="flex items-center gap-3"><span className="text-emerald-400">✓</span><span className="text-emerald-100 text-sm">30 días de prueba gratis incluidos</span></div>
              <div className="flex items-center gap-3"><span className="text-emerald-400">✓</span><span className="text-emerald-100 text-sm">Cancelá cuando quieras sin penalidades</span></div>
            </div>
          )}
        </div>
        {/* Step indicator */}
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? "bg-emerald-400 text-emerald-900" : "bg-emerald-700 text-white"}`}>1</div>
          <div className="h-0.5 w-10 bg-emerald-700" />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? "bg-emerald-400 text-emerald-900" : "bg-emerald-800 text-emerald-500"}`}>2</div>
          <p className="text-emerald-300 text-xs ml-2">{step === 1 ? "Tus datos" : "Tu plan"}</p>
        </div>
      </div>

      {/* COLUMNA DERECHA */}
      <div className="flex flex-1 flex-col justify-center items-center px-6 py-12 min-w-0">
        {/* Logo mobile */}
        <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <Image src="/LogoGuander.png" alt="Guander" width={28} height={28} className="object-contain" />
          <span className="text-xl font-black tracking-tight text-gray-900">Guander</span>
        </Link>

        <div className="w-full max-w-lg">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
          )}

          {/* ── STEP 1: Datos ── */}
          {step === 1 && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Crear cuenta</h2>
                <p className="text-gray-500 text-sm mt-1">Completa los datos para comenzar</p>
              </div>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="name" className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre</label>
                    <input id="name" type="text" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all" />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-xs font-semibold text-gray-600 mb-1.5">Apellido</label>
                    <input id="lastName" type="text" placeholder="Tu apellido" value={lastName} onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all" />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
                  <input id="email" type="email" placeholder="tu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="tel" className="block text-xs font-semibold text-gray-600 mb-1.5">Teléfono</label>
                    <input id="tel" type="tel" placeholder="+54..." value={tel} onChange={(e) => setTel(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all" />
                  </div>
                  <div>
                    <label htmlFor="address" className="block text-xs font-semibold text-gray-600 mb-1.5">Dirección</label>
                    <input id="address" type="text" placeholder="Tu dirección" value={address} onChange={(e) => setAddress(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="password" className="block text-xs font-semibold text-gray-600 mb-1.5">Contraseña</label>
                    <input id="password" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all" />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-600 mb-1.5">Confirmar contraseña</label>
                    <input id="confirmPassword" type="password" placeholder="••••••••" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">¿Qué eres?</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ value: "professional", label: "Profesional" }, { value: "store_owner", label: "Local / Tienda" }].map((opt) => (
                      <button key={opt.value} type="button" onClick={() => setRole(opt.value)}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                          role === opt.value ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={goToStep2}
                  className="mt-2 h-11 w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 shadow-sm hover:shadow-md">
                  Siguiente — Elegir plan →
                </button>
              </div>
              <p className="text-center text-sm text-gray-500 mt-6">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">Inicia sesión</Link>
              </p>
              <p className="text-xs text-gray-400 text-center mt-4">Al registrarte aceptas nuestros términos y condiciones de servicio</p>
            </>
          )}

          {/* ── STEP 2: Plan selection ── */}
          {step === 2 && (
            <>
              <div className="mb-6">
                <button type="button" onClick={() => setStep(1)} className="text-sm text-emerald-700 hover:text-emerald-800 font-semibold mb-3 flex items-center gap-1">
                  ← Volver
                </button>
                <h2 className="text-2xl font-bold text-gray-900">Elegí tu plan</h2>
                <p className="text-gray-500 text-sm mt-1">El pago se coordina con el equipo de Guander tras la activación</p>
              </div>

              {plansLoading ? (
                <div className="text-center py-12 text-gray-400">Cargando planes...</div>
              ) : (
                <div className="flex flex-col gap-3 mb-6">
                  {plans.map((plan) => {
                    const isSelected = selectedPlanId === plan.id_subscription;
                    const benefits = parseBenefits(plan.plan_benefits);
                    return (
                      <button key={plan.id_subscription} type="button" onClick={() => setSelectedPlanId(isSelected ? null : plan.id_subscription)}
                        className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                          isSelected ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-emerald-300 bg-white"
                        }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-gray-900 text-base">{plan.name}</p>
                            <p className="text-emerald-700 font-black text-xl">{formatAmount(plan.amount)}<span className="text-gray-400 text-sm font-normal">/mes</span></p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? "border-emerald-500 bg-emerald-500" : "border-gray-300"
                          }`}>
                            {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                          </div>
                        </div>
                        {plan.description && <p className="text-gray-500 text-xs mt-1">{plan.description}</p>}
                        {benefits.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {benefits.map((b, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                                <span><span className="font-medium">{b.benefit}</span>{b.detail && <span className="text-gray-400"> — {b.detail}</span>}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </button>
                    );
                  })}
                  {plans.length === 0 && <p className="text-center text-gray-400 py-6">No hay planes disponibles en este momento</p>}
                </div>
              )}

              {selectedPlanId === null && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                  Podés continuar sin seleccionar un plan. El admin te asignará uno al activar tu cuenta.
                </p>
              )}

              <button type="button" onClick={handleRegister} disabled={loading}
                className="h-11 w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md">
                {loading ? "Registrando..." : selectedPlanId ? `Crear cuenta con ${plans.find(p => p.id_subscription === selectedPlanId)?.name}` : "Crear cuenta"}
              </button>

              <p className="text-xs text-gray-400 text-center mt-4">Al registrarte aceptas nuestros términos y condiciones de servicio</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

