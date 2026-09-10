"use client";

import { useState } from "react";

import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";

import "./settings-workspace-shared.css";
import "./webhooks-settings-tab-screen.css";

type DeliveryStatus = "200 OK" | "401 Unauthorized" | "429 Retry" | "Sin envío";
type SigningType = "HMAC-SHA256" | "Bearer Token" | "mTLS";

type HookRow = {
  id: string;
  name: string;
  endpoint: string;
  events: string[];
  signing: SigningType;
  secretMasked: string;
  headers: string;
  retryPolicy: string;
  environment: "Sandbox" | "Producción";
  lastStatus: DeliveryStatus;
};

const SEED: HookRow[] = [
  {
    id: "wh-1",
    name: "Originación a CRM comercial",
    endpoint: "https://crm.grupodelta.com/hooks/credit-originations",
    events: ["application.approved", "application.override_applied"],
    signing: "HMAC-SHA256",
    secretMasked: "whse••••••c91d",
    headers: "X-Zelify-Signature, X-Zelify-Event",
    retryPolicy: "5 intentos / backoff exponencial",
    environment: "Producción",
    lastStatus: "200 OK",
  },
  {
    id: "wh-2",
    name: "Alertas AML a compliance",
    endpoint: "https://ops.riesgo-demo.mx/webhooks/aml-alerts",
    events: ["aml.match_detected", "kyb.revalidation_required"],
    signing: "Bearer Token",
    secretMasked: "tok_••••••7a2f",
    headers: "Authorization, X-Correlation-Id",
    retryPolicy: "3 intentos / 30 segundos",
    environment: "Sandbox",
    lastStatus: "429 Retry",
  },
];

function maskSecret(value: string) {
  if (!value) return "Sin secret";
  if (value.length <= 6) return "••••••";
  return `${value.slice(0, 4)}••••••${value.slice(-4)}`;
}

function badgeTone(status: DeliveryStatus) {
  if (status === "200 OK") return "success";
  if (status === "Sin envío") return "neutral";
  return "error";
}

export function WebhooksSettingsTabScreen() {
  const [rows, setRows] = useState(SEED);
  const [showSecret, setShowSecret] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [secret, setSecret] = useState("");
  const [events, setEvents] = useState("application.created");
  const [headers, setHeaders] = useState("X-Zelify-Signature");
  const [signing, setSigning] = useState<SigningType>("HMAC-SHA256");
  const [environment, setEnvironment] = useState<"Sandbox" | "Producción">("Sandbox");
  const [retryPolicy, setRetryPolicy] = useState("3 intentos / 30 segundos");

  const addRow = () => {
    if (!name.trim() || !endpoint.trim() || !secret.trim()) return;
    setRows((prev) => [
      {
        id: `wh-${prev.length + 1}`,
        name: name.trim(),
        endpoint: endpoint.trim(),
        events: events.split(",").map((item) => item.trim()).filter(Boolean),
        signing,
        secretMasked: maskSecret(secret.trim()),
        headers: headers.trim() || "Sin headers extra",
        retryPolicy: retryPolicy.trim(),
        environment,
        lastStatus: "Sin envío",
      },
      ...prev,
    ]);
    setName("");
    setEndpoint("");
    setSecret("");
    setEvents("application.created");
    setHeaders("X-Zelify-Signature");
    setSigning("HMAC-SHA256");
    setEnvironment("Sandbox");
    setRetryPolicy("3 intentos / 30 segundos");
  };

  return (
    <div className="zelify-settings-workspace zelify-webhook-settings-tab">
      <h1 className="zelify-settings-workspace__title">Webhooks y APIs</h1>
      <p className="zelify-webhook-settings-tab__lead">
        Configura salidas seguras del core con firma, eventos, headers operativos y política de reintentos.
      </p>

      <section className="zelify-policy-card zelify-webhook-settings-tab__form">
        <h2>Nuevo endpoint webhook</h2>
        <div className="zelify-webhook-settings-tab__grid">
          <label>
            Nombre
            <AppInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Webhook de originación" />
          </label>
          <label>
            URL HTTPS
            <AppInput value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="https://integracion.empresa.com/hooks/credit" />
          </label>
          <label>
            Ambiente
            <select value={environment} onChange={(e) => setEnvironment(e.target.value as "Sandbox" | "Producción")}>
              <option value="Sandbox">Sandbox</option>
              <option value="Producción">Producción</option>
            </select>
          </label>
          <label>
            Firma / autenticación
            <select value={signing} onChange={(e) => setSigning(e.target.value as SigningType)}>
              <option value="HMAC-SHA256">HMAC-SHA256</option>
              <option value="Bearer Token">Bearer Token</option>
              <option value="mTLS">mTLS</option>
            </select>
          </label>
          <label>
            Secret / token
            <AppInput type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Se guarda oculto" />
          </label>
          <label>
            Headers
            <AppInput value={headers} onChange={(e) => setHeaders(e.target.value)} placeholder="Authorization, X-Correlation-Id" />
          </label>
          <label className="zelify-webhook-settings-tab__grid-wide">
            Eventos
            <AppInput value={events} onChange={(e) => setEvents(e.target.value)} placeholder="application.created, application.approved" />
          </label>
          <label className="zelify-webhook-settings-tab__grid-wide">
            Política de reintentos
            <AppInput value={retryPolicy} onChange={(e) => setRetryPolicy(e.target.value)} placeholder="5 intentos / backoff exponencial" />
          </label>
        </div>
        <AppButton type="button" tone="primary" onClick={addRow}>
          Añadir webhook
        </AppButton>
      </section>

      <h2 className="zelify-settings-workspace__subtitle">Endpoints activos</h2>
      <SettingsDataTable variant="clients">
        <thead>
          <tr>
            <th>Webhook</th>
            <th>Endpoint / eventos</th>
            <th>Seguridad</th>
            <th>Operación</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const revealed = showSecret.includes(row.id);
            return (
              <tr key={row.id}>
                <td>
                  <div className="zelify-webhook-settings-tab__cell-stack">
                    <span className="zelify-webhook-settings-tab__cell-title">{row.name}</span>
                    <span className="zelify-webhook-settings-tab__cell-meta">{row.environment}</span>
                  </div>
                </td>
                <td>
                  <div className="zelify-webhook-settings-tab__cell-stack">
                    <span className="zelify-webhook-settings-tab__url">{row.endpoint}</span>
                    <span className="zelify-webhook-settings-tab__cell-meta">{row.events.join(", ")}</span>
                  </div>
                </td>
                <td>
                  <div className="zelify-webhook-settings-tab__cell-stack">
                    <span className="zelify-webhook-settings-tab__cell-title">{row.signing}</span>
                    <code className="zelify-webhook-settings-tab__secret">{revealed ? row.secretMasked.replace(/•/g, "x") : row.secretMasked}</code>
                    <button
                      type="button"
                      className="zelify-webhook-settings-tab__btn"
                      onClick={() => setShowSecret((prev) => (prev.includes(row.id) ? prev.filter((id) => id !== row.id) : [...prev, row.id]))}
                    >
                      {revealed ? "Ocultar" : "Ver secret"}
                    </button>
                  </div>
                </td>
                <td>
                  <div className="zelify-webhook-settings-tab__cell-stack">
                    <span className="zelify-webhook-settings-tab__cell-meta">{row.headers}</span>
                    <span className="zelify-webhook-settings-tab__cell-meta">{row.retryPolicy}</span>
                  </div>
                </td>
                <td>
                  <AppBadge tone={badgeTone(row.lastStatus)} size="sm">
                    {row.lastStatus}
                  </AppBadge>
                </td>
                <td className="is-actions">
                  <button type="button" className="zelify-webhook-settings-tab__btn">
                    Probar
                  </button>
                  <button type="button" className="zelify-webhook-settings-tab__btn">
                    Rotar
                  </button>
                  <button type="button" className="zelify-webhook-settings-tab__btn" onClick={() => setRows((p) => p.filter((r) => r.id !== row.id))}>
                    Eliminar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </SettingsDataTable>
    </div>
  );
}
