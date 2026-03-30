import { Settings as SettingsIcon, Save, Globe, Bell, Shield, Palette } from 'lucide-react';

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold" style={{ color: 'var(--guander-ink)' }}>
        Configuración General
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* General Settings */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--guander-border)' }}>
          <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--guander-ink)' }}>
            <Globe size={18} style={{ color: 'var(--guander-forest)' }} />
            Configuración General
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--guander-ink)' }}>Nombre de la Plataforma</label>
              <input type="text" defaultValue="Guander" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ border: '1px solid var(--guander-border)', color: 'var(--guander-ink)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--guander-ink)' }}>Email de Contacto</label>
              <input type="email" defaultValue="contacto@guander.com" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ border: '1px solid var(--guander-border)', color: 'var(--guander-ink)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--guander-ink)' }}>Descripción</label>
              <textarea defaultValue="Encuentra los mejores lugares petfriendly cerca de ti" rows={3} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" style={{ border: '1px solid var(--guander-border)', color: 'var(--guander-ink)' }} />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--guander-border)' }}>
          <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--guander-ink)' }}>
            <Bell size={18} style={{ color: 'var(--guander-forest)' }} />
            Notificaciones
          </h2>
          <div className="space-y-4">
            {[
              { label: 'Notificaciones por email', desc: 'Recibe alertas de nuevos registros', default: true },
              { label: 'Notificaciones de sistema', desc: 'Alertas de estado del sistema', default: true },
              { label: 'Reportes semanales', desc: 'Resumen semanal por email', default: false },
              { label: 'Alertas de seguridad', desc: 'Notificaciones de accesos sospechosos', default: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--guander-ink)' }}>{item.label}</p>
                  <p className="text-xs" style={{ color: 'var(--guander-muted)' }}>{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={item.default} className="sr-only peer" />
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--guander-forest)]" />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--guander-border)' }}>
          <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--guander-ink)' }}>
            <Shield size={18} style={{ color: 'var(--guander-forest)' }} />
            Seguridad
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--guander-ink)' }}>Contraseña Actual</label>
              <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ border: '1px solid var(--guander-border)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--guander-ink)' }}>Nueva Contraseña</label>
              <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ border: '1px solid var(--guander-border)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--guander-ink)' }}>Confirmar Contraseña</label>
              <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ border: '1px solid var(--guander-border)' }} />
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--guander-border)' }}>
          <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--guander-ink)' }}>
            <Palette size={18} style={{ color: 'var(--guander-forest)' }} />
            Apariencia
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--guander-ink)' }}>Tema</label>
              <select className="w-full px-4 py-3 rounded-xl text-sm outline-none bg-white cursor-pointer" style={{ border: '1px solid var(--guander-border)', color: 'var(--guander-ink)' }}>
                <option>Claro</option>
                <option>Oscuro</option>
                <option>Sistema</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--guander-ink)' }}>Idioma</label>
              <select className="w-full px-4 py-3 rounded-xl text-sm outline-none bg-white cursor-pointer" style={{ border: '1px solid var(--guander-border)', color: 'var(--guander-ink)' }}>
                <option>Español</option>
                <option>English</option>
                <option>Português</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          className="px-6 py-3 rounded-xl text-sm font-semibold text-white flex items-center gap-2 cursor-pointer transition hover:opacity-90"
          style={{ backgroundColor: 'var(--guander-forest)' }}
        >
          <Save size={16} />
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}
