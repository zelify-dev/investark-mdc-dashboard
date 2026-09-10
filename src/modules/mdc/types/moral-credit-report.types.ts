import type {
  AmlListCheck,
  BuroScoreHistory,
  BuroTradeline,
  CreditReportMeta,
  RateCascadeStep,
} from "@/modules/reporting/types/credit-report.types";

export type MoralRuleVerdict = "CUMPLE" | "NO_CUMPLE" | "REVISAR";

export interface MoralCreditReportRuleRow {
  id: string;
  group: "aprobacion" | "validacion" | "pricing";
  label: string;
  description: string;
  verdict: MoralRuleVerdict;
  detail: string;
  threshold?: string;
  observedValue?: string;
  policyRef?: string;
  bpsDiscount?: number;
}

export interface KybDocument {
  id: string;
  label: string;
  capturedAt: string;
  source: string;
  status: "VALIDADO" | "PENDIENTE" | "OBSERVACION";
  detail: string;
  expiryDate?: string;
}

export interface RevenueBreakdown {
  concept: string;
  amount: number;
  verified: boolean;
  source: string;
  pctOfTotal?: number;
}

export interface ShareholderRow {
  name: string;
  rfc: string;
  ownershipPct: number;
  role: string;
  pep: boolean;
  bureauScore?: number;
  nationality: string;
}

export interface BalanceSheetSnapshot {
  period: string;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  currentAssets: number;
  currentLiabilities: number;
  cash: number;
  accountsReceivable: number;
  inventory: number;
  accountsPayable: number;
  shortTermDebt: number;
  longTermDebt: number;
}

export interface IncomeStatementSnapshot {
  period: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  ebitda: number;
  depreciation: number;
  netIncome: number;
}

export interface CashFlowSnapshot {
  period: string;
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashChange: number;
  capex: number;
}

export interface ClientConcentrationRow {
  client: string;
  sector: string;
  revenuePct: number;
  paymentTerms: string;
  tenureYears: number;
  annualVolume: number;
}

export interface CollateralItem {
  id: string;
  type: string;
  description: string;
  appraisedValue: number;
  coveragePct: number;
  lienStatus: string;
  location: string;
}

export interface MdcTraceabilityRef {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  channel: string;
  user: string;
  rateBefore?: number;
  rateAfter?: number;
}

export interface PaymentHistoryRef {
  sessionId: string;
  amount: number;
  status: string;
  date: string;
  method: string;
  reference?: string;
}

export interface SectorAnalysis {
  naicsCode: string;
  naicsDescription: string;
  naicsRiskIndex: number;
  sectorOutlook: string;
  competitivePosition: string;
  macroRisks: string[];
  industryTrends: string[];
}

export interface CapacityAnalysis {
  dscr: number;
  minRequiredDscr: number;
  quotaToRevenueRatio: number;
  maxAllowedQuotaRatio: number;
  debtServiceMonthly: number;
  ebitdaMonthly: number;
  cushionMonths: number;
  stressDscr: number;
  breakEvenRevenueDecline: number;
  fixedCharges: number;
  discretionaryCashFlow: number;
}

export interface MoralApplicationRef {
  appNo: string;
  appId: string;
  submittedAt: string;
  status: string;
  statusLabel: string;
  riskLevel: string;
  riskScore: number;
  channel: string;
  executive: string;
}

export interface MoralCreditReportCompany {
  id: string;
  legalName: string;
  tradeName: string;
  rfc: string;
  incorporationDate: string;
  antiquityYears: number;
  antiquityMonths: number;
  companyType: string;
  segment: string;
  sector: string;
  naicsCode: string;
  address: string;
  state: string;
  website: string;
  email: string;
  phone: string;
  legalRep: string;
  legalRepRfc: string;
  legalRepTenureYears: number;
  employees: number;
  shareholders: number;
  operatingRegions: string;
  industrySummary: string;
  targetMarket: string;
  revenueModel: string;
  competitiveEdge: string;
  productId: string;
  productName: string;
  requestedAmount: number;
  preApprovedAmount: number;
  termMonths: number;
  creditPurpose: string;
  baseRate: number;
  finalRate: number;
  monthlyPayment: number;
  totalInterest: number;
  cat: number;
  openingFee: number;
  bureauScore: number;
  shareholderScore: number;
  bureauPercentile: number;
  bureauRating: string;
  maxDaysPastDue: number;
  inquiries6m: number;
  inquiries12m: number;
  totalCorporateDebt: number;
  kybStatus: string;
  kybCompleteness: number;
  amlStatus: string;
  amlRiskLevel: string;
  amlAlerts: number;
  taxComplianceStatus: string;
  aiScore: number;
  aiRecommendation: string;
  decision: "APROBADO" | "RECHAZADO" | "REVISION";
  decisionSummary: string;
  conditions: string[];
}

export interface MoralCreditReportPayload {
  reportId: string;
  generatedAt: string;
  promptUsed: string;
  meta: CreditReportMeta;
  application: MoralApplicationRef;
  company: MoralCreditReportCompany;
  shareholders: ShareholderRow[];
  financials: {
    monthlyRevenue: number;
    annualRevenue: number;
    ebitda: number;
    ebitdaMargin: number;
    netIncome: number;
    dscr: number;
    leverageRatio: number;
    roe: number;
    roa: number;
    workingCapital: number;
    freeCashFlow: number;
    topClientConcentration: number;
    debtBurdenRatio: number;
    requestedAmountToRevenue: number;
    currentRatio: number;
    quickRatio: number;
    interestCoverage: number;
    grossMargin: number;
    netMargin: number;
  };
  balanceSheet: BalanceSheetSnapshot[];
  incomeStatement: IncomeStatementSnapshot[];
  cashFlow: CashFlowSnapshot[];
  clientConcentration: ClientConcentrationRow[];
  collateral: CollateralItem[];
  kybDocuments: KybDocument[];
  amlChecks: AmlListCheck[];
  buroTradelines: BuroTradeline[];
  buroScoreHistory: BuroScoreHistory[];
  rules: MoralCreditReportRuleRow[];
  rateCascade: RateCascadeStep[];
  revenueBreakdown: RevenueBreakdown[];
  crossSellAccepted: { label: string; bps: number }[];
  capacity: CapacityAnalysis;
  sector: SectorAnalysis;
  traceability: MdcTraceabilityRef[];
  paymentHistory: PaymentHistoryRef[];
  monitoringPlan: string[];
  executiveSummary: string[];
  integratedAnalysis: string[];
  riskFactors: string[];
  strengths: string[];
}
