"use client";

import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";

import "@/components/ui/templates/workspace-page.css";

type CreditOfficerRow = {
  id: string;
  officer: string;
  assignedBranch: string;
  portfolioClients: number;
  portfolioGroups: number;
  par30: number;
  canAccessPeers: boolean;
};

const CREDIT_OFFICERS: CreditOfficerRow[] = [
  {
    id: "co-1",
    officer: "Jose M. Herrera",
    assignedBranch: "Matriz Quito",
    portfolioClients: 114,
    portfolioGroups: 9,
    par30: 2.1,
    canAccessPeers: true,
  },
  {
    id: "co-2",
    officer: "Camila Bernal",
    assignedBranch: "Bogota Norte",
    portfolioClients: 98,
    portfolioGroups: 7,
    par30: 1.8,
    canAccessPeers: false,
  },
  {
    id: "co-3",
    officer: "Natalia Vela",
    assignedBranch: "Lima San Isidro",
    portfolioClients: 106,
    portfolioGroups: 8,
    par30: 2.9,
    canAccessPeers: true,
  },
];

export function CreditOfficersManagementScreen() {
  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />
      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner">
          <header style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <h1 className="zelify-workspace-page__title">Gestión de oficiales de crédito</h1>
              <p style={{ margin: "6px 0 0", color: "#64748b" }}>
                Asignación de cartera por sucursal, acceso entre oficiales y control de desempeño.
              </p>
            </div>
            <AppButton tone="primary">Reasignar cartera</AppButton>
          </header>

          <SettingsDataTable variant="clients">
            <thead>
              <tr>
                <th>Oficial</th>
                <th>Sucursal asignada</th>
                <th className="is-numeric-header">Clientes</th>
                <th className="is-numeric-header">Grupos</th>
                <th className="is-numeric-header">PAR &gt; 30</th>
                <th>Acceso a otros oficiales</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {CREDIT_OFFICERS.map((row) => (
                <tr key={row.id}>
                  <td>{row.officer}</td>
                  <td>{row.assignedBranch}</td>
                  <td className="is-numeric">{row.portfolioClients}</td>
                  <td className="is-numeric">{row.portfolioGroups}</td>
                  <td className="is-numeric">{row.par30.toFixed(1)}%</td>
                  <td>
                    <AppBadge tone={row.canAccessPeers ? "warning" : "neutral"} size="sm">
                      {row.canAccessPeers ? "Habilitado" : "No habilitado"}
                    </AppBadge>
                  </td>
                  <td className="is-actions">
                    <AppButton tone="secondary">Ver cartera</AppButton>
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
