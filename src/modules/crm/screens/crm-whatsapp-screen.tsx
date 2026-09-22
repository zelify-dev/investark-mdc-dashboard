"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCheck, Paperclip, Search, Send, Smile, UserPlus } from "lucide-react";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { getStoredUser } from "@/lib/auth-api";
import { CrmProspectPanel } from "@/modules/crm/components/crm-prospect-panel";
import {
  fetchWapiChannel,
  fetchWapiConversations,
  fetchWapiHistory,
  markWapiConversationRead,
  mediaDownloadUrl,
  normalizePhone,
  replyWapiConversation,
  simulateWapiInbound,
  type WapiMessage,
} from "@/modules/crm/services/wapi-client";
import "@/components/ui/templates/workspace-page.css";
import "./crm-whatsapp-screen.css";

function initials(name: string | null, phone: string) {
  const source = (name || phone).trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function formatClock(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function formatDay(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return formatClock(value);
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

function StatusTicks({ status }: { status: WapiMessage["status"] }) {
  if (status === "read") return <CheckCheck size={14} className="crm-wa__ticks crm-wa__ticks--read" />;
  if (status === "delivered") return <CheckCheck size={14} className="crm-wa__ticks" />;
  if (status === "failed") return <span className="crm-wa__ticks crm-wa__ticks--fail">!</span>;
  return <Check size={14} className="crm-wa__ticks" />;
}

export function CrmWhatsappScreen() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [activePhone, setActivePhone] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [simulateOpen, setSimulateOpen] = useState(false);
  const [simulateFrom, setSimulateFrom] = useState("");
  const [simulateName, setSimulateName] = useState("");
  const [simulateText, setSimulateText] = useState("Hola, quiero información de mi crédito");
  const threadRef = useRef<HTMLDivElement>(null);
  const agentId = getStoredUser()?.id || "crm-operator";

  const channelQuery = useQuery({
    queryKey: ["wapi-channel"],
    queryFn: fetchWapiChannel,
    staleTime: 60_000,
  });

  const inboxQuery = useQuery({
    queryKey: ["wapi-conversations", query],
    queryFn: () => fetchWapiConversations(query),
    refetchInterval: 4000,
  });

  const conversations = inboxQuery.data?.items ?? [];
  const active = useMemo(
    () => conversations.find((item) => item.phone === activePhone) || null,
    [conversations, activePhone],
  );

  const historyQuery = useQuery({
    queryKey: ["wapi-history", activePhone],
    queryFn: () => fetchWapiHistory(activePhone as string),
    enabled: Boolean(activePhone),
    refetchInterval: activePhone ? 3000 : false,
  });

  const messages = useMemo(() => {
    const items = [...(historyQuery.data?.items ?? [])];
    return items.sort((a, b) => new Date(a.occurredAt || 0).getTime() - new Date(b.occurredAt || 0).getTime());
  }, [historyQuery.data]);

  useEffect(() => {
    if (!activePhone && conversations[0]) setActivePhone(conversations[0].phone);
  }, [activePhone, conversations]);

  useEffect(() => {
    const node = threadRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages.length, activePhone]);

  useEffect(() => {
    if (!activePhone) return;
    void markWapiConversationRead(activePhone, agentId).then(() => {
      void queryClient.invalidateQueries({ queryKey: ["wapi-conversations"] });
    });
  }, [activePhone, agentId, queryClient]);

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!activePhone) throw new Error("Selecciona una conversación.");
      return replyWapiConversation(activePhone, text, agentId);
    },
    onSuccess: () => {
      setDraft("");
      void queryClient.invalidateQueries({ queryKey: ["wapi-history", activePhone] });
      void queryClient.invalidateQueries({ queryKey: ["wapi-conversations"] });
    },
  });

  const simulateMutation = useMutation({
    mutationFn: () =>
      simulateWapiInbound({
        from: simulateFrom,
        contact_name: simulateName || undefined,
        text: simulateText,
      }),
    onSuccess: async () => {
      const phone = normalizePhone(simulateFrom);
      setSimulateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["wapi-conversations"] });
      setActivePhone(phone);
    },
  });

  const onSend = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sendMutation.isPending) return;
    sendMutation.mutate(text);
  };

  const channelName =
    channelQuery.data?.displayName ||
    channelQuery.data?.verifiedName ||
    channelQuery.data?.verified_name ||
    "Sandbox Public";
  const channelPhone = channelQuery.data?.displayPhone || channelQuery.data?.display_phone_number || "15550001111";

  return (
    <div className="zelify-workspace-page crm-workspace">
      <ZelifyTopNavbar activeNavId="crm" />
      <div className="zelify-workspace-page__scroll crm-workspace__body">
        <div className="crm-wa">
          <aside className="crm-wa__inbox">
            <header className="crm-wa__inbox-head">
              <div>
                <p>CRM</p>
                <h2>WhatsApp</h2>
                <small>
                  {channelName} · {channelPhone}
                </small>
              </div>
              <button
                type="button"
                className="crm-btn crm-btn--ghost crm-btn--sm"
                onClick={() => setSimulateOpen((open) => !open)}
              >
                <UserPlus size={15} />
                {simulateOpen ? "Cerrar" : "Inbound"}
              </button>
            </header>
            {simulateOpen ? (
              <form
                className="crm-wa__simulate"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (normalizePhone(simulateFrom)) simulateMutation.mutate();
                }}
              >
                <input value={simulateFrom} onChange={(e) => setSimulateFrom(e.target.value)} placeholder="Teléfono 593998592724" />
                <input value={simulateName} onChange={(e) => setSimulateName(e.target.value)} placeholder="Nombre" />
                <input value={simulateText} onChange={(e) => setSimulateText(e.target.value)} placeholder="Mensaje del cliente" />
                <button type="submit" className="crm-btn crm-btn--primary" disabled={simulateMutation.isPending}>
                  {simulateMutation.isPending ? "Simulando…" : "Simular cliente"}
                </button>
              </form>
            ) : null}
            <label className="crm-wa__search">
              <Search size={15} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar o empezar un chat" />
            </label>
            <div className="crm-wa__scroll crm-wa__people">
              {inboxQuery.isLoading ? <p className="crm-wa__muted">Cargando conversaciones…</p> : null}
              {inboxQuery.isError ? (
                <p className="crm-wa__warn">
                  {inboxQuery.error instanceof Error ? inboxQuery.error.message : "No se pudo leer el inbox."}
                </p>
              ) : null}
              {conversations.map((item) => (
                <button
                  key={item.id || item.phone}
                  type="button"
                  className={`crm-wa__person${item.phone === activePhone ? " is-active" : ""}`}
                  onClick={() => setActivePhone(item.phone)}
                >
                  <span className="crm-wa__avatar">{initials(item.contactName, item.phone)}</span>
                  <span className="crm-wa__person-body">
                    <strong>{item.contactName || item.phone}</strong>
                    <em>{item.lastMessage || "Sin mensajes"}</em>
                  </span>
                  <span className="crm-wa__person-meta">
                    <time>{formatDay(item.lastMessageAt)}</time>
                    {item.unreadCount > 0 ? <b>{item.unreadCount}</b> : null}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="crm-wa__chat">
            {active ? (
              <>
                <header className="crm-wa__chat-head">
                  <span className="crm-wa__avatar">{initials(active.contactName, active.phone)}</span>
                  <div>
                    <strong>{active.contactName || active.phone}</strong>
                    <small>{active.phone}</small>
                  </div>
                </header>
                <div className="crm-wa__scroll crm-wa__thread" ref={threadRef}>
                  {messages.map((message) => (
                    <article
                      key={message.id}
                      className={`crm-wa__bubble crm-wa__bubble--${message.direction === "outbound" ? "out" : "in"}`}
                    >
                      <MessageBody message={message} />
                      <footer>
                        <time>{formatClock(message.occurredAt)}</time>
                        {message.direction === "outbound" ? <StatusTicks status={message.status} /> : null}
                      </footer>
                    </article>
                  ))}
                  {historyQuery.isLoading && messages.length === 0 ? <p className="crm-wa__muted">Cargando mensajes…</p> : null}
                </div>
                <form className="crm-wa__composer" onSubmit={onSend}>
                  <button type="button" className="crm-btn crm-btn--icon" aria-label="Emoji" disabled>
                    <Smile size={20} />
                  </button>
                  <button type="button" className="crm-btn crm-btn--icon" aria-label="Adjuntar" disabled>
                    <Paperclip size={20} />
                  </button>
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Escribe un mensaje"
                    maxLength={4096}
                  />
                  <button
                    type="submit"
                    className="crm-btn crm-btn--send"
                    disabled={!draft.trim() || sendMutation.isPending}
                    aria-label="Enviar"
                  >
                    <Send size={18} />
                  </button>
                </form>
                {sendMutation.isError ? (
                  <p className="crm-wa__warn">
                    {sendMutation.error instanceof Error ? sendMutation.error.message : "No se pudo enviar."}
                  </p>
                ) : null}
              </>
            ) : (
              <div className="crm-wa__empty">
                <h3>WhatsApp Business</h3>
                <p>Elige un usuario a la izquierda para hablar one to one y llenar su ficha a la derecha.</p>
              </div>
            )}
          </section>

          {active ? (
            <CrmProspectPanel phone={active.phone} contactName={active.contactName} />
          ) : (
            <aside className="crm-wa__prospect crm-wa__prospect--idle">
              <p>Selecciona un chat para abrir la ficha.</p>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBody({ message }: { message: WapiMessage }) {
  if (message.type === "image" && (message.mediaId || message.mediaLink)) {
    const src = message.mediaLink || (message.mediaId ? mediaDownloadUrl(message.mediaId) : "");
    return (
      <>
        {src ? <img src={src} alt={message.caption || "Imagen"} /> : null}
        {message.caption || message.text ? <p>{message.caption || message.text}</p> : null}
      </>
    );
  }
  if (message.type === "document") {
    return <p>{message.filename || message.caption || message.text || "Documento"}</p>;
  }
  return <p>{message.text || message.caption || message.templateName || message.type}</p>;
}
