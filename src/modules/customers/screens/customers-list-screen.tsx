"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import "@/components/ui/templates/workspace-page.css";
import "@/modules/mdc/screens/mdc-screen.css";
import { getStoredOrganization } from "@/lib/auth-api";
import { APPLICATIONS_BY_MODE } from "@/modules/mdc/data/mdc-credit-mock";
import { fetchFinanceRequests } from "@/modules/mdc/services/mdc-finance-requests.service";

type MdcClientRow = {
  id: string;
  name: string;
  email: string;
  product: string;
  amount: number;
  status: string;
  submittedAt: string;
  personType: string;
};

function money(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

function statusLabel(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("aprob")) return "Aprobada";
  if (normalized.includes("rechaz")) return "Rechazada";
  if (normalized.includes("manual") || normalized.includes("revision")) return "Revisión manual";
  if (normalized.includes("override")) return "Override";
  if (normalized === "approved") return "Aprobada";
  if (normalized === "declined") return "Rechazada";
  if (normalized === "manualreview") return "Revisión manual";
  if (normalized === "overridden") return "Override";
  return "Pendiente";
}

function uniqueClients(rows: MdcClientRow[]) {
  const map = new Map<string, MdcClientRow>();
  for (const row of rows) {
    const key = (row.email || row.name).trim().toLowerCase();
    if (!key) continue;
    const current = map.get(key);
    if (!current || new Date(row.submittedAt).getTime() > new Date(current.submittedAt).getTime()) {
      map.set(key, row);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

export const CustomersListScreen: React.FC = () => {
  const [clients, setClients] = useState<MdcClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const orgId = getStoredOrganization()?.id || "ORG-001";
        if (orgId === "demo-bypass-org") {
          const demo = uniqueClients(
            [...APPLICATIONS_BY_MODE.natural, ...APPLICATIONS_BY_MODE.moral].map((app) => ({
              id: app.id,
              name: app.applicantName,
              email: app.applicantEmail,
              product: app.product,
              amount: app.requestedAmount,
              status: app.status,
              submittedAt: app.submittedAt,
              personType: APPLICATIONS_BY_MODE.moral.some((item) => item.id === app.id) ? "moral" : "natural",
            })),
          );
          setClients(demo);
          return;
        }

        const [natural, moral] = await Promise.all([
          fetchFinanceRequests(orgId, "natural").catch(() => []),
          fetchFinanceRequests(orgId, "moral").catch(() => []),
        ]);

        const mapped = uniqueClients(
          [...natural, ...moral].map((item) => ({
            id: item.id,
            name:
              item.personType === "natural"
                ? `${item.firstName || ""} ${item.lastName || ""}`.trim() || item.email
                : item.businessName || item.email,
            email: item.email || "—",
            product: item.product || "—",
            amount: Number(item.amount) || 0,
            status: item.status || "pending",
            submittedAt: item.createdAt || item.updatedAt || new Date().toISOString(),
            personType: item.personType || "natural",
          })),
        );
        setClients(mapped);
      } catch (error) {
        console.error("Error fetching MDC clients:", error);
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((client) =>
      `${client.name} ${client.email} ${client.product} ${client.status}`.toLowerCase().includes(q),
    );
  }, [clients, query]);

  return (
    <div className="zelify-workspace-page mdc-workspace mdc-workspace--solo">
      <ZelifyTopNavbar />
      <div className="zelify-workspace-page__scroll mdc-workspace__body">
        <div className="mdc-workspace__main">
          <div className="mdc-root">
            <div className="mdc-overview-hero mdc-prod-hero">
              <div className="mdc-prod-hero__row">
                <div>
                  <h2 className="mdc-overview-hero__title">Clientes</h2>
                  <p className="mdc-prod-hero__sub">Base de clientes del Motor de Decisión de Crédito.</p>
                </div>
              </div>
            </div>

            <article className="mdc-card mdc-apps-panel">
              <div className="mdc-filters mdc-apps-filters" style={{ gridTemplateColumns: "1fr" }}>
                <label>
                  <span>Buscar</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Nombre, email o producto"
                  />
                </label>
              </div>

              <div className="mdc-table-wrap">
                <table className="mdc-table mdc-apps-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Email</th>
                      <th>Tipo</th>
                      <th>Producto</th>
                      <th>Monto</th>
                      <th>Estado</th>
                      <th>Última solicitud</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7}>Cargando clientes de MDC...</td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7}>No hay clientes en la base de MDC.</td>
                      </tr>
                    ) : (
                      filtered.map((client) => (
                        <tr key={client.id}>
                          <td>{client.name}</td>
                          <td>{client.email}</td>
                          <td>{client.personType === "moral" ? "Persona Moral" : "Persona Física"}</td>
                          <td>{client.product}</td>
                          <td>{money(client.amount)}</td>
                          <td>
                            <span className="mdc-badge mdc-badge--ok">{statusLabel(client.status)}</span>
                          </td>
                          <td>{new Date(client.submittedAt).toLocaleDateString("es-MX")}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
};
