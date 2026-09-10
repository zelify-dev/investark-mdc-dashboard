"use client";

import { useMemo, useState } from "react";
import { AppSelect } from "@/components/ui/atoms/select/app-select";
import type { CreditClientProfile } from "@/modules/cortex/types/credit-pricing.types";
import { ScotiaSectionHeader, displayClientId } from "@/modules/scotia/components/scotia-section-header";
import { getCreditClientForDeposit } from "@/modules/scotia/data/scotia-demo-bridge";
import type { useLimDemoStore } from "../hooks/use-lim-demo-store";
import { formatMxn, formatPct } from "../services/deposit-pricing.engine";
import type { DemoClient, PersonType } from "../types/deposit-pricing.types";

type Store = ReturnType<typeof useLimDemoStore>;
type ClientTypeFilter = "ALL" | PersonType;
type BalanceRangeFilter = "ALL" | "LOW" | "MID" | "UPPER_MID" | "HIGH";

function getClientTypeLabel(type: PersonType) {
  return type === "PM" ? "Persona moral" : "Persona física";
}

function getBalanceRangeLabel(value: BalanceRangeFilter) {
  switch (value) {
    case "LOW":
      return "Hasta $250 mil";
    case "MID":
      return "$250 mil a $1 millón";
    case "UPPER_MID":
      return "$1 millón a $50 millones";
    case "HIGH":
      return "Más de $50 millones";
    default:
      return "Todos los saldos";
  }
}

function matchesBalanceRange(balance: number, range: BalanceRangeFilter) {
  switch (range) {
    case "LOW":
      return balance <= 250_000;
    case "MID":
      return balance > 250_000 && balance <= 1_000_000;
    case "UPPER_MID":
      return balance > 1_000_000 && balance <= 50_000_000;
    case "HIGH":
      return balance > 50_000_000;
    default:
      return true;
  }
}

function matchesFilters(
  client: DemoClient,
  state: Store["state"],
  clientType: ClientTypeFilter,
  tierFilter: string,
  balanceRange: BalanceRangeFilter,
) {
  const snap = state.clientRates[client.id];
  if (clientType !== "ALL" && client.personType !== clientType) return false;
  if (tierFilter !== "ALL" && String(snap?.tier ?? "") !== tierFilter) return false;
  if (!matchesBalanceRange(client.averageBalance, balanceRange)) return false;
  return true;
}

function ClientRatesTable({
  title,
  subtitle,
  clients,
  state,
  creditClients,
  showLoanColumn,
}: {
  title: string;
  subtitle?: string;
  clients: DemoClient[];
  state: Store["state"];
  creditClients: CreditClientProfile[];
  showLoanColumn?: boolean;
}) {
  return (
    <section className="scotia-card">
      <div className="scotia-card__head">
        <h3>{title}</h3>
        {subtitle && <span className="lim-td-muted">{subtitle}</span>}
      </div>
      {clients.length === 0 ? (
        <div className="lim-treasury-empty">No hay clientes que coincidan con los filtros aplicados.</div>
      ) : (
        <table className="lim-tbl lim-tbl--list scotia-table-compact">
          <thead>
            <tr>
              {["Cliente", "Saldo actual", ...(showLoanColumn ? ["Monto vinculado"] : []), "Tier asignado", "Tasa final"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => {
              const snap = state.clientRates[client.id];
              const credit = getCreditClientForDeposit(client, creditClients);
              return (
                <tr key={client.id}>
                  <td>
                    <strong>{client.name}</strong>
                    <div className="lim-td-muted">{displayClientId(client.id)} · {getClientTypeLabel(client.personType)}</div>
                  </td>
                  <td className="lim-td-n">{formatMxn(client.averageBalance)}</td>
                  {showLoanColumn && (
                    <td className="lim-td-n lim-td-credit">
                      {credit ? formatMxn(credit.amount) : client.loanAmountMxn ? formatMxn(client.loanAmountMxn) : "—"}
                    </td>
                  )}
                  <td>T{snap?.tier ?? "—"}</td>
                  <td className="lim-td-n lim-val-up">{snap ? formatPct(snap.rate) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}

export function LimTreasuryDepositsPanel({
  store,
  creditClients = [],
}: {
  store: Store;
  creditClients?: CreditClientProfile[];
}) {
  const { state, treasury } = store;
  const [clientTypeFilter, setClientTypeFilter] = useState<ClientTypeFilter>("ALL");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [balanceRangeFilter, setBalanceRangeFilter] = useState<BalanceRangeFilter>("ALL");
  const avgRate =
    state.clients.length > 0
      ? state.clients.reduce((sum, c) => sum + (state.clientRates[c.id]?.rate ?? 0), 0) / state.clients.length
      : 0;

  const featuredClients = state.clients.filter((c) => c.featuredCase);
  const creditPortfolioClients = state.clients.filter((c) => !c.featuredCase);
  const tierOptions = useMemo(
    () => treasury.clientsByTier.map((row) => ({ value: String(row.tier), label: `Tier ${row.tier}` })),
    [treasury.clientsByTier],
  );
  const filteredFeaturedClients = useMemo(
    () => featuredClients.filter((client) => matchesFilters(client, state, clientTypeFilter, tierFilter, balanceRangeFilter)),
    [featuredClients, state, clientTypeFilter, tierFilter, balanceRangeFilter],
  );
  const filteredCreditPortfolioClients = useMemo(
    () => creditPortfolioClients.filter((client) => matchesFilters(client, state, clientTypeFilter, tierFilter, balanceRangeFilter)),
    [creditPortfolioClients, state, clientTypeFilter, tierFilter, balanceRangeFilter],
  );
  const filteredCount = filteredFeaturedClients.length + filteredCreditPortfolioClients.length;

  return (
    <div className="lim-panel scotia-workspace" data-tour="lim-treasury">
      <ScotiaSectionHeader
        badge="LIM · Tesorería"
        title="Cartera de depósitos"
        subtitle=" "
        metric={formatPct(state.tiie.rate)}
        metricLabel="TIIE 28d"
      />

      <section className="scotia-card">
        <div className="scotia-card__head">
          <h3>Resumen de cartera</h3>
          <span className="lim-td-muted">Vista ejecutiva de la cartera de depósitos.</span>
        </div>
        <div className="scotia-summary-row scotia-summary-row--5">
          <div><span>Saldo total</span><strong>{formatMxn(treasury.totalBalance)}</strong></div>
          <div><span>Clientes</span><strong>{state.clients.length}</strong></div>
          <div><span>Tasa promedio pagada</span><strong>{formatPct(avgRate)}</strong></div>
          <div><span>TIIE 28d</span><strong>{formatPct(state.tiie.rate)}</strong></div>
          <div><span>Fecha de cálculo</span><strong>{state.tiie.effectiveDate}</strong></div>
        </div>

        <div className="lim-pricing-grid-2 lim-treasury-overview-grid">
          <section className="scotia-card">
            <div className="scotia-card__head">
              <h3>Distribución por tier</h3>
              <span className="lim-td-muted">Cómo se reparte la cartera por banda de saldo y tasa.</span>
            </div>
            <table className="lim-tbl lim-tbl--list scotia-table-compact">
              <thead>
                <tr>{["Tier", "Clientes", "Saldo total", "Tasa promedio pagada"].map((h) => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {treasury.clientsByTier.map((row) => (
                  <tr key={row.tier}>
                    <td><strong>T{row.tier}</strong></td>
                    <td>{row.count}</td>
                    <td className="lim-td-n">{formatMxn(row.balance)}</td>
                    <td className="lim-td-n lim-val-up">{formatPct(row.avgRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="scotia-card">
            <div className="scotia-card__head">
              <h3>Filtros de análisis</h3>
              <span className="lim-td-muted">Filtra la cartera por tipo de cliente, tier y rango de saldo.</span>
            </div>
            <div className="lim-treasury-filters">
              <div className="lim-treasury-filter">
                <span>Tipo de cliente</span>
                <AppSelect value={clientTypeFilter} onChange={(e) => setClientTypeFilter(e.target.value as ClientTypeFilter)}>
                  <option value="ALL">Todos</option>
                  <option value="PM">Persona moral</option>
                  <option value="PF">Persona física</option>
                </AppSelect>
              </div>
              <div className="lim-treasury-filter">
                <span>Tier</span>
                <AppSelect value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
                  <option value="ALL">Todos</option>
                  {tierOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </AppSelect>
              </div>
              <div className="lim-treasury-filter">
                <span>Rango de saldo</span>
                <AppSelect value={balanceRangeFilter} onChange={(e) => setBalanceRangeFilter(e.target.value as BalanceRangeFilter)}>
                  <option value="ALL">Todos los saldos</option>
                  <option value="LOW">Hasta $250 mil</option>
                  <option value="MID">$250 mil a $1 millón</option>
                  <option value="UPPER_MID">$1 millón a $50 millones</option>
                  <option value="HIGH">Más de $50 millones</option>
                </AppSelect>
              </div>
            </div>
            <div className="lim-treasury-filter-summary">
              <strong>{filteredCount}</strong> cliente(s) visibles · {getBalanceRangeLabel(balanceRangeFilter)}
            </div>
          </section>
        </div>
      </section>

      <ClientRatesTable
        title="Clientes corporativos"
        subtitle="Casos destacados para explicar el comportamiento del pricing en cartera corporativa."
        clients={filteredFeaturedClients}
        state={state}
        creditClients={creditClients}
        showLoanColumn
      />

      <ClientRatesTable
        title="Clientes vinculados"
        subtitle="Clientes operativos con tasa final calculada según su saldo y tier asignado."
        clients={filteredCreditPortfolioClients}
        state={state}
        creditClients={creditClients}
        showLoanColumn
      />
    </div>
  );
}
