'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, RefreshCw, CheckCircle, ChevronLeft } from 'lucide-react';

type SupportMessage = {
  id_message: number;
  fk_ticket: number;
  sender_role: string;
  sender_name: string;
  body: string;
  created_at: string;
};

type SupportTicket = {
  id_ticket: number;
  user_id: number;
  user_role: string;
  user_name: string;
  user_email: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  messages: SupportMessage[];
};

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  return `Hace ${Math.floor(hrs / 24)}d`;
}

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    store_owner: 'Local',
    professional: 'Profesional',
    customer: 'Cliente',
    admin: 'Admin',
  };
  return map[role] ?? role;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    open: { label: 'Abierto', cls: 'bg-amber-100 text-amber-800' },
    answered: { label: 'Respondido', cls: 'bg-blue-100 text-blue-800' },
    closed: { label: 'Cerrado', cls: 'bg-gray-100 text-gray-500' },
  };
  const s = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500' };
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
  );
}

export default function MensajesPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedTicket = tickets.find((t) => t.id_ticket === selectedId) ?? null;
  const unreadCount = tickets.filter((t) => {
    const last = t.messages[t.messages.length - 1];
    return last?.sender_role === 'user' && t.status !== 'closed';
  }).length;

  async function fetchTickets() {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/messages/support-admin', { cache: 'no-store' });
      const json = (await res.json()) as { tickets?: SupportTicket[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Error al cargar mensajes');
      setTickets(json.tickets ?? []);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Error de red');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchTickets();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages.length]);

  async function handleSendReply(closeTicket = false) {
    if (!selectedId || !reply.trim()) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch('/api/messages/support-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedId,
          message: reply,
          status: closeTicket ? 'closed' : undefined,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'No se pudo enviar');

      const now = new Date().toISOString();
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id_ticket !== selectedId) return t;
          return {
            ...t,
            status: closeTicket ? 'closed' : 'answered',
            updated_at: now,
            messages: [
              ...t.messages,
              {
                id_message: Date.now(),
                fk_ticket: selectedId,
                sender_role: 'admin',
                sender_name: 'Soporte Guander',
                body: reply,
                created_at: now,
              },
            ],
          };
        }),
      );
      setReply('');
    } catch (e) {
      setSendError(e instanceof Error ? e.message : 'Error de red');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1
          className="text-xl font-bold flex items-center gap-2"
          style={{ color: 'var(--guander-ink)' }}
        >
          <MessageSquare size={20} />
          Mensajes de Soporte
          {unreadCount > 0 && (
            <span
              className="text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold"
              style={{ backgroundColor: 'var(--guander-forest)' }}
            >
              {unreadCount}
            </span>
          )}
        </h1>
        <button
          onClick={() => void fetchTickets()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition hover:opacity-80"
          style={{ border: '1px solid var(--guander-border)', color: 'var(--guander-forest)' }}
        >
          <RefreshCw size={14} />
          Actualizar
        </button>
      </div>

      {fetchError && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{fetchError}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: 'var(--guander-forest)' }}
          />
        </div>
      ) : (
        <div className="flex gap-4" style={{ height: 'calc(100vh - 160px)' }}>
          {/* Ticket list */}
          <div
            className={`flex-shrink-0 flex flex-col rounded-2xl overflow-hidden overflow-y-auto
              ${selectedId ? 'hidden md:flex' : 'flex'} md:w-80 w-full`}
            style={{ border: '1px solid var(--guander-border)', backgroundColor: 'white' }}
          >
            {tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-16 text-center px-4">
                <MessageSquare size={40} className="mb-3" style={{ color: 'var(--guander-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--guander-muted)' }}>
                  No hay mensajes de soporte todavía.
                </p>
              </div>
            ) : (
              tickets.map((ticket, i) => {
                const last = ticket.messages[ticket.messages.length - 1];
                const isUnread = last?.sender_role === 'user' && ticket.status !== 'closed';
                const isSelected = ticket.id_ticket === selectedId;
                return (
                  <button
                    key={ticket.id_ticket}
                    onClick={() => setSelectedId(ticket.id_ticket)}
                    className={`text-left flex items-start gap-3 px-4 py-3.5 transition w-full
                      ${i < tickets.length - 1 ? 'border-b' : ''}
                      ${isSelected ? '' : 'hover:opacity-90'}`}
                    style={{
                      borderColor: 'var(--guander-border)',
                      backgroundColor: isSelected
                        ? 'var(--guander-mint)'
                        : isUnread
                        ? '#f0faf4'
                        : undefined,
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white"
                      style={{
                        backgroundColor: isUnread
                          ? 'var(--guander-forest)'
                          : 'var(--guander-muted)',
                      }}
                    >
                      {ticket.user_name[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-sm truncate ${isUnread ? 'font-bold' : 'font-medium'}`}
                          style={{ color: 'var(--guander-ink)' }}
                        >
                          {ticket.user_name}
                        </span>
                        <span
                          className="text-[10px] shrink-0"
                          style={{ color: 'var(--guander-muted)' }}
                        >
                          {timeAgo(ticket.updated_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: 'var(--guander-mint)',
                            color: 'var(--guander-forest)',
                          }}
                        >
                          {roleLabel(ticket.user_role)}
                        </span>
                        <StatusBadge status={ticket.status} />
                      </div>
                      <p
                        className={`text-xs mt-0.5 truncate ${isUnread ? 'font-semibold' : ''}`}
                        style={{ color: 'var(--guander-ink)' }}
                      >
                        {ticket.subject}
                      </p>
                      {last && (
                        <p
                          className="text-[11px] truncate mt-0.5"
                          style={{ color: 'var(--guander-muted)' }}
                        >
                          {last.sender_role === 'admin' ? '✓ ' : ''}
                          {last.body}
                        </p>
                      )}
                    </div>
                    {isUnread && (
                      <div
                        className="w-2 h-2 rounded-full shrink-0 mt-2"
                        style={{ backgroundColor: 'var(--guander-forest)' }}
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Conversation */}
          {selectedTicket ? (
            <div
              className={`flex-1 flex flex-col rounded-2xl overflow-hidden min-w-0
                ${selectedId ? 'flex' : 'hidden md:flex'}`}
              style={{ border: '1px solid var(--guander-border)', backgroundColor: 'white' }}
            >
              {/* Thread header */}
              <div
                className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
                style={{ borderColor: 'var(--guander-border)' }}
              >
                <button
                  onClick={() => setSelectedId(null)}
                  className="md:hidden p-1.5 rounded-lg transition hover:opacity-80"
                  style={{ color: 'var(--guander-forest)' }}
                >
                  <ChevronLeft size={18} />
                </button>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ backgroundColor: 'var(--guander-forest)' }}
                >
                  {selectedTicket.user_name[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: 'var(--guander-ink)' }}>
                    {selectedTicket.user_name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--guander-muted)' }}>
                    {selectedTicket.user_email} · {roleLabel(selectedTicket.user_role)}
                  </p>
                </div>
                <StatusBadge status={selectedTicket.status} />
              </div>

              {/* Subject bar */}
              <div
                className="px-4 py-2 border-b shrink-0"
                style={{
                  borderColor: 'var(--guander-border)',
                  backgroundColor: 'var(--guander-cream)',
                }}
              >
                <p className="text-[10px] font-semibold" style={{ color: 'var(--guander-muted)' }}>
                  ASUNTO
                </p>
                <p className="text-sm font-bold" style={{ color: 'var(--guander-ink)' }}>
                  {selectedTicket.subject}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {selectedTicket.messages.map((msg) => (
                  <div
                    key={msg.id_message}
                    className={`flex ${msg.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className="max-w-[76%] rounded-2xl px-3.5 py-2.5 text-sm"
                      style={
                        msg.sender_role === 'admin'
                          ? { backgroundColor: 'var(--guander-forest)', color: '#fff' }
                          : {
                              backgroundColor: 'var(--guander-cream)',
                              border: '1px solid var(--guander-border)',
                              color: 'var(--guander-ink)',
                            }
                      }
                    >
                      <p
                        className="text-[10px] font-semibold mb-1"
                        style={{
                          color:
                            msg.sender_role === 'admin'
                              ? 'rgba(255,255,255,0.65)'
                              : 'var(--guander-muted)',
                        }}
                      >
                        {msg.sender_name}
                      </p>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                      <p
                        className="text-[10px] mt-1.5"
                        style={{
                          color:
                            msg.sender_role === 'admin'
                              ? 'rgba(255,255,255,0.5)'
                              : 'var(--guander-muted)',
                        }}
                      >
                        {timeAgo(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply area */}
              {selectedTicket.status !== 'closed' ? (
                <div
                  className="border-t px-4 py-3 shrink-0"
                  style={{ borderColor: 'var(--guander-border)' }}
                >
                  {sendError && <p className="text-xs text-red-600 mb-2">{sendError}</p>}
                  <textarea
                    className="w-full rounded-xl px-3 py-2.5 text-sm resize-none outline-none focus:ring-1"
                    style={{
                      border: '1px solid var(--guander-border)',
                      backgroundColor: 'var(--guander-cream)',
                      color: 'var(--guander-ink)',
                    }}
                    placeholder="Escribí tu respuesta... (Ctrl+Enter para enviar)"
                    rows={3}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        void handleSendReply(false);
                      }
                    }}
                    maxLength={2000}
                  />
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <button
                      onClick={() => void handleSendReply(true)}
                      disabled={sending || !reply.trim()}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-40"
                      style={{
                        border: '1px solid var(--guander-border)',
                        color: 'var(--guander-muted)',
                      }}
                    >
                      <CheckCircle size={13} />
                      Responder y cerrar
                    </button>
                    <button
                      onClick={() => void handleSendReply(false)}
                      disabled={sending || !reply.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition disabled:opacity-40"
                      style={{ backgroundColor: 'var(--guander-forest)' }}
                    >
                      <Send size={13} />
                      {sending ? 'Enviando...' : 'Responder'}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="border-t px-4 py-3 shrink-0 text-center"
                  style={{
                    borderColor: 'var(--guander-border)',
                    backgroundColor: 'var(--guander-cream)',
                  }}
                >
                  <p className="text-sm" style={{ color: 'var(--guander-muted)' }}>
                    Ticket cerrado.
                  </p>
                  <button
                    className="mt-1 text-xs font-semibold underline"
                    style={{ color: 'var(--guander-forest)' }}
                    onClick={() =>
                      setTickets((prev) =>
                        prev.map((t) =>
                          t.id_ticket === selectedId ? { ...t, status: 'open' } : t,
                        ),
                      )
                    }
                  >
                    Reabrir ticket
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div
              className="flex-1 rounded-2xl items-center justify-center hidden md:flex"
              style={{ border: '1px solid var(--guander-border)', backgroundColor: 'white' }}
            >
              <div className="text-center">
                <MessageSquare
                  size={48}
                  className="mx-auto mb-3"
                  style={{ color: 'var(--guander-muted)' }}
                />
                <p className="text-sm font-semibold" style={{ color: 'var(--guander-ink)' }}>
                  Seleccioná una conversación
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--guander-muted)' }}>
                  Elegí un ticket de la lista para ver y responder.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


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
