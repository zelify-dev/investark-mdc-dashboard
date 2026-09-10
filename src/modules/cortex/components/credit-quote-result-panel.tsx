"use client";

import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppCheckbox } from "@/components/ui/atoms/checkbox/app-checkbox";
import type { RuleCompliance } from "../services/credit-pricing.engine";
import {
  crossSellRatePreview,
  formatMxnCredit,
  formatPctCredit,
} from "../services/credit-pricing.engine";
import type { CreditClientProfile, CreditQuoteResult, CrossSellOption } from "../types/credit-pricing.types";
import "./credit-quote-result-panel.css";

function cascadeRate(baseRate: number, discounts: { bps: number }[], throughIndex: number): number {
  const totalBps = discounts.slice(0, throughIndex + 1).reduce((s, d) => s + d.bps, 0);
  return Math.round((baseRate - totalBps / 100) * 100) / 100;
}

function dedupeDiscounts(discounts: CreditQuoteResult["discountsApplied"]) {
  const seen = new Set<string>();
  return discounts.filter((d) => {
    const key = d.label.toLowerCase().replace(/[^a-záéíóúñ]/gi, "").slice(0, 12);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

type Props = {
  client: CreditClientProfile;
  quote: CreditQuoteResult;
  compliance: RuleCompliance[];
  complianceOk: boolean;
  scoreOk: boolean;
  floor: number;
  baseBeforeCross: number;
  crossSellOptions: CrossSellOption[];
  crossSellAccepted: Record<string, boolean>;
  totalCrossBps: number;
  potentialCrossBps: number;
  onCrossSellToggle: (id: string, on: boolean) => void;
  managerApproved: boolean;
  quoteFixed: boolean;
  quoteFixedAt: string | null;
  onApproveManager: () => void;
  onFixQuote: () => void;
};

export function CreditQuoteResultPanel({
  client,
  quote: q,
  compliance,
  complianceOk,
  scoreOk,
  floor,
  baseBeforeCross,
  crossSellOptions,
  crossSellAccepted,
  totalCrossBps,
  potentialCrossBps,
  onCrossSellToggle,
  managerApproved,
  quoteFixed,
  quoteFixedAt,
  onApproveManager,
  onFixQuote,
}: Props) {
  const pricingDiscounts = dedupeDiscounts(q.discountsApplied.filter((d) => !crossSellOptions.some((xs) => d.label.includes(xs.label.split(" ")[0]!))));

  return (
    <section className="cortex-quote-result" data-tour="credit-quote-result">
      <header className="cortex-quote-result__header">
        <div>
          <p className="cortex-quote-result__eyebrow">Resultado · Post verificación</p>
          <h3>Cumplimiento · {client.name}</h3>
        </div>
        <AppBadge tone={complianceOk && scoreOk ? "success" : "warning"}>
          {complianceOk && scoreOk ? "Score aceptable" : "Revisar condiciones"}
        </AppBadge>
      </header>

      <div className="cortex-quote-result__score">
        <span>Score buró</span>
        <strong>{client.creditScore}</strong>
        <span className="cortex-quote-result__score-hint">{scoreOk ? "≥ 650 · aceptable" : "< 650 · riesgo"}</span>
      </div>

      <div className="cortex-quote-result__section">
        <h4>Reglas evaluadas</h4>
        <table className="cortex-quote-result__rules-table">
          <thead>
            <tr>
              <th>Regla</th>
              <th>Detalle</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {compliance.map((r) => (
              <tr key={r.id}>
                <td>{r.label}</td>
                <td className="cortex-quote-result__muted">{r.detail}</td>
                <td>
                  <AppBadge tone={r.passed ? "success" : "error"} size="sm">
                    {r.passed ? "Cumple" : "No cumple"}
                  </AppBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cortex-quote-result__section">
        <h4>Tasa · cascada de descuentos</h4>
        <div className="cortex-quote-result__cascade">
          <div className="cortex-quote-result__cascade-row cortex-quote-result__cascade-row--base">
            <span>Tasa base</span>
            <strong>{formatPctCredit(q.baseRate)}</strong>
          </div>
          {pricingDiscounts.map((d, i) => (
            <div key={`${d.label}-${i}`} className="cortex-quote-result__cascade-row">
              <span>−{d.bps} pbs · {d.label}</span>
              <strong>{formatPctCredit(cascadeRate(q.baseRate, pricingDiscounts, i))}</strong>
            </div>
          ))}
          <div className="cortex-quote-result__cascade-row cortex-quote-result__cascade-row--final">
            <span>Tasa actual</span>
            <strong>{formatPctCredit(baseBeforeCross)}</strong>
          </div>
        </div>
        {q.decisionReason && <p className="cortex-quote-result__warn">{q.decisionReason}</p>}
      </div>

      {q.discountsPotential.length > 0 && (
        <div className="cortex-quote-result__section" data-tour="credit-quote-potential">
          <h4>Cross-sell disponible</h4>
          <p className="cortex-quote-result__hint">Productos complementarios para mejorar tasa y relación comercial.</p>
          <ul className="cortex-quote-result__xs-list">
            {q.discountsPotential.map((d) => (
              <li key={d.label}>−{d.bps} pbs · {d.label}</li>
            ))}
          </ul>
          <p className="cortex-quote-result__xs-total">
            Hasta <strong>−{potentialCrossBps} pbs</strong> · piso <strong>{formatPctCredit(floor)}</strong>
          </p>
        </div>
      )}

      <div className="cortex-quote-result__section" data-tour="credit-cross-sell">
        <div className="cortex-quote-result__xs-head">
          <h4>Activar cross-sell</h4>
          <span>En vivo: <strong>{formatPctCredit(q.finalRate)}</strong></span>
        </div>
        <p className="cortex-quote-result__hint">
          Desde <strong>{formatPctCredit(baseBeforeCross)}</strong> · cada producto resta pbs de la tasa
        </p>
        <ul className="cortex-quote-result__xs-steps">
          {crossSellOptions.map((xs, idx) => {
            const on = crossSellAccepted[xs.id];
            const stepRate = on
              ? crossSellRatePreview(baseBeforeCross, floor, crossSellOptions, crossSellAccepted, idx)
              : crossSellRatePreview(baseBeforeCross, floor, crossSellOptions, crossSellAccepted, idx, idx);
            return (
              <li key={xs.id} className={`cortex-quote-result__xs-step${on ? " cortex-quote-result__xs-step--on" : ""}`}>
                <AppCheckbox
                  id={`xs-${xs.id}`}
                  checked={on}
                  onChange={(e) => onCrossSellToggle(xs.id, e.target.checked)}
                  label={
                    <span className="cortex-quote-result__xs-step-label">
                      <strong>{idx + 1}. {xs.label}</strong>
                      <span>−{xs.bps} pbs · {xs.description}</span>
                    </span>
                  }
                />
                <span className="cortex-quote-result__xs-step-rate">
                  {on ? formatPctCredit(stepRate) : `→ ${formatPctCredit(stepRate)}`}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="cortex-quote-result__summary" data-tour="credit-rate-summary">
          <div className="cortex-quote-result__summary-rate">
            <span>{formatPctCredit(baseBeforeCross)}</span>
            <span>→</span>
            <strong>{formatPctCredit(q.finalRate)}</strong>
          </div>
          <p className="cortex-quote-result__hint">
            {formatPctCredit(baseBeforeCross)} − {totalCrossBps} pbs = {formatPctCredit(q.finalRate)} · piso {formatPctCredit(floor)}
          </p>
          <div className="cortex-quote-result__kpis">
            <div><span>Pago mensual</span><strong>{formatMxnCredit(q.monthlyPayment)}</strong></div>
            <div><span>CAT est.</span><strong>{formatPctCredit(q.estimatedCat)}</strong></div>
          </div>
        </div>
      </div>

      <footer className="cortex-quote-result__footer" data-tour="credit-fix-quote">
        <h4>Confirmar cotización</h4>
        <div className="cortex-quote-result__actions">
          {!managerApproved && q.decision !== "RECHAZADO" && (
            <AppButton tone="secondary" className="cortex-btn--lg" onClick={onApproveManager} data-tour="credit-manager-approve">
              Aprobación gerencial
            </AppButton>
          )}
          {managerApproved && (
            <AppBadge tone="success">Gerencia aprobó · {formatPctCredit(q.finalRate)}</AppBadge>
          )}
          {quoteFixed ? (
            <div className="cortex-quote-result__fixed">
              Tasa {formatPctCredit(q.finalRate)} fija · {q.termMonths} meses · Core ·{" "}
              {quoteFixedAt ? new Date(quoteFixedAt).toLocaleString("es-MX") : ""}
            </div>
          ) : (
            <AppButton
              tone="primary"
              className="cortex-btn--lg"
              onClick={onFixQuote}
              disabled={q.decision === "RECHAZADO" || !managerApproved}
            >
              Fijar y enviar al Core
            </AppButton>
          )}
        </div>
      </footer>
    </section>
  );
}
