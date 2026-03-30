import { MessageSquare, Send } from 'lucide-react';

const messages = [
  { id: 1, from: 'Juan Pérez', subject: 'Consulta sobre suscripción', preview: 'Hola, tengo una duda sobre el plan Premium...', time: 'Hace 15 min', unread: true },
  { id: 2, from: 'María García', subject: 'Problema con el local', preview: 'No puedo actualizar la información de mi local...', time: 'Hace 1 hora', unread: true },
  { id: 3, from: 'Carlos López', subject: 'Solicitud de verificación', preview: 'Me gustaría verificar mi cuenta de veterinaria...', time: 'Hace 2 horas', unread: true },
  { id: 4, from: 'Ana Rodríguez', subject: 'Reporte de error', preview: 'Encontré un error al buscar locales cercanos...', time: 'Hace 3 horas', unread: false },
  { id: 5, from: 'Luis Martínez', subject: 'Sugerencia de mejora', preview: 'Sería genial si pudieran agregar filtros por...', time: 'Hace 5 horas', unread: true },
  { id: 6, from: 'Sistema', subject: 'Informe semanal', preview: 'Tu resumen semanal está disponible...', time: 'Ayer', unread: false },
  { id: 7, from: 'Soporte', subject: 'Ticket #1234 cerrado', preview: 'El ticket ha sido resuelto exitosamente...', time: 'Ayer', unread: false },
];

export default function MensajesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--guander-ink)' }}>
          Mensajes
          <span
            className="text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold"
            style={{ backgroundColor: 'var(--guander-forest)' }}
          >
            {messages.filter((m) => m.unread).length}
          </span>
        </h1>
        <button
          className="px-5 py-3 rounded-xl text-sm font-semibold text-white flex items-center gap-2 cursor-pointer transition hover:opacity-90"
          style={{ backgroundColor: 'var(--guander-forest)' }}
        >
          <Send size={16} />
          Nuevo Mensaje
        </button>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid var(--guander-border)' }}>
        {messages.map((msg, i) => (
          <div
            key={msg.id}
            className={`flex items-start gap-4 px-5 py-4 transition hover:bg-[var(--guander-cream)] cursor-pointer ${
              i < messages.length - 1 ? 'border-b' : ''
            }`}
            style={{ borderColor: 'var(--guander-border)', backgroundColor: msg.unread ? 'var(--guander-card)' : undefined }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white"
              style={{ backgroundColor: msg.unread ? 'var(--guander-forest)' : 'var(--guander-muted)' }}
            >
              {msg.from[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className={`text-sm ${msg.unread ? 'font-bold' : 'font-medium'}`} style={{ color: 'var(--guander-ink)' }}>
                  {msg.from}
                </p>
                <span className="text-xs shrink-0 ml-2" style={{ color: 'var(--guander-muted)' }}>
                  {msg.time}
                </span>
              </div>
              <p className="text-sm font-medium truncate" style={{ color: 'var(--guander-ink)' }}>
                {msg.subject}
              </p>
              <p className="text-xs truncate mt-0.5" style={{ color: 'var(--guander-muted)' }}>
                {msg.preview}
              </p>
            </div>
            {msg.unread && (
              <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-2" style={{ backgroundColor: 'var(--guander-forest)' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
