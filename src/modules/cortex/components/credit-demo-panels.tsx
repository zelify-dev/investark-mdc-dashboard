"use client";

import { useEffect, useReducer, useState } from "react";
import { Eye } from "lucide-react";
import { CATEGORY_LABELS } from "../data/credit-catalog";
import type { useCreditDemoStore } from "../hooks/use-credit-demo-store";
import {
  aiPropensity,
  evaluateRuleCompliance,
  formatMxnCredit,
  formatPctCredit,
  rateBeforeCrossSell,
} from "../services/credit-pricing.engine";
import type { CreditClientProfile, CreditProductCategory, CreditProductTemplate } from "../types/credit-pricing.types";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { ScotiaSectionHeader, displayClientId } from "@/modules/scotia/components/scotia-section-header";
import { CreditRulesPanel } from "./credit-rules-panel";
import { CreditQuoteResultPanel } from "./credit-quote-result-panel";
import "./credit-rules-panel.css";

type Store = ReturnType<typeof useCreditDemoStore>;

export function CreditAdminPanel({ store, activeCategory }: { store: Store; activeCategory: CreditProductCategory }) {
  const { state, selectClient, updateProduct } = store;
  const product = store.getProduct();
  const [local, dispatchLocal] = useReducer(
    (_state: CreditProductTemplate, action: { type: "sync"; product: CreditProductTemplate } | { type: "patch"; patch: Partial<CreditProductTemplate> }) => {
      if (action.type === "sync") return action.product;
      return { ..._state, ...action.patch };
    },
    product,
  );
  const [saved, setSaved] = useState(false);
  const [detailClient, setDetailClient] = useState<CreditClientProfile | null>(null);

  const categoryProducts = state.products.filter((p) => p.category === activeCategory);
  const filteredClients = state.clients.filter((c) => {
    const category = state.products.find((p) => p.id === c.productId)?.category;
    return category === activeCategory;
  });

  return (
    <div className="lim-panel scotia-workspace" data-tour="credit-product-admin">
      <ScotiaSectionHeader
        badge="CORTEX · Crédito"
        title="Catálogo de productos"
        subtitle={`${CATEGORY_LABELS[activeCategory]}`}
      />

      <section className="scotia-card">
        <div className="scotia-card__head">
          <div>
            <h3>Clientes</h3>
            <span className="lim-td-muted">Selecciona un cliente y abre el detalle KYC/KYB con un click</span>
          </div>
        </div>
        <p className="scotia-card__hint">
          {filteredClients.length} cliente(s) visibles · {CATEGORY_LABELS[activeCategory]}
        </p>
        <div className="scotia-credit-client-table-wrap">
          <table className="lim-table scotia-credit-client-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cliente</th>
                <th>Score</th>
                <th>KYC</th>
                <th>AML</th>
                <th>PEP</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((c) => {
                const cat = state.products.find((p) => p.id === c.productId)?.category;
                const overview = getClientOverview(c);
                const amlStatus = overview.statuses.find((status) => status.key === "aml")!;
                const kycStatus = overview.statuses.find((status) => status.key === "kyc")!;
                const pepStatus = overview.statuses.find((status) => status.key === "pep")!;

                return (
                  <tr
                    key={c.id}
                    className={state.selectedClientId === c.id ? "scotia-credit-client-table__row--active" : ""}
                    onClick={() => {
                      selectClient(c.id);
                      setDetailClient(c);
                    }}
                  >
                    <td>{cat === "automotriz" ? CATEGORY_LABELS.automotriz : CATEGORY_LABELS.personal}</td>
                    <td>
                      <strong className="scotia-credit-client-table__name">{c.name}</strong>
                    </td>
                    <td>
                      <span className={`scotia-credit-client-table__score scotia-credit-client-table__score--${overview.score.tone}`}>
                        {c.creditScore}
                      </span>
                    </td>
                    <td>
                      <span className={`scotia-credit-client-table__status scotia-credit-client-table__status--${kycStatus.tone}`}>
                        {kycStatus.value}
                      </span>
                    </td>
                    <td>
                      <span className={`scotia-credit-client-table__status scotia-credit-client-table__status--${amlStatus.tone}`}>
                        {amlStatus.value}
                      </span>
                    </td>
                    <td>
                      <span className={`scotia-credit-client-table__status scotia-credit-client-table__status--${pepStatus.tone}`}>{pepStatus.value}</span>
                    </td>
                    <td className="scotia-credit-client-table__detail-cell">
                      <span className="scotia-credit-client-table__link" aria-label={`Ver detalle de ${c.name}`}>
                        <Eye size={16} strokeWidth={2} />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {detailClient && (
        <ClientDetailModal
          client={detailClient}
          product={state.products.find((p) => p.id === detailClient.productId)!}
          onClose={() => setDetailClient(null)}
        />
      )}

      <section className="scotia-card" data-tour="credit-product-params">
        <div className="scotia-card__head">
          <h3>Parámetros · {local.name}</h3>
          <select
            className="lim-sel"
            value={local.id}
            onChange={(e) => {
              const nextProduct = store.getProduct(e.target.value);
              store.selectProduct(e.target.value);
              dispatchLocal({ type: "sync", product: nextProduct });
            }}
          >
            {categoryProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} · {p.name}
              </option>
            ))}
          </select>
        </div>
        <p className="scotia-card__hint">{local.description}</p>
        <ul className="scotia-restrictions-list">
          {local.restrictions.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <div className="scotia-summary-row">
          <div><span>Tasa base</span><strong>{local.baseRate}%</strong></div>
          <div><span>Banda</span><strong>{local.discountBandMin}% – {local.discountBandMax}%</strong></div>
          <div><span>Plazos</span><strong>{local.termMinMonths}–{local.termMaxMonths} meses</strong></div>
          <div><span>Monto máx.</span><strong>{formatMxnCredit(local.amountMax)}</strong></div>
        </div>
        <div className="lim-credit-params-grid">
          <ParamField label="Tasa base (%)" type="number" value={String(local.baseRate)} onChange={(v) => dispatchLocal({ type: "patch", patch: { baseRate: parseFloat(v) || 0 } })} />
          <ParamField label="Banda mín (%)" type="number" value={String(local.discountBandMin)} onChange={(v) => dispatchLocal({ type: "patch", patch: { discountBandMin: parseFloat(v) || 0 } })} />
          <ParamField label="Banda máx (%)" type="number" value={String(local.discountBandMax)} onChange={(v) => dispatchLocal({ type: "patch", patch: { discountBandMax: parseFloat(v) || 0 } })} />
          <ParamField label="Plazo mín" type="number" value={String(local.termMinMonths)} onChange={(v) => dispatchLocal({ type: "patch", patch: { termMinMonths: parseInt(v) || 0 } })} />
          <ParamField label="Plazo máx" type="number" value={String(local.termMaxMonths)} onChange={(v) => dispatchLocal({ type: "patch", patch: { termMaxMonths: parseInt(v) || 0 } })} />
          <ParamField label="Comisión (%)" type="number" value={String(local.openingFeePct)} onChange={(v) => dispatchLocal({ type: "patch", patch: { openingFeePct: parseFloat(v) || 0 } })} />
        </div>
        <button
          type="button"
          className="lim-btn-primary lim-btn-sm"
          onClick={() => {
            updateProduct(local);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
        >
          {saved ? "Parámetros fijados" : "Fijar parámetros"}
        </button>
      </section>
    </div>
  );
}

export function CreditQuotePanel({ store, activeCategory }: { store: Store; activeCategory: CreditProductCategory }) {
  const { state, runQuote, setCrossSellOption, runAiVerification, approveManager, fixQuote, toggleRule } = store;
  const product = store.getProduct();
  const client = store.getClient();
  const q = state.quote;
  const floor = product.discountBandMin;
  const crossSellOptions = state.crossSellByCategory[product.category];
  const crossSellLabels = crossSellOptions.map((o) => o.label);
  const propensity = aiPropensity(client);
  const compliance = evaluateRuleCompliance(client, product, state.rulesByCategory[activeCategory]);
  const complianceOk = compliance.every((r) => r.passed);
  const scoreOk = client.creditScore >= 650;

  useEffect(() => {
    if (!state.quote) runQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedClientId, state.selectedProductId]);

  const baseBeforeCross = q ? rateBeforeCrossSell(q.baseRate, q.discountsApplied, crossSellLabels) : product.baseRate;
  const totalCrossBps = crossSellOptions.filter((o) => state.crossSellAccepted[o.id]).reduce((s, o) => s + o.bps, 0);
  const potentialCrossBps = crossSellOptions.filter((o) => !state.crossSellAccepted[o.id]).reduce((s, o) => s + o.bps, 0);

  return (
    <div className="lim-panel scotia-workspace">
      <ScotiaSectionHeader
        badge="CORTEX · Cotización"
        title="Motor de decisión"
        subtitle={CATEGORY_LABELS[activeCategory]}
        metric={q ? formatPctCredit(q.finalRate) : "—"}
        metricLabel="Tasa"
      />

      <section className="scotia-card scotia-data-layer scotia-data-layer--compact" data-tour="credit-data-layer">
        <div className="scotia-card__head scotia-card__head--minimal">
          <h3>Origen de datos</h3>
          <AppBadge tone="neutral">Sincronizado</AppBadge>
        </div>
        <div className="scotia-data-flow scotia-data-flow--compact">
          <span>Core Banking</span>
          <span>→</span>
          <span>Data Layer</span>
          <span>→</span>
          <span>CORTEX</span>
        </div>
      </section>

      <CreditRulesPanel
        category={activeCategory}
        rules={state.rulesByCategory[activeCategory]}
        onToggle={(ruleId, enabled) => toggleRule(activeCategory, ruleId, enabled)}
      />

      <section className="cortex-ai-panel" data-tour="credit-ai-recommend">
        <header className="cortex-ai-panel__header">
          <div>
            <p className="cortex-ai-panel__eyebrow">Paso 3 · Verificación</p>
            <h3>Scoring inteligente CORTEX</h3>
            <p className="cortex-ai-panel__hint">Ejecutar después de configurar reglas y seleccionar cliente.</p>
          </div>
          <div className="cortex-ai-panel__metric">
            <span>Propensión cross-sell</span>
            <strong>{propensity}%</strong>
          </div>
        </header>
        <p className="cortex-ai-panel__rec">
          Sugerencia: {crossSellOptions.slice(0, 2).map((o) => o.label).join(" + ")} · hasta −{crossSellOptions.slice(0, 2).reduce((s, o) => s + o.bps, 0)} pbs
        </p>
        <div className="cortex-ai-panel__actions">
          <AppButton tone="primary" className="cortex-btn--lg" onClick={runAiVerification} data-tour="credit-ai-verify-btn">
            {state.aiVerificationRun ? "Re-ejecutar verificación" : "Ejecutar verificación IA"}
          </AppButton>
        </div>
        {state.aiBatchResults.length > 0 && (
          <div className="cortex-ai-panel__batch" data-tour="credit-ai-batch">
            <table className="cortex-ai-panel__table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Score</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {state.aiBatchResults.map((r) => (
                  <tr key={r.clientId}>
                    <td>{r.clientName}</td>
                    <td>{r.score}</td>
                    <td>
                      <AppBadge tone={r.approved ? "success" : "error"} size="sm">
                        {r.approved ? "Aprobado" : "Rechazado"}
                      </AppBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="cortex-ai-panel__summary">
              {state.aiBatchResults.filter((r) => r.approved).length} aprobados · {state.aiBatchResults.filter((r) => !r.approved).length} rechazado(s)
            </p>
          </div>
        )}
      </section>

      {state.aiVerificationRun && q && (
        <CreditQuoteResultPanel
          client={client}
          quote={q}
          compliance={compliance}
          complianceOk={complianceOk}
          scoreOk={scoreOk}
          floor={floor}
          baseBeforeCross={baseBeforeCross}
          crossSellOptions={crossSellOptions}
          crossSellAccepted={state.crossSellAccepted}
          totalCrossBps={totalCrossBps}
          potentialCrossBps={potentialCrossBps}
          onCrossSellToggle={setCrossSellOption}
          managerApproved={state.managerApproved}
          quoteFixed={state.quoteFixed}
          quoteFixedAt={state.quoteFixedAt}
          onApproveManager={approveManager}
          onFixQuote={fixQuote}
        />
      )}
    </div>
  );
}

export function CreditAuditPanel({ store }: { store: Store }) {
  const { state } = store;
  return (
    <div className="lim-panel scotia-workspace" data-tour="credit-audit-log">
      <ScotiaSectionHeader badge="CORTEX · Auditoría" title="Trazabilidad" subtitle="Reglas, IA, cross-sell y fijaciones." />
      <section className="scotia-card">
        <table className="lim-tbl lim-tbl--list scotia-table-compact">
          <thead><tr>{["Fecha", "Acción", "Detalle", "Canal", "Usuario", "Correlación", "Tasa antes", "Tasa después"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {state.auditLog.map((e) => (
              <tr key={e.id}>
                <td className="lim-td-muted">{new Date(e.timestamp).toLocaleString("es-MX")}</td>
                <td><span className="lim-pill lim-pill--blue">{e.action}</span></td>
                <td className="lim-td-muted">{e.details}</td>
                <td>{e.channel}</td>
                <td>{e.user}</td>
                <td className="lim-td-muted">{e.correlationId}</td>
                <td className="lim-td-n">{e.rateBefore !== undefined ? formatPctCredit(e.rateBefore) : "—"}</td>
                <td className="lim-td-n">{e.rateAfter !== undefined ? formatPctCredit(e.rateAfter) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function ClientDetailModal({
  client,
  product,
  onClose,
}: {
  client: CreditClientProfile;
  product: CreditProductTemplate;
  onClose: () => void;
}) {
  const overview = getClientOverview(client);
  const scoreFill = Math.max(0, Math.min(100, ((client.creditScore - 400) / 450) * 100));

  return (
    <div className="scotia-modal-backdrop" onClick={onClose}>
      <div className="scotia-modal" onClick={(e) => e.stopPropagation()}>
        <div className="scotia-modal__head">
          <div>
            <p className="scotia-modal__eyebrow">{client.entityType === "PM" ? "Persona moral" : "Persona física"} · {displayClientId(client.id)}</p>
            <h3>{client.name}</h3>
          </div>
          <button type="button" className="scotia-tour-close" onClick={onClose}>×</button>
        </div>
        <div className="scotia-modal__summary">
          <div className={`scotia-modal__score-card scotia-modal__score-card--${overview.score.tone}`}>
            <div className="scotia-modal__score-head">
              <span>Score crediticio</span>
              <em>{client.creditScore}/850</em>
            </div>
            <div className="scotia-modal__score-body">
              <strong>{client.creditScore}</strong>
              <p>{overview.score.label}</p>
            </div>
            <div className="scotia-modal__score-meter" aria-hidden="true">
              <span style={{ width: `${scoreFill}%` }} />
            </div>
            <div className="scotia-modal__score-meta">
              <span>{overview.entityLabel}</span>
              <span>{product.name}</span>
            </div>
          </div>
          <div className="scotia-modal__status-panel">
            <div className="scotia-modal__status-grid">
              {overview.statuses.map((status) => (
                <div key={status.key} className={`scotia-modal__status-card scotia-modal__status-card--${status.tone}`}>
                  <span>{status.label}</span>
                  <strong>{status.value}</strong>
                </div>
              ))}
            </div>
            <div className="scotia-modal__identity-row">
              <span>{displayClientId(client.id)}</span>
              <span>{client.sourceCustomerId ? `Origen ${client.sourceCustomerId}` : "Origen cliente base"}</span>
            </div>
          </div>
        </div>

        <section className="scotia-modal__section">
          <div className="scotia-modal__section-head">
            <h4>Datos KYC</h4>
            <span>{product.name}</span>
          </div>
          <div className="scotia-modal__grid">
            <div><span>RFC</span><strong>{client.kyc.rfc}</strong></div>
            {client.kyc.curp && <div><span>CURP</span><strong>{client.kyc.curp}</strong></div>}
            <div><span>Teléfono</span><strong>{client.kyc.phone}</strong></div>
            <div><span>Email</span><strong>{client.kyc.email}</strong></div>
            {client.kyc.birthDate && <div><span>Nacimiento</span><strong>{client.kyc.birthDate}</strong></div>}
            <div><span>Dirección</span><strong>{client.kyc.address}</strong></div>
            {client.kyc.idDocument && <div><span>INE</span><strong>{client.kyc.idDocument}</strong></div>}
            {client.kyc.incomeMonthly && <div><span>Ingreso</span><strong>{formatMxnCredit(client.kyc.incomeMonthly)}/mes</strong></div>}
          </div>
        </section>

        {client.entityType === "PM" ? (
          <section className="scotia-modal__section">
            <div className="scotia-modal__section-head">
              <h4>Datos KYB</h4>
              <span>{client.kyb?.amlRisk ?? "Sin riesgo"}</span>
            </div>
            <div className="scotia-modal__grid">
              <div><span>Razón social</span><strong>{client.kyb?.legalName ?? "—"}</strong></div>
              <div><span>Sector</span><strong>{client.kyb?.sector ?? "—"}</strong></div>
              <div><span>Empleados</span><strong>{client.kyb?.employees ?? "—"}</strong></div>
              <div><span>AML</span><strong>{client.kyb?.amlRisk ?? "—"}</strong></div>
              <div><span>Beneficiarios</span><strong>{client.kyb?.beneficialOwnersVerified ? "Verificados" : "Pendiente"}</strong></div>
            </div>
          </section>
        ) : (
          <section className="scotia-modal__section">
            <div className="scotia-modal__section-head">
              <h4>Persona física</h4>
              <span>No aplica KYB</span>
            </div>
            <p className="scotia-modal__empty">
              Este cliente es una persona física. La validación central es KYC.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

function getClientOverview(client: CreditClientProfile) {
  const score =
    client.creditScore >= 700
      ? { label: "Perfil fuerte", shortLabel: "Fuerte", tone: "strong" as const }
      : client.creditScore >= 650
        ? { label: "Perfil estandar", shortLabel: "Estandar", tone: "standard" as const }
        : { label: "Perfil de revision", shortLabel: "Revision", tone: "review" as const };

  const statuses = [
    {
      key: "kyc",
      label: "KYC",
      value: client.kyc.idVerified ? "Verificado" : "Pendiente",
      tone: client.kyc.idVerified ? ("ok" as const) : ("warn" as const),
    },
    {
      key: "aml",
      label: "AML",
      value: client.kyc.amlApproved ? "Aprobado" : client.kyc.amlApproved === false ? "Bloqueado" : "Pendiente",
      tone: client.kyc.amlApproved ? ("ok" as const) : client.kyc.amlApproved === false ? ("bad" as const) : ("warn" as const),
    },
    {
      key: "pep",
      label: "PEP",
      value: client.kyc.pep ? "Si" : "No",
      tone: client.kyc.pep ? ("warn" as const) : ("ok" as const),
    },
  ];

  return {
    entityLabel: client.entityType === "PM" ? "Persona moral" : "Persona fisica",
    score,
    statuses,
  };
}

function ParamField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="lim-credit-param">
      <span>{label}</span>
      <input className="lim-pricing-input lim-credit-param-input" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
