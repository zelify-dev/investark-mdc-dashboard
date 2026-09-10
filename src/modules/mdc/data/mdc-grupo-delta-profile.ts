/**
 * Fuente unificada de mock para Grupo Delta Industrial SA de CV.
 * Alineada con: mdc-credit-mock, kyb-company-context, mdc-payments-tab,
 * buildMoralCompanyProfile (manualReview) y trazabilidad MDC.
 */
import type { Application } from "@/modules/mdc/data/mdc-credit-mock";

export const GRUPO_DELTA_APPLICATION: Application = {
  id: "pm-uuid-002",
  appNo: "APP-PM-100283",
  applicantName: "Grupo Delta Industrial SA de CV",
  applicantEmail: "finanzas@grupodelta.mx",
  product: "Credito simple empresarial",
  requestedAmount: 8_800_000,
  currency: "MXN",
  status: "manualReview",
  risk: "medium",
  riskScore: 56,
  submittedAt: "2026-05-07T09:42:00Z",
};

export const GRUPO_DELTA_POOL = {
  id: "PM-CU-500202",
  creditScore: 692,
  preApprovedAmount: 7_600_000,
} as const;

export const GRUPO_DELTA_KYB = {
  rfc: "GDI150403PX6",
  website: "https://www.grupodeltaindustrial.mx",
  phone: "+52 81 4441 2800",
  address: "Carretera a Colombia Km 18.5, Escobedo, C.P. 66052, Nuevo León, México",
  state: "Nuevo León",
  registrationDate: "2015-04-03",
  industrySummary:
    "Holding industrial con operación en manufactura pesada, mantenimiento industrial y servicios de ingeniería.",
  targetMarket:
    "Industria automotriz, acerera, energía e infraestructura con necesidades de mantenimiento especializado.",
  revenueModel: "Contratos anuales, proyectos EPC y órdenes de mantenimiento industrial recurrente.",
  competitiveEdge:
    "Capacidad instalada, certificaciones industriales y operación multi-planta en el norte del país.",
  estimatedAnnualRevenue: 210_000_000,
  averageTicket: 320_000,
  operatingRegions: "Nuevo León, Coahuila, Tamaulipas, San Luis Potosí y Bajío.",
} as const;

/** Valores derivados con la misma lógica de buildMoralCompanyProfile para APP-PM-100283 */
export const GRUPO_DELTA_FINANCIAL_PROFILE = {
  segment: "PYME estructurada",
  companyType: "Empresa operativa",
  requestedTermMonths: 36,
  monthlyRevenue: 2_666_667,
  annualRevenue: 32_000_004,
  antiquityMonths: 134,
  antiquityYears: 11.2,
  bureauScore: 598,
  shareholderScore: 592,
  maxDaysPastDue: 41,
  dscr: 1.18,
  leverageRatio: 3.05,
  topClientConcentration: 0.42,
  ebitdaMargin: 0.12,
  naicsRiskIndex: 61,
  kybCompleteness: 0.91,
  amlAlerts: 1,
  taxComplianceStatus: 0,
  uboCoverage: 0.88,
  legalIncidents: 1,
  requestedAmountToRevenue: 3.3,
  quotaToIncomeRatio: 0.34,
  debtBurdenRatio: 0.53,
  freeCashFlow: 213_333,
  workingCapital: 4_000_001,
  roe: 0.12,
  roa: 0.06,
  ebitda: 3_840_000,
  netIncome: 2_380_800,
  taxStatus: "En proceso",
  mercantileStatus: "Vigente",
  shareholdersStructure: "Parcial",
} as const;

export const GRUPO_DELTA_PAYMENT = {
  sessionId: "pm_ses_1002",
  applicantId: "APP-PM-100283",
  amount: 240_000,
  status: "CAPTURADO",
  paymentMethod: "spei",
  createdAt: "2026-05-02",
} as const;

export const GRUPO_DELTA_TRACEABILITY = [
  {
    id: "pm-trace-002",
    timestamp: "2026-06-23T14:31:17Z",
    action: "PM_RULES",
    details:
      "Motor empresa evaluado · DSCR, apalancamiento y buró corporativo para Grupo Delta Industrial SA de CV",
    channel: "Sucursal empresarial",
    user: "Ejecutivo Empresarial",
    rateBefore: 17.8,
    rateAfter: 17.8,
  },
  {
    id: "pm-trace-003",
    timestamp: "2026-06-23T14:06:47Z",
    action: "CROSS_SELL_PM",
    details: "Paquete transaccional y dispersión de nómina activados · mejora de pricing corporativo",
    channel: "Sucursal empresarial",
    user: "Ejecutivo Empresarial",
    rateBefore: 18.1,
    rateAfter: 17.6,
  },
] as const;
