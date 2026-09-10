"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { AccountingPageHeader } from "../components/accounting-page-header";

import "@/components/ui/organisms/settings-data-table/settings-data-table.css";
import "./trial-balance-screen.css";

type TrialBalanceNode = {
  id: string;
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "INCOME" | "EXPENSE";
  initial: number;
  debit: number;
  credit: number;
  final: number;
  children?: TrialBalanceNode[];
};

const TRIAL_BALANCE_MOCK: TrialBalanceNode[] = [
  {
    id: "1",
    code: "1000",
    name: "Activos",
    type: "ASSET",
    initial: 150000,
    debit: 50000,
    credit: 20000,
    final: 180000,
    children: [
      {
        id: "1-1",
        code: "1001",
        name: "Caja Fuerte",
        type: "ASSET",
        initial: 50000,
        debit: 10000,
        credit: 5000,
        final: 55000,
      },
    ],
  },
];

const BRANCHES = ["Matriz", "Sucursal Norte", "Sucursal Sur"] as const;

function money(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export function TrialBalanceScreen() {
  const [from, setFrom] = useState("2026-04-01");
  const [to, setTo] = useState("2026-04-20");
  const [selectedBranches, setSelectedBranches] = useState<string[]>(["Matriz"]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ "1": true });
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const rows = TRIAL_BALANCE_MOCK;
  const difference = useMemo(() => {
    const debit = rows.reduce((acc, r) => acc + r.debit, 0);
    const credit = rows.reduce((acc, r) => acc + r.credit, 0);
    return debit - credit - 30000;
  }, [rows]);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const mockAction = (label: string) => setActionMessage(`Acción ejecutada: ${label}`);

  return (
    <div className="zelify-accounting-trial-balance">
      <AccountingPageHeader />
      <h2 className="zelify-accounting-trial-balance__title">Trial Balance</h2>
      {actionMessage ? <div className="zelify-workspace-page__subtitle">{actionMessage}</div> : null}

      <div className="zelify-accounting-trial-balance__filters">
        <label className="zelify-accounting-trial-balance__field">
          <span>Desde</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="zelify-accounting-trial-balance__field">
          <span>Hasta</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label className="zelify-accounting-trial-balance__field">
          <span>Sucursales</span>
          <select
            multiple
            value={selectedBranches}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions).map((o) => o.value);
              setSelectedBranches(values);
            }}
            className="zelify-accounting-trial-balance__multi"
          >
            {BRANCHES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <AppButton type="button" tone="primary" onClick={() => mockAction(`Filtrar balance de prueba (${from} a ${to})`)}>
          Filtrar
        </AppButton>
        <div
          className={`zelify-accounting-trial-balance__difference ${difference === 0 ? "is-balanced" : "is-unbalanced"}`}
        >
          Diferencia Total: {money(Math.abs(difference))}
        </div>
      </div>

      <SettingsDataTable variant="clients" className="zelify-accounting-trial-balance__table">
        <thead>
          <tr>
            <th>Código GL</th>
            <th>Nombre Cuenta</th>
            <th>Tipo</th>
            <th className="is-numeric-header">Saldo Inicial</th>
            <th className="is-numeric-header">Débito</th>
            <th className="is-numeric-header">Crédito</th>
            <th className="is-numeric-header">Saldo Final</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <Fragment key={row.id}>
              <tr>
                <td className="zelify-mono">{row.code}</td>
                <td>
                  <button
                    type="button"
                    className="zelify-accounting-trial-balance__tree-toggle"
                    onClick={() => toggleExpanded(row.id)}
                  >
                    {expanded[row.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {row.name}
                  </button>
                </td>
                <td>{row.type}</td>
                <td className="is-numeric">{money(row.initial)}</td>
                <td className="is-numeric">{money(row.debit)}</td>
                <td className="is-numeric">{money(row.credit)}</td>
                <td className="is-numeric">{money(row.final)}</td>
              </tr>
              {expanded[row.id] &&
                row.children?.map((child) => (
                  <tr key={child.id}>
                    <td className="zelify-mono">{child.code}</td>
                    <td className="zelify-accounting-trial-balance__child-name">{child.name}</td>
                    <td>{child.type}</td>
                    <td className="is-numeric">{money(child.initial)}</td>
                    <td className="is-numeric">{money(child.debit)}</td>
                    <td className="is-numeric">{money(child.credit)}</td>
                    <td className="is-numeric">{money(child.final)}</td>
                  </tr>
                ))}
            </Fragment>
          ))}
        </tbody>
      </SettingsDataTable>
    </div>
  );
}

