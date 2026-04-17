"use client";

import { Shield, User, Eye, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";

export default function ConfiguracionPage() {
  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Activity Log State
  const [showAllActivity, setShowAllActivity] = useState(false);

  const activityHistory = [
    { action: "Inicio de sesión", time: "2h" },
    { action: "Cambio contraseña", time: "3d" },
    { action: "Modificación admin", time: "1s" },
    { action: "Acceso a Locales", time: "1s" },
    { action: "Acceso a Usuarios", time: "2s" },
    { action: "Acceso a Planes", time: "5s" },
  ];

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    // Validations
    if (!currentPassword.trim()) {
      setPasswordMessage({
        type: "error",
        text: "Ingresa tu contraseña actual",
      });
      return;
    }

    if (!newPassword.trim()) {
      setPasswordMessage({
        type: "error",
        text: "Ingresa una nueva contraseña",
      });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "La contraseña debe tener al menos 6 caracteres",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "Las contraseñas no coinciden",
      });
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordMessage({
        type: "error",
        text: "La nueva contraseña no puede ser igual a la actual",
      });
      return;
    }

    setLoading(true);

    try {
      // Get userId from auth status endpoint
      const authRes = await fetch("/api/admin/auth-status");
      if (!authRes.ok) {
        setPasswordMessage({
          type: "error",
          text: "Sesión no encontrada. Por favor inicia sesión de nuevo.",
        });
        setLoading(false);
        return;
      }

      const authData = await authRes.json();
      const userId = authData.userId;

      const response = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          userId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordMessage({
          type: "success",
          text: "Contraseña actualizada correctamente",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage({
          type: "error",
          text: data.message || "Error al cambiar la contraseña",
        });
      }
    } catch (error) {
      setPasswordMessage({
        type: "error",
        text: "Error de conexión. Intenta de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  };

  const displayedActivity = showAllActivity
    ? activityHistory
    : activityHistory.slice(0, 3);

  return (
    <div className="space-y-6 max-w-full px-2">
      {/* Page Title */}
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--guander-ink)" }}
        >
          Configuración General
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--guander-ink)" }}>
          Gestiona tu perfil, seguridad y actividad del sistema
        </p>
      </div>

      {/* Top Row: Profile Info, Activity Log, and Change Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Profile Info */}
        <div
          className="bg-white rounded-xl p-4"
          style={{ border: "1px solid var(--guander-border)" }}
        >
          <h2
            className="text-base font-bold mb-3 flex items-center gap-2"
            style={{ color: "var(--guander-ink)" }}
          >
            <User size={18} style={{ color: "var(--guander-forest)" }} />
            Información del Perfil
          </h2>
          <div className="space-y-2">
            <div>
              <p
                className="text-sm font-semibold uppercase"
                style={{ color: "var(--guander-muted)" }}
              >
                Email
              </p>
              <p
                className="text-sm mt-0.5"
                style={{ color: "var(--guander-ink)" }}
              >
                admin123@gmail.com
              </p>
            </div>
            <div>
              <p
                className="text-sm font-semibold uppercase"
                style={{ color: "var(--guander-muted)" }}
              >
                Rol
              </p>
              <p
                className="text-sm mt-0.5"
                style={{ color: "var(--guander-ink)" }}
              >
                Administrador del Sistema
              </p>
            </div>
            <div>
              <p
                className="text-sm font-semibold uppercase"
                style={{ color: "var(--guander-muted)" }}
              >
                Último acceso
              </p>
              <p
                className="text-sm mt-0.5"
                style={{ color: "var(--guander-ink)" }}
              >
                Hoy a las 14:32
              </p>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div
          className="bg-white rounded-xl p-4"
          style={{ border: "1px solid var(--guander-border)" }}
        >
          <h2
            className="text-base font-bold mb-3 flex items-center gap-2"
            style={{ color: "var(--guander-ink)" }}
          >
            <Eye size={18} style={{ color: "var(--guander-forest)" }} />
            Actividad Reciente
          </h2>
          <div className="space-y-1.5 text-sm">
            {displayedActivity.map((item, i) => (
              <div
                key={i}
                className="flex justify-between py-1.5"
                style={{
                  borderBottom:
                    i === displayedActivity.length - 1
                      ? "none"
                      : "1px solid var(--guander-border)",
                }}
              >
                <span style={{ color: "var(--guander-ink)" }}>
                  {item.action}
                </span>
                <span style={{ color: "var(--guander-muted)" }}>
                  {item.time}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowAllActivity(!showAllActivity)}
            className="w-full mt-2.5 px-3 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition"
            style={{
              backgroundColor: "var(--guander-mint)",
              color: "var(--guander-forest)",
            }}
          >
            {showAllActivity ? "Ver menos" : "Ver historial"}
          </button>
        </div>

        {/* Change Password */}
        <div
          className="bg-white rounded-xl p-4"
          style={{ border: "1px solid var(--guander-border)" }}
        >
          <h2
            className="text-base font-bold mb-3 flex items-center gap-2"
            style={{ color: "var(--guander-ink)" }}
          >
            <Shield size={18} style={{ color: "var(--guander-forest)" }} />
            Cambiar Contraseña
          </h2>

          {passwordMessage && (
            <div
              className="mb-3 p-2 rounded-lg text-sm flex items-start gap-2"
              style={{
                backgroundColor:
                  passwordMessage.type === "success"
                    ? "rgba(76, 175, 80, 0.1)"
                    : "rgba(244, 67, 54, 0.1)",
                color:
                  passwordMessage.type === "success" ? "#2e7d32" : "#c62828",
              }}
            >
              {passwordMessage.type === "success" ? (
                <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              )}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-2.5">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--guander-ink)" }}
              >
                Actual
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: "1px solid var(--guander-border)" }}
                disabled={loading}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--guander-ink)" }}
              >
                Nueva
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: "1px solid var(--guander-border)" }}
                disabled={loading}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--guander-ink)" }}
              >
                Confirmar
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: "1px solid var(--guander-border)" }}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 px-4 py-3 rounded-lg text-sm font-semibold text-white cursor-pointer transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--guander-forest)" }}
            >
              {loading ? "Actualizando..." : "Actualizar Contraseña"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
