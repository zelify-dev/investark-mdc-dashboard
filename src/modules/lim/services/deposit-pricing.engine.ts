import type {
  ClientOverride,
  ConditionalBonus,
  DemoClient,
  LimDemoState,
  PricingAuditEntry,
  PricingResult,
  TierRow,
  TreasurySummary,
} from "../types/deposit-pricing.types";
import { formatMxnCompact, formatMxnFull } from "@/modules/scotia/utils/format-mxn";

export function findTierForBalance(tiers: TierRow[], balance: number): TierRow | null {
  const sorted = [...tiers].sort((a, b) => a.tier - b.tier);
  for (const tier of sorted) {
    if (balance >= tier.balanceMin && (tier.balanceMax === null || balance <= tier.balanceMax)) {
      return tier;
    }
  }
  return sorted[sorted.length - 1] ?? null;
}

export function calculateClientRate(params: {
  client: DemoClient;
  tiersPm: TierRow[];
  tiersPf: TierRow[];
  tiieRate: number;
  override?: ClientOverride;
  bonuses: ConditionalBonus[];
}): PricingResult {
  const { client, tiersPm, tiersPf, tiieRate, override, bonuses } = params;
  const tiers = client.personType === "PM" ? tiersPm : tiersPf;
  const tier = findTierForBalance(tiers, client.averageBalance);
  if (!tier) {
    throw new Error(`No tier found for client ${client.id}`);
  }

  let factor = tier.tiieFactor;
  const appliedBonuses: string[] = [];

  for (const bonus of bonuses.filter((b) => b.clientId === client.id && b.active)) {
    const incremental = client.incrementalBalance30d ?? 0;
    if (incremental >= bonus.minIncrementalBalance) {
      factor += bonus.factorBonus;
      appliedBonuses.push(bonus.description);
    }
  }

  let rate = tiieRate * factor;
  let overrideApplied = false;
  let capMinApplied: number | undefined;
  let capMaxApplied: number | undefined;

  if (override?.capMax !== undefined && rate > override.capMax) {
    rate = override.capMax;
    capMaxApplied = override.capMax;
    overrideApplied = true;
  }
  if (override?.capMin !== undefined && rate < override.capMin) {
    rate = override.capMin;
    capMinApplied = override.capMin;
    overrideApplied = true;
  }

  return {
    clientId: client.id,
    tier: tier.tier,
    tierLabel: `Tier ${tier.tier} · ${tier.label}`,
    factor,
    tiieRate,
    rate: Math.round(rate * 10000) / 10000,
    appliedBonuses,
    overrideApplied,
    capMinApplied,
    capMaxApplied,
  };
}

export function recalculateAllClientRates(state: LimDemoState, user = "Motor LIM"): LimDemoState {
  const clientRates: LimDemoState["clientRates"] = {};
  const newAudit: PricingAuditEntry[] = [];

  for (const client of state.clients) {
    const override = state.overrides.find((o) => o.clientId === client.id);
    const prev = state.clientRates[client.id];
    const result = calculateClientRate({
      client,
      tiersPm: state.tiersPm,
      tiersPf: state.tiersPf,
      tiieRate: state.tiie.rate,
      override,
      bonuses: state.bonuses,
    });

    clientRates[client.id] = {
      rate: result.rate,
      factor: result.factor,
      tier: result.tier,
      tiieRate: result.tiieRate,
      calculatedAt: new Date().toISOString(),
      appliedBonuses: result.appliedBonuses,
      overrideApplied: result.overrideApplied,
    };

    if (prev && Math.abs(prev.rate - result.rate) > 0.0001) {
      newAudit.push({
        id: `audit-${Date.now()}-${client.id}`,
        timestamp: new Date().toISOString(),
        clientId: client.id,
        clientName: client.name,
        action: "RECALC_TIIE",
        tiieInput: state.tiie.rate,
        factorApplied: result.factor,
        rateBefore: prev.rate,
        rateAfter: result.rate,
        details: `Recálculo automático · ${result.tierLabel}${result.overrideApplied ? " · Override aplicado" : ""}`,
        user,
      });
    }
  }

  return {
    ...state,
    clientRates,
    auditLog: [...newAudit, ...state.auditLog].slice(0, 100),
  };
}

export function buildTreasurySummary(state: LimDemoState): TreasurySummary {
  const clientsByTierMap = new Map<number, { count: number; balance: number; totalRate: number }>();
  let totalBalance = 0;
  let projectedNii = 0;

  for (const client of state.clients) {
    const snap = state.clientRates[client.id];
    if (!snap) continue;
    totalBalance += client.averageBalance;
    projectedNii += (client.averageBalance * snap.rate) / 100;

    const existing = clientsByTierMap.get(snap.tier) ?? { count: 0, balance: 0, totalRate: 0 };
    existing.count += 1;
    existing.balance += client.averageBalance;
    existing.totalRate += snap.rate;
    clientsByTierMap.set(snap.tier, existing);
  }

  const clientsByTier = [...clientsByTierMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([tier, data]) => ({
      tier,
      count: data.count,
      balance: data.balance,
      avgRate: data.count > 0 ? Math.round((data.totalRate / data.count) * 10000) / 10000 : 0,
    }));

  const alerts: TreasurySummary["alerts"] = [];

  if (state.pendingApproval?.status === "PENDING") {
    alerts.push({
      id: "pending-tiie",
      type: "warning",
      message: `Cambio TIIE ±${state.pendingApproval.variationBps} pbs pendiente de aprobación tesorería`,
    });
  }

  const bonusPending = state.bonuses.find((b) => b.active && !b.crmNotified);
  if (bonusPending) {
    alerts.push({
      id: "crm-bonus",
      type: "success",
      message: `Bonificación activa para ${bonusPending.clientId} · CRM notificado`,
    });
  }

  const vipOverride = state.overrides.find((o) => o.capMin);
  if (vipOverride) {
    alerts.push({
      id: "vip-override",
      type: "info",
      message: `Override cap_min ${vipOverride.capMin}% activo en ${vipOverride.clientId}`,
    });
  }

  if (state.tiie.rate < 10) {
    alerts.push({
      id: "tiie-drop",
      type: "warning",
      message: `TIIE 28d en ${state.tiie.rate.toFixed(2)}% · Recálculo aplicado a cartera depósitos`,
    });
  }

  return {
    totalBalance,
    projectedNii: Math.round(projectedNii),
    clientsByTier,
    alerts,
    currencyCoverage: { mxn: 98.2, usd: 1.8 },
  };
}

export function tiieVariationBps(before: number, after: number): number {
  return Math.round((after - before) * 100);
}

export function formatMxn(value: number): string {
  return formatMxnCompact(value);
}

export { formatMxnFull };

export function formatPct(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}
