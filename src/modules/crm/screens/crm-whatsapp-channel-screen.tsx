"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AppButton } from "@/components/ui/atoms/button/app-button";
import { DOC_KIND_LABEL, LEAD_STATUS_LABEL, formatWhen } from "@/modules/crm/data/kumaza-crm.seed";
import type { ChatStatus, DocKind, DocStatus, LeadStatus } from "@/modules/crm/data/kumaza-crm.types";
import { useCrmSession } from "@/modules/crm/lib/crm-session";

import "./crm-whatsapp-channel.css";

const PROCESS_STEPS = ["Identificación", "Documentos", "Validación", "Expediente", "Precalificación", "Resultado"] as const;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function badgeClass(status: DocStatus) {
  if (status === "validado" || status === "recibido") return "wa-badge wa-badge--ok";
  if (status === "revision") return "wa-badge wa-badge--warn";
  if (status === "rechazado") return "wa-badge wa-badge--bad";
  return "wa-badge";
}

function stepIndex(status: LeadStatus) {
  if (status === "nuevo") return 0;
  if (status === "en_conversacion") return 1;
  if (status === "docs_pendiente") return 1;
  if (status === "docs_completo") return 2;
  if (status === "validando") return 2;
  if (status === "precalificado" || status === "aprobado") return 5;
  if (status === "rechazado" || status === "cerrado") return 5;
  return 1;
}

function alaizaReply(text: string, leadName: string) {
  const q = text.toLowerCase();
  if (/documento|nómina|nomina|estado|comprobante|ine/.test(q)) {
    return `${leadName.split(" ")[0]}, para el expediente pedimos nómina (una o varias), estado de cuenta de un banco de México y comprobante de domicilio: agua, luz, internet o teléfono. El INE no sustituye esos tres.`;
  }
  if (/estado|expediente|falta/.test(q)) {
    return "Puedo decirte qué documentos están recibidos, pendientes o en revisión desde el panel derecho. Si quieres, te pido ahora el que falte.";
  }
  if (/banco|bbva|santander/.test(q)) {
    return "Aceptamos estados de cuenta de Banorte, BBVA, Santander, Citibanamex, HSBC, Azteca y otros bancos de México. El sistema intenta identificar el banco por el archivo.";
  }
  return `Hola ${leadName.split(" ")[0]}, soy Alaiza. Te guío en la carga de documentos y el estado del expediente. Si la duda es de crédito o un caso especial, paso con un operador.`;
}

export function CrmWhatsappChannelScreen() {
  const { leads, process, templates, sendMessage, requestDocument, receiveDocument, setDocumentStatus, prequalify, closeLead, updateLead } =
    useCrmSession();
  const [activeId, setActiveId] = useState(leads[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | ChatStatus | "docs">("all");
  const [draft, setDraft] = useState("");
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads
      .filter((lead) => {
        if (filter === "docs") return lead.status === "docs_pendiente" || lead.status === "docs_completo";
        if (filter !== "all") return lead.chatStatus === filter;
        return true;
      })
      .filter((lead) => !q || `${lead.name} ${lead.phone} ${lead.lastMessage}`.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
  }, [filter, leads, query]);

  const active = leads.find((lead) => lead.id === activeId) ?? visible[0] ?? leads[0];

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [active?.id, active?.messages.length]);

  if (!active) return null;

  const currentStep = stepIndex(active.status);

  const send = (text = draft, kind: "text" | "template" = "text") => {
    const value = text.trim();
    if (!value) return;
    sendMessage(active.id, { from: "out", kind, text: value });
    setDraft("");
  };

  const askAlaiza = () => {
    const question = lastInbound();
    sendMessage(active.id, { from: "ai", kind: "text", text: alaizaReply(question, active.name) });
    if (/asesor|humano|operador|gerente/.test(question.toLowerCase())) {
      updateLead(active.id, { needsHuman: true });
    }
  };

  const lastInbound = () => [...active.messages].reverse().find((item) => item.from === "in")?.text ?? active.lastMessage;

  const simulateUpload = (kind: DocKind) => {
    const names: Record<DocKind, string> = {
      nomina: `nomina-${active.id.toLowerCase()}.pdf`,
      estado_cuenta: `bbva-${active.id.toLowerCase()}.pdf`,
      comprobante_domicilio: `cfe-${active.id.toLowerCase()}.pdf`,
    };
    receiveDocument(active.id, kind, names[kind], { service: kind === "comprobante_domicilio" ? "luz" : undefined });
  };

  return (
    <div className="wa-app">
      <aside className="wa-list">
        <div className="wa-list__head">
          <h2>Canal de WhatsApp</h2>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar chat o teléfono" />
        </div>
        <div className="wa-list__filters">
          {(
            [
              ["all", "Todas"],
              ["abierta", "Abiertas"],
              ["pendiente", "Pendientes"],
              ["docs", "Documentos"],
              ["cerrada", "Cerradas"],
            ] as const
          ).map(([value, label]) => (
            <button key={value} type="button" className={filter === value ? "is-on" : ""} onClick={() => setFilter(value)}>
              {label}
            </button>
          ))}
        </div>
        <div className="wa-list__scroll">
          {visible.map((lead) => (
            <button
              key={lead.id}
              type="button"
              className={`wa-row${lead.id === active.id ? " is-active" : ""}`}
              onClick={() => {
                setActiveId(lead.id);
                updateLead(lead.id, { unread: 0 });
              }}
            >
              <span className="wa-avatar">{initials(lead.name)}</span>
              <span className="wa-row__copy">
                <strong>
                  {lead.name}
                  {lead.unread ? <em className="wa-unread">{lead.unread}</em> : <small>{formatWhen(lead.lastAt)}</small>}
                </strong>
                <span>{lead.lastMessage}</span>
                <small>
                  {LEAD_STATUS_LABEL[lead.status]} · {lead.phone}
                </small>
              </span>
            </button>
          ))}
        </div>
      </aside>

      <section className="wa-chat">
        <div className="wa-chat__head">
          <div>
            <h3>{active.name}</h3>
            <p>
              {active.phone} · {active.city} · {LEAD_STATUS_LABEL[active.status]}
              {active.needsHuman ? " · Requiere operador" : ""}
            </p>
          </div>
          <span className={`wa-badge ${active.chatStatus === "cerrada" ? "" : "wa-badge--ok"}`}>{active.chatStatus}</span>
        </div>
        <div className="wa-chat__body" ref={bodyRef}>
          {active.messages.map((message) => (
            <div key={message.id} className={`wa-bubble wa-bubble--${message.from}`}>
              {message.from === "ai" ? <small>Alaiza</small> : null}
              {message.kind === "doc" ? <small>Documento</small> : null}
              {message.text}
              <time>{formatWhen(message.at)}</time>
            </div>
          ))}
        </div>
        <div className="wa-quick" style={{ background: "#f0f2f5", paddingTop: 8 }}>
          {templates
            .filter((item) => item.active)
            .slice(0, 6)
            .map((item) => (
              <button key={item.id} type="button" onClick={() => send(item.body, "template")}>
                {item.name}
              </button>
            ))}
          <button type="button" onClick={askAlaiza}>
            Alaiza responde
          </button>
        </div>
        <div className="wa-chat__composer">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") send();
            }}
            placeholder="Escribe un mensaje"
          />
          <AppButton tone="primary" onClick={() => send()}>
            Enviar
          </AppButton>
        </div>
      </section>

      <aside className="wa-file">
        <header>
          <h3>Expediente</h3>
          <p>
            {active.id} · {active.operator}
            {active.capacity ? ` · capacidad $${active.capacity.toLocaleString("es-MX")}` : ""}
          </p>
        </header>
        <div className="wa-steps">
          {PROCESS_STEPS.map((label, index) => (
            <span key={label} className={index <= currentStep ? "is-on" : ""}>
              {label}
            </span>
          ))}
        </div>
        <div className="wa-docs">
          <p style={{ margin: 0, fontSize: 12, color: "#667781" }}>{process.requestDocs}</p>
          {active.documents.map((doc) => (
            <article key={doc.id} className="wa-doc">
              <strong>{DOC_KIND_LABEL[doc.kind]}</strong>
              <small>
                {doc.fileName}
                {doc.bank ? ` · ${doc.bank}` : ""}
                {doc.service ? ` · ${doc.service}` : ""}
              </small>
              <div style={{ marginTop: 6 }}>
                <span className={badgeClass(doc.status)}>{doc.status}</span>
              </div>
              {doc.note ? <small>{doc.note}</small> : null}
              <div className="wa-doc__actions">
                <button type="button" onClick={() => requestDocument(active.id, doc.kind)}>
                  Solicitar
                </button>
                <button type="button" onClick={() => simulateUpload(doc.kind)}>
                  Simular carga
                </button>
                <button type="button" onClick={() => setDocumentStatus(active.id, doc.id, "revision", "En revisión de tipo de documento.")}>
                  Revisar
                </button>
                <button type="button" onClick={() => setDocumentStatus(active.id, doc.id, "validado", "Tipo de documento correcto.")}>
                  Validar
                </button>
                <button
                  type="button"
                  onClick={() => setDocumentStatus(active.id, doc.id, "rechazado", "El archivo no corresponde al tipo solicitado.")}
                >
                  Rechazar
                </button>
              </div>
            </article>
          ))}
        </div>
        <div className="wa-quick">
          <AppButton tone="primary" onClick={() => sendMessage(active.id, { from: "ai", kind: "template", text: process.completeFile })}>
            Expediente completo
          </AppButton>
          <AppButton onClick={() => prequalify(active.id, "aprobado", 120000)}>Precalificar</AppButton>
          <AppButton onClick={() => prequalify(active.id, "rechazado", 0)}>Rechazar precalificación</AppButton>
          <AppButton onClick={() => closeLead(active.id)}>Cerrar conversación</AppButton>
        </div>
      </aside>
    </div>
  );
}
