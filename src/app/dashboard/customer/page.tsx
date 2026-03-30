"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  email: string;
  name: string;
  lastName: string;
  role: string;
}

export default function CustomerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      if (userData.role !== "customer") {
        router.push("/login");
        return;
      }
      setUser(userData);
    } catch {
      router.push("/login");
    }
  }, [router]);

  if (!user) {
    return null;
  }

  function handleLogout() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <div className="bg-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Panel de Cliente</h1>
          </div>
          <button
            onClick={handleLogout}
            className="bg-blue-600 hover:bg-blue-800 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md text-center">
          {/* Icono del Rol */}
          <div className="text-6xl mb-6">🛍️</div>

          {/* Nombre del Usuario */}
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {user.name} {user.lastName}
          </h2>

          {/* Rol */}
          <p className="text-lg text-blue-600 font-bold mb-4">Cliente</p>

          {/* Email */}
          <p className="text-gray-600 text-sm">{user.email}</p>
        </div>
      </div>
    </div>
  );
}
