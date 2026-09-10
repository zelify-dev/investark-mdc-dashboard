export type PersonType = "PF" | "PM";
export type BalanceMetric = "SPD" | "SPM";
export type DepositProductType = "VISTA" | "PLAZO";

export interface TierRow {
  id: string;
  tier: number;
  balanceMin: number;
  balanceMax: number | null;
  tiieFactor: number;
  label: string;
}

export interface TiieSnapshot {
  rate: number;
  effectiveDate: string;
  source: string;
  history: { date: string; rate: number }[];
}

export interface DemoClient {
  id: string;
  name: string;
  personType: PersonType;
  averageBalance: number;
  balanceMetric: BalanceMetric;
  productTypes: DepositProductType[];
  incrementalBalance30d?: number;
  segment?: string;
  /** Mismo id que en CORTEX cuando el depósito refleja la relación de crédito. */
  creditClientId?: string;
  /** Monto del préstamo activo (MXN); en casos featured puede diferir del saldo SPM. */
  loanAmountMxn?: number;
  /** Caso corporativo destacado en pricing (PM-DEMO-00x). */
  featuredCase?: boolean;
}

export interface ClientOverride {
  clientId: string;
  capMin?: number;
  capMax?: number;
  notes?: string;
}

export interface ConditionalBonus {
  id: string;
  clientId: string;
  description: string;
  conditionLabel: string;
  minIncrementalBalance: number;
  factorBonus: number;
  active: boolean;
  crmNotified?: boolean;
}

export interface PricingAuditEntry {
  id: string;
  timestamp: string;
  clientId?: string;
  clientName?: string;
  action: string;
  tiieInput?: number;
  factorApplied?: number;
  rateBefore?: number;
  rateAfter?: number;
  details?: string;
  user: string;
}

export interface ClientRateSnapshot {
  rate: number;
  factor: number;
  tier: number;
  tiieRate: number;
  calculatedAt: string;
  appliedBonuses: string[];
  overrideApplied?: boolean;
}

export interface PricingResult {
  clientId: string;
  tier: number;
  tierLabel: string;
  factor: number;
  tiieRate: number;
  rate: number;
  appliedBonuses: string[];
  overrideApplied: boolean;
  capMinApplied?: number;
  capMaxApplied?: number;
}

export interface TourProgress {
  completed: boolean;
  currentStep: number;
  dismissed: boolean;
}

export interface LimDemoState {
  version: number;
  tiie: TiieSnapshot;
  tiersPm: TierRow[];
  tiersPf: TierRow[];
  clients: DemoClient[];
  overrides: ClientOverride[];
  bonuses: ConditionalBonus[];
  auditLog: PricingAuditEntry[];
  clientRates: Record<string, ClientRateSnapshot>;
  tour: TourProgress;
  pendingApproval?: {
    id: string;
    tiieBefore: number;
    tiieAfter: number;
    variationBps: number;
    status: "PENDING" | "APPROVED";
  } | null;
}

export interface TreasurySummary {
  totalBalance: number;
  projectedNii: number;
  clientsByTier: { tier: number; count: number; balance: number; avgRate: number }[];
  alerts: { id: string; type: "info" | "warning" | "success"; message: string }[];
  currencyCoverage: { mxn: number; usd: number };
}
