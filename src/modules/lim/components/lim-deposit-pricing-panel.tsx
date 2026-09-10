"use client";

import { useState } from "react";
import type { CreditClientProfile } from "@/modules/cortex/types/credit-pricing.types";
import { ScotiaSectionHeader, displayClientId } from "@/modules/scotia/components/scotia-section-header";
import { formatMxn, formatPct } from "../services/deposit-pricing.engine";
import type { useLimDemoStore } from "../hooks/use-lim-demo-store";
import type { TierRow } from "../types/deposit-pricing.types";

type Store = ReturnType<typeof useLimDemoStore>;

function normalizeMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function buildTierLabel(balanceMin: number, balanceMax: number | null): string {
  const min = formatMxn(balanceMin);
  if (balanceMax === null) return `>= ${min}`;
  return `${min} — ${formatMxn(balanceMax)}`;
}

function normalizeTierRows(rows: TierRow[]): TierRow[] {
  return rows
    .map((row, index) => {
      const balanceMin = normalizeMoney(row.balanceMin);
      const balanceMax =
        row.balanceMax === null
          ? null
          : normalizeMoney(row.balanceMax);
      const tier = Number.isFinite(row.tier) ? Math.max(1, Math.round(row.tier)) : index + 1;
      const tiieFactor = Number.isFinite(row.tiieFactor) ? Math.max(0, row.tiieFactor) : 0;
      return {
        ...row,
        tier,
        balanceMin,
        balanceMax,
        tiieFactor: Math.round(tiieFactor * 10000) / 10000,
        label: buildTierLabel(balanceMin, balanceMax),
      };
    })
    .sort((a, b) => a.balanceMin - b.balanceMin)
    .map((row, index) => ({
      ...row,
      tier: index + 1,
      label: buildTierLabel(row.balanceMin, row.balanceMax),
    }));
}

function validateTierRows(rows: TierRow[]): { ok: true; tiers: TierRow[] } | { ok: false; message: string } {
  const normalized = normalizeTierRows(rows);
  if (normalized.length === 0) {
    return { ok: false, message: "Debe existir al menos un tier." };
  }

  for (const row of normalized) {
    if (row.balanceMax !== null && row.balanceMax < row.balanceMin) {
      return { ok: false, message: `El Tier ${row.tier} tiene saldo máximo menor al mínimo.` };
    }
  }

  const byBalance = [...normalized].sort((a, b) => a.balanceMin - b.balanceMin);
  if (byBalance[0]?.balanceMin !== 0) {
    return { ok: false, message: "El primer tier debe iniciar en 0." };
  }

  for (let i = 0; i < byBalance.length - 1; i++) {
    const current = byBalance[i]!;
    const next = byBalance[i + 1]!;
    if (current.balanceMax === null) {
      return { ok: false, message: "Solo el último tier puede quedar sin saldo máximo." };
    }
    if (next.balanceMin <= current.balanceMax) {
      return { ok: false, message: `Los tiers ${current.tier} y ${next.tier} se traslapan en saldos.` };
    }
  }

  const last = byBalance[byBalance.length - 1]!;
  if (last.balanceMax !== null) {
    return { ok: false, message: "El último tier debe quedar sin saldo máximo (sin tope)." };
  }

  return { ok: true, tiers: normalized };
}

function TierTableEditor({
  title,
  idPrefix,
  tiers,
  tiieRate,
  onSave,
}: {
  title: string;
  idPrefix: "pm" | "pf";
  tiers: TierRow[];
  tiieRate: number;
  onSave: (tiers: TierRow[]) => void;
}) {
  const [local, setLocal] = useState(() => normalizeTierRows(tiers));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateRow = (tierId: string, patch: Partial<TierRow>) => {
    setLocal((prev) => normalizeTierRows(
      prev.map((row) => {
        if (row.id !== tierId) return row;
        const next = { ...row, ...patch };
        return {
          ...next,
          balanceMin: normalizeMoney(next.balanceMin),
          balanceMax: next.balanceMax === null ? null : normalizeMoney(next.balanceMax),
          label: buildTierLabel(normalizeMoney(next.balanceMin), next.balanceMax === null ? null : normalizeMoney(next.balanceMax)),
        };
      }),
    ));
    setSaved(false);
    setError(null);
  };

  const addTierRow = () => {
    setLocal((prev) => {
      const normalized = normalizeTierRows(prev);
      const lastNonNullMax = normalized
        .map((row) => row.balanceMax)
        .filter((value): value is number => value !== null)
        .reduce((max, value) => Math.max(max, value), 0);
      const balanceMin = lastNonNullMax > 0 ? lastNonNullMax + 1 : 0;
      const newRow: TierRow = {
        id: `${idPrefix}-tier-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tier: normalized.length + 1,
        balanceMin,
        balanceMax: null,
        tiieFactor: 0.2,
        label: buildTierLabel(balanceMin, null),
      };
      return normalizeTierRows([...normalized, newRow]);
    });
    setSaved(false);
    setError(null);
  };

  const removeTierRow = (tierId: string) => {
    setLocal((prev) => normalizeTierRows(prev.filter((row) => row.id !== tierId)));
    setSaved(false);
    setError(null);
  };

  return (
    <section className="scotia-card scotia-card--nested">
      <div className="scotia-card__head">
        <h3>{title}</h3>
        <div className="lim-tier-toolbar">
          <button type="button" className="lim-btn-ghost lim-btn-sm" onClick={addTierRow}>
            Agregar tier
          </button>
          <button
            type="button"
            className="lim-btn-primary lim-btn-sm"
            onClick={() => {
              const validation = validateTierRows(local);
              if (!validation.ok) {
                setError(validation.message);
                return;
              }
              onSave(validation.tiers);
              setLocal(validation.tiers);
              setSaved(true);
              setError(null);
              setTimeout(() => setSaved(false), 2000);
            }}
          >
            {saved ? "Guardado" : "Guardar"}
          </button>
        </div>
      </div>
      {error && <div className="lim-pricing-alert lim-pricing-alert--warning">{error}</div>}
      <table className="lim-tbl lim-tbl--list scotia-table-compact">
        <thead>
          <tr>
            {["Tier", "Saldo mínimo", "Saldo máximo", "Factor", "Tasa", "Acciones"].map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {local.map((tier) => (
            <tr key={tier.id}>
              <td>
                <strong>T{tier.tier}</strong>
              </td>
              <td>
                <input
                  className="lim-pricing-input lim-pricing-input--wide"
                  type="number"
                  min={0}
                  step={1}
                  value={tier.balanceMin}
                  onChange={(e) => {
                    const next = parseInt(e.target.value, 10);
                    updateRow(tier.id, { balanceMin: Number.isFinite(next) ? next : 0 });
                  }}
                />
              </td>
              <td>
                <div className="lim-tier-max-cell">
                  <input
                    className="lim-pricing-input lim-pricing-input--wide"
                    type="number"
                    min={0}
                    step={1}
                    disabled={tier.balanceMax === null}
                    value={tier.balanceMax ?? ""}
                    placeholder="Sin tope"
                    onChange={(e) => {
                      const raw = e.target.value.trim();
                      if (!raw) {
                        updateRow(tier.id, { balanceMax: null });
                        return;
                      }
                      const next = parseInt(raw, 10);
                      updateRow(tier.id, { balanceMax: Number.isFinite(next) ? next : null });
                    }}
                  />
                  <label className="lim-tier-max-toggle">
                    <input
                      type="checkbox"
                      checked={tier.balanceMax === null}
                      onChange={(e) => {
                        updateRow(tier.id, {
                          balanceMax: e.target.checked ? null : tier.balanceMin + 1,
                        });
                      }}
                    />
                    Sin tope
                  </label>
                </div>
              </td>
              <td>
                <input
                  className="lim-pricing-input"
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={tier.tiieFactor}
                  onChange={(e) => {
                    const factor = parseFloat(e.target.value);
                    updateRow(tier.id, { tiieFactor: Number.isFinite(factor) ? factor : 0 });
                  }}
                />
              </td>
              <td className="lim-td-n lim-val-up">{formatPct(tiieRate * tier.tiieFactor)}</td>
              <td>
                <button
                  type="button"
                  className="lim-btn-ghost lim-btn-sm"
                  disabled={local.length <= 1}
                  onClick={() => removeTierRow(tier.id)}
                >
                  Quitar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="lim-td-muted">
        Rango calculado por tier: {local.map((tier) => `T${tier.tier}: ${buildTierLabel(tier.balanceMin, tier.balanceMax)}`).join(" · ")}
      </p>
    </section>
  );
}

export function LimDepositPricingPanel(props: {
  store: Store;
  creditClients?: CreditClientProfile[];
}) {
  const { store } = props;
  const { state, updateTiersPm, updateTiersPf } = store;
  const pmTierSignature = state.tiersPm
    .map((tier) => `${tier.id}-${tier.tier}-${tier.balanceMin}-${tier.balanceMax ?? "open"}-${tier.tiieFactor}`)
    .join("|");
  const pfTierSignature = state.tiersPf
    .map((tier) => `${tier.id}-${tier.tier}-${tier.balanceMin}-${tier.balanceMax ?? "open"}-${tier.tiieFactor}`)
    .join("|");
  const creditPortfolio = state.clients.filter((c) => !c.featuredCase);

  return (
    <div className="lim-panel scotia-workspace">
      <ScotiaSectionHeader
        badge="LIM · Depósitos"
        title="Pricing dinámico"
        subtitle="Tres escenarios corporativos en paralelo + cartera CORTEX vinculada."
        metric={formatPct(state.tiie.rate)}
        metricLabel="TIIE 28d"
      />

      <section className="scotia-card scotia-card--flat" data-tour="lim-tiers-config">
        <div className="scotia-card__head">
          <h3>Tablas tier</h3>
          <span className="lim-td-muted">Vigencia {state.tiie.effectiveDate}</span>
        </div>
        <div className="lim-pricing-grid-2">
          <TierTableEditor
            key={`pm-${pmTierSignature}`}
            title="Persona moral"
            idPrefix="pm"
            tiers={state.tiersPm}
            tiieRate={state.tiie.rate}
            onSave={updateTiersPm}
          />
          <TierTableEditor
            key={`pf-${pfTierSignature}`}
            title="Persona física"
            idPrefix="pf"
            tiers={state.tiersPf}
            tiieRate={state.tiie.rate}
            onSave={updateTiersPf}
          />
        </div>
      </section>

      {creditPortfolio.length > 0 && (
        <section className="scotia-card scotia-card--flat lim-pricing-credit-portfolio" data-tour="lim-credit-deposits">
          <div className="scotia-card__head">
            <h3>Cartera CORTEX · depósitos vinculados</h3>
            <span className="lim-td-muted">Clientes vinculados con relación activa en CORTEX y tasa de depósito calculada por LCC.</span>
          </div>
          <div className="lim-credit-deposit-grid">
            {creditPortfolio.map((client) => {
              const pricing = store.getClientPricing(client.id);
              if (!pricing) return null;
              return (
                <article key={client.id} className="lim-credit-deposit-card">
                  <strong>{client.name}</strong>
                  <span className="lim-td-muted">{displayClientId(client.id)}</span>
                  <div className="lim-credit-deposit-card__row">
                    <span>Depósito</span>
                    <strong>{formatMxn(client.averageBalance)}</strong>
                  </div>
                  <div className="lim-credit-deposit-card__row">
                    <span>Tasa</span>
                    <strong className="lim-val-up">{formatPct(pricing.rate)}</strong>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="scotia-card scotia-card--flat lim-pricing-treasury-preview">
        <div className="scotia-card__head">
          <h3>Vista Tesorería</h3>
          <span className="lim-td-muted">Actualización dinámica · mismo motor LIM</span>
        </div>
        <div className="scotia-summary-row scotia-summary-row--4">
          <div><span>Saldo cartera</span><strong>{formatMxn(store.treasury.totalBalance)}</strong></div>
          <div><span>Clientes</span><strong>{state.clients.length}</strong></div>
          <div><span>Alertas activas</span><strong>{store.treasury.alerts.length}</strong></div>
        </div>
      </section>
    </div>
  );
}
