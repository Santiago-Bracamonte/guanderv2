'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión');
        return;
      }

      router.push('/admin');
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--guander-cream)' }}
    >
      <div
        className="w-full max-w-md p-8 bg-white rounded-2xl"
        style={{
          border: '1px solid var(--guander-border)',
          boxShadow: '0 4px 24px rgba(31,75,59,0.08)',
        }}
      >
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-bold flex items-center justify-center gap-2"
            style={{ color: 'var(--guander-ink)' }}
          >
            Guander
            <span
              className="text-white text-[10px] px-2 py-0.5 rounded font-semibold tracking-wide"
              style={{ backgroundColor: 'var(--guander-forest)' }}
            >
              Admin
            </span>
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--guander-muted)' }}>
            Inicia sesión para acceder al panel de administración
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--guander-ink)' }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm transition outline-none"
              style={{
                border: '1px solid var(--guander-border)',
                color: 'var(--guander-ink)',
              }}
              placeholder="admin@guander.com"
              required
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--guander-ink)' }}
            >
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm transition outline-none"
              style={{
                border: '1px solid var(--guander-border)',
                color: 'var(--guander-ink)',
              }}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: 'var(--guander-forest)' }}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--guander-muted)' }}>
          Credenciales por defecto: admin@guander.com / admin123
        </p>
      </div>
    </div>
  );
}
