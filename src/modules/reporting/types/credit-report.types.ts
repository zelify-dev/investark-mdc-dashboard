export type RuleVerdict = "CUMPLE" | "NO_CUMPLE" | "REVISAR";

export interface CreditReportRuleRow {
  id: string;
  group: "aprobacion" | "validacion" | "pricing";
  label: string;
  description: string;
  verdict: RuleVerdict;
  detail: string;
  bpsDiscount?: number;
  policyRef?: string;
}

export interface AmlListCheck {
  listName: string;
  provider: string;
  result: "SIN_COINCIDENCIAS" | "ALERTA" | "BLOQUEADO";
  checkedAt: string;
  reference?: string;
  riskLevel?: "BAJO" | "MEDIO" | "ALTO";
}

export interface KycCapture {
  id: string;
  type: "ine_front" | "ine_back" | "selfie" | "proof_address";
  label: string;
  capturedAt: string;
  device: string;
  livenessScore?: number;
  matchScore?: number;
  ocrConfidence?: number;
  geolocation?: string;
}

export interface BuroTradeline {
  creditor: string;
  product: string;
  balance: number;
  limit: number;
  mop: string;
  status: string;
  opened: string;
  paymentHistory?: string;
  utilizationPct?: number;
}

export interface BuroScoreHistory {
  period: string;
  score: number;
}

export interface IncomeBreakdown {
  concept: string;
  amount: number;
  verified: boolean;
  source: string;
}

export interface RateCascadeStep {
  label: string;
  rate: number;
  deltaBps?: number;
}

export interface VehicleDetail {
  brand: string;
  model: string;
  year: number;
  version: string;
  value: number;
  vin: string;
  insuranceQuote: number;
}

export interface CreditReportMeta {
  institution: string;
  branch: string;
  analyst: string;
  channel: string;
  confidentiality: string;
  validUntil: string;
}

export interface CreditReportSubject {
  id: string;
  fullName: string;
  curp: string;
  rfc: string;
  ine: string;
  birthDate: string;
  age: number;
  nationality: string;
  maritalStatus: string;
  dependents: number;
  email: string;
  phone: string;
  address: string;
  addressYears: number;
  employer: string;
  jobTitle: string;
  employmentYears: number;
  employmentType: string;
  incomeGrossMonthly: number;
  incomeNetMonthly: number;
  incomeVerifiedAt: string;
  productId: string;
  productName: string;
  productCategory: string;
  requestedAmount: number;
  downPaymentPct: number;
  downPaymentAmount: number;
  termMonths: number;
  baseRate: number;
  finalRate: number;
  monthlyPayment: number;
  totalInterest: number;
  cat: number;
  openingFee: number;
  creditScore: number;
  buroScore: number;
  buroPercentile: number;
  buroRating: string;
  totalDebt: number;
  creditAgeMonths: number;
  inquiries6m: number;
  inquiries12m: number;
  maxMop: string;
  delinquencies24m: number;
  pep: boolean;
  kycStatus: string;
  amlStatus: string;
  amlRiskLevel: string;
  aiScore: number;
  aiRecommendation: string;
  decision: "APROBADO" | "RECHAZADO" | "REVISION";
  decisionSummary: string;
  conditions: string[];
}

export interface CreditReportPayload {
  reportId: string;
  generatedAt: string;
  promptUsed: string;
  meta: CreditReportMeta;
  subject: CreditReportSubject;
  vehicle?: VehicleDetail;
  kycCaptures: KycCapture[];
  amlChecks: AmlListCheck[];
  buroTradelines: BuroTradeline[];
  buroScoreHistory: BuroScoreHistory[];
  rules: CreditReportRuleRow[];
  rateCascade: RateCascadeStep[];
  incomeBreakdown: IncomeBreakdown[];
  capacity: {
    paymentToIncome: number;
    maxAllowedPti: number;
    disposableIncome: number;
    debtToIncome: number;
    maxLoanByIncome: number;
    recommendedAmount: number;
    cushionMonths: number;
    fixedObligations: number;
    freeCashFlow: number;
  };
  crossSellAccepted: { label: string; bps: number }[];
  executiveSummary: string[];
  riskFactors: string[];
  strengths: string[];
}
