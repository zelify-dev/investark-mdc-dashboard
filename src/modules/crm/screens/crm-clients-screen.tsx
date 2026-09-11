"use client";

import { useEffect, useMemo, useState } from "react";

import { CrmPageHeader } from "@/modules/crm/components/crm-page-header";
import { loadCrmClients, type CrmClientRow } from "@/modules/crm/lib/load-crm-clients";
import { moneyMxn } from "@/modules/crm/data/crm.seed";

import "./crm-workspace.css";

function statusLabel(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("aprob") || normalized === "approved") return "Aprobada";
  if (normalized.includes("rechaz") || normalized === "declined") return "Rechazada";
  if (normalized.includes("manual") || normalized.includes("revision") || normalized === "manualreview") {
    return "Revisión";
  }
  if (normalized.includes("override")) return "Override";
  return "Pendiente";
}

export function CrmClientsScreen() {
  const [clients, setClients] = useState<CrmClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void loadCrmClients()
      .then(setClients)
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((client) =>
      `${client.name} ${client.email} ${client.product} ${client.owner}`.toLowerCase().includes(q),
    );
  }, [clients, query]);

  return (
    <div className="crm-page">
      <CrmPageHeader
        title="Cartera de crédito"
        subtitle="Acreditados replicados del motor MDC, con oficial, WhatsApp y producto colocado."
      />

      <section className="crm-card">
        <div className="crm-card__head">
          <div>
            <h2>Cartera activa</h2>
            <p>
              {loading ? "Sincronizando cartera…" : `${filtered.length} acreditados únicos desde solicitudes MDC.`}
            </p>
          </div>
          <div className="crm-filters">
            <label>
              Buscar
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, producto u owner" />
            </label>
          </div>
        </div>
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Acreditado</th>
                <th>WhatsApp</th>
                <th>Tipo</th>
                <th>Producto</th>
                <th>Línea</th>
                <th>Decisión MDC</th>
                <th>Oficial</th>
                <th>Origen</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>Cargando cartera MDC…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>No hay acreditados replicados desde MDC.</td>
                </tr>
              ) : (
                filtered.map((client) => (
                  <tr key={client.id}>
                    <td>
                      {client.name}
                      <div style={{ color: "#64748b", fontSize: 12 }}>{client.email}</div>
                    </td>
                    <td>{client.phone}</td>
                    <td>{client.personType === "moral" ? "Persona moral" : "Persona física"}</td>
                    <td>{client.product}</td>
                    <td>{moneyMxn(client.amount)}</td>
                    <td>
                      <span className="crm-badge crm-badge--ok">{statusLabel(client.status)}</span>
                    </td>
                    <td>{client.owner}</td>
                    <td>
                      <span className="crm-badge">{client.source}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
