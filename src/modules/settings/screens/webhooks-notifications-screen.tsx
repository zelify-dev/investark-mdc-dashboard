"use client";

import { useMemo, useState } from "react";

import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";

import {
  mockAdminApiIntegrations,
  type AdminApiIntegrationRow,
} from "../data/admin-webhooks.mock";

import "./webhooks-notifications-screen.css";

type ApiEnvironment = "Sandbox" | "Producción";
type ApiAuthType = "API Key" | "Bearer Token" | "OAuth 2.0" | "mTLS";
type ApiStatus = "Activa" | "En pruebas" | "Pausada";

function maskSecret(value: string) {
  if (!value) return "No configurado";
  if (value.length <= 6) return "••••••";
  return `${value.slice(0, 4)}••••••${value.slice(-4)}`;
}

function statusTone(status: ApiStatus) {
  if (status === "Activa") return "success";
  if (status === "En pruebas") return "warning";
  return "neutral";
}

const EMPTY_FORM = {
  name: "",
  provider: "",
  purpose: "",
  environment: "Sandbox" as ApiEnvironment,
  authType: "API Key" as ApiAuthType,
  credential: "",
  baseUrl: "",
  timeoutSec: "15",
  rateLimit: "120",
  allowedIps: "",
};

export function WebhooksNotificationsScreen() {
  const [rows, setRows] = useState<AdminApiIntegrationRow[]>(mockAdminApiIntegrations);
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);

  const totalActive = useMemo(() => rows.filter((row) => row.status === "Activa").length, [rows]);

  const addIntegration = () => {
    if (!form.name.trim() || !form.provider.trim() || !form.baseUrl.trim() || !form.credential.trim()) return;

    const next: AdminApiIntegrationRow = {
      id: `api-${rows.length + 1}`,
      name: form.name.trim(),
      provider: form.provider.trim(),
      purpose: form.purpose.trim() || "Integración operativa del core",
      authType: form.authType,
      credentialMasked: maskSecret(form.credential.trim()),
      environment: form.environment,
      status: form.environment === "Producción" ? "Activa" : "En pruebas",
      lastSync: "Sin consumo",
      baseUrl: form.baseUrl.trim(),
      allowedIps: form.allowedIps.trim() || "No restringido",
      timeoutSec: Number(form.timeoutSec) || 15,
      rateLimit: Number(form.rateLimit) || 120,
    };

    setRows((prev) => [next, ...prev]);
    setForm(EMPTY_FORM);
  };

  return (
    <div className="zelify-webhooks-notifications">
      <div className="zelify-webhooks-notifications__header">
        <div>
          <h1 className="zelify-settings-workspace__title">Webhooks y APIs</h1>
          <p className="zelify-webhooks-notifications__lead">
            Administra conexiones hacia SAT, buró, AML, core bancario y proveedores externos con credenciales protegidas.
          </p>
        </div>
        <div className="zelify-webhooks-notifications__summary">
          <span className="zelify-webhooks-notifications__summary-kpi">{rows.length}</span>
          <span className="zelify-webhooks-notifications__summary-label">Integraciones registradas</span>
          <span className="zelify-webhooks-notifications__summary-note">{totalActive} activas en este momento</span>
        </div>
      </div>

      <section className="zelify-webhooks-notifications__composer">
        <div className="zelify-webhooks-notifications__composer-head">
          <h2>Nueva API</h2>
          <p>Registra una integración con autenticación, endpoint base, límites y control de consumo.</p>
        </div>

        <div className="zelify-webhooks-notifications__grid">
          <label>
            Nombre de integración
            <AppInput value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Buró empresarial" />
          </label>
          <label>
            Proveedor
            <AppInput value={form.provider} onChange={(e) => setForm((prev) => ({ ...prev, provider: e.target.value }))} placeholder="TransUnion" />
          </label>
          <label>
            Ambiente
            <select value={form.environment} onChange={(e) => setForm((prev) => ({ ...prev, environment: e.target.value as ApiEnvironment }))}>
              <option value="Sandbox">Sandbox</option>
              <option value="Producción">Producción</option>
            </select>
          </label>
          <label>
            Método de autenticación
            <select value={form.authType} onChange={(e) => setForm((prev) => ({ ...prev, authType: e.target.value as ApiAuthType }))}>
              <option value="API Key">API Key</option>
              <option value="Bearer Token">Bearer Token</option>
              <option value="OAuth 2.0">OAuth 2.0</option>
              <option value="mTLS">mTLS</option>
            </select>
          </label>
          <label>
            Endpoint base
            <AppInput value={form.baseUrl} onChange={(e) => setForm((prev) => ({ ...prev, baseUrl: e.target.value }))} placeholder="https://api.proveedor.com/v1" />
          </label>
          <label>
            Credencial / token
            <AppInput type="password" value={form.credential} onChange={(e) => setForm((prev) => ({ ...prev, credential: e.target.value }))} placeholder="Se almacena enmascarado" />
          </label>
          <label>
            Timeout (seg)
            <AppInput type="number" value={form.timeoutSec} onChange={(e) => setForm((prev) => ({ ...prev, timeoutSec: e.target.value }))} />
          </label>
          <label>
            Rate limit por minuto
            <AppInput type="number" value={form.rateLimit} onChange={(e) => setForm((prev) => ({ ...prev, rateLimit: e.target.value }))} />
          </label>
          <label>
            IP allowlist
            <AppInput value={form.allowedIps} onChange={(e) => setForm((prev) => ({ ...prev, allowedIps: e.target.value }))} placeholder="201.10.2.4, 201.10.2.5" />
          </label>
          <label className="zelify-webhooks-notifications__grid-full">
            Uso funcional
            <textarea rows={3} value={form.purpose} onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))} placeholder="Consulta score, validación fiscal, screening AML, originación, conciliación..." />
          </label>
        </div>

        <div className="zelify-webhooks-notifications__footer-actions">
          <AppButton type="button" tone="primary" onClick={addIntegration}>
            Guardar integración
          </AppButton>
        </div>
      </section>

      <div className="zelify-webhooks-notifications__table-wrap">
        <SettingsDataTable variant="clients" className="zelify-webhooks-notifications__data-table">
          <thead>
            <tr>
              <th>Integración</th>
              <th>Uso / endpoint</th>
              <th>Autenticación</th>
              <th>Configuración</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const revealed = revealedIds.includes(row.id);
              return (
                <tr key={row.id}>
                  <td className="zelify-webhooks-notifications__name-cell">
                    <span className="zelify-webhooks-notifications__name">{row.name}</span>
                    <span className="zelify-webhooks-notifications__provider">{row.provider}</span>
                  </td>
                  <td>
                    <div className="zelify-webhooks-notifications__event-cell">
                      <span className="zelify-webhooks-notifications__event-title">{row.purpose}</span>
                      <span className="zelify-webhooks-notifications__event-desc">{row.baseUrl}</span>
                    </div>
                  </td>
                  <td>
                    <div className="zelify-webhooks-notifications__secret-cell">
                      <span>{row.authType}</span>
                      <code>{revealed ? row.credentialMasked.replace(/•/g, "x") : row.credentialMasked}</code>
                      <button
                        type="button"
                        className="zelify-webhooks-notifications__inline-btn"
                        onClick={() =>
                          setRevealedIds((prev) => (prev.includes(row.id) ? prev.filter((id) => id !== row.id) : [...prev, row.id]))
                        }
                      >
                        {revealed ? "Ocultar" : "Ver"}
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="zelify-webhooks-notifications__config-cell">
                      <span>{row.environment}</span>
                      <span>{row.timeoutSec}s timeout</span>
                      <span>{row.rateLimit}/min</span>
                      <span>{row.allowedIps}</span>
                    </div>
                  </td>
                  <td>
                    <div className="zelify-webhooks-notifications__status-cell">
                      <AppBadge tone={statusTone(row.status)} size="sm">{row.status}</AppBadge>
                      <span className="zelify-webhooks-notifications__last-sync">{row.lastSync}</span>
                    </div>
                  </td>
                  <td className="is-actions">
                    <div className="zelify-webhooks-notifications__row-actions">
                      <button type="button" className="zelify-webhooks-notifications__inline-btn">Probar</button>
                      <button type="button" className="zelify-webhooks-notifications__inline-btn">Rotar token</button>
                      <button
                        type="button"
                        className="zelify-webhooks-notifications__inline-btn zelify-webhooks-notifications__inline-btn--danger"
                        onClick={() => setRows((prev) => prev.filter((item) => item.id !== row.id))}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </SettingsDataTable>
      </div>
    </div>
  );
}
