export type CreditProductCategory = "automotriz" | "personal";

export interface CreditProductTemplate {
  id: string;
  category: CreditProductCategory;
  name: string;
  description: string;
  restrictions: string[];
  baseRate: number;
  discountBandMin: number;
  discountBandMax: number;
  termMinMonths: number;
  termMaxMonths: number;
  amountMin: number;
  amountMax: number;
  fixedRateForTerm: boolean;
  openingFeePct: number;
}

export interface ProductRule {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  bpsDiscount: number;
  blocksApproval?: boolean;
  group?: "aprobacion" | "validacion" | "pricing";
}

export interface CrossSellOption {
  id: string;
  label: string;
  bps: number;
  description: string;
}

export interface KycProfile {
  curp?: string;
  rfc: string;
  birthDate?: string;
  nationality: string;
  address: string;
  phone: string;
  email: string;
  idVerified: boolean;
  /** Número de identificación oficial (INE). */
  idDocument?: string;
  /** AML aprobado para persona física. */
  amlApproved?: boolean;
  pep: boolean;
  incomeMonthly?: number;
}

export interface KybProfile {
  rfc: string;
  legalName: string;
  sector: string;
  employees: number;
  annualRevenue: number;
  beneficialOwnersVerified: boolean;
  amlRisk: "BAJO" | "MEDIO" | "ALTO";
}

export interface ClientProductContext {
  nomina: boolean;
  tdc: boolean;
  seguroAuto: boolean;
  inversionPatrimonial: boolean;
  cuentaAhorro: boolean;
}

export interface CreditClientProfile {
  id: string;
  /** Cliente origen en módulo Clientes (CU-xxx). */
  sourceCustomerId?: string;
  productId: string;
  name: string;
  entityType: "PF" | "PM";
  amount: number;
  termMonths: number;
  creditScore: number;
  aiApproved: boolean | null;
  clientProducts: ClientProductContext;
  kyc: KycProfile;
  kyb?: KybProfile;
}

export interface DiscountLine {
  label: string;
  bps: number;
  applied: boolean;
  potential: boolean;
}

export interface CreditQuoteResult {
  decision: "APROBADO" | "CONDICIONAL" | "RECHAZADO";
  decisionReason?: string;
  baseRate: number;
  finalRate: number;
  discountsApplied: DiscountLine[];
  discountsPotential: DiscountLine[];
  monthlyPayment: number;
  openingFeeMxn: number;
  estimatedCat: number;
  fixedForTerm: boolean;
  termMonths: number;
  amount: number;
  rulesEvaluated: string[];
}

export interface AiVerificationResult {
  clientId: string;
  clientName: string;
  score: number;
  approved: boolean;
  reason: string;
}

export interface CreditAuditEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
  channel: string;
  correlationId: string;
  rateBefore?: number;
  rateAfter?: number;
}

export interface CreditDemoState {
  version: number;
  products: CreditProductTemplate[];
  clients: CreditClientProfile[];
  rulesByCategory: Record<CreditProductCategory, ProductRule[]>;
  crossSellByCategory: Record<CreditProductCategory, CrossSellOption[]>;
  selectedProductId: string;
  selectedClientId: string;
  quoteAmountMxn: number;
  quoteTermMonths: number;
  crossSellAccepted: Record<string, boolean>;
  aiVerificationRun: boolean;
  aiBatchResults: AiVerificationResult[];
  quote: CreditQuoteResult | null;
  quoteFixed: boolean;
  quoteFixedAt: string | null;
  managerApproved: boolean;
  auditLog: CreditAuditEntry[];
}

/** @deprecated use selected client + product from catalog */
export type LegacyCrossSell = { seguroAuto: boolean; inversionPatrimonial: boolean };
