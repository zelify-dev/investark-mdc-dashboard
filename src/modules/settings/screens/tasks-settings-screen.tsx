"use client";

import { useState } from "react";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";

import "@/components/ui/templates/workspace-page.css";
import "./settings-workspace-shared.css";
import "./tasks-settings-screen.css";

type TaskDef = {
  id: string;
  name: string;
  queue: string;
  slaHours: number;
  ownerRole: string;
  active: boolean;
};

const TASKS: TaskDef[] = [
  { id: "t1", name: "Aprobación préstamo > 25k USD", queue: "Riesgo", slaHours: 8, ownerRole: "Gerente sucursal", active: true },
  { id: "t2", name: "Verificación KYC pendiente", queue: "Cumplimiento", slaHours: 24, ownerRole: "Analista AML", active: true },
  { id: "t3", name: "Desembolso con excepción", queue: "Operaciones", slaHours: 4, ownerRole: "Supervisor caja", active: false },
  { id: "t4", name: "Alta de producto nuevo", queue: "Producto", slaHours: 72, ownerRole: "Comité producto", active: true },
];

export function TasksSettingsScreen() {
  const [rows, setRows] = useState(TASKS);

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />
      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner zelify-tasks-settings">
          <header className="zelify-tasks-settings__head">
            <div>
              <h1 className="zelify-workspace-page__title">Tareas operativas</h1>
              <p className="zelify-tasks-settings__sub">Definición de colas y SLA.</p>
            </div>
            <AppButton type="button" tone="primary">
              Nueva definición
            </AppButton>
          </header>

          <SettingsDataTable variant="clients">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cola</th>
                <th className="is-numeric-header">SLA (h)</th>
                <th>Rol responsable</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.queue}</td>
                  <td className="is-numeric">{row.slaHours}</td>
                  <td>{row.ownerRole}</td>
                  <td>
                    <AppBadge tone={row.active ? "success" : "neutral"} size="sm">
                      {row.active ? "Sí" : "No"}
                    </AppBadge>
                  </td>
                  <td className="is-actions">
                    <button type="button" className="zelify-tasks-settings__link">
                      Editar
                    </button>
                    <button
                      type="button"
                      className="zelify-tasks-settings__link"
                      onClick={() => setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, active: !r.active } : r)))}
                    >
                      {row.active ? "Pausar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </SettingsDataTable>
        </div>
      </div>
    </div>
  );
}
