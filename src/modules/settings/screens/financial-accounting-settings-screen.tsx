"use client";

import { useState } from "react";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";

import "./settings-workspace-shared.css";
import "./financial-accounting-settings-screen.css";

export function FinancialAccountingSettingsScreen() {
  const [fiscalStartMonth, setFiscalStartMonth] = useState("1");
  const [defaultBranchGl, setDefaultBranchGl] = useState("MAIN");
  const [autoPostLoans, setAutoPostLoans] = useState(true);
  const [requireEodApproval, setRequireEodApproval] = useState(false);
  const [roundingMode, setRoundingMode] = useState("HALF_UP");
  const [minPostingAmount, setMinPostingAmount] = useState("0.01");

  return (
    <div className="zelify-settings-workspace zelify-fin-acct">
      <h1 className="zelify-settings-workspace__title">Contabilidad financiera</h1>
      <p className="zelify-fin-acct__lead">
        Parámetros generales del motor contable y del cierre diario.
      </p>

      <div className="zelify-fin-acct__grid">
        <section className="zelify-policy-card">
          <h2>Periodo fiscal</h2>
          <label>
            Mes de inicio del año fiscal
            <select value={fiscalStartMonth} onChange={(e) => setFiscalStartMonth(e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  {i + 1} — {new Date(2000, i, 1).toLocaleString("es", { month: "long" })}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="zelify-policy-card">
          <h2>Libro mayor</h2>
          <label>
            Sucursal por defecto para asientos automáticos
            <select value={defaultBranchGl} onChange={(e) => setDefaultBranchGl(e.target.value)}>
              <option value="MAIN">Matriz (MAIN)</option>
              <option value="NORTH">Sucursal Norte</option>
              <option value="SOUTH">Sucursal Sur</option>
            </select>
          </label>
          <label>
            Redondeo de importes
            <select value={roundingMode} onChange={(e) => setRoundingMode(e.target.value)}>
              <option value="HALF_UP">HALF_UP (estándar)</option>
              <option value="DOWN">Hacia cero</option>
            </select>
          </label>
          <label>
            Importe mínimo registrable (USD)
            <AppInput type="number" step="0.01" value={minPostingAmount} onChange={(e) => setMinPostingAmount(e.target.value)} />
          </label>
        </section>

        <section className="zelify-policy-card">
          <h2>Automatización</h2>
          <label className="zelify-policy-item">
            <span>Postear intereses de préstamos al vencimiento de cuota</span>
            <label className="zelify-switch">
              <input type="checkbox" checked={autoPostLoans} onChange={(e) => setAutoPostLoans(e.target.checked)} />
              <span />
            </label>
          </label>
          <label className="zelify-policy-item">
            <span>EOD requiere aprobación (maker-checker)</span>
            <label className="zelify-switch">
              <input type="checkbox" checked={requireEodApproval} onChange={(e) => setRequireEodApproval(e.target.checked)} />
              <span />
            </label>
          </label>
        </section>
      </div>

      <div className="zelify-policy-footer">
        <AppButton type="button" tone="primary">
          Guardar configuración
        </AppButton>
      </div>
    </div>
  );
}
