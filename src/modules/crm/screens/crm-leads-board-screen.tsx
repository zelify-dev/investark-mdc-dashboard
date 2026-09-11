"use client";

import { useMemo, useState } from "react";

import { CrmPageHeader } from "@/modules/crm/components/crm-page-header";
import { DOC_KIND_LABEL, LEAD_STATUS_LABEL, docCounts, formatDay, formatWhen, moneyMxn } from "@/modules/crm/data/kumaza-crm.seed";
import type { LeadStatus } from "@/modules/crm/data/kumaza-crm.types";
import { useCrmSession } from "@/modules/crm/lib/crm-session";

import "./crm-ops.css";

const FILTERS: { id: "all" | LeadStatus; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "nuevo", label: "Nuevos" },
  { id: "docs_pendiente", label: "Docs pendientes" },
  { id: "docs_completo", label: "Docs completos" },
  { id: "validando", label: "Validando" },
  { id: "precalificado", label: "Precalificados" },
  { id: "cerrado", label: "Cerrados" },
];

function statusTone(status: LeadStatus) {
  if (status === "precalificado" || status === "aprobado" || status === "cerrado") return "crm-badge crm-badge--ok";
  if (status === "rechazado") return "crm-badge crm-badge--bad";
  if (status === "validando" || status === "docs_pendiente") return "crm-badge crm-badge--warn";
  return "crm-badge crm-badge--info";
}

export function CrmLeadsBoardScreen() {
  const { leads } = useCrmSession();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(
    () => (filter === "all" ? leads : leads.filter((lead) => lead.status === filter)),
    [filter, leads],
  );
  const selected = leads.find((lead) => lead.id === openId) ?? null;

  return (
    <div className="crm-ops">
      <CrmPageHeader
        title="Leads"
        subtitle="Clientes que iniciaron por WhatsApp, con expediente, validación y precalificación."
      />

      <div className="crm-ops__chips">
        {FILTERS.map((item) => (
          <button key={item.id} type="button" className={filter === item.id ? "is-on" : ""} onClick={() => setFilter(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      <section className="crm-ops__card">
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Creado</th>
                <th>Última interacción</th>
                <th>Chat</th>
                <th>Expediente</th>
                <th>Documentos</th>
                <th>Validación</th>
                <th>Precalificación</th>
                <th>Capacidad</th>
                <th>Operador</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((lead) => {
                const counts = docCounts(lead);
                return (
                  <tr key={lead.id} onClick={() => setOpenId(lead.id)} style={{ cursor: "pointer" }}>
                    <td>
                      <strong>{lead.name}</strong>
                      <div style={{ color: "#64748b", fontSize: 12 }}>{lead.id}</div>
                    </td>
                    <td>{lead.phone}</td>
                    <td>{formatDay(lead.createdAt)}</td>
                    <td>{formatWhen(lead.lastAt)}</td>
                    <td>{lead.chatStatus}</td>
                    <td>
                      <span className={statusTone(lead.status)}>{LEAD_STATUS_LABEL[lead.status]}</span>
                    </td>
                    <td>
                      {counts.received}/{counts.total} rec. · {counts.pending} pend.
                    </td>
                    <td>{lead.validationNote}</td>
                    <td>{lead.prequalResult}</td>
                    <td>{lead.capacity != null ? moneyMxn(lead.capacity) : "—"}</td>
                    <td>{lead.operator}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {selected ? (
        <section className="crm-ops__card">
          <h2>
            Expediente {selected.name} · {selected.id}
          </h2>
          <p>
            {selected.phone} · {LEAD_STATUS_LABEL[selected.status]} · operador {selected.operator}
          </p>
          <table>
            <thead>
              <tr>
                <th>Documento</th>
                <th>Archivo</th>
                <th>Estado</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {selected.documents.map((doc) => (
                <tr key={doc.id}>
                  <td>{DOC_KIND_LABEL[doc.kind]}</td>
                  <td>{doc.fileName}</td>
                  <td>{doc.status}</td>
                  <td>
                    {doc.bank || doc.service || doc.note || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: 12 }}>
            Historial: {selected.messages.length} mensajes. Conversaciones cerradas conservan el expediente completo.
          </p>
        </section>
      ) : null}
    </div>
  );
}
