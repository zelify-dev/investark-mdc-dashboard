"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AppButton } from "@/components/ui/atoms/button/app-button";
import { CrmPageHeader } from "@/modules/crm/components/crm-page-header";
import {
  INTENT_LABEL,
  WHATSAPP_API,
  WHATSAPP_THREADS,
  formatWhen,
  moneyMxn,
  type WhatsappIntent,
  type WhatsappMessage,
  type WhatsappThread,
} from "@/modules/crm/data/crm.seed";

import "./crm-workspace.css";

type InboxFilter = "all" | WhatsappIntent | "unread";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function lastInbound(thread: WhatsappThread) {
  return [...thread.messages].reverse().find((message) => message.from === "in")?.text ?? thread.lastMessage;
}

function buildAiReply(thread: WhatsappThread) {
  const question = lastInbound(thread).toLowerCase();
  const product = thread.product.toLowerCase();

  if (thread.intent === "cobranza" || /pagu|atras|mora|oxxo|spei|reflej/.test(question)) {
    if (/ya pagu|pagu[eé]|oxxo|spei|reflej/.test(question)) {
      return `Hola ${thread.name.split(" ")[0]}, si pagaste en OXXO o SPEI puede tardar hasta 24 horas en reflejarse. En cuanto entre, tu atraso se limpia y no reportamos a buró. Te aviso aquí mismo.`;
    }
    if (/solo intereses|mínimo|minimo/.test(question)) {
      return `Sí puedes cubrir el pago mínimo o intereses de ${thread.amountDue ? moneyMxn(thread.amountDue) : "tu línea"} para no romper el convenio. El capital pendiente se recorre al siguiente corte.`;
    }
    const days = thread.overdueDays ?? 0;
    const due = thread.amountDue ? moneyMxn(thread.amountDue) : "tu saldo";
    return `Hola ${thread.name.split(" ")[0]}, tu ${product} tiene ${due} ${days > 0 ? `con ${days} día(s) de atraso` : `con vencimiento ${thread.dueDate ?? "próximo"}`}. Paga hoy por SPEI CLABE 646180100012345678 o el enlace Kumaza Pay. Si ya liquidaste, mándame el comprobante.`;
  }

  if (/monto máximo|maximo|cuánto me|cuanto me|preaprob/.test(question)) {
    return `Para ${thread.product}, el rango preaprobado va de $60,000 a $120,000 según score e ingresos. Con tu perfil actual te puedo dejar una precalificación de $90,000 a 18 meses. ¿Lo pasamos a MDC?`;
  }
  if (/tasa|iva|cat|interés|interes/.test(question)) {
    return `La tasa de ${thread.product} es fija. El 18.4% anual es sin IVA; el CAT estimado es 22.1%. En la oferta MDC te llega el desglose de comisión y seguro.`;
  }
  if (/ine|comprobante|documento|estados de cuenta/.test(question)) {
    return `Para continuar: INE vigente, comprobante de domicilio menor a 3 meses y, si es persona moral, estados de cuenta. Con eso el motor MDC puede resolver en minutos.`;
  }
  if (/enganche/.test(question)) {
    return `En automotriz el enganche mínimo es 20%. Sobre $320,000 serían $64,000 y el resto a 48 meses. ¿Quieres que te arme la tabla de amortización?`;
  }
  if (/buró|buro|atraso 3/.test(question)) {
    return `Un atraso de 1 a 3 días no se reporta si regularizas antes del corte. A partir del día 4 sí puede marcarse. Te conviene pagar el viernes y avisar aquí.`;
  }
  if (/mensualidad|reestruct|bajar/.test(question)) {
    return `Sí se puede evaluar reestructura: alargar plazo y bajar mensualidad, sujeto a que no haya mora mayor a 15 días. ¿Quieres que lo mande a análisis MDC?`;
  }
  if (/desembolso/.test(question)) {
    return `El desembolso queda agendado. El lunes se libera a la CLABE registrada. Te mando comprobante en cuanto el banco lo confirme.`;
  }

  return `Hola ${thread.name.split(" ")[0]}, soy Kumaza IA. Puedo resolver dudas de monto, tasa, documentos o mandarte un recordatorio de cobranza. ¿Qué necesitas?`;
}

function buildCollectionReminder(thread: WhatsappThread) {
  const first = thread.name.split(" ")[0];
  const due = thread.amountDue ? moneyMxn(thread.amountDue) : "tu pago";
  const days = thread.overdueDays ?? 0;
  if (days >= 8) {
    return `${first}, tu crédito Kumaza lleva ${days} días de atraso. Saldo ${due}. Regularízalo hoy para evitar cobranza extrajudicial y reporte a buró. Paga en Kumaza Pay o SPEI.`;
  }
  if (days > 0) {
    return `${first}, recordatorio de cobranza: ${due} vencido desde el ${thread.dueDate ?? "corte"}. Tienes ${days} día(s) de atraso. Paga hoy y te confirmo en este chat.`;
  }
  return `${first}, tu próximo pago de ${due} vence el ${thread.dueDate ?? "próximo corte"}. Te dejo el recordatorio para que no se pase.`;
}

function appendMessage(thread: WhatsappThread, message: WhatsappMessage): WhatsappThread {
  return {
    ...thread,
    lastMessage: message.text,
    lastAt: message.at,
    unread: message.from === "in" ? thread.unread : 0,
    messages: [...thread.messages, message],
  };
}

export function CrmWhatsappScreen() {
  const [threads, setThreads] = useState<WhatsappThread[]>(WHATSAPP_THREADS);
  const [activeId, setActiveId] = useState(WHATSAPP_THREADS[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return threads
      .filter((thread) => {
        if (filter === "unread") return thread.unread > 0;
        if (filter !== "all") return thread.intent === filter;
        return true;
      })
      .filter((thread) => {
        if (!q) return true;
        return `${thread.name} ${thread.phone} ${thread.product} ${thread.lastMessage}`.toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
  }, [filter, query, threads]);

  const active = useMemo(
    () => threads.find((thread) => thread.id === activeId) ?? filtered[0] ?? threads[0],
    [activeId, filtered, threads],
  );

  const unreadCount = threads.filter((thread) => thread.unread > 0).length;
  const collectionCount = threads.filter((thread) => thread.intent === "cobranza").length;
  const questionCount = threads.filter((thread) => thread.intent === "duda").length;

  useEffect(() => {
    const node = bodyRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [active?.id, active?.messages.length]);

  const pushToActive = (message: WhatsappMessage, extra?: Partial<WhatsappThread>) => {
    if (!active) return;
    setThreads((current) =>
      current.map((thread) => (thread.id === active.id ? { ...appendMessage(thread, message), ...extra } : thread)),
    );
  };

  const send = (text = draft) => {
    const value = text.trim();
    if (!active || !value) return;
    pushToActive({ from: "out", text: value, at: new Date().toISOString() });
    setDraft("");
    setNotice("Mensaje enviado por WhatsApp Cloud API.");
  };

  const runAi = (mode: "reply" | "reminder") => {
    if (!active || aiBusy) return;
    setAiBusy(true);
    const text = mode === "reminder" ? buildCollectionReminder(active) : buildAiReply(active);
    window.setTimeout(() => {
      pushToActive({ from: "ai", text, at: new Date().toISOString() });
      setAiBusy(false);
      setNotice(
        mode === "reminder"
          ? `Recordatorio de cobranza enviado a ${active.name}.`
          : `Kumaza IA resolvió la duda de ${active.name}.`,
      );
    }, 450);
  };

  const sendCollectionSweep = () => {
    const now = new Date().toISOString();
    setThreads((current) =>
      current.map((thread) => {
        if (thread.intent !== "cobranza") return thread;
        return appendMessage(thread, {
          from: "ai",
          text: buildCollectionReminder(thread),
          at: now,
        });
      }),
    );
    setNotice(`IA envió recordatorios de cobranza a ${collectionCount} acreditados.`);
  };

  return (
    <div className="crm-page">
      <CrmPageHeader
        title="WhatsApp crédito"
        subtitle="Bandeja con más acreditados, Kumaza IA para dudas y recordatorios automáticos de cobranza."
      />

      <div className="crm-kpis">
        <article className="crm-kpi">
          <span>Chats activos</span>
          <strong>{threads.length}</strong>
          <small>{unreadCount} sin leer</small>
        </article>
        <article className="crm-kpi">
          <span>Dudas abiertas</span>
          <strong>{questionCount}</strong>
          <small>IA lista para resolver</small>
        </article>
        <article className="crm-kpi">
          <span>Cobranza</span>
          <strong>{collectionCount}</strong>
          <small>Recordatorios pendientes</small>
        </article>
        <article className="crm-kpi">
          <span>Canal</span>
          <strong>Cloud API</strong>
          <small>{WHATSAPP_API.phone}</small>
        </article>
      </div>

      <div className="crm-wa crm-wa--inbox">
        <aside className="crm-wa-list" aria-label="Conversaciones WhatsApp">
          <div className="crm-wa-list__tools">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar acreditado, producto o duda"
            />
            <div className="crm-wa-chips">
              {(
                [
                  ["all", "Todos"],
                  ["unread", "No leídos"],
                  ["duda", "Dudas"],
                  ["cobranza", "Cobranza"],
                  ["documentos", "Docs"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={filter === value ? "is-on" : ""}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="crm-wa-list__scroll">
            {filtered.map((thread) => (
              <button
                key={thread.id}
                type="button"
                className={thread.id === active?.id ? "is-active" : ""}
                onClick={() => {
                  setActiveId(thread.id);
                  setThreads((current) =>
                    current.map((item) => (item.id === thread.id ? { ...item, unread: 0 } : item)),
                  );
                }}
              >
                <span className={`crm-wa-avatar crm-wa-avatar--${thread.intent}`}>{initials(thread.name)}</span>
                <span className="crm-wa-list__copy">
                  <strong>
                    {thread.name}
                    {thread.unread ? <em>{thread.unread}</em> : null}
                  </strong>
                  <span>{thread.lastMessage}</span>
                  <small>
                    {INTENT_LABEL[thread.intent]} · {thread.product} · {formatWhen(thread.lastAt)}
                  </small>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="crm-wa-thread">
          {active ? (
            <>
              <div className="crm-wa-thread__head">
                <div>
                  <h3>{active.name}</h3>
                  <p className="zelify-accounting-page-header__meta">
                    {active.phone} · {active.city} · {active.product}
                    {active.amountDue ? ` · saldo ${moneyMxn(active.amountDue)}` : ""}
                    {active.overdueDays ? ` · ${active.overdueDays}d atraso` : ""}
                  </p>
                </div>
                <span className={`crm-badge ${active.intent === "cobranza" ? "crm-badge--bad" : "crm-badge--info"}`}>
                  {INTENT_LABEL[active.intent]}
                </span>
              </div>
              <div className="crm-wa-thread__body" ref={bodyRef}>
                {active.messages.map((message, index) => (
                  <div key={`${active.id}-${index}`} className={`crm-bubble crm-bubble--${message.from}`}>
                    {message.from === "ai" ? <small>Kumaza IA</small> : null}
                    {message.text}
                    <time>{formatWhen(message.at)}</time>
                  </div>
                ))}
              </div>
              <div className="crm-wa-suggest">
                <button type="button" onClick={() => setDraft(buildAiReply(active))}>
                  Usar respuesta IA
                </button>
                <button type="button" onClick={() => setDraft(buildCollectionReminder(active))}>
                  Armar recordatorio
                </button>
              </div>
              <div className="crm-wa-thread__composer">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") send();
                  }}
                  placeholder="Escribe o deja que la IA responda…"
                />
                <AppButton tone="primary" onClick={() => send()}>
                  Enviar
                </AppButton>
              </div>
            </>
          ) : null}
        </section>

        <aside className="crm-wa-api">
          <header>
            <h3>Kumaza IA</h3>
            <p className="zelify-accounting-page-header__meta">Resuelve dudas de crédito y dispara cobranza.</p>
          </header>
          <dl>
            <div>
              <dt>Sugerencia</dt>
              <dd>{active ? buildAiReply(active) : "—"}</dd>
            </div>
            {active?.amountDue ? (
              <div>
                <dt>Saldo / atraso</dt>
                <dd>
                  {moneyMxn(active.amountDue)}
                  {active.overdueDays ? ` · ${active.overdueDays} días` : ""}
                </dd>
              </div>
            ) : null}
            <div>
              <dt>Plantillas</dt>
              <dd>
                {WHATSAPP_API.templates.map((template) => (
                  <div key={template.name}>
                    {template.name} · {template.status}
                  </div>
                ))}
              </dd>
            </div>
          </dl>
          <div className="crm-actions" style={{ padding: "0 16px" }}>
            <AppButton tone="primary" disabled={aiBusy} onClick={() => runAi("reply")}>
              {aiBusy ? "IA escribiendo…" : "Resolver duda con IA"}
            </AppButton>
            <AppButton disabled={aiBusy} onClick={() => runAi("reminder")}>
              Recordatorio de cobranza
            </AppButton>
            <AppButton onClick={sendCollectionSweep}>Cobranza masiva IA</AppButton>
          </div>
          {notice ? (
            <p className="crm-note" style={{ padding: "12px 16px 0" }}>
              {notice}
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
