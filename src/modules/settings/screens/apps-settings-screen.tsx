"use client";

import { useState } from "react";
import { Eye, EyeOff, RotateCcw } from "lucide-react";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";

import "./settings-workspace-shared.css";
import "./apps-settings-screen.css";

type ApiKeyRow = { id: string; app: string; active: boolean; secret: string };
type WebhookRow = { id: string; endpoint: string; event: string; status: "200 OK" | "500 Error" };

const API_KEYS: ApiKeyRow[] = [
  { id: "k1", app: "Salesforce Sync", active: true, secret: "sk_live_4M8H_98AA_XXZZ" },
  { id: "k2", app: "Risk Engine", active: false, secret: "sk_test_2B9M_11BB_YYQQ" },
];

const WEBHOOKS: WebhookRow[] = [
  { id: "w1", endpoint: "https://hooks.app/loan", event: "LOAN_APPROVED", status: "200 OK" },
  { id: "w2", endpoint: "https://hooks.app/risk", event: "CLIENT_BLACKLISTED", status: "500 Error" },
];

export function AppsSettingsScreen() {
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  return (
    <div className="zelify-settings-workspace">
      <h1 className="zelify-settings-workspace__title">Apps</h1>

      <section>
        <h2 className="zelify-settings-workspace__subtitle">API Keys</h2>
        <div className="zelify-apps-grid">
          {API_KEYS.map((row) => {
            const isVisible = Boolean(visible[row.id]);
            return (
              <article key={row.id} className="zelify-apps-card">
                <header className="zelify-apps-card__head">
                  <strong>{row.app}</strong>
                  <AppBadge tone={row.active ? "success" : "neutral"} size="sm">
                    {row.active ? "Activa" : "Inactiva"}
                  </AppBadge>
                </header>
                <div className="zelify-apps-card__secret">
                  <input type={isVisible ? "text" : "password"} readOnly value={row.secret} />
                  <button type="button" onClick={() => setVisible((p) => ({ ...p, [row.id]: !isVisible }))}>
                    {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <AppButton type="button" tone="neutral">
                  <RotateCcw size={14} />
                  Regenerar Key
                </AppButton>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="zelify-settings-workspace__subtitle">Webhooks</h2>
        <SettingsDataTable variant="clients">
          <thead>
            <tr>
              <th>URL Endpoint</th>
              <th>Evento Suscrito</th>
              <th>Último Status</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {WEBHOOKS.map((row) => (
              <tr key={row.id}>
                <td>{row.endpoint}</td>
                <td>{row.event}</td>
                <td>
                  <AppBadge tone={row.status === "200 OK" ? "success" : "error"} size="sm">
                    {row.status}
                  </AppBadge>
                </td>
                <td className="is-actions">
                  <button type="button" className="zelify-icon-btn">
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </SettingsDataTable>
      </section>
    </div>
  );
}

