"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import {
  DEFAULT_FAQS,
  DEFAULT_LEADS,
  DEFAULT_ORG,
  DEFAULT_PROCESS,
  DEFAULT_TEMPLATES,
  detectBank,
  DOC_KIND_LABEL,
} from "@/modules/crm/data/kumaza-crm.seed";
import type {
  CrmFaq,
  CrmLead,
  CrmMessage,
  CrmOrgConfig,
  CrmProcessConfig,
  CrmTemplate,
  DocKind,
  DocStatus,
  LeadStatus,
} from "@/modules/crm/data/kumaza-crm.types";

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function deriveStatus(lead: CrmLead): LeadStatus {
  if (lead.status === "cerrado" || lead.status === "aprobado" || lead.status === "rechazado") return lead.status;
  if (lead.prequalResult === "aprobado") return "precalificado";
  if (lead.prequalResult === "rechazado") return "rechazado";
  const pending = lead.documents.some((item) => item.status === "pendiente" || item.status === "rechazado");
  const reviewing = lead.documents.some((item) => item.status === "revision");
  const allValid = lead.documents.every((item) => item.status === "validado");
  const allIn = lead.documents.every((item) => item.status === "recibido" || item.status === "revision" || item.status === "validado");
  if (allValid) return lead.status === "validando" ? "validando" : "docs_completo";
  if (reviewing) return "validando";
  if (allIn) return "docs_completo";
  if (!pending && lead.messages.length > 1) return "en_conversacion";
  if (lead.messages.some((item) => item.from === "in")) return lead.documents.some((item) => item.status !== "pendiente") ? "docs_pendiente" : "en_conversacion";
  return lead.status;
}

type CrmSession = {
  org: CrmOrgConfig;
  process: CrmProcessConfig;
  leads: CrmLead[];
  templates: CrmTemplate[];
  faqs: CrmFaq[];
  setOrg: (next: CrmOrgConfig) => void;
  setProcess: (next: CrmProcessConfig) => void;
  updateLead: (id: string, patch: Partial<CrmLead> | ((lead: CrmLead) => CrmLead)) => void;
  sendMessage: (leadId: string, message: Omit<CrmMessage, "id" | "at"> & { at?: string }) => void;
  requestDocument: (leadId: string, kind: DocKind) => void;
  receiveDocument: (leadId: string, kind: DocKind, fileName: string, extra?: { service?: CrmLead["documents"][number]["service"] }) => void;
  setDocumentStatus: (leadId: string, docId: string, status: DocStatus, note?: string) => void;
  prequalify: (leadId: string, result: "aprobado" | "rechazado", capacity: number) => void;
  closeLead: (leadId: string) => void;
  setTemplates: (next: CrmTemplate[]) => void;
  setFaqs: (next: CrmFaq[]) => void;
};

const CrmSessionContext = createContext<CrmSession | null>(null);

export function CrmSessionProvider({ children }: { children: ReactNode }) {
  const [org, setOrg] = useState(DEFAULT_ORG);
  const [process, setProcess] = useState(DEFAULT_PROCESS);
  const [leads, setLeads] = useState(DEFAULT_LEADS);
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [faqs, setFaqs] = useState(DEFAULT_FAQS);

  const updateLead: CrmSession["updateLead"] = (id, patch) => {
    setLeads((current) =>
      current.map((lead) => {
        if (lead.id !== id) return lead;
        const next = typeof patch === "function" ? patch(lead) : { ...lead, ...patch };
        return { ...next, status: deriveStatus(next) };
      }),
    );
  };

  const sendMessage: CrmSession["sendMessage"] = (leadId, message) => {
    const at = message.at ?? nowIso();
    updateLead(leadId, (lead) => ({
      ...lead,
      lastAt: at,
      lastMessage: message.text,
      unread: message.from === "in" ? lead.unread + 1 : 0,
      chatStatus: lead.chatStatus === "cerrada" ? "abierta" : lead.chatStatus,
      messages: [...lead.messages, { ...message, id: uid("msg"), at }],
    }));
  };

  const requestDocument: CrmSession["requestDocument"] = (leadId, kind) => {
    const template = templates.find((item) => item.id === (kind === "nomina" ? "tpl-nomina" : kind === "estado_cuenta" ? "tpl-bank" : "tpl-address"));
    sendMessage(leadId, { from: "out", kind: "doc_request", text: template?.body ?? `Envía tu ${DOC_KIND_LABEL[kind]}.` });
    updateLead(leadId, (lead) => ({
      ...lead,
      documents: lead.documents.map((doc) => (doc.kind === kind && doc.status === "pendiente" ? doc : doc)),
    }));
  };

  const receiveDocument: CrmSession["receiveDocument"] = (leadId, kind, fileName, extra) => {
    const at = nowIso();
    updateLead(leadId, (lead) => {
      const documents = lead.documents.map((doc) =>
        doc.kind === kind
          ? {
              ...doc,
              fileName,
              status: "recibido" as const,
              uploadedAt: at,
              bank: kind === "estado_cuenta" ? detectBank(fileName) : doc.bank,
              service: extra?.service ?? doc.service,
              note: undefined,
            }
          : doc,
      );
      const next: CrmLead = {
        ...lead,
        lastAt: at,
        lastMessage: `Documento recibido: ${fileName}`,
        unread: 0,
        documents,
        messages: [
          ...lead.messages,
          { id: uid("msg"), from: "in", kind: "doc", text: `Envié ${fileName}`, at },
        ],
      };
      return next;
    });
  };

  const setDocumentStatus: CrmSession["setDocumentStatus"] = (leadId, docId, status, note) => {
    updateLead(leadId, (lead) => ({
      ...lead,
      validationNote: note ?? lead.validationNote,
      documents: lead.documents.map((doc) => (doc.id === docId ? { ...doc, status, note } : doc)),
    }));
    if (status === "rechazado") {
      sendMessage(leadId, { from: "ai", kind: "template", text: process.rejectedDoc });
    }
  };

  const prequalify: CrmSession["prequalify"] = (leadId, result, capacity) => {
    const at = nowIso();
    updateLead(leadId, (lead) => ({
      ...lead,
      lastAt: at,
      lastMessage: result === "aprobado" ? `Precalificado. Capacidad ${capacity}.` : "Precalificación rechazada.",
      prequalResult: result,
      capacity: result === "aprobado" ? capacity : 0,
      status: result === "aprobado" ? "precalificado" : "rechazado",
      messages: [
        ...lead.messages,
        {
          id: uid("msg"),
          from: "ai",
          kind: "text",
          text:
            result === "aprobado"
              ? `Expediente validado. Capacidad/precalificación disponible: $${capacity.toLocaleString("es-MX")}.`
              : "El expediente se validó, pero no alcanzó capacidad de precalificación.",
          at,
        },
      ],
    }));
  };

  const closeLead: CrmSession["closeLead"] = (leadId) => {
    sendMessage(leadId, { from: "out", kind: "template", text: process.finish });
    updateLead(leadId, { chatStatus: "cerrada", status: "cerrado" });
  };

  const value = useMemo(
    () => ({
      org,
      process,
      leads,
      templates,
      faqs,
      setOrg,
      setProcess,
      updateLead,
      sendMessage,
      requestDocument,
      receiveDocument,
      setDocumentStatus,
      prequalify,
      closeLead,
      setTemplates,
      setFaqs,
    }),
    [faqs, leads, org, process, templates],
  );

  return <CrmSessionContext.Provider value={value}>{children}</CrmSessionContext.Provider>;
}

export function useCrmSession() {
  const ctx = useContext(CrmSessionContext);
  if (!ctx) throw new Error("useCrmSession must be used inside CrmSessionProvider");
  return ctx;
}
