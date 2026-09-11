"use client";

import { useState } from "react";

import { AppButton } from "@/components/ui/atoms/button/app-button";
import { CrmPageHeader } from "@/modules/crm/components/crm-page-header";
import { CRM_ACTIVITIES, CRM_OWNERS, formatWhen, type CrmActivity } from "@/modules/crm/data/crm.seed";

import "./crm-workspace.css";

export function CrmActivitiesScreen() {
  const [activities, setActivities] = useState(CRM_ACTIVITIES);
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    title: "",
    relatedTo: "",
    type: "whatsapp" as CrmActivity["type"],
    owner: CRM_OWNERS[0],
  });

  const add = () => {
    if (!draft.title.trim() || !draft.relatedTo.trim()) {
      setNotice("Completa título y registro relacionado.");
      return;
    }
    const next: CrmActivity = {
      id: `AC-${activities.length + 92}`,
      type: draft.type,
      title: draft.title.trim(),
      relatedTo: draft.relatedTo.trim(),
      owner: draft.owner,
      dueAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
      status: "pendiente",
    };
    setActivities((current) => [next, ...current]);
    setDraft({ ...draft, title: "", relatedTo: "" });
    setNotice(`Actividad ${next.id} agendada.`);
  };

  const complete = (id: string) => {
    setActivities((current) =>
      current.map((item) => (item.id === id ? { ...item, status: "hecha" } : item)),
    );
  };

  return (
    <div className="crm-page">
      <CrmPageHeader
        title="Seguimiento crediticio"
        subtitle="Expedientes, llamadas de precalificación y cierre de ofertas."
      />

      <section className="crm-card">
        <div className="crm-card__head">
          <div>
            <h2>Agendar seguimiento</h2>
            <p>Queda ligado a un prospecto, acreditado o línea de crédito.</p>
          </div>
        </div>
        <div className="crm-composer">
          <label>
            Título
            <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          </label>
          <label>
            Relacionado
            <input
              value={draft.relatedTo}
              onChange={(event) => setDraft({ ...draft, relatedTo: event.target.value })}
              placeholder="Cliente o lead"
            />
          </label>
          <label>
            Tipo
            <select
              value={draft.type}
              onChange={(event) => setDraft({ ...draft, type: event.target.value as CrmActivity["type"] })}
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="llamada">Llamada</option>
              <option value="reunion">Reunión</option>
              <option value="tarea">Tarea</option>
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
            <AppButton tone="primary" onClick={add}>
              Agendar
            </AppButton>
          </div>
        </div>
        {notice ? <p className="crm-note">{notice}</p> : null}
      </section>

      <section className="crm-card">
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Actividad</th>
                <th>Relacionado</th>
                <th>Tipo</th>
                <th>Owner</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {activities.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.relatedTo}</td>
                  <td>
                    <span className={item.type === "whatsapp" ? "crm-badge crm-badge--wa" : "crm-badge crm-badge--info"}>
                      {item.type}
                    </span>
                  </td>
                  <td>{item.owner}</td>
                  <td>{formatWhen(item.dueAt)}</td>
                  <td>
                    <span className={item.status === "hecha" ? "crm-badge crm-badge--ok" : "crm-badge crm-badge--warn"}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    {item.status === "pendiente" ? (
                      <AppButton onClick={() => complete(item.id)}>Completar</AppButton>
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
