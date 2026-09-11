"use client";

import { useState } from "react";

import { AppButton } from "@/components/ui/atoms/button/app-button";
import { CrmPageHeader } from "@/modules/crm/components/crm-page-header";
import { CRM_CAMPAIGNS, type CrmCampaign } from "@/modules/crm/data/crm.seed";

import "./crm-workspace.css";

function statusTone(status: CrmCampaign["status"]) {
  if (status === "activa") return "crm-badge crm-badge--ok";
  if (status === "pausada") return "crm-badge crm-badge--warn";
  if (status === "finalizada") return "crm-badge";
  return "crm-badge crm-badge--info";
}

export function CrmCampaignsScreen() {
  const [campaigns, setCampaigns] = useState(CRM_CAMPAIGNS);
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    name: "",
    channel: "whatsapp" as CrmCampaign["channel"],
    audience: "150",
  });

  const launch = () => {
    if (!draft.name.trim()) {
      setNotice("Asigna un nombre a la campaña.");
      return;
    }
    const next: CrmCampaign = {
      id: `CP-${campaigns.length + 32}`,
      name: draft.name.trim(),
      channel: draft.channel,
      status: "activa",
      audience: Number(draft.audience) || 0,
      sent: 0,
      replies: 0,
      launchedAt: new Date().toISOString().slice(0, 10),
    };
    setCampaigns((current) => [next, ...current]);
    setDraft({ name: "", channel: "whatsapp", audience: "150" });
    setNotice(`Campaña ${next.id} lanzada por ${next.channel}.`);
  };

  return (
    <div className="crm-page">
      <CrmPageHeader
        title="Campañas de originación"
        subtitle="Preaprobados, reactivación de cartera y recordatorios de expediente por WhatsApp, email y SMS."
      />

      <section className="crm-card">
        <div className="crm-card__head">
          <div>
            <h2>Nueva campaña de crédito</h2>
            <p>Las plantillas WhatsApp cubren preaprobado, documentos y recordatorio de pago.</p>
          </div>
        </div>
        <div className="crm-composer">
          <label className="crm-composer__full">
            Nombre
            <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </label>
          <label>
            Canal
            <select
              value={draft.channel}
              onChange={(event) => setDraft({ ...draft, channel: event.target.value as CrmCampaign["channel"] })}
            >
              <option value="whatsapp">WhatsApp API</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </label>
          <label>
            Audiencia
            <input
              value={draft.audience}
              onChange={(event) => setDraft({ ...draft, audience: event.target.value })}
              type="number"
              min={1}
            />
          </label>
          <div className="crm-composer__full crm-actions">
            <AppButton tone="primary" onClick={launch}>
              Lanzar campaña
            </AppButton>
          </div>
        </div>
        {notice ? <p className="crm-note">{notice}</p> : null}
      </section>

      <section className="crm-card">
        <div className="crm-card__head">
          <div>
            <h2>Historial</h2>
            <p>Respuestas y cobertura por canal.</p>
          </div>
        </div>
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Campaña</th>
                <th>Canal</th>
                <th>Estado</th>
                <th>Audiencia</th>
                <th>Enviados</th>
                <th>Respuestas</th>
                <th>Inicio</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>
                    <span className={item.channel === "whatsapp" ? "crm-badge crm-badge--wa" : "crm-badge"}>
                      {item.channel}
                    </span>
                  </td>
                  <td>
                    <span className={statusTone(item.status)}>{item.status}</span>
                  </td>
                  <td>{item.audience}</td>
                  <td>{item.sent}</td>
                  <td>{item.replies}</td>
                  <td>{item.launchedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
