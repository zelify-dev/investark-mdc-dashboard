"use client";

import { useMemo, useState } from "react";

import { AppButton } from "@/components/ui/atoms/button/app-button";
import { CrmPageHeader } from "@/modules/crm/components/crm-page-header";
import {
  CRM_LEADS,
  CRM_OWNERS,
  LEAD_SOURCE_LABEL,
  LEAD_STATUS_LABEL,
  type CrmLead,
  type CrmLeadSource,
  type CrmLeadStatus,
} from "@/modules/crm/data/crm.seed";

import "./crm-workspace.css";

function badgeTone(status: CrmLeadStatus) {
  if (status === "calificado") return "crm-badge crm-badge--ok";
  if (status === "nuevo") return "crm-badge crm-badge--info";
  if (status === "descartado") return "crm-badge crm-badge--bad";
  return "crm-badge crm-badge--warn";
}

export function CrmLeadsScreen() {
  const [leads, setLeads] = useState<CrmLead[]>(CRM_LEADS);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<CrmLeadSource | "all">("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    name: "",
    phone: "",
    email: "",
    interest: "Crédito personal",
    amount: "",
    source: "whatsapp" as CrmLeadSource,
    owner: CRM_OWNERS[0],
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesQuery = !q || `${lead.name} ${lead.email} ${lead.phone} ${lead.interest}`.toLowerCase().includes(q);
      const matchesSource = source === "all" || lead.source === source;
      return matchesQuery && matchesSource;
    });
  }, [leads, query, source]);

  const captureLead = () => {
    if (!draft.name.trim() || !draft.phone.trim()) {
      setNotice("Nombre y teléfono son obligatorios para capturar el lead.");
      return;
    }
    const next: CrmLead = {
      id: `LD-${1000 + leads.length + 8}`,
      name: draft.name.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim() || "sin-email@kumaza.mx",
      source: draft.source,
      status: "nuevo",
      owner: draft.owner,
      interest: draft.interest,
      amount: Number(draft.amount) || 0,
      createdAt: new Date().toISOString(),
      score: draft.source === "whatsapp" ? 68 : 54,
    };
    setLeads((current) => [next, ...current]);
    setDraft({ ...draft, name: "", phone: "", email: "", amount: "" });
    setNotice(`Prospecto ${next.id} capturado para ${next.interest}.`);
  };

  const qualify = (id: string) => {
    setLeads((current) =>
      current.map((lead) => (lead.id === id ? { ...lead, status: "calificado", score: Math.max(lead.score, 80) } : lead)),
    );
    setNotice(`Prospecto ${id} precalificado y listo para mesa de crédito.`);
  };

  return (
    <div className="crm-page">
      <CrmPageHeader
        title="Prospectos de crédito"
        subtitle="Captura precalificaciones desde WhatsApp, web, referidos y el motor MDC."
      />

      <section className="crm-card">
        <div className="crm-card__head">
          <div>
            <h2>Capturar prospecto</h2>
            <p>WhatsApp puntúa más alto por intención de originación.</p>
          </div>
        </div>
        <div className="crm-composer">
          <label>
            Nombre
            <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </label>
          <label>
            Teléfono
            <input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} placeholder="+52 …" />
          </label>
          <label>
            Email
            <input value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
          </label>
          <label>
            Producto
            <select value={draft.interest} onChange={(event) => setDraft({ ...draft, interest: event.target.value })}>
              <option>Crédito personal</option>
              <option>Crédito automotriz</option>
              <option>Crédito revolvente</option>
              <option>Arrendamiento financiero</option>
            </select>
          </label>
          <label>
            Monto solicitado
            <input
              value={draft.amount}
              onChange={(event) => setDraft({ ...draft, amount: event.target.value })}
              type="number"
              min={0}
              placeholder="85000"
            />
          </label>
          <label>
            Origen
            <select
              value={draft.source}
              onChange={(event) => setDraft({ ...draft, source: event.target.value as CrmLeadSource })}
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="web">Formulario web</option>
              <option value="referral">Referido</option>
              <option value="mdc">Réplica MDC</option>
            </select>
          </label>
          <label>
            Owner
            <select value={draft.owner} onChange={(event) => setDraft({ ...draft, owner: event.target.value })}>
              {CRM_OWNERS.map((owner) => (
                <option key={owner}>{owner}</option>
              ))}
            </select>
          </label>
          <div className="crm-composer__full crm-actions">
            <AppButton tone="primary" onClick={captureLead}>
              Guardar prospecto
            </AppButton>
          </div>
        </div>
        {notice ? <p className="crm-note">{notice}</p> : null}
      </section>

      <section className="crm-card">
        <div className="crm-card__head">
          <div>
            <h2>Inbox de prospectos</h2>
            <p>{filtered.length} registros visibles.</p>
          </div>
          <div className="crm-filters">
            <label>
              Buscar
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, teléfono o producto" />
            </label>
            <label>
              Origen
              <select value={source} onChange={(event) => setSource(event.target.value as CrmLeadSource | "all")}>
                <option value="all">Todos</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="web">Web</option>
                <option value="referral">Referido</option>
                <option value="mdc">MDC</option>
              </select>
            </label>
          </div>
        </div>
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Prospecto</th>
                <th>Contacto</th>
                <th>Origen</th>
                <th>Producto</th>
                <th>Monto</th>
                <th>Score</th>
                <th>Estado</th>
                <th>Owner</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    {lead.name}
                    <div style={{ color: "#64748b", fontSize: 12 }}>{lead.id}</div>
                  </td>
                  <td>
                    {lead.phone}
                    <div style={{ color: "#64748b", fontSize: 12 }}>{lead.email}</div>
                  </td>
                  <td>
                    <span className={lead.source === "whatsapp" ? "crm-badge crm-badge--wa" : "crm-badge"}>
                      {LEAD_SOURCE_LABEL[lead.source]}
                    </span>
                  </td>
                  <td>{lead.interest}</td>
                  <td>{lead.amount ? `$${lead.amount.toLocaleString("es-MX")}` : "—"}</td>
                  <td>{lead.score}</td>
                  <td>
                    <span className={badgeTone(lead.status)}>{LEAD_STATUS_LABEL[lead.status]}</span>
                  </td>
                  <td>{lead.owner}</td>
                  <td>
                    {lead.status !== "calificado" && lead.status !== "descartado" ? (
                      <AppButton onClick={() => qualify(lead.id)}>Precalificar</AppButton>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
