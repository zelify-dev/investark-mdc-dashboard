/** Base histórica del mock Cashflow · se escala al saldo cartera LIM en tiempo real. */
export const LCC_LEGACY_BASE_CASH_MXN = 2_469_770;

export const LCC_MONTHLY_INFLOW_BASE_MXN = 1_180_000;
export const LCC_MONTHLY_OUTFLOW_BASE_MXN = 1_020_000;
export const LCC_LIQUIDITY_RESERVE_BASE_MXN = 250_000;

export const LCC_INVEST_BASE = {
  moneyMarket6m: 700_000,
  fondo3m: 400_000,
  cete90d: 180_000,
  cete28d: 100_000,
  repo1d: 120_000,
} as const;

export const LCC_FLOW_30D_BASE = {
  projectedOutflows: 1_030_000,
  recognizedInflows: 410_000,
  currentLiabilities: 900_000,
} as const;

export const LCC_EXPECTED_30D_BASE = {
  inflows: 1_340_000,
  outflows: 1_030_000,
} as const;

/** Escala un monto de la demo legacy al saldo cartera vigente. */
export function scaleToPortfolio(amount: number, portfolioBalanceMxn: number): number {
  if (portfolioBalanceMxn <= 0) return amount;
  return Math.round((amount * portfolioBalanceMxn) / LCC_LEGACY_BASE_CASH_MXN);
}
