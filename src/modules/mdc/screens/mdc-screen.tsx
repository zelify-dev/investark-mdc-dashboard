"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Plus, Settings, Trash2, AlertTriangle, Copy, ExternalLink } from "lucide-react";
import { seedScotiaCreditStorage, useCreditDemoStore } from "@/modules/cortex/hooks/use-credit-demo-store";
import { AppCheckbox } from "@/components/ui/atoms/checkbox/app-checkbox";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import {
  APPLICATIONS_BY_MODE,
  CLIENT_POOL_BY_MODE,
  CREDIT_PRODUCTS_BY_MODE,
  LCC_AUTO_CLIENTS,
  LCC_PERSONAL_CLIENTS,
  MORAL_CREDIT_PRODUCTS,
  PM_MDC_CLIENTS,
  RISK_LABELS,
  STATUS_LABELS,
  NATURAL_CREDIT_PRODUCTS,
  resolveApplicantDisplayName,
  type Application,
  type ApplicationStatus,
  type MdcApplicantMode,
  type MdcClientPoolItem,
  type MdcCreditProduct,
  type RiskLevel,
} from "@/modules/mdc/data/mdc-credit-mock";
import { CREDIT_RULES_BY_MODE, type CreditRuleRow, type RuleDataType, type RuleOperator, type RuleProduct, type RuleSeverity } from "@/modules/mdc/data/mdc-rules-mock";
import { evaluateDecisionRule, fetchRules, fetchFinanceProducts, fetchUserRules, createRule, updateRule, deleteRule } from "@/modules/mdc/services/mdc-rules.service";
import { createTraceabilityLog, fetchTraceabilityLogs } from "@/modules/mdc/services/mdc-traceability.service";
import { getMdcApiBaseUrl } from "@/modules/mdc/services/mdc-api-client";

import {
  analyzeFinanceRequest,
  attachFinanceRequestKyc,
  createFinanceRequest,
  deleteFinanceRequest,
  fetchFinanceRequestById,
  fetchFinanceRequests,
  updateFinanceRequest,
  uploadFinancialDocument,
  type AnalyzeFinanceRequestResponse,
  type DocumentMatch,
  type FinancialDocumentExtractionResponse,
  type FinancialDocumentProgress,
  type FinanceRequestDetail,
  type MdcApiError,
} from "@/modules/mdc/services/mdc-finance-requests.service";
import {
  createZelifyKycOnboardingSession,
  fetchZelifyKycOnboardingSession,
  formatEducation,
  formatHousingType,
  formatIneMatched,
  formatKycIdentitySummary,
  formatMaritalStatus,
  formatMdcUserAddressLines,
  formatRelation,
  formatSexLabel,
  formatKycPercent,
  isCurpLike,
  kycError,
  kycLog,
  kycWarn,
  kycScoreTone,
  kycStatusLabel,
  normalizeMxPhone10,
  type ZelifyKycSessionStatus,
} from "@/modules/mdc/services/zelify-kyc-onboarding.service";
import { getStoredOrganization, getStoredUser } from "@/lib/auth-api";
import { writeApplicationDetailSession, writeRuleFormSession } from "@/modules/mdc/lib/mdc-form-session";
import { MdcProductsTab } from "@/modules/mdc/components/mdc-products-tab";
import { MdcRequestsTab } from "@/modules/mdc/components/mdc-requests-tab";


import { MdcCollectionsTab } from "@/modules/mdc/components/mdc-collections-tab";
import { MdcPaymentsTab } from "@/modules/mdc/components/mdc-payments-tab";
import { MdcConfigurationTab } from "@/modules/mdc/components/mdc-configuration-tab";
import { MdcReportsTab } from "@/modules/mdc/components/mdc-reports-tab";
import {
  calculateCreditQuote,
  crossSellRatePreview,
  formatMxnCredit,
  formatPctCredit,
  rateBeforeCrossSell,
} from "@/modules/cortex/services/credit-pricing.engine";
import type { CreditClientProfile, CreditProductCategory, CrossSellOption } from "@/modules/cortex/types/credit-pricing.types";
import { MDC_PRODUCTS_BY_MODE } from "@/modules/mdc/data/mdc-products-mock";
import { activateKybCompanyContext } from "@/modules/kyb/lib/kyb-company-context";
import "@/components/ui/templates/workspace-page.css";
import "@/modules/cortex/components/credit-quote-result-panel.css";
import "./mdc-screen.css";
import { FinancialDocumentUploader } from "@/components/upload/FinancialDocumentUploader";
import {
  useAnalysisExtraction,
  useManualReviewAnalysis,
  useDocumentProgress,
  useDocumentFileUrl,
  useReprocessAnalysis,
  isDocumentAnalyzing,
} from "@/modules/mdc/hooks/use-financial-documents";
import {
  documentMatchBadge,
  documentMatchField,
  documentMatchFieldClass,
} from "@/modules/mdc/lib/document-match-ui";

type MdcTab = "overview" | "products" | "applications" | "rules" | "traceability" | "payments" | "collections" | "reports" | "configuration";

type FinanceProductOption = {
  financialProduct: string;
  minimumAmount?: number;
  maximumAmount?: number;
  dueDatesCount?: number;
  termMin?: number;
  termMax?: number;
  creditRate?: number;
  paymentFrequency?: string;
};

export type RuleFormState = {
  name: string;
  product: RuleProduct;
  field: string;
  evaluationMode: "single" | "bands";
  operator: RuleOperator;
  value: string;
  dataType: RuleDataType;
  severity: RuleSeverity;
  description: string;
  status: "active" | "inactive";
  approveMin: string;
  approveMax: string;
  reviewMin: string;
  reviewMax: string;
  rejectMin: string;
  rejectMax: string;
  conditions?: any[];
};

type RangePreset = "7d" | "30d" | "90d";
type MdcTraceabilityEntry = {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  channel: string;
  user: string;
  correlationId: string;
  rateBefore?: number;
  rateAfter?: number;
  oldValue?: string;
  newValue?: string;
};

const APP_STORAGE_KEY = "mdc:applications";
const RULES_STORAGE_KEY = "mdc:rules";
const PAGE_SIZE = 10;
const TRACEABILITY_PAGE_SIZE = 8;
const DAY_MS = 24 * 60 * 60 * 1000;
const RANGE_DAYS: Record<RangePreset, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const PERSONA_OPTIONS: { id: MdcApplicantMode; label: string }[] = [
  { id: "natural", label: "Persona Física" },
  { id: "moral", label: "Persona Moral" },
];

const MODE_STORAGE_KEYS: Record<MdcApplicantMode, { applications: string; rules: string; products: string }> = {
  natural: {
    applications: "mdc:natural:applications",
    rules: "mdc:natural:rules:v3",
    products: "mdc:natural:products",
  },
  moral: {
    applications: "mdc:moral:applications",
    rules: "mdc:moral:rules:v3",
    products: "mdc:moral:products",
  },
};

const MODE_COPY: Record<MdcApplicantMode, { title: string; subtitle: string; recentTitle: string }> = {
  natural: {
    title: "MDC - Motor de Decisión de Crédito",
    subtitle: "Análisis de solicitudes, reglas y decisiones para originación de persona física.",
    recentTitle: "Solicitudes recientes",
  },
  moral: {
    title: "MDC - Motor de Decisión de Crédito Empresarial",
    subtitle: "Evaluación de empresas, razones financieras y políticas de originación para persona moral.",
    recentTitle: "Solicitudes recientes",
  },
};

const TREND_COPY: Record<RangePreset, string> = {
  "7d": "Tendencia de ingreso al motor según rango seleccionado.",
  "30d": "Tendencia de ingreso al motor según rango seleccionado.",
  "90d": "Tendencia de ingreso al motor según rango seleccionado.",
};

const MORAL_TRACEABILITY: MdcTraceabilityEntry[] = [
  {
    id: "pm-trace-001",
    timestamp: "2026-06-26T16:48:22Z",
    action: "PM_KYB_UPDATE",
    details: "KYB corporativo actualizado para GRUPO DELTA INDUSTRIAL SA DE CV · RFC validado y acta constitutiva conciliada",
    channel: "Mesa corporativa",
    user: "Analista KYB",
    correlationId: "corr-pm-1782449822011",
  },
  {
    id: "pm-trace-002",
    timestamp: "2026-06-26T16:31:07Z",
    action: "PM_DOCS",
    details: "Carga documental completada · estados financieros 2025, opinión 32-D y estados de cuenta bancarios 12 meses",
    channel: "Portal cliente",
    user: "Tesoreria TechStart",
    correlationId: "corr-pm-1782449718034",
  },
  {
    id: "pm-trace-003",
    timestamp: "2026-06-26T16:12:40Z",
    action: "PM_BUREAU",
    details: "Consulta de buró empresarial ejecutada · score 712 y experiencia de pago sin deterioro material",
    channel: "Buró / API",
    user: "Sistema MDC",
    correlationId: "corr-pm-1782449601102",
  },
  {
    id: "pm-trace-004",
    timestamp: "2026-06-26T15:58:10Z",
    action: "PM_RULES",
    details: "Motor empresarial recalculado · DSCR, apalancamiento y monto / ventas dentro de política para TechStart Solutions SA de CV",
    channel: "Consola riesgo",
    user: "Analista Senior",
    correlationId: "corr-pm-1782449500041",
    rateBefore: 19.5,
    rateAfter: 19.5,
  },
  {
    id: "pm-trace-005",
    timestamp: "2026-06-26T15:44:02Z",
    action: "PM_MANUAL_REVIEW",
    details: "Caso enviado a revisión manual por opinión 32-D en proceso y validación complementaria de beneficiarios reales",
    channel: "Consola riesgo",
    user: "Analista Senior",
    correlationId: "corr-pm-1782449387721",
  },
  {
    id: "pm-trace-006",
    timestamp: "2026-06-26T15:28:51Z",
    action: "PM_OVERRIDE",
    details: "Override aplicado con comité de crédito · mitigantes documentados y covenant trimestral incorporado",
    channel: "Comité",
    user: "Director Riesgo",
    correlationId: "corr-pm-1782449266304",
    rateBefore: 18.9,
    rateAfter: 18.4,
  },
  {
    id: "pm-trace-007",
    timestamp: "2026-06-26T15:09:14Z",
    action: "PM_DISBURSEMENT",
    details: "Condiciones comerciales confirmadas · línea revolvente liberada en tramo inicial de $4.5M",
    channel: "Backoffice",
    user: "Operaciones Crédito",
    correlationId: "corr-pm-1782449142250",
    rateBefore: 18.4,
    rateAfter: 18.4,
  },
  {
    id: "pm-trace-008",
    timestamp: "2026-06-25T18:42:37Z",
    action: "PM_AML_CLEAR",
    details: "Validación AML / PLD cerrada sin coincidencias bloqueantes para socios, avales y representante legal",
    channel: "Compliance",
    user: "Oficial PLD",
    correlationId: "corr-pm-1782384451904",
  },
  {
    id: "pm-trace-009",
    timestamp: "2026-06-25T17:26:19Z",
    action: "PM_SAT_32D",
    details: "Opinión de cumplimiento fiscal 32-D recibida en estado positivo · contribuyente al corriente",
    channel: "SAT",
    user: "Sistema MDC",
    correlationId: "corr-pm-1782381029137",
  },
  {
    id: "pm-trace-010",
    timestamp: "2026-06-25T16:11:55Z",
    action: "PM_FINANCIALS",
    details: "Estados financieros parseados · EBITDA 13.2%, deuda neta / EBITDA 2.4x y capital de trabajo positivo",
    channel: "IA documental",
    user: "Sistema MDC",
    correlationId: "corr-pm-1782377450014",
  },
  {
    id: "pm-trace-011",
    timestamp: "2026-06-24T19:08:41Z",
    action: "PM_SYNC",
    details: "Sincronización de empresas desde onboarding corporativo · 3 expedientes nuevos en MDC",
    channel: "Consola",
    user: "Sistema MDC",
    correlationId: "corr-pm-1782245321393",
  },
  {
    id: "pm-trace-012",
    timestamp: "2026-06-24T18:31:17Z",
    action: "PM_RULES",
    details: "Motor empresa evaluado · DSCR, apalancamiento y buro corporativo para Grupo Delta Industrial SA de CV",
    channel: "Sucursal empresarial",
    user: "Ejecutivo Empresarial",
    correlationId: "corr-pm-1782245277709",
    rateBefore: 17.8,
    rateAfter: 17.8,
  },
  {
    id: "pm-trace-013",
    timestamp: "2026-06-24T18:06:47Z",
    action: "CROSS_SELL_PM",
    details: "Paquete transaccional y dispersión de nómina activados · mejora de pricing corporativo",
    channel: "Sucursal empresarial",
    user: "Ejecutivo Empresarial",
    correlationId: "corr-pm-1782245280707",
    rateBefore: 18.1,
    rateAfter: 17.6,
  },
  {
    id: "pm-trace-014",
    timestamp: "2026-06-24T18:06:27Z",
    action: "AI_VERIFY_PM",
    details: "IA documental · 2 expedientes empresariales aprobados / 1 enviado a revisión manual",
    channel: "Sucursal empresarial",
    user: "Ejecutivo Empresarial",
    correlationId: "corr-pm-1782245278521",
  },
  {
    id: "pm-trace-015",
    timestamp: "2026-06-24T17:41:01Z",
    action: "SEED_PM",
    details: "Catálogo PM cargado · líneas empresariales, arrendamiento y capital de trabajo en México",
    channel: "Consola",
    user: "Admin Producto",
    correlationId: "corr-pm-seed-002",
  },
  {
    id: "pm-trace-016",
    timestamp: "2026-06-23T15:08:41Z",
    action: "PM_SYNC",
    details: "Sincronización de empresas desde onboarding corporativo · 3 expedientes nuevos en MDC",
    channel: "Consola",
    user: "Sistema MDC",
    correlationId: "corr-pm-1782245321393",
  },
  {
    id: "pm-trace-017",
    timestamp: "2026-06-23T14:31:17Z",
    action: "PM_RULES",
    details: "Motor empresa evaluado · DSCR, apalancamiento y buro corporativo para Grupo Delta Industrial SA de CV",
    channel: "Sucursal empresarial",
    user: "Ejecutivo Empresarial",
    correlationId: "corr-pm-1782245277709",
    rateBefore: 17.8,
    rateAfter: 17.8,
  },
  {
    id: "pm-trace-018",
    timestamp: "2026-06-23T14:06:47Z",
    action: "CROSS_SELL_PM",
    details: "Paquete transaccional y dispersión de nómina activados · mejora de pricing corporativo",
    channel: "Sucursal empresarial",
    user: "Ejecutivo Empresarial",
    correlationId: "corr-pm-1782245280707",
    rateBefore: 18.1,
    rateAfter: 17.6,
  },
  {
    id: "pm-trace-019",
    timestamp: "2026-06-23T14:06:27Z",
    action: "AI_VERIFY_PM",
    details: "IA documental · 2 expedientes empresariales aprobados / 1 enviado a revisión manual",
    channel: "Sucursal empresarial",
    user: "Ejecutivo Empresarial",
    correlationId: "corr-pm-1782245278521",
  },
  {
    id: "pm-trace-020",
    timestamp: "2026-06-23T13:41:01Z",
    action: "SEED_PM",
    details: "Catálogo PM cargado · líneas empresariales, arrendamiento y capital de trabajo en México",
    channel: "Consola",
    user: "Admin Producto",
    correlationId: "corr-pm-seed-002",
  },
];

const TABS: { id: MdcTab; label: string; moralOnly?: boolean }[] = [
  { id: "overview", label: "Tablero" },
  { id: "products", label: "Productos" },
  { id: "applications", label: "Solicitudes" },
  { id: "rules", label: "Reglas" },
  { id: "traceability", label: "Trazabilidad" },
  { id: "payments", label: "Pagos" },
  { id: "collections", label: "Cobranza" },
  { id: "reports", label: "Informes", moralOnly: true },
];

const STATUS_OPTIONS: (ApplicationStatus | "all")[] = [
  "all",
  "approved",
  "declined",
  "pending",
  "manualReview",
  "overridden",
];

const RISK_OPTIONS: (RiskLevel | "all")[] = ["all", "low", "medium", "high"];

const RULE_OPERATORS: RuleOperator[] = [
  "equals",
  "notEquals",
  "gt",
  "gte",
  "lt",
  "lte",
  "contains",
  "between",
];

const RULE_TYPES: RuleDataType[] = ["string", "number", "boolean", "date", "percentage"];

const RULE_SEVERITIES: RuleSeverity[] = ["pass", "warn", "fail"];
const REMOVED_RULE_FIELDS = new Set([
  "cards.utilization",
  "credit.hardInquiries30d",
  "company.shareholderScore",
  "company.kybCompleteness",
  "company.amlAlerts",
]);
const PRODUCT_RULE_FIELDS: Record<RuleProduct, string[]> = {
  "Credito automotriz": [
    "applicant.age",
    "ratios.dti",
    "bureau.score",
    "credit.maxDaysPastDue",
    "credit.historyMonths",
    "income.monthlyNet",
  ],
  "Credito personal": [
    "applicant.age",
    "ratios.dti",
    "bureau.score",
    "credit.maxDaysPastDue",
    "credit.historyMonths",
    "income.monthlyNet",
    "employment.months",
  ],
  "Credito simple empresarial": [
    "company.antiquityMonths",
    "company.monthlyRevenue",
    "company.bureauScore",
    "company.maxDaysPastDue",
    "company.dscr",
    "company.leverageRatio",
    "company.ebitdaMargin",
    "company.requestedAmountToRevenue",
    "company.naicsRiskIndex",
    "company.taxComplianceStatus",
  ],
  "Credito revolvente": [
    "company.antiquityMonths",
    "company.monthlyRevenue",
    "company.bureauScore",
    "company.maxDaysPastDue",
    "company.leverageRatio",
    "company.topClientConcentration",
    "company.requestedAmountToRevenue",
    "company.naicsRiskIndex",
    "company.taxComplianceStatus",
  ],
  "Arrendamiento financiero": [
    "company.antiquityMonths",
    "company.monthlyRevenue",
    "company.bureauScore",
    "company.maxDaysPastDue",
    "company.dscr",
    "company.ebitdaMargin",
    "company.naicsRiskIndex",
    "company.requestedTermMonths",
    "company.taxComplianceStatus",
  ],
};

const RULE_FIELD_LABELS: Record<string, string> = {
  "applicant.age": "Edad del solicitante",
  "ratios.dti": "Relacion deuda / ingreso (DTI)",
  "bureau.score": "Score crediticio en buro",
  "credit.maxDaysPastDue": "Maximo atraso reciente (dias)",
  "credit.historyMonths": "Antiguedad de historial (meses)",
  "employment.months": "Antiguedad laboral (meses)",
  "income.monthlyNet": "Ingreso mensual neto",
  "company.antiquityMonths": "Antiguedad operativa (meses)",
  "company.monthlyRevenue": "Facturacion mensual promedio",
  "company.bureauScore": "Score de buro empresa / representante",
  "company.shareholderScore": "Score de accionistas / aval",
  "company.maxDaysPastDue": "Maximo atraso reciente (dias)",
  "company.dscr": "Cobertura del servicio de deuda (DSCR)",
  "company.leverageRatio": "Deuda neta / EBITDA",
  "company.topClientConcentration": "Concentracion del cliente principal",
  "company.ebitdaMargin": "Margen EBITDA",
  "company.kybCompleteness": "Completitud del expediente KYB",
  "company.amlAlerts": "Alertas AML / PLD activas",
  "company.requestedAmountToRevenue": "Monto solicitado / ventas mensuales",
  "company.naicsRiskIndex": "Indice de riesgo sectorial NAICS",
  "company.requestedTermMonths": "Plazo solicitado (meses)",
  "company.taxComplianceStatus": "Opinion de Cumplimiento Fiscal 32-D",
  "applicant.employmentType": "Tipo de empleo",
  "applicant.ageAtTerm": "Edad al termino del contrato",
  "loan.requestedTerm": "Plazo solicitado",
  "loan.requestedAmount": "Monto solicitado",
  "income.averageLiquid": "Ingreso liquido promedio",
  "income.remainingLiquid": "Liquido restante (Resguardo)",
  "custom.field": "Campo personalizado",
};

const FALLBACK_RULE_FIELDS = Object.keys(RULE_FIELD_LABELS);

const RULE_OPERATOR_LABELS: Record<RuleOperator, string> = {
  equals: "Igual a (=)",
  notEquals: "Distinto de (!=)",
  gt: "Mayor que (>)",
  gte: "Mayor o igual (>=)",
  lt: "Menor que (<)",
  lte: "Menor o igual (<=)",
  contains: "Contiene",
  between: "Entre",
};

const RULE_TYPE_LABELS: Record<RuleDataType, string> = {
  string: "Texto",
  number: "Numero",
  boolean: "Si / No",
  date: "Fecha",
  percentage: "Porcentaje",
};

const RULE_SEVERITY_LABELS: Record<RuleSeverity, string> = {
  pass: "Aprobacion",
  warn: "Revision",
  fail: "Rechazo",
};

function readStoredJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function isRemovedMoralDuplicateApplication(app: Application) {
  const normalizedName = app.applicantName.trim().toUpperCase();
  const normalizedEmail = app.applicantEmail.trim().toLowerCase();
  return (
    app.appNo === "PM-APP-001264" ||
    (normalizedName === "GRUPO DELTA INDUSTRIAL SA DE CV" &&
      normalizedEmail === "planeacion@orionmanufactura.mx" &&
      app.requestedAmount === 9_727_414)
  );
}

function sanitizeApplications(mode: MdcApplicantMode, rows: Application[]) {
  if (mode !== "moral") return rows;
  return rows.filter((app) => !isRemovedMoralDuplicateApplication(app));
}

function mergeApplicationsWithDefaults(stored: Application[], defaults: Application[]) {
  const byAppNo = new Map<string, Application>();
  const safeDefaults = sanitizeApplications("moral", defaults);
  const safeStored = sanitizeApplications("moral", stored);
  for (const row of safeDefaults) {
    byAppNo.set(row.appNo, row);
  }
  for (const row of safeStored) {
    byAppNo.set(row.appNo, row);
  }
  return [...byAppNo.values()].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

function reconcileMockTimeline(
  mode: MdcApplicantMode,
  stored: Application[],
  defaults: Application[],
) {
  const safeStored = sanitizeApplications(mode, stored);
  if (mode !== "moral" || defaults.length === 0) return safeStored;

  const defaultLatestTs = defaults.reduce(
    (max, row) => Math.max(max, new Date(row.submittedAt).getTime()),
    0,
  );

  let nextTs = defaultLatestTs + 5 * 60 * 1000;
  return safeStored.map((row) => {
    const rowTs = new Date(row.submittedAt).getTime();
    const tooFarAhead = rowTs - defaultLatestTs > 14 * DAY_MS;
    if (!tooFarAhead) return row;
    const migrated = { ...row, submittedAt: new Date(nextTs).toISOString() };
    nextTs += 5 * 60 * 1000;
    return migrated;
  });
}

function writeStoredJson<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // noop 
  }
}

function money(v: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(v);
}

function getConfiguredTimezone() {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem("mdc:config:general:v6");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.timezone) return parsed.timezone;
    }
  } catch {
    // ignore
  }
  return undefined;
}

function shortDate(v: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: getConfiguredTimezone(),
  }).format(new Date(v));
}

function ratioLabel(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

function normalizedPercentages(values: number[]) {
  const rawSum = values.reduce((sum, value) => sum + value, 0);
  if (rawSum === 0) return values.map(() => 0);
  const total = Math.max(rawSum, 1);
  const scaled = values.map((value) => (value / total) * 1000);
  const base = scaled.map((value) => Math.floor(value));
  const remainder = 1000 - base.reduce((sum, value) => sum + value, 0);
  const order = scaled
    .map((value, index) => ({ index, frac: value - base[index] }))
    .sort((a, b) => b.frac - a.frac);

  for (let i = 0; i < remainder; i++) {
    base[order[i % order.length].index] += 1;
  }

  return base.map((value) => value / 10);
}

function pctLabel(v: number) {
  return `${v.toFixed(1)}%`;
}

function deltaPctLabel(v: number) {
  return `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
}

function pctDelta(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function rangeWindow(apps: Pick<Application, "submittedAt">[], days: number) {
  const latestTs = apps.length === 0
    ? Date.now()
    : apps.reduce((max, app) => Math.max(max, new Date(app.submittedAt).getTime()), 0);
  const latestDate = new Date(latestTs);
  const endMs = Date.UTC(
    latestDate.getUTCFullYear(),
    latestDate.getUTCMonth(),
    latestDate.getUTCDate(),
    23,
    59,
    59,
    999,
  );
  const startMs = endMs - (days * DAY_MS - 1);
  return { startMs, endMs };
}

function isWithinRange(dateIso: string, startMs: number, endMs: number) {
  const ts = new Date(dateIso).getTime();
  return ts >= startMs && ts <= endMs;
}

function chartDayLabel(date: Date) {
  const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(date);
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${month} ${day}`;
}

function utcDayStartMs(value: string | number) {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function nextMockSubmittedAt(rows: Pick<Application, "submittedAt">[]) {
  if (rows.length === 0) return new Date().toISOString();
  const latestTs = rows.reduce((max, row) => Math.max(max, new Date(row.submittedAt).getTime()), 0);
  return new Date(latestTs + 5 * 60 * 1000).toISOString();
}

function bureauScoreFromRiskIndex(riskIndex: number) {
  const bounded = Math.max(0, Math.min(100, riskIndex));
  return Math.round(850 - (bounded / 100) * 450);
}

function riskFromScore(score: number): RiskLevel {
  const bureauScore = bureauScoreFromRiskIndex(score);
  if (bureauScore <= 549) return "high";
  if (bureauScore <= 649) return "medium";
  return "low";
}

function normalizeRiskScoreForStatus(status: ApplicationStatus, score: number) {
  if (status === "approved") return Math.min(39, Math.max(20, score));
  if (status === "declined") return Math.min(95, Math.max(75, score));
  if (status === "pending") return Math.min(59, Math.max(45, score));
  if (status === "manualReview") return Math.min(69, Math.max(50, score));
  return Math.min(59, Math.max(40, score));
}

function riskFromApplicationStatus(status: ApplicationStatus, score: number) {
  return riskFromScore(normalizeRiskScoreForStatus(status, score));
}

function statusFromScore(score: number): ApplicationStatus {
  const bureauScore = bureauScoreFromRiskIndex(score);
  if (bureauScore < 550) return "declined";
  if (bureauScore < 650) return "manualReview";
  return "approved";
}

function classForStatus(status: ApplicationStatus) {
  if (status === "approved") return "mdc-badge mdc-badge--ok";
  if (status === "declined") return "mdc-badge mdc-badge--bad";
  if (status === "pending") return "mdc-badge mdc-badge--warn";
  if (status === "manualReview") return "mdc-badge mdc-badge--warn";
  if (status === "overridden") return "mdc-badge mdc-badge--info";
  return "mdc-badge mdc-badge--neutral";
}

function classForRisk(risk: RiskLevel) {
  if (risk === "low") return "mdc-badge mdc-badge--ok";
  if (risk === "medium") return "mdc-badge mdc-badge--warn";
  return "mdc-badge mdc-badge--bad";
}

function quickHash(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function formatPlainPct(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

function numberCompact(value: number) {
  return new Intl.NumberFormat("es-MX", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
}

function chipToneBySeverity(severity: RuleSeverity) {
  if (severity === "pass") return "mdc-col-pill mdc-col-pill--ok";
  if (severity === "warn") return "mdc-col-pill mdc-col-pill--warn";
  return "mdc-col-pill mdc-col-pill--bad";
}

type MoralCompanyProfile = {
  segment: string;
  companyType: string;
  requestedTermMonths: number;
  monthlyRevenue: number;
  annualRevenue: number;
  antiquityMonths: number;
  bureauScore: number;
  shareholderScore: number;
  maxDaysPastDue: number;
  dscr: number;
  leverageRatio: number;
  topClientConcentration: number;
  ebitdaMargin: number;
  roe: number;
  roa: number;
  workingCapital: number;
  freeCashFlow: number;
  requestedAmountToRevenue: number;
  naicsRiskIndex: number;
  debtBurdenRatio: number;
  quotaToIncomeRatio: number;
  kybCompleteness: number;
  amlAlerts: number;
  taxComplianceStatus: number;
  uboCoverage: number;
  legalIncidents: number;
  taxStatus: string;
  mercantileStatus: string;
  shareholdersStructure: string;
  docsStatus: Array<{ label: string; detail: string; status: "ok" | "warn" | "bad" }>;
  amlChecks: Array<{ label: string; detail: string; status: "ok" | "warn" | "bad" }>;
  scoringHighlights: string[];
  financeHighlights: string[];
  sectorHighlights: string[];
  monitoringHighlights: string[];
};

function buildMoralCompanyProfile(app: Application): MoralCompanyProfile {
  if (app.id.startsWith("local-")) {
    const requestedTermMonths =
      app.product === "Credito simple empresarial"
        ? 36
        : app.product === "Credito revolvente"
          ? 18
          : app.product === "Arrendamiento financiero"
            ? 48
            : 24;

    return {
      segment: "Pendiente",
      companyType:
        app.product === "Arrendamiento financiero"
          ? "Activo productivo"
          : app.product === "Credito revolvente"
            ? "Operacion comercial / capital de trabajo"
            : "Operacion empresarial",
      requestedTermMonths,
      monthlyRevenue: 0,
      annualRevenue: 0,
      antiquityMonths: 0,
      bureauScore: 0,
      shareholderScore: 0,
      maxDaysPastDue: 0,
      dscr: 0,
      leverageRatio: 0,
      topClientConcentration: 0,
      ebitdaMargin: 0,
      roe: 0,
      roa: 0,
      workingCapital: 0,
      freeCashFlow: 0,
      requestedAmountToRevenue: 0,
      naicsRiskIndex: 0,
      debtBurdenRatio: 0,
      quotaToIncomeRatio: 0,
      kybCompleteness: 0,
      amlAlerts: 0,
      taxComplianceStatus: 0,
      uboCoverage: 0,
      legalIncidents: 0,
      taxStatus: "Pendiente",
      mercantileStatus: "Pendiente",
      shareholdersStructure: "Pendiente",
      docsStatus: [
        { label: "RFC / Tax ID", detail: "Pendiente de validacion.", status: "warn" },
        { label: "Opinion de Cumplimiento Fiscal 32-D", detail: "Pendiente de consulta.", status: "warn" },
        { label: "Acta constitutiva", detail: "Pendiente de carga.", status: "warn" },
        { label: "Poderes notariales", detail: "Pendiente de carga.", status: "warn" },
        { label: "Estados financieros", detail: "Pendiente de carga.", status: "warn" },
      ],
      amlChecks: [
        { label: "Listas OFAC / ONU", detail: "Pendiente de validacion.", status: "warn" },
        { label: "PEPs / partes relacionadas", detail: "Pendiente de validacion.", status: "warn" },
        { label: "Prensa adversa", detail: "Pendiente de validacion.", status: "warn" },
        { label: "Demandas / gravamenes", detail: "Pendiente de validacion.", status: "warn" },
      ],
      scoringHighlights: [],
      financeHighlights: [],
      sectorHighlights: [],
      monitoringHighlights: [],
    };
  }

  const seed = quickHash(`${app.id}:${app.applicantName}:${app.product}`);
  const bureauScore = bureauScoreFromRiskIndex(app.riskScore);
  const riskLevel = riskFromScore(app.riskScore);
  const termByProduct: Record<string, number> = {
    "Credito simple empresarial": 36,
    "Credito revolvente": 18,
    "Arrendamiento financiero": 48,
  };
  const requestedTermMonths = termByProduct[app.product] ?? 24;
  const approvedLike = app.status === "approved" || app.status === "overridden";
  const reviewLike = app.status === "manualReview" || app.status === "pending";

  const monthlyRevenue =
    app.status === "declined"
      ? Math.round(app.requestedAmount / (3.9 + ((seed % 3) * 0.25)))
      : reviewLike
        ? Math.round(app.requestedAmount / (3.1 + ((seed % 3) * 0.2)))
        : Math.round(app.requestedAmount / (2.1 + ((seed % 4) * 0.18)));
  const antiquityMonths =
    app.status === "declined"
      ? 14 + (seed % 11)
      : reviewLike
        ? 22 + (seed % 18)
        : 46 + (seed % 70);
  const dscr = Number(
    (
      app.status === "declined"
        ? 0.88 + (seed % 12) / 100
        : reviewLike
          ? 1.05 + (seed % 18) / 100
          : 1.34 + (seed % 28) / 100
    ).toFixed(2),
  );
  const leverageRatio = Number(
    (
      app.status === "declined"
        ? 3.55 + (seed % 60) / 100
        : reviewLike
          ? 2.65 + (seed % 55) / 100
          : 1.45 + (seed % 70) / 100
    ).toFixed(2),
  );
  const topClientConcentration = Number(
    (
      app.status === "declined"
        ? 0.54 + (seed % 14) / 100
        : reviewLike
          ? 0.41 + (seed % 12) / 100
          : 0.24 + (seed % 14) / 100
    ).toFixed(2),
  );
  const ebitdaMargin = Number(
    (
      app.status === "declined"
        ? 0.07 + (seed % 4) / 100
        : reviewLike
          ? 0.11 + (seed % 6) / 100
          : 0.15 + (seed % 8) / 100
    ).toFixed(2),
  );
  const naicsRiskIndex =
    app.status === "declined" ? 68 + (seed % 18) : reviewLike ? 48 + (seed % 16) : 28 + (seed % 18);
  const kybCompleteness =
    app.status === "declined" ? 0.78 + (seed % 8) / 100 : reviewLike ? 0.86 + (seed % 8) / 100 : 0.93 + (seed % 7) / 100;
  const amlAlerts = app.status === "declined" ? 2 : reviewLike ? 1 : 0;
  const taxComplianceStatus = app.status === "declined" ? -1 : reviewLike ? 0 : 1;
  const shareholderScore = Math.max(560, Math.min(820, bureauScore + (approvedLike ? 14 : reviewLike ? -6 : -22)));
  const maxDaysPastDue = app.status === "declined" ? 61 + (seed % 28) : reviewLike ? 28 + (seed % 18) : 6 + (seed % 16);
  const requestedAmountToRevenue = Number((app.requestedAmount / Math.max(monthlyRevenue, 1)).toFixed(2));
  const quotaToIncomeRatio = Number(
    (
      app.status === "declined"
        ? 0.39 + (seed % 7) / 100
        : reviewLike
          ? 0.29 + (seed % 7) / 100
          : 0.17 + (seed % 8) / 100
    ).toFixed(2),
  );
  const debtBurdenRatio = Number(
    (
      app.status === "declined"
        ? 0.66 + (seed % 11) / 100
        : reviewLike
          ? 0.48 + (seed % 10) / 100
          : 0.31 + (seed % 10) / 100
    ).toFixed(2),
  );
  const annualRevenue = monthlyRevenue * 12;
  const freeCashFlow = Math.round(monthlyRevenue * (approvedLike ? 0.16 : reviewLike ? 0.08 : 0.03));
  const workingCapital = Math.round(monthlyRevenue * (approvedLike ? 2.4 : reviewLike ? 1.5 : 0.9));
  const roe = Number((approvedLike ? 0.17 + (seed % 4) / 100 : reviewLike ? 0.11 + (seed % 3) / 100 : 0.06 + (seed % 3) / 100).toFixed(2));
  const roa = Number((approvedLike ? 0.08 + (seed % 3) / 100 : reviewLike ? 0.05 + (seed % 2) / 100 : 0.02 + (seed % 2) / 100).toFixed(2));
  const uboCoverage = app.status === "declined" ? 0.72 : reviewLike ? 0.88 : 1;
  const legalIncidents = app.status === "declined" ? 2 : reviewLike ? 1 : 0;

  return {
    segment:
      app.requestedAmount >= 10_000_000 ? "Corporativo" : app.requestedAmount >= 4_000_000 ? "PYME estructurada" : "PYME",
    companyType:
      app.product === "Arrendamiento financiero"
        ? "Empresa intensiva en activos"
        : app.product === "Credito revolvente"
          ? "Operacion comercial / capital de trabajo"
          : "Empresa operativa",
    requestedTermMonths,
    monthlyRevenue,
    annualRevenue,
    antiquityMonths,
    bureauScore,
    shareholderScore,
    maxDaysPastDue,
    dscr,
    leverageRatio,
    topClientConcentration,
    ebitdaMargin,
    roe,
    roa,
    workingCapital,
    freeCashFlow,
    requestedAmountToRevenue,
    naicsRiskIndex,
    debtBurdenRatio,
    quotaToIncomeRatio,
    kybCompleteness: Number(Math.min(1, kybCompleteness).toFixed(2)),
    amlAlerts,
    taxComplianceStatus,
    uboCoverage,
    legalIncidents,
    taxStatus: taxComplianceStatus === 1 ? "Positiva" : taxComplianceStatus === 0 ? "En proceso" : "Negativa",
    mercantileStatus: antiquityMonths >= 24 ? "Vigente" : "Con observacion",
    shareholdersStructure: uboCoverage >= 1 ? "Completa" : "Parcial",
    docsStatus: [
      { label: "RFC / Tax ID", detail: "Vigencia SAT y razon social conciliada", status: "ok" },
      {
        label: "Opinion de Cumplimiento Fiscal 32-D",
        detail:
          taxComplianceStatus === 1
            ? "Positiva: la empresa esta al corriente con sus obligaciones fiscales."
            : taxComplianceStatus === 0
              ? "Sin opinion / En proceso: el SAT continua validando informacion o creditos fiscales especificos."
              : "Negativa: existen adeudos fiscales o declaraciones obligatorias pendientes.",
        status: taxComplianceStatus === 1 ? "ok" : taxComplianceStatus === 0 ? "warn" : "bad",
      },
      { label: "Acta constitutiva", detail: antiquityMonths >= 24 ? "Validada" : "Pendiente de aclaracion", status: antiquityMonths >= 24 ? "ok" : "warn" },
      { label: "Poderes notariales", detail: uboCoverage >= 0.88 ? "Representacion vigente" : "Firmantes incompletos", status: uboCoverage >= 0.88 ? "ok" : "warn" },
      { label: "Estados financieros", detail: freeCashFlow > 0 ? "Recibidos y conciliados" : "Con desviaciones", status: freeCashFlow > 0 ? "ok" : "warn" },
    ],
    amlChecks: [
      { label: "Listas OFAC / ONU", detail: amlAlerts === 0 ? "Sin coincidencias" : "Coincidencia por revisar", status: amlAlerts === 0 ? "ok" : "bad" },
      { label: "PEPs / partes relacionadas", detail: legalIncidents === 0 ? "Sin exposicion material" : "Relacion con tercero observado", status: legalIncidents === 0 ? "ok" : "warn" },
      { label: "Prensa adversa", detail: amlAlerts > 1 ? "Hallazgos abiertos" : "Sin eventos criticos", status: amlAlerts > 1 ? "bad" : "ok" },
      { label: "Demandas / gravamenes", detail: legalIncidents === 0 ? "Sin eventos relevantes" : `${legalIncidents} incidencia(s) en seguimiento`, status: legalIncidents === 0 ? "ok" : "warn" },
    ],
    scoringHighlights: [
      `Buró empresarial ${bureauScore}`,
      `Score socios / aval ${shareholderScore}`,
      `${app.status === "declined" ? "Cartera vencida material" : "Creditos vigentes controlados"}`,
      `Indice NAICS ${naicsRiskIndex}`,
    ],
    financeHighlights: [
      `EBITDA ${formatPlainPct(ebitdaMargin)}`,
      `ROE ${formatPlainPct(roe)}`,
      `ROA ${formatPlainPct(roa)}`,
      `Capital de trabajo ${money(workingCapital)}`,
      `Flujo libre ${money(freeCashFlow)}`,
    ],
    sectorHighlights: [
      `Cuota / ingresos ${formatPlainPct(quotaToIncomeRatio)}`,
      `Ingresos verificados ${money(monthlyRevenue)}/mes`,
      `Concentracion top cliente ${formatPlainPct(topClientConcentration)}`,
      `Endeudamiento ${formatPlainPct(debtBurdenRatio)}`,
    ],
    monitoringHighlights: [
      "Monitor de logs en tiempo real",
      "Alertas de deterioro",
      "Re-scoring periodico",
      "Cobranza temprana",
      `Distribucion poblacional ${riskLevel === "low" ? "estable" : "bajo vigilancia"}`,
    ],
  };
}

function nextAppNo(rows: Application[], mode: MdcApplicantMode) {
  const expression = mode === "moral" ? /APP-PM-(\d+)/ : /APP-(\d+)/;
  const seed = mode === "moral" ? 100279 : 1284;
  const maxNumber = rows.reduce((max, row) => {
    const match = row.appNo.match(expression);
    return match ? Math.max(max, Number(match[1])) : max;
  }, seed);
  return mode === "moral"
    ? `APP-PM-${String(maxNumber + 1).padStart(6, "0")}`
    : `APP-${String(maxNumber + 1).padStart(6, "0")}`;
}

function defaultRuleForm(products: readonly RuleProduct[]): RuleFormState {
  return {
    name: "",
    product: products[0] ?? NATURAL_CREDIT_PRODUCTS[0],
    field: "",
    evaluationMode: "single",
    operator: "gte",
    value: "",
    dataType: "number",
    severity: "warn",
    description: "",
    status: "active",
    approveMin: "",
    approveMax: "",
    reviewMin: "",
    reviewMax: "",
    rejectMin: "",
    rejectMax: "",
  };
}

function numberToInput(value?: number) {
  return value === undefined ? "" : String(value);
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseNumericList(value: string) {
  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));
}

function hasExactTaxComplianceBands(rule?: CreditRuleRow) {
  const bands = rule?.decisionBands;
  if (!bands) return false;
  return (
    bands.approveMin === 1 &&
    bands.approveMax === 1 &&
    bands.reviewMin === 0 &&
    bands.reviewMax === 0 &&
    bands.rejectMin === -1 &&
    bands.rejectMax === -1
  );
}

export function buildDecisionBands(form: RuleFormState) {
  if (form.evaluationMode !== "bands") return undefined;
  const decisionBands = {
    approveMin: parseOptionalNumber(form.approveMin),
    approveMax: parseOptionalNumber(form.approveMax),
    reviewMin: parseOptionalNumber(form.reviewMin),
    reviewMax: parseOptionalNumber(form.reviewMax),
    rejectMin: parseOptionalNumber(form.rejectMin),
    rejectMax: parseOptionalNumber(form.rejectMax),
  };

  return Object.values(decisionBands).some((value) => value !== undefined) ? decisionBands : undefined;
}

function ruleToFormState(rule: CreditRuleRow, product: RuleProduct): RuleFormState {
  return {
    name: rule.name,
    product,
    field: rule.field,
    evaluationMode: rule.decisionBands ? "bands" : "single",
    operator: rule.operator,
    value: rule.decisionBands ? "" : rule.value,
    dataType: rule.dataType,
    severity: rule.severity,
    description: rule.description,
    status: rule.status,
    approveMin: numberToInput(rule.decisionBands?.approveMin),
    approveMax: numberToInput(rule.decisionBands?.approveMax),
    reviewMin: numberToInput(rule.decisionBands?.reviewMin),
    reviewMax: numberToInput(rule.decisionBands?.reviewMax),
    rejectMin: numberToInput(rule.decisionBands?.rejectMin),
    rejectMax: numberToInput(rule.decisionBands?.rejectMax),
  };
}

function mergeRulesWithDefaults(rows: CreditRuleRow[], availableProducts: readonly RuleProduct[], baseRules: CreditRuleRow[]) {
  const dedupeById = (items: CreditRuleRow[]) => {
    const byId = new Map<string, CreditRuleRow>();
    for (const item of items) {
      byId.set(item.id, item);
    }
    return [...byId.values()];
  };

  const sanitizeRule = (rule: CreditRuleRow): CreditRuleRow[] => {
    if (REMOVED_RULE_FIELDS.has(rule.field)) return [];
    const baseId = rule.id.split("::")[0] ?? rule.id;
    const baseRule = baseRules.find((item) => item.id === baseId || item.id.split("::")[0] === baseId);
    const forceBaseBandsForTaxCompliance =
      rule.field === "company.taxComplianceStatus" &&
      Boolean(baseRule?.decisionBands) &&
      !hasExactTaxComplianceBands(rule);
    const forceBaseRuleForNaics =
      rule.field === "company.naicsRiskIndex" &&
      Boolean(baseRule) &&
      (rule.operator !== "contains" || Boolean(rule.decisionBands));
    const needsBandsMigration = !rule.decisionBands && Boolean(baseRule?.decisionBands) && baseRule?.field === rule.field;
    const normalizedRule = forceBaseRuleForNaics
      ? {
        ...rule,
        operator: baseRule?.operator ?? rule.operator,
        value: baseRule?.value ?? rule.value,
        description: baseRule?.description ?? rule.description,
        severity: baseRule?.severity ?? rule.severity,
        decisionBands: baseRule?.decisionBands,
      }
      : forceBaseBandsForTaxCompliance
        ? {
          ...rule,
          operator: baseRule?.operator ?? rule.operator,
          value: baseRule?.value ?? rule.value,
          description: baseRule?.description ?? rule.description,
          severity: baseRule?.severity ?? rule.severity,
          decisionBands: baseRule?.decisionBands,
        }
        : needsBandsMigration
          ? {
            ...rule,
            value: baseRule?.value ?? rule.value,
            description: baseRule?.description ?? rule.description,
            severity: baseRule?.severity ?? rule.severity,
            decisionBands: baseRule?.decisionBands,
          }
          : rule;
    const products =
      normalizedRule.products && normalizedRule.products.length > 0
        ? normalizedRule.products.filter((product) => availableProducts.includes(product))
        : (availableProducts.filter((product) => (PRODUCT_RULE_FIELDS[product] || FALLBACK_RULE_FIELDS).includes(normalizedRule.field)) as RuleProduct[]);
    if (products.length === 0) return [];
    return products.map((product) => ({
      ...normalizedRule,
      id: `${baseId}::${product}`,
      products: [product],
    }));
  };

  const sanitizedRows = dedupeById(rows.flatMap(sanitizeRule));
  if (sanitizedRows.length === 0) {
    return dedupeById(baseRules.flatMap(sanitizeRule));
  }
  const merged = [...sanitizedRows];
  const byProductField = new Set(sanitizedRows.flatMap((rule) => rule.products.map((product) => `${product}:${rule.field}`)));
  for (const baseRule of baseRules) {
    const sanitizedRowsForBase = sanitizeRule(baseRule);
    for (const sanitized of sanitizedRowsForBase) {
      const product = sanitized.products[0]!;
      const key = `${product}:${sanitized.field}`;
      if (byProductField.has(key)) continue;
      merged.push(sanitized);
      byProductField.add(key);
    }
  }
  return dedupeById(merged);
}

function ruleFieldLabel(field: string) {
  return RULE_FIELD_LABELS[field] ?? field.replaceAll(".", " · ");
}

function getRuleFieldsForProduct(product: RuleProduct) {
  const fields = PRODUCT_RULE_FIELDS[product] || FALLBACK_RULE_FIELDS;
  return fields.map((field) => ({
    value: field,
    label: ruleFieldLabel(field),
  }));
}

function renderRuleOperator(rule: CreditRuleRow) {
  if (rule.decisionBands) {
    return <span className="mdc-badge mdc-badge--bands">Por bandas</span>;
  }
  return <span className="mdc-rule-operator-label">{RULE_OPERATOR_LABELS[rule.operator]}</span>;
}

function renderRuleValue(rule: CreditRuleRow) {
  if (!rule.decisionBands) return rule.value;
  if (rule.operator === "contains") {
    return rule.value;
  }
  return <span className="mdc-badge mdc-badge--bands">Por bandas</span>;
}

function renderRuleSeverity(rule: CreditRuleRow) {
  if (rule.decisionBands) {
    const { approveMin, approveMax, reviewMin, reviewMax, rejectMin, rejectMax } = rule.decisionBands;
    const formatBandValue = (value: number) => value.toFixed(Number.isInteger(value) ? 0 : 2);
    const isExactBand = (min?: number, max?: number) => min !== undefined && max !== undefined && min === max;

    return (
      <div className="mdc-rule-bands">
        {approveMax !== undefined && (
          <span className="mdc-rule-band mdc-rule-band--ok">
            {isExactBand(approveMin, approveMax)
              ? `Aprob. = ${formatBandValue(approveMax)}`
              : `Aprob. ≤ ${formatBandValue(approveMax)}`}
          </span>
        )}
        {reviewMin !== undefined && reviewMax !== undefined && (
          <span className="mdc-rule-band mdc-rule-band--warn">
            {isExactBand(reviewMin, reviewMax)
              ? `Rev. = ${formatBandValue(reviewMin)}`
              : `Rev. ${formatBandValue(reviewMin)} - ${formatBandValue(reviewMax)}`}
          </span>
        )}
        {rejectMin !== undefined && (
          <span className="mdc-rule-band mdc-rule-band--bad">
            {isExactBand(rejectMin, rejectMax)
              ? `Rech. = ${formatBandValue(rejectMin)}`
              : `Rech. ≥ ${formatBandValue(rejectMin)}`}
          </span>
        )}
      </div>
    );
  }

  const severityClass =
    rule.severity === "fail" ? "mdc-badge mdc-badge--bad" : rule.severity === "warn" ? "mdc-badge mdc-badge--warn" : "mdc-badge mdc-badge--ok";

  return <span className={severityClass}>{RULE_SEVERITY_LABELS[rule.severity]}</span>;
}

function productCategoryFromMdcProduct(product: string): CreditProductCategory {
  return product === "Credito automotriz" ? "automotriz" : "personal";
}

function isMoralProduct(product: string) {
  return MORAL_CREDIT_PRODUCTS.includes(product as (typeof MORAL_CREDIT_PRODUCTS)[number]);
}

function defaultCrossSellAccepted(
  options: CrossSellOption[],
  client?: CreditClientProfile,
) {
  return Object.fromEntries(
    options.map((option, index) => {
      const normalized = option.id.toLowerCase();
      const enabled =
        normalized.includes("tdc")
          ? Boolean(client?.clientProducts.tdc)
          : normalized.includes("inversion")
            ? Boolean(client?.clientProducts.inversionPatrimonial)
            : normalized.includes("nomina")
              ? Boolean(client?.clientProducts.nomina)
              : normalized.includes("seguro")
                ? Boolean(client?.clientProducts.seguroAuto) || index === 0
                : false;
      return [option.id, enabled];
    }),
  );
}

function ApprovedCrossSellPanel({
  app,
  creditStore,
}: {
  app: Application;
  creditStore: ReturnType<typeof useCreditDemoStore>;
}) {
  const category = productCategoryFromMdcProduct(app.product);
  const product = creditStore.state.products.find((item) => item.category === category);
  const matchedClient =
    creditStore.state.clients.find(
      (client) =>
        client.productId === product?.id &&
        client.kyc.email.toLowerCase() === app.applicantEmail.toLowerCase(),
    ) ??
    creditStore.state.clients.find(
      (client) =>
        client.productId === product?.id &&
        client.name.toLowerCase() === app.applicantName.toLowerCase(),
    );
  const crossSellOptions = useMemo(
    () => creditStore.state.crossSellByCategory[category] ?? [],
    [category, creditStore.state.crossSellByCategory],
  );
  const [crossSellAccepted, setCrossSellAccepted] = useState<Record<string, boolean>>(() =>
    defaultCrossSellAccepted(crossSellOptions, matchedClient),
  );

  if (!product || crossSellOptions.length === 0) return null;

  const quotedClient: CreditClientProfile = matchedClient
    ? {
      ...matchedClient,
      amount: app.requestedAmount,
      termMonths: category === "automotriz" ? 48 : 24,
    }
    : {
      id: `mdc-cross-sell-${app.id}`,
      productId: product.id,
      name: app.applicantName,
      entityType: "PF",
      amount: app.requestedAmount,
      termMonths: category === "automotriz" ? 48 : 24,
      creditScore: bureauScoreFromRiskIndex(app.riskScore),
      aiApproved: true,
      clientProducts: {
        nomina: false,
        tdc: false,
        seguroAuto: false,
        inversionPatrimonial: false,
        cuentaAhorro: false,
      },
      kyc: {
        rfc: "PENDIENTE",
        nationality: "Mexicana",
        address: "No disponible",
        phone: "No disponible",
        email: app.applicantEmail,
        idVerified: true,
        pep: false,
        incomeMonthly: Math.max(20000, Math.round(app.requestedAmount / 12)),
      },
    };

  const quote = calculateCreditQuote({
    product,
    client: quotedClient,
    rules: [],
    crossSellOptions,
    crossSellAccepted,
  });
  const baseBeforeCross = rateBeforeCrossSell(
    quote.baseRate,
    quote.discountsApplied,
    crossSellOptions.map((option) => option.label),
  );
  const totalCrossBps = crossSellOptions
    .filter((option) => crossSellAccepted[option.id])
    .reduce((sum, option) => sum + option.bps, 0);
  const potentialCrossBps = quote.discountsPotential.reduce((sum, discount) => sum + discount.bps, 0);

  return (
    <section className="mdc-detail-card">
      <div className="cortex-quote-result__section">
        <h4>Cross-sell disponible</h4>
        <p className="cortex-quote-result__hint">Productos complementarios para mejorar tasa y relación comercial.</p>
        <ul className="cortex-quote-result__xs-list">
          {quote.discountsPotential.map((discount) => (
            <li key={discount.label}>−{discount.bps} pbs · {discount.label}</li>
          ))}
        </ul>
        <p className="cortex-quote-result__xs-total">
          Hasta <strong>−{potentialCrossBps} pbs</strong> · piso <strong>{formatPctCredit(product.discountBandMin)}</strong>
        </p>
      </div>

      <div className="cortex-quote-result__section">
        <div className="cortex-quote-result__xs-head">
          <h4>Activar cross-sell</h4>
          <span>En vivo: <strong>{formatPctCredit(quote.finalRate)}</strong></span>
        </div>
        <p className="cortex-quote-result__hint">
          Desde <strong>{formatPctCredit(baseBeforeCross)}</strong> · cada producto resta pbs de la tasa
        </p>
        <ul className="cortex-quote-result__xs-steps">
          {crossSellOptions.map((option, index) => {
            const enabled = crossSellAccepted[option.id];
            const stepRate = enabled
              ? crossSellRatePreview(baseBeforeCross, product.discountBandMin, crossSellOptions, crossSellAccepted, index)
              : crossSellRatePreview(baseBeforeCross, product.discountBandMin, crossSellOptions, crossSellAccepted, index, index);

            return (
              <li key={option.id} className={`cortex-quote-result__xs-step${enabled ? " cortex-quote-result__xs-step--on" : ""}`}>
                <AppCheckbox
                  id={`mdc-xs-${app.id}-${option.id}`}
                  checked={enabled}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setCrossSellAccepted((current) => ({ ...current, [option.id]: checked }));
                  }}
                  label={
                    <span className="cortex-quote-result__xs-step-label">
                      <strong>{index + 1}. {option.label}</strong>
                      <span>−{option.bps} pbs · {option.description}</span>
                    </span>
                  }
                />
                <span className="cortex-quote-result__xs-step-rate">
                  {enabled ? formatPctCredit(stepRate) : `→ ${formatPctCredit(stepRate)}`}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="cortex-quote-result__summary">
          <div className="cortex-quote-result__summary-rate">
            <span>{formatPctCredit(baseBeforeCross)}</span>
            <span>→</span>
            <strong>{formatPctCredit(quote.finalRate)}</strong>
          </div>
          <p className="cortex-quote-result__hint">
            {formatPctCredit(baseBeforeCross)} − {totalCrossBps} pbs = {formatPctCredit(quote.finalRate)} · piso {formatPctCredit(product.discountBandMin)}
          </p>
          <div className="cortex-quote-result__kpis">
            <div><span>Pago mensual</span><strong>{formatMxnCredit(quote.monthlyPayment)}</strong></div>
            <div><span>CAT est.</span><strong>{formatPctCredit(quote.estimatedCat)}</strong></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function evaluateRuleResult(rule: CreditRuleRow, metricValue: number, appStatus: ApplicationStatus): RuleSeverity {
  if (rule.decisionBands) {
    const { approveMin, approveMax, reviewMin, reviewMax, rejectMin, rejectMax } = rule.decisionBands;
    const inApprove =
      (approveMin === undefined || metricValue >= approveMin) &&
      (approveMax === undefined || metricValue <= approveMax);
    if (inApprove) return "pass";

    const inReview =
      (reviewMin === undefined || metricValue >= reviewMin) &&
      (reviewMax === undefined || metricValue < reviewMax);
    if (inReview) return "warn";

    const inReject =
      (rejectMin === undefined || metricValue >= rejectMin) &&
      (rejectMax === undefined || metricValue <= rejectMax);
    if (inReject) return "fail";

    return appStatus === "manualReview" ? "warn" : rule.severity;
  }

  if (rule.field === "company.naicsRiskIndex" && rule.operator === "contains") {
    const blockedIndexes = parseNumericList(rule.value);
    const isBlocked = blockedIndexes.includes(metricValue);
    if (isBlocked) return "fail";
    if (appStatus === "manualReview" && rule.severity === "warn") return "warn";
    return "pass";
  }

  const hasPolicyBreach =
    (rule.field === "income.monthlyNet" && metricValue < Number(rule.value || 0)) ||
    (rule.field === "ratios.dti" && metricValue > Number(rule.value || 0)) ||
    (rule.field === "applicant.age" && metricValue < Number(rule.value || 0)) ||
    (rule.field === "bureau.score" && metricValue < Number(rule.value || 0)) ||
    (rule.field === "credit.maxDaysPastDue" && metricValue > Number(rule.value || 0)) ||
    (rule.field === "credit.historyMonths" && metricValue < Number(rule.value || 0)) ||
    (rule.field === "employment.months" && metricValue < Number(rule.value || 0)) ||
    (rule.field === "company.antiquityMonths" && metricValue < Number(rule.value || 0)) ||
    (rule.field === "company.monthlyRevenue" && metricValue < Number(rule.value || 0)) ||
    (rule.field === "company.bureauScore" && metricValue < Number(rule.value || 0)) ||
    (rule.field === "company.maxDaysPastDue" && metricValue > Number(rule.value || 0)) ||
    (rule.field === "company.dscr" && metricValue < Number(rule.value || 0)) ||
    (rule.field === "company.leverageRatio" && metricValue > Number(rule.value || 0)) ||
    (rule.field === "company.topClientConcentration" && metricValue > Number(rule.value || 0)) ||
    (rule.field === "company.ebitdaMargin" && metricValue < Number(rule.value || 0)) ||
    (rule.field === "company.kybCompleteness" && metricValue < Number(rule.value || 0)) ||
    (rule.field === "company.amlAlerts" && metricValue > Number(rule.value || 0)) ||
    (rule.field === "company.shareholderScore" && metricValue < Number(rule.value || 0)) ||
    (rule.field === "company.requestedAmountToRevenue" && metricValue > Number(rule.value || 0)) ||
    (rule.field === "company.requestedTermMonths" && metricValue > Number(rule.value || 0)) ||
    (rule.field === "company.taxComplianceStatus" && metricValue < Number(rule.value || 0));

  if (hasPolicyBreach) {
    return appStatus === "manualReview" && rule.severity !== "fail" ? "warn" : "fail";
  }
  if (appStatus === "manualReview" && rule.severity === "warn") {
    return "warn";
  }
  return "pass";
}

function normalizeProductName(name: string) {
  if (name === "BNPL") return "Credito personal";
  if (name === "Prestamo personal") return "Credito automotriz";
  if (name.toLowerCase().includes("plazo fijo")) return "Credito personal";
  return name;
}

function normalizeApplicantEmail(email: string) {
  return email.replace(/@example\.com$/i, "@gmail.com");
}

function bindApplicantFromPool(
  app: Pick<Application, "id" | "appNo" | "product" | "applicantName" | "applicantEmail">,
  mode: MdcApplicantMode,
) {
  const pool: MdcClientPoolItem[] =
    mode === "moral"
      ? PM_MDC_CLIENTS.filter((client) => client.product === app.product)
      : app.product === "Credito automotriz"
        ? LCC_AUTO_CLIENTS
        : app.product === "Credito personal"
          ? LCC_PERSONAL_CLIENTS
          : [];

  if (pool.length === 0) {
    return { applicantName: app.applicantName, applicantEmail: app.applicantEmail };
  }

  const byEmail = pool.find(
    (client) => client.email.toLowerCase() === app.applicantEmail.toLowerCase(),
  );
  if (byEmail) {
    return { applicantName: byEmail.name, applicantEmail: byEmail.email };
  }
  const byName = pool.find(
    (client) => client.name.toLowerCase() === app.applicantName.toLowerCase(),
  );
  if (byName) {
    return { applicantName: byName.name, applicantEmail: byName.email };
  }

  if (mode === "moral") {
    return { applicantName: app.applicantName, applicantEmail: app.applicantEmail };
  }

  let hash = 0;
  const seed = `${app.id}-${app.appNo}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % pool.length;
  const selected = pool[idx];
  return { applicantName: selected.name, applicantEmail: selected.email };
}

function normalizeRequestedAmount(product: string, requestedAmount: number) {
  if (product === "Credito personal") {
    if (requestedAmount < 25_000) return 25_000 + Math.round(requestedAmount * 60);
    return Math.min(Math.max(requestedAmount, 25_000), 800_000);
  }
  if (product === "Credito automotriz") {
    if (requestedAmount < 100_000) return 100_000 + Math.round(requestedAmount * 14);
    return Math.min(Math.max(requestedAmount, 100_000), 2_500_000);
  }
  if (product === "Credito revolvente") {
    if (requestedAmount < 750_000) return 750_000 + Math.round(requestedAmount * 4);
    return Math.min(Math.max(requestedAmount, 750_000), 18_000_000);
  }
  if (product === "Credito simple empresarial") {
    if (requestedAmount < 1_000_000) return 1_000_000 + Math.round(requestedAmount * 3.5);
    return Math.min(Math.max(requestedAmount, 1_000_000), 25_000_000);
  }
  if (product === "Arrendamiento financiero") {
    if (requestedAmount < 1_500_000) return 1_500_000 + Math.round(requestedAmount * 3.2);
    return Math.min(Math.max(requestedAmount, 1_500_000), 30_000_000);
  }
  return requestedAmount;
}

function hydrateApplications(mode: MdcApplicantMode, rows: Application[]) {
  return sanitizeApplications(mode, rows).map((app) => ({
    ...app,
    product: normalizeProductName(app.product),
    riskScore: normalizeRiskScoreForStatus(app.status, app.riskScore),
    risk: riskFromApplicationStatus(app.status, app.riskScore),
    ...bindApplicantFromPool(
      {
        id: app.id,
        appNo: app.appNo,
        product: normalizeProductName(app.product),
        applicantName: app.applicantName,
        applicantEmail: normalizeApplicantEmail(app.applicantEmail),
      },
      mode,
    ),
    requestedAmount: normalizeRequestedAmount(normalizeProductName(app.product), app.requestedAmount),
  }));
}

function MdcStatCard({
  title,
  value,
  deltaPct,
  positive,
  comparisonLabel,
}: {
  title: string;
  value: string;
  deltaPct: number;
  positive: boolean;
  comparisonLabel: string;
}) {
  return (
    <article className="mdc-kpi-card mdc-kpi-card--rich">
      <div className="mdc-kpi-card__title-row">
        <p>{title}</p>
      </div>
      <strong>{value}</strong>
      <div className="mdc-kpi-card__delta">
        <span className={`mdc-kpi-card__delta-pill${positive ? " mdc-kpi-card__delta-pill--up" : " mdc-kpi-card__delta-pill--down"}`}>
          {deltaPctLabel(deltaPct)}
        </span>
        <span>{comparisonLabel}</span>
      </div>
    </article>
  );
}

function LineChart({ points }: { points: { label: string; value: number }[] }) {
  const width = 1080;
  const height = 320;
  const topPad = 18;
  const rightPad = 20;
  const bottomPad = 44;
  const leftPad = 52;
  const chartWidth = width - leftPad - rightPad;
  const chartHeight = height - topPad - bottomPad;
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const chartMax = Math.max(8, Math.ceil(maxValue / 2) * 2);
  const ticks = [0, chartMax / 4, chartMax / 2, (chartMax * 3) / 4, chartMax].map((tick) => Math.round(tick));
  const uniqueTicks = Array.from(new Set(ticks));

  const xForIndex = (index: number) => leftPad + (chartWidth * index) / Math.max(points.length - 1, 1);
  const yForValue = (value: number) => topPad + chartHeight - (value / chartMax) * chartHeight;
  const linePoints = points.map((point, index) => `${xForIndex(index)},${yForValue(point.value)}`).join(" ");
  const labelStep = points.length > 14 ? Math.ceil(points.length / 12) : 1;

  return (
    <svg className="mdc-line-chart" viewBox={`0 0 ${width} ${height}`} aria-hidden>
      {uniqueTicks.map((tick) => {
        const y = yForValue(tick);
        return (
          <g key={tick}>
            <line x1={leftPad} y1={y} x2={leftPad + chartWidth} y2={y} className="mdc-line-chart__grid" />
            <text x={leftPad - 8} y={y + 4} textAnchor="end" className="mdc-line-chart__y-label">
              {tick}
            </text>
          </g>
        );
      })}

      <polyline points={linePoints} className="mdc-line-chart__line" />

      {points.map((point, index) => (
        <g key={`${point.label}-${index}`}>
          <circle cx={xForIndex(index)} cy={yForValue(point.value)} r="4" className="mdc-line-chart__dot" />
          {(index === 0 || index === points.length - 1 || index % labelStep === 0) && (
            <text x={xForIndex(index)} y={height - 16} textAnchor="middle" className="mdc-line-chart__x-label">
              {point.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

function DonutChart({
  data,
  centerLabel = "solicitudes",
  legendFirst = true,
}: {
  data: { label: string; value: number; color: string }[];
  centerLabel?: string;
  legendFirst?: boolean;
}) {
  const rawTotal = data.reduce((sum, d) => sum + d.value, 0);
  const total = Math.max(rawTotal, 1);
  const percentages = rawTotal === 0 ? data.map(() => 0) : normalizedPercentages(data.map((d) => d.value));
  const r = 52;
  const c = 62;
  const circumference = 2 * Math.PI * r;
  const slices = rawTotal === 0
    ? []
    : data.reduce<{ label: string; value: number; color: string; len: number; offset: number }[]>(
      (acc, slice) => {
        const used = acc.reduce((sum, item) => sum + item.len, 0);
        const len = circumference * (slice.value / total);
        acc.push({
          label: slice.label,
          value: slice.value,
          color: slice.color,
          len,
          offset: used,
        });
        return acc;
      },
      [],
    );

  return (
    <div className={`mdc-donut-wrap${legendFirst ? " mdc-donut-wrap--legend-first" : ""}`}>
      <div className="mdc-donut-shell">
        <svg viewBox="0 0 124 124" className="mdc-donut" aria-hidden>
          <circle cx={c} cy={c} r={r} fill="none" stroke="#efeaf6" strokeWidth="12" />
          <g>
            {slices.map((slice) => {
              return (
                <circle
                  key={slice.label}
                  cx={c}
                  cy={c}
                  r={r}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="12"
                  strokeLinecap="butt"
                  strokeDasharray={`${slice.len} ${circumference - slice.len}`}
                  strokeDashoffset={-slice.offset}
                  transform={`rotate(-90 ${c} ${c})`}
                />
              );
            })}
          </g>
          <circle cx={c} cy={c} r="38" fill="#ffffff" />
          <text x={c} y={58} textAnchor="middle" className="mdc-donut-total">{rawTotal}</text>
          <text x={c} y={72} textAnchor="middle" className="mdc-donut-sub">{centerLabel}</text>
        </svg>
      </div>
      <div className="mdc-donut-legend">
        {data.map((d, index) => (
          <div key={d.label} className="mdc-legend-item">
            <span style={{ background: d.color }} />
            <strong>{d.label}</strong>
            <em className="mdc-legend-item__pct">{pctLabel(percentages[index] ?? 0)}</em>
          </div>
        ))}
      </div>
    </div>
  );
}

function SegmentedBar({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = Math.max(data.reduce((sum, d) => sum + d.value, 0), 1);
  return (
    <div className="mdc-seg-wrap">
      <div className="mdc-seg-bar" aria-hidden>
        {data.map((segment) => (
          <div
            key={segment.label}
            style={{ width: `${(segment.value / total) * 100}%`, background: segment.color }}
          />
        ))}
      </div>
      <div className="mdc-seg-legend">
        {data.map((segment) => (
          <div key={segment.label} className="mdc-seg-item">
            <span style={{ background: segment.color }} />
            <strong>{segment.label}</strong>
            <em>{ratioLabel(segment.value / total)}</em>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MoralApplicantDetailModal({
  app,
  rules,
  onClose,
  layout = "modal",
}: {
  app: Application;
  rules: CreditRuleRow[];
  onClose: () => void;
  layout?: "modal" | "page";
}) {
  const [feedback, setFeedback] = useState("");
  const [overrideChoice, setOverrideChoice] = useState<ApplicationStatus>("manualReview");
  const [overrideReason, setOverrideReason] = useState("");
  const [breakdown, setBreakdown] = useState<any[] | null>(app.rulesBreakdown || null);
  const [breakdownStatus, setBreakdownStatus] = useState<string | null>(app.rulesBreakdownStatus || app.analysis?.status || null);
  useEffect(() => {
    if (app.rulesBreakdown && app.rulesBreakdown.length > 0) {
      setBreakdown(app.rulesBreakdown);
      setBreakdownStatus(app.rulesBreakdownStatus || app.analysis?.status || null);
      return;
    }
    const analyzePayload = app.rawPayload || {
      product: app.product,
      personType: "moral",
      orgId: getStoredOrganization()?.id || "ORG-001",
      identificationNumber: app.applicantId || app.id || "APP-PM-001",
      firstName: app.applicantName || "Empresa",
      lastName: "",
      businessName: app.applicantName,
      email: app.applicantEmail,
      amount: app.requestedAmount,
      montoCredito: app.requestedAmount,
      tipoEmpleo: "Empresarial",
      edad: 35,
      plazo: 24,
      capacidadPago: 30,
    };
    analyzeFinanceRequest(analyzePayload)
      .then((res) => {
        if (res && Array.isArray(res.rulesBreakdown) && res.rulesBreakdown.length > 0) {
          setBreakdown(res.rulesBreakdown);
          setBreakdownStatus(res.status);
        }
      })
      .catch((err) => {
        console.debug("Moral rules breakdown fetch fallback", err);
      });
  }, [app]);

  const isFreshLocalApplication = app.id.startsWith("local-");
  const profile = buildMoralCompanyProfile(app);
  const appRiskLevel = riskFromScore(app.riskScore);
  const scoreTone = app.status === "declined" ? "bad" : app.status === "manualReview" || app.status === "pending" ? "warn" : "ok";
  const stages = [
    { id: "input", label: "Captura y onboarding", state: isFreshLocalApplication ? "current" : "done" },
    { id: "kyb", label: "KYB / existencia legal", state: isFreshLocalApplication ? "current" : profile.kybCompleteness >= 0.9 ? "done" : "current" },
    { id: "aml", label: "AML / PLD", state: isFreshLocalApplication ? "current" : profile.amlAlerts > 0 ? "failed" : "done" },
    { id: "risk", label: "Scoring y finanzas", state: isFreshLocalApplication ? "current" : app.status === "declined" ? "failed" : "done" },
    {
      id: "decision",
      label: "Decision automatizada",
      state:
        isFreshLocalApplication
          ? "current"
          : app.status === "declined"
            ? "failed"
            : app.status === "manualReview" || app.status === "pending"
              ? "current"
              : "done",
    },
  ] as const;

  const metricByField: Partial<Record<CreditRuleRow["field"], number>> = {
    "company.antiquityMonths": profile.antiquityMonths,
    "company.monthlyRevenue": profile.monthlyRevenue,
    "company.bureauScore": profile.bureauScore,
    "company.shareholderScore": profile.shareholderScore,
    "company.maxDaysPastDue": profile.maxDaysPastDue,
    "company.dscr": profile.dscr,
    "company.leverageRatio": profile.leverageRatio,
    "company.topClientConcentration": profile.topClientConcentration,
    "company.ebitdaMargin": profile.ebitdaMargin,
    "company.kybCompleteness": profile.kybCompleteness,
    "company.amlAlerts": profile.amlAlerts,
    "company.requestedAmountToRevenue": profile.requestedAmountToRevenue,
    "company.naicsRiskIndex": profile.naicsRiskIndex,
    "company.requestedTermMonths": profile.requestedTermMonths,
    "company.taxComplianceStatus": profile.taxComplianceStatus,
  };

  const ruleResultLabel: Record<RuleSeverity, string> = {
    pass: "Aprobado",
    warn: "Revision",
    fail: "Rechazado",
  };

  const activeRules = rules
    .filter((rule) => rule.status === "active" && rule.products.includes(app.product as RuleProduct))
    .map((rule) => {
      const metricValue = metricByField[rule.field] ?? 0;
      const result = isFreshLocalApplication ? ("warn" as RuleSeverity) : evaluateRuleResult(rule, metricValue, app.status);
      return { ...rule, metricValue, result };
    });

  const failedRuleRows = activeRules.filter((rule) => rule.result === "fail");
  const warnedRuleRows = activeRules.filter((rule) => rule.result === "warn");

  const pmRuleReason = (rule: (typeof activeRules)[number]) => {
    switch (rule.field) {
      case "company.antiquityMonths":
        return `Antiguedad operativa de ${profile.antiquityMonths} meses, por debajo del minimo requerido.`;
      case "company.monthlyRevenue":
        return `Facturacion mensual promedio de ${money(profile.monthlyRevenue)}, insuficiente frente al monto solicitado.`;
      case "company.bureauScore":
        return `Score de buro empresarial de ${profile.bureauScore}, debajo del umbral de originacion.`;
      case "company.shareholderScore":
        return `Score consolidado de socios / aval en ${profile.shareholderScore}, requiere mitigantes adicionales.`;
      case "company.maxDaysPastDue":
        return `Atraso maximo reciente de ${profile.maxDaysPastDue} dias en experiencia de pago empresarial.`;
      case "company.dscr":
        return `DSCR de ${profile.dscr.toFixed(2)}, insuficiente para el servicio de deuda esperado.`;
      case "company.leverageRatio":
        return `Apalancamiento de ${profile.leverageRatio.toFixed(2)}x, por encima del apetito definido.`;
      case "company.topClientConcentration":
        return `Concentracion del cliente principal en ${formatPlainPct(profile.topClientConcentration)}, expone demasiado la fuente de ingresos.`;
      case "company.ebitdaMargin":
        return `Margen EBITDA de ${formatPlainPct(profile.ebitdaMargin)}, por debajo del nivel minimo esperado.`;
      case "company.kybCompleteness":
        return `Expediente KYB en ${formatPlainPct(profile.kybCompleteness)}, todavia incompleto.`;
      case "company.amlAlerts":
        return `Existen ${profile.amlAlerts} alerta(s) AML/PLD abiertas que bloquean aprobacion automatica.`;
      case "company.requestedAmountToRevenue":
        return `La relacion monto / ventas es ${profile.requestedAmountToRevenue.toFixed(2)}x y presiona la capacidad de pago.`;
      case "company.naicsRiskIndex":
        return `El indice sectorial NAICS ${profile.naicsRiskIndex} esta configurado en la lista de rechazo automatico de la politica.`;
      case "company.requestedTermMonths":
        return `Plazo solicitado de ${profile.requestedTermMonths} meses excede el maximo permitido para el producto.`;
      case "company.taxComplianceStatus":
        return profile.taxComplianceStatus === 0
          ? "La Opinion de Cumplimiento Fiscal 32-D sigue en proceso de validacion por parte del SAT."
          : "La Opinion de Cumplimiento Fiscal 32-D es negativa y bloquea la originacion automatica.";
      default:
        return `${rule.name}: validacion corporativa fuera de politica.`;
    }
  };

  const decisionReason =
    app.status === "approved"
      ? `Operacion aprobada con oferta de monto, tasa y plazo. DSCR ${profile.dscr.toFixed(2)}, score empresarial ${profile.bureauScore} y expediente KYB ${formatPlainPct(profile.kybCompleteness)}.`
      : app.status === "declined"
        ? `Solicitud rechazada por politica automatica: ${failedRuleRows.map(pmRuleReason).slice(0, 3).join(" ")}`
        : app.status === "overridden"
          ? `Operacion aprobada con override documentado. Se conservaron alertas en ${warnedRuleRows.map((rule) => rule.name).slice(0, 2).join(", ") || "politica comercial"}.`
          : `Caso enviado a zona gris para revision manual. Alertas principales: ${warnedRuleRows.map(pmRuleReason).slice(0, 2).join(" ") || "validaciones complementarias de riesgo y cumplimiento."}`;

  const runAction = (label: string) => {
    setFeedback(`${label} ejecutado · ${new Intl.DateTimeFormat("es-MX", { timeStyle: "short", timeZone: getConfiguredTimezone() }).format(new Date())}`);
  };

  const applyOverride = () => {
    if (!overrideReason.trim()) {
      setFeedback("Debes dejar la justificacion del override. Si no, eso en cumplimiento no pasa ni de chiste.");
      return;
    }
    setFeedback(`Override aplicado: ${STATUS_LABELS[overrideChoice]}. Registrado en trazabilidad corporativa.`);
  };

  const decisionCardClass = (status: "approved" | "declined" | "manual") =>
    `mdc-pm-decision-card${(status === "approved" && app.status === "approved") ||
      (status === "declined" && app.status === "declined") ||
      (status === "manual" && (app.status === "manualReview" || app.status === "pending" || app.status === "overridden"))
      ? " mdc-pm-decision-card--active"
      : ""
    }`;

  return (
    <div className={layout === "page" ? "mdc-modal mdc-modal--page" : "mdc-modal-backdrop"} onClick={layout === "page" ? undefined : onClose}>
      <div className="mdc-modal mdc-modal--detail" onClick={(e) => e.stopPropagation()}>
        <header className="mdc-detail-head">
          <div className="mdc-detail-head__title">
            {layout === "page" ? null : (
            <button type="button" className="mdc-link-btn" onClick={onClose}>
              ← Volver a solicitudes
            </button>
            )}
            <div className="mdc-detail-head__line">
              <h3>Detalle de empresa</h3>
              <span className={classForStatus(app.status)}>{STATUS_LABELS[app.status]}</span>
              <span className={classForRisk(appRiskLevel)}>{RISK_LABELS[appRiskLevel]}</span>
            </div>
            <p>
              {app.appNo} · {app.product} · {profile.segment}
            </p>
          </div>
        </header>

        {feedback ? <p className="mdc-detail-feedback">{feedback}</p> : null}

        <div className="mdc-detail-progress">
          {stages.map((stage) => (
            <div key={stage.id} className="mdc-stage-card">
              <span className={`mdc-stage-dot mdc-stage-dot--${stage.state}`} />
              <strong>{stage.label}</strong>
              <em>
                {isFreshLocalApplication
                  ? "0%"
                  : stage.state === "done"
                    ? "Completado"
                    : stage.state === "current"
                      ? "En proceso"
                      : "Con observacion"}
              </em>
            </div>
          ))}
        </div>

        <div className="mdc-pm-hero">
          <div>
            <p className="mdc-pm-hero__eyebrow">Motor de decision de credito · persona moral</p>
            <h2>{app.applicantName}</h2>
            <span>{app.applicantEmail}</span>
          </div>
          <div className="mdc-pm-hero__stats">
            <div>
              <span>Score empresa</span>
              <strong>{profile.bureauScore}</strong>
            </div>
            <div>
              <span>DSCR</span>
              <strong>{profile.dscr.toFixed(2)}x</strong>
            </div>
            <div>
              <span>Monto solicitado</span>
              <strong>{money(app.requestedAmount)}</strong>
            </div>
          </div>
        </div>

        <div className="mdc-detail-layout mdc-detail-layout--pm">
          <div className="mdc-detail-main">
            <section className="mdc-detail-card">
              <div className="mdc-detail-card__head">
                <h4>1. Captura y onboarding digital</h4>
                <span className="mdc-badge mdc-badge--neutral">{profile.companyType}</span>
              </div>
              <dl className="mdc-detail-dl">
                <div><dt>RFC / Tax ID</dt><dd>{app.id}</dd></div>
                <div><dt>Producto solicitado</dt><dd>{app.product}</dd></div>
                <div><dt>Plazo solicitado</dt><dd>{profile.requestedTermMonths} meses</dd></div>
                <div><dt>Destino del credito</dt><dd>{app.product === "Credito revolvente" ? "Capital de trabajo" : app.product === "Arrendamiento financiero" ? "Activo productivo" : "Expansion operativa"}</dd></div>
              </dl>
            </section>

            <section className="mdc-detail-card">
              <div className="mdc-detail-card__head">
                <h4>2. Verificacion y KYB</h4>
                <span className={profile.kybCompleteness >= 0.9 ? "mdc-badge mdc-badge--ok" : "mdc-badge mdc-badge--warn"}>
                  {formatPlainPct(profile.kybCompleteness)}
                </span>
              </div>
              <div className="mdc-pm-grid">
                <article className="mdc-pm-metric-card">
                  <span>Registro mercantil / existencia legal</span>
                  <strong>{profile.mercantileStatus}</strong>
                </article>
                <article className="mdc-pm-metric-card">
                  <span>Situacion fiscal SAT</span>
                  <strong>{profile.taxStatus}</strong>
                </article>
                <article className="mdc-pm-metric-card">
                  <span>Estructura societaria</span>
                  <strong>{profile.shareholdersStructure}</strong>
                </article>
                <article className="mdc-pm-metric-card">
                  <span>Beneficiarios reales (UBO)</span>
                  <strong>{formatPlainPct(profile.uboCoverage)}</strong>
                </article>
              </div>
              <div className="mdc-pm-status-list">
                {profile.docsStatus.map((item) => (
                  <article key={item.label} className="mdc-pm-status-item">
                    <div>
                      <strong>{item.label}</strong>
                      <p>{item.detail}</p>
                    </div>
                    <span className={`mdc-col-pill mdc-col-pill--${item.status}`}>{item.status === "ok" ? "Ok" : item.status === "warn" ? "Revision" : "Bloqueo"}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="mdc-detail-card">
              <div className="mdc-detail-card__head">
                <h4>3. Cumplimiento y listas restrictivas</h4>
                <span className={profile.amlAlerts === 0 ? "mdc-badge mdc-badge--ok" : "mdc-badge mdc-badge--bad"}>
                  {profile.amlAlerts === 0 ? "Sin alertas" : `${profile.amlAlerts} alerta(s)`}
                </span>
              </div>
              <div className="mdc-pm-status-list">
                {profile.amlChecks.map((item) => (
                  <article key={item.label} className="mdc-pm-status-item">
                    <div>
                      <strong>{item.label}</strong>
                      <p>{item.detail}</p>
                    </div>
                    <span className={`mdc-col-pill mdc-col-pill--${item.status}`}>{item.status === "ok" ? "Limpio" : item.status === "warn" ? "Seguimiento" : "Bloqueante"}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="mdc-detail-card">
              <h4>4. Consulta a buro y scoring de la empresa</h4>
              <div className="mdc-pm-grid">
                <article className="mdc-pm-metric-card">
                  <span>Buro de credito empresarial</span>
                  <strong>{profile.bureauScore}</strong>
                </article>
                <article className="mdc-pm-metric-card">
                  <span>Score socios / aval</span>
                  <strong>{profile.shareholderScore}</strong>
                </article>
                <article className="mdc-pm-metric-card">
                  <span>Creditos vigentes y vencidos</span>
                  <strong>{profile.maxDaysPastDue} dias max.</strong>
                </article>
                <article className="mdc-pm-metric-card">
                  <span>Nivel de endeudamiento</span>
                  <strong>{formatPlainPct(profile.debtBurdenRatio)}</strong>
                </article>
              </div>
            </section>

            <section className="mdc-detail-card">
              <h4>5. Capacidad de pago y riesgo del sector</h4>
              <div className="mdc-pm-grid">
                <article className="mdc-pm-metric-card"><span>Relacion cuota / ingresos</span><strong>{formatPlainPct(profile.quotaToIncomeRatio)}</strong></article>
                <article className="mdc-pm-metric-card"><span>Concentracion top cliente</span><strong>{formatPlainPct(profile.topClientConcentration)}</strong></article>
                <article className="mdc-pm-metric-card"><span>Indice sectorial NAICS</span><strong>{profile.naicsRiskIndex}</strong></article>
                <article className="mdc-pm-metric-card"><span>Monto / ventas mensuales</span><strong>{profile.requestedAmountToRevenue.toFixed(2)}x</strong></article>
              </div>
              <div className="mdc-pm-chip-wrap">
                {profile.sectorHighlights.map((item) => (
                  <span key={item} className="mdc-col-pill mdc-col-pill--ok">{item}</span>
                ))}
              </div>
            </section>

            <section className="mdc-detail-card">
              <div className="mdc-detail-card__head">
                <h4>6. Motor de reglas y politicas de credito</h4>
                <span
                  className={
                    breakdownStatus === "Aprobada" || breakdownStatus === "Aprobado" ? "mdc-badge mdc-badge--ok" :
                      breakdownStatus === "Rechazada" || breakdownStatus === "Rechazado" ? "mdc-badge mdc-badge--bad" :
                        breakdownStatus === "Revision manual" || breakdownStatus === "Revision" ? "mdc-badge mdc-badge--warn" :
                          isFreshLocalApplication
                            ? "mdc-badge mdc-badge--neutral"
                            : failedRuleRows.length > 0
                              ? "mdc-badge mdc-badge--bad"
                              : warnedRuleRows.length > 0
                                ? "mdc-badge mdc-badge--warn"
                                : "mdc-badge mdc-badge--ok"
                  }
                >
                  {breakdownStatus || (isFreshLocalApplication ? "Pendiente" : failedRuleRows.length > 0 ? "Con rechazos" : warnedRuleRows.length > 0 ? "Con revision" : "Aprobable")}
                </span>
              </div>
              <div className="mdc-detail-rule-list">
                {breakdown && breakdown.length > 0 ? (
                  breakdown.map((rule, idx) => {
                    const rawStatus = rule.status || (rule.passed ? (rule.severity === "Revision" || rule.severity === "warn" ? "Revision" : "Aprobado") : "Rechazado");
                    const isApproved =
                      rawStatus === "Aprobado" || rawStatus === "Aprobada" || rawStatus === "pass" || rule.passed === true;

                    const isRevision =
                      !isApproved &&
                      (rawStatus === "Revision" ||
                        rawStatus === "Revision manual" ||
                        rawStatus === "warn" ||
                        rule.severity === "Revision" ||
                        rule.severity === "warn");

                    const isDeclined =
                      !isRevision &&
                      !isApproved &&
                      (rawStatus === "Rechazado" || rawStatus === "Rechazada" || rawStatus === "Rechazo" || rawStatus === "fail" || rule.passed === false);

                    const displayStatus = isRevision ? "Revision" : isApproved ? "Aprobado" : isDeclined ? "Rechazado" : rawStatus;
                    const badgeClass =
                      isApproved
                        ? "mdc-badge mdc-badge--ok"
                        : isDeclined
                          ? "mdc-badge mdc-badge--bad"
                          : "mdc-badge mdc-badge--warn";

                    return (
                      <article key={rule.id || `pm-rule-breakdown-${idx}`} className="mdc-detail-rule">
                        <div>
                          <strong>{rule.name}</strong>
                          {rule.reason ? <p>{rule.reason}</p> : null}
                        </div>
                        <span className={badgeClass}>
                          {displayStatus}
                        </span>
                      </article>
                    );
                  })
                ) : (
                  activeRules.map((rule) => (
                    <article key={rule.id} className="mdc-detail-rule">
                      <div>
                        <strong>{rule.name}</strong>
                        <p>{rule.description}</p>
                      </div>
                      <span className={isFreshLocalApplication ? "mdc-badge mdc-badge--neutral" : chipToneBySeverity(rule.result)}>
                        {isFreshLocalApplication ? "Pendiente" : ruleResultLabel[rule.result]}
                      </span>
                    </article>
                  ))
                )}
              </div>
            </section>

          </div>

          <aside className="mdc-detail-side">
            <section className="mdc-detail-card">
              <h4>Resumen ejecutivo</h4>
              <div className="mdc-detail-score-grid">
                <div><span>Segmento</span><strong>{profile.segment}</strong></div>
                <div><span>Antiguedad</span><strong>{Math.floor(profile.antiquityMonths / 12)} a</strong></div>
                <div><span>AML alertas</span><strong>{profile.amlAlerts}</strong></div>
                <div><span>KYB</span><strong>{formatPlainPct(profile.kybCompleteness)}</strong></div>
                <div><span>NAICS</span><strong>{profile.naicsRiskIndex}</strong></div>
                <div><span>ROE / ROA</span><strong>{formatPlainPct(profile.roe, 0)} / {formatPlainPct(profile.roa, 0)}</strong></div>
              </div>
              <div className="mdc-score-track" aria-hidden>
                <span style={{ width: `${Math.min(100, Math.round((profile.bureauScore / 850) * 100))}%` }} />
              </div>
            </section>

            <section className="mdc-detail-card">
              <h4>Override manual</h4>
              <label className="mdc-detail-field">
                <span>Nueva decision</span>
                <select value={overrideChoice} onChange={(e) => setOverrideChoice(e.target.value as ApplicationStatus)}>
                  <option value="approved">Aprobada</option>
                  <option value="declined">Rechazada</option>
                  <option value="manualReview">Revision manual</option>
                  <option value="overridden">Override</option>
                </select>
              </label>
              <label className="mdc-detail-field">
                <span>Justificacion</span>
                <textarea
                  rows={4}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Mitigantes, comite, soporte documental o aprobacion comercial."
                />
              </label>
              <button type="button" className="mdc-btn mdc-btn--primary" onClick={applyOverride}>
                Aplicar override
              </button>
            </section>
          </aside>
        </div>

      </div>
    </div>
  );
}

function formatDurationLabel(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!rest) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

type DetailDocumentStatus = "Pendiente" | "En proceso" | "Completado" | "Revisión manual" | "Con errores";
type DetailDocError = { message: string; step?: string; detail?: string };
type ManualReviewAction = "APPROVED" | "REJECTED" | "REPROCESS" | null;
type DocumentActionFeedback = { type: "success" | "error"; message: string } | null;

function isUuidLike(value?: string | null) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

function extractFinanceRequestUserId(payload: FinanceRequestDetail): string | null {
  const directUserId = payload?.userId;
  const direct = payload?.user?.id;
  if (isUuidLike(directUserId)) return directUserId || null;
  if (isUuidLike(direct)) return direct || null;
  return null;
}

function toDetailDocError(error: unknown, fallback: string): DetailDocError {
  if (error && typeof error === "object") {
    const typed = error as Partial<MdcApiError>;
    return {
      message: typed.message || fallback,
      step: typed.step,
      detail: typed.detail,
    };
  }
  return { message: fallback };
}

function deriveCombinedDocumentStatus(progresses: Array<FinancialDocumentProgress | null>): DetailDocumentStatus {
  const available = progresses.filter((progress): progress is FinancialDocumentProgress => Boolean(progress));
  if (available.length === 0) return "Pendiente";
  if (available.some((progress) => progress.failed > 0)) return "Con errores";
  if (available.some((progress) => progress.manualReview > 0)) return "Revisión manual";
  if (available.reduce((total, progress) => total + progress.uploaded, 0) === 0) return "Pendiente";
  if (available.every((progress) => progress.processingComplete)) return "Completado";
  return "En proceso";
}

function documentStatusBadgeClass(status: DetailDocumentStatus) {
  switch (status) {
    case "Con errores":
      return "mdc-badge mdc-badge--bad";
    case "Revisión manual":
      return "mdc-badge mdc-badge--warn";
    case "Completado":
      return "mdc-badge mdc-badge--ok";
    case "En proceso":
      return "mdc-badge mdc-badge--info";
    default:
      return "mdc-badge mdc-badge--neutral";
  }
}

function bdaStatusBadgeClass(status?: string | null, manualDecision?: string | null) {
  if (manualDecision === "APPROVED") return "mdc-badge mdc-badge--ok";
  if (manualDecision === "REJECTED") return "mdc-badge mdc-badge--bad";
  switch (status) {
    case "COMPLETED":
      return "mdc-badge mdc-badge--ok";
    case "MANUAL_REVIEW_REQUIRED":
      return "mdc-badge mdc-badge--warn";
    case "FAILED":
    case "REJECTED":
      return "mdc-badge mdc-badge--bad";
    case "PROCESSING":
    case "UPLOADED":
    case "SENT_TO_BDA":
      return "mdc-badge mdc-badge--info";
    default:
      return "mdc-badge mdc-badge--neutral";
  }
}

function bdaStatusLabel(status?: string | null, manualDecision?: string | null, errorCode?: string | null) {
  if (manualDecision === "APPROVED") return "Aprobado manualmente";
  if (manualDecision === "REJECTED") return "Rechazado manualmente";
  if (errorCode === "INVALID_DOCUMENT_TYPE") return "No corresponde";
  switch (status) {
    case "COMPLETED": return "Completado";
    case "PROCESSING":
    case "UPLOADED":
    case "SENT_TO_BDA":
      return "Analizando…";
    case "MANUAL_REVIEW_REQUIRED": return "Revisión manual";
    case "FAILED": return "Fallido";
    case "REJECTED": return "Rechazado";
    default: return "Pendiente";
  }
}

function bdaResultLabel(status?: string | null, extraction?: FinancialDocumentExtractionResponse | null, manualDecision?: string | null) {
  if (manualDecision === "APPROVED") return "Validado por operador";
  if (manualDecision === "REJECTED") return "Rechazado por operador";
  if (extraction?.errorCode === "INVALID_DOCUMENT_TYPE" || (status === "REJECTED" && extraction?.errorCode === "INVALID_DOCUMENT_TYPE")) {
    return extraction?.errorMessage || "Documento que no corresponde. Sube uno válido.";
  }
  if (status === "REJECTED" && extraction?.errorMessage) return extraction.errorMessage;
  if (extraction?.processed === false) return "Sin extracción procesada";
  switch (status) {
    case "COMPLETED":
      return "Extracción lista";
    case "MANUAL_REVIEW_REQUIRED":
      return "Requiere revisión manual";
    case "FAILED":
      return extraction?.extraction ? "Falló con extracción parcial" : "Error en análisis";
    case "PROCESSING":
    case "UPLOADED":
    case "SENT_TO_BDA":
      return "Analizando con Bedrock…";
    default:
      return "Pendiente";
  }
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "N/D";
  return String(value);
}

function DocumentMatchBadge({ match, className }: { match?: DocumentMatch | null; className?: string }) {
  const badge = documentMatchBadge(match);
  if (!badge || !match) return null;
  return (
    <span className={`${badge.className}${className ? ` ${className}` : ""}`} title={match.note}>
      {badge.label}
    </span>
  );
}

function DocumentMatchPanel({ match }: { match?: DocumentMatch | null }) {
  const badge = documentMatchBadge(match);
  if (!match || !badge) return null;
  const treatMismatchAsNeutral = match.status === "neutral" || match.status === "pending_kyc";

  return (
    <section className="mdc-extraction-card">
      <div className="mdc-extraction-card__head">
        <h4>Comparación con KYC</h4>
        <span className={badge.className} title={match.note}>{badge.label}</span>
      </div>
      <p className="mdc-kyc-match-note">{match.note}</p>
      <dl className="mdc-kyc-match-grid">
        {match.fields.map((field) => (
          <div key={field.name} className={documentMatchFieldClass(field, treatMismatchAsNeutral)}>
            <dt>{field.name === "curp" ? "CURP" : "Nombre"}</dt>
            <dd>
              <span>KYC: {displayValue(field.kyc)}</span>
              <span>Documento: {displayValue(field.document)}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function formatDocumentMoney(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return "N/D";
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(numeric);
}

function formatConfidence(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return "N/D";
  return `${Math.round((numeric <= 1 ? numeric * 100 : numeric) * 10) / 10}%`;
}

function formatExtractionDate(value: unknown) {
  if (!value) return "N/D";
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

function DocumentCategoryPanel({
  title,
  itemLabel,
  progress,
  loading,
  error,
  reprocessingAnalysisId,
  extractionAnalysisId,
  extractionData,
  actionErrors,
  onReprocess,
  onViewExtraction,
}: {
  title: string;
  itemLabel: (index: number) => string;
  progress: FinancialDocumentProgress | null;
  loading: boolean;
  error: DetailDocError | null;
  reprocessingAnalysisId: string | null;
  extractionAnalysisId: string | null;
  extractionData: FinancialDocumentExtractionResponse | null;
  actionErrors: Record<string, DetailDocError | null>;
  onReprocess: (analysisId: string, rowKey: string) => void;
  onViewExtraction: (analysisId: string, documentId: string | null, label: string, fileName: string) => void;
}) {
  return (
    <section className="mdc-document-category">
      <header className="mdc-document-category__head">
        <div>
          <span>Sección documental</span>
          <h5>{title}</h5>
        </div>
        <div className="mdc-document-category__summary">
          <strong>{progress ? `${progress.uploaded}/${progress.required} archivos` : "Sin datos"}</strong>
        </div>
      </header>

      {error ? (
        <div className="mdc-document-error">
          <strong>Documentación no disponible temporalmente</strong>
          <span>{error.message}</span>
        </div>
      ) : null}

      <div className="mdc-document-list">
        {loading && !progress ? (
          <div className="mdc-document-loading">Cargando documentación...</div>
        ) : !progress || progress.documents.length === 0 ? (
          <div className="mdc-document-empty">No hay documentos cargados en esta categoría.</div>
        ) : (
          progress.documents.map((doc, index) => {
            const label = itemLabel(index);
            const rowKey = doc.analysisId || doc.documentId || `${title}-${index}`;
            const rowError = actionErrors[rowKey];
            const analyzing = isDocumentAnalyzing(doc.status);
            const canReprocess = (doc.status === "FAILED" || doc.status === "REJECTED") && Boolean(doc.analysisId);
            const canViewExtraction = Boolean(doc.analysisId) && !analyzing;
            const extractionPreview = extractionAnalysisId === doc.analysisId ? extractionData : null;

            return (
              <article className="mdc-document-row" key={rowKey}>
                <strong className="mdc-document-row__label">{label}</strong>
                <span className="mdc-document-row__file">{doc.fileName || "Archivo sin nombre"}</span>
                <span className={`${bdaStatusBadgeClass(doc.status, doc.manualDecision)} mdc-document-row__status`}>{bdaStatusLabel(doc.status, doc.manualDecision, doc.errorCode)}</span>
                {doc.documentMatch ? (
                  <DocumentMatchBadge match={doc.documentMatch} className="mdc-document-row__kyc-match" />
                ) : (
                  <span className="mdc-document-row__kyc-match" />
                )}
                <span className="mdc-document-row__result">{bdaResultLabel(doc.status, extractionPreview, doc.manualDecision)}</span>
                <div className="mdc-document-row__actions">
                  {analyzing ? (
                    <span className="mdc-document-row__analyzing">Analizando documento…</span>
                  ) : null}
                  {canReprocess ? (
                    <button
                      type="button"
                      className="mdc-btn mdc-btn--ghost mdc-btn--sm"
                      onClick={() => onReprocess(doc.analysisId as string, rowKey)}
                      disabled={reprocessingAnalysisId === doc.analysisId}
                    >
                      {reprocessingAnalysisId === doc.analysisId ? "Reprocesando..." : "Reprocesar"}
                    </button>
                  ) : null}
                  {canViewExtraction ? (
                    <button
                      type="button"
                      className="mdc-btn mdc-btn--ghost mdc-btn--sm"
                      onClick={() => onViewExtraction(doc.analysisId as string, doc.documentId || null, label, doc.fileName || "Sin nombre")}
                    >
                      {doc.status === "FAILED" || doc.status === "REJECTED" ? "Ver error" : "Ver extracción"}
                    </button>
                  ) : null}
                </div>
                {doc.errorMessage ? (
                  <p className="mdc-document-row__error">{doc.errorMessage}</p>
                ) : null}
                {rowError ? (
                  <details className="mdc-document-row__error">
                    <summary>{rowError.message}</summary>
                    {rowError.step ? <p>Paso: {rowError.step}</p> : null}
                    {rowError.detail ? <p>Detalle: {rowError.detail}</p> : null}
                  </details>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

function normalizeExtractionKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function asExtractionRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function readExtractionValue(source: Record<string, unknown>, ...aliases: string[]) {
  const aliasKeys = new Set(aliases.map(normalizeExtractionKey));
  const match = Object.entries(source).find(([key]) => aliasKeys.has(normalizeExtractionKey(key)));
  return match?.[1];
}

function formatBusinessDate(value: unknown) {
  if (!value) return "N/D";
  const raw = String(value);
  const isoDate = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const parsed = isoDate
    ? new Date(Date.UTC(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3])))
    : new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(parsed);
}

function BankStatementExtractionDetails({ data }: { data: FinancialDocumentExtractionResponse }) {
  const extraction = asExtractionRecord(data.extraction);
  const statementPeriod = asExtractionRecord(readExtractionValue(extraction, "statementPeriod", "statement_period", "periodoEstadoCuenta"));
  const accountHolder = readExtractionValue(extraction, "accountHolder", "account_holder", "titularCuenta", "titular");
  const rfc = readExtractionValue(extraction, "rfc");
  const bankName = readExtractionValue(extraction, "bankName", "bank_name", "banco");
  const accountNumber = readExtractionValue(extraction, "accountNumber", "account_number", "numeroCuenta");
  const clabe = readExtractionValue(extraction, "clabe");
  const customerNumber = readExtractionValue(extraction, "customerNumber", "customer_number", "numeroCliente");
  const cutoffDate = readExtractionValue(extraction, "cutoffDate", "cutoff_date", "fechaCorte");
  const currency = readExtractionValue(extraction, "currency", "moneda");
  const periodFrom = readExtractionValue(statementPeriod, "from", "desde", "startDate", "fechaInicio");
  const periodTo = readExtractionValue(statementPeriod, "to", "hasta", "endDate", "fechaFin");
  const periodLabel = periodFrom && periodTo
    ? `${formatBusinessDate(periodFrom)} — ${formatBusinessDate(periodTo)}`
    : formatBusinessDate(periodFrom || periodTo);
  const validationLabel = data.validation?.requiresManualReview
    ? "Revisión manual"
    : data.validation?.valid
      ? "Válida"
      : "N/D";
  const nombreField = documentMatchField(data.documentMatch, "nombre");

  return (
    <>
      <DocumentMatchPanel match={data.documentMatch} />
      <section className="mdc-extraction-card">
        <div className="mdc-extraction-card__head"><h4>Datos principales del extracto</h4></div>
        <dl className="mdc-extraction-data-grid mdc-bank-primary-grid">
          <div className={`mdc-bank-primary-grid__holder ${documentMatchFieldClass(nombreField)}`}><dt>Titular de la cuenta</dt><dd>{displayValue(accountHolder)}</dd></div>
          <div><dt>RFC</dt><dd>{displayValue(rfc)}</dd></div>
          <div><dt>Número de cuenta</dt><dd>{displayValue(accountNumber)}</dd></div>
          <div><dt>CLABE</dt><dd>{displayValue(clabe)}</dd></div>
          <div><dt>Banco</dt><dd>{displayValue(bankName)}</dd></div>
          <div><dt>Número de cliente</dt><dd>{displayValue(customerNumber)}</dd></div>
        </dl>
      </section>

      <section className="mdc-extraction-card">
        <div className="mdc-extraction-card__head"><h4>Información del estado de cuenta</h4></div>
        <dl className="mdc-extraction-data-grid mdc-bank-statement-grid">
          <div className="mdc-bank-statement-grid__period"><dt>Periodo del estado de cuenta</dt><dd>{periodLabel}</dd></div>
          <div><dt>Fecha de corte</dt><dd>{formatBusinessDate(cutoffDate)}</dd></div>
          <div><dt>Moneda</dt><dd>{displayValue(currency)}</dd></div>
        </dl>
      </section>

      <section className="mdc-extraction-card">
        <div className="mdc-extraction-card__head"><h4>Información del documento</h4></div>
        <dl className="mdc-extraction-data-grid">
          <div><dt>Tipo</dt><dd>Estado de cuenta bancario</dd></div>
        </dl>
      </section>

      <details className="mdc-extraction-technical">
        <summary>
          <span>Detalles técnicos del procesamiento</span>
          <span className={bdaStatusBadgeClass(data.status)}>{displayValue(data.status)}</span>
        </summary>
        <div className="mdc-extraction-technical__body">
          <dl className="mdc-extraction-data-grid">
            <div><dt>Estado</dt><dd>{displayValue(data.status)}</dd></div>
            <div><dt>Tipo interno</dt><dd>{displayValue(data.documentType || readExtractionValue(extraction, "documentType", "document_type"))}</dd></div>
            <div><dt>Procesado</dt><dd>{data.processed ? "Sí" : "No"}</dd></div>
            <div><dt>Actualizado</dt><dd>{formatExtractionDate(data.updatedAt)}</dd></div>
            <div><dt>Validación</dt><dd>{validationLabel}</dd></div>
            <div><dt>Reason codes</dt><dd>{data.validation?.reasonCodes?.length ? data.validation.reasonCodes.join(", ") : "N/D"}</dd></div>
            <div><dt>Error code</dt><dd>{displayValue(data.errorCode)}</dd></div>
            <div><dt>Mensaje</dt><dd>{displayValue(data.errorMessage || data.validation?.message)}</dd></div>
          </dl>
        </div>
      </details>
    </>
  );
}

function ProofOfAddressExtractionDetails({ data }: { data: FinancialDocumentExtractionResponse }) {
  const extraction = asExtractionRecord(data.extraction);
  const explainability = asExtractionRecord(readExtractionValue(extraction, "explainability"));
  const holder = readExtractionValue(extraction, "nombreTitular", "nombre_titular", "titular", "accountHolder");
  const street = readExtractionValue(extraction, "calle", "street");
  const exteriorNumber = readExtractionValue(extraction, "numeroExterior", "numero_exterior", "exteriorNumber");
  const interiorNumber = readExtractionValue(extraction, "numeroInterior", "numero_interior", "interiorNumber");
  const neighborhood = readExtractionValue(extraction, "colonia", "neighborhood");
  const postalCode = readExtractionValue(extraction, "codigoPostal", "codigo_postal", "postalCode", "zipCode");
  const municipality = readExtractionValue(extraction, "municipio", "alcaldia", "delegacion", "municipality");
  const state = readExtractionValue(extraction, "estado", "state");
  const city = readExtractionValue(extraction, "ciudad", "city");
  const issuer = readExtractionValue(extraction, "emisor", "issuer", "nombreEmisor", "nombre_emisor");
  const serviceType = readExtractionValue(extraction, "tipoServicio", "tipo_servicio", "serviceType");
  const issueDate = readExtractionValue(extraction, "fechaEmision", "fecha_emision", "issueDate");
  const addressParts = [street, exteriorNumber, interiorNumber ? `Int. ${interiorNumber}` : null]
    .filter(Boolean)
    .map(String)
    .join(" ");
  const locationParts = [neighborhood, municipality || city, state, postalCode ? `C.P. ${postalCode}` : null]
    .filter(Boolean)
    .map(String)
    .join(", ");
  const confidenceEntries = Object.entries(explainability)
    .map(([field, value]) => {
      const details = asExtractionRecord(value);
      return {
        field,
        value: readExtractionValue(details, "value", "valor") ?? details.value,
        confidence: readExtractionValue(details, "confidence", "confianza"),
        success: readExtractionValue(details, "success", "exitoso"),
      };
    })
    .filter((entry) => entry.value !== undefined || entry.confidence !== undefined);
  const validationLabel = data.validation?.requiresManualReview
    ? "Revisión manual"
    : data.validation?.valid
      ? "Válida"
      : "N/D";
  const nombreField = documentMatchField(data.documentMatch, "nombre");
  const treatNameMismatchAsNeutral =
    data.documentMatch?.status === "neutral" || data.documentMatch?.status === "pending_kyc";

  return (
    <>
      <DocumentMatchPanel match={data.documentMatch} />
      <section className="mdc-extraction-card">
        <div className="mdc-extraction-card__head"><h4>Datos principales del domicilio</h4></div>
        <dl className="mdc-extraction-data-grid mdc-bank-primary-grid">
          <div className={`mdc-bank-primary-grid__holder ${documentMatchFieldClass(nombreField, treatNameMismatchAsNeutral)}`}><dt>Titular</dt><dd>{displayValue(holder)}</dd></div>
          <div><dt>Calle y número</dt><dd>{displayValue(addressParts)}</dd></div>
          <div><dt>Colonia / zona</dt><dd>{displayValue(neighborhood)}</dd></div>
          <div><dt>Código postal</dt><dd>{displayValue(postalCode)}</dd></div>
          <div><dt>Municipio / ciudad</dt><dd>{displayValue(municipality || city)}</dd></div>
          <div><dt>Estado</dt><dd>{displayValue(state)}</dd></div>
        </dl>
      </section>

      <section className="mdc-extraction-card">
        <div className="mdc-extraction-card__head"><h4>Dirección normalizada</h4></div>
        <dl className="mdc-extraction-data-grid">
          <div><dt>Domicilio</dt><dd>{displayValue(addressParts)}</dd></div>
          <div><dt>Ubicación</dt><dd>{displayValue(locationParts)}</dd></div>
        </dl>
      </section>

      <section className="mdc-extraction-card">
        <div className="mdc-extraction-card__head"><h4>Información del documento</h4></div>
        <dl className="mdc-extraction-data-grid">
          <div><dt>Tipo</dt><dd>Comprobante de domicilio</dd></div>
          <div><dt>Emisor</dt><dd>{displayValue(issuer)}</dd></div>
          <div><dt>Servicio</dt><dd>{displayValue(serviceType)}</dd></div>
          <div><dt>Fecha de emisión</dt><dd>{formatBusinessDate(issueDate)}</dd></div>
        </dl>
      </section>

      {confidenceEntries.length ? (
        <section className="mdc-extraction-card">
          <div className="mdc-extraction-card__head"><h4>Confianza por campo</h4></div>
          <dl className="mdc-extraction-data-grid">
            {confidenceEntries.map((entry) => (
              <div key={entry.field}>
                <dt>{entry.field}</dt>
                <dd>{displayValue(entry.value)}</dd>
                <small>{formatConfidence(entry.confidence)} · {entry.success === false ? "No confirmado" : "Detectado"}</small>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <details className="mdc-extraction-technical">
        <summary>
          <span>Detalles técnicos del procesamiento</span>
          <span className={bdaStatusBadgeClass(data.status)}>{displayValue(data.status)}</span>
        </summary>
        <div className="mdc-extraction-technical__body">
          <dl className="mdc-extraction-data-grid">
            <div><dt>Estado</dt><dd>{displayValue(data.status)}</dd></div>
            <div><dt>Tipo interno</dt><dd>{displayValue(data.documentType || readExtractionValue(extraction, "documentType", "document_type"))}</dd></div>
            <div><dt>Procesado</dt><dd>{data.processed ? "Sí" : "No"}</dd></div>
            <div><dt>Actualizado</dt><dd>{formatExtractionDate(data.updatedAt)}</dd></div>
            <div><dt>Validación</dt><dd>{validationLabel}</dd></div>
            <div><dt>Reason codes</dt><dd>{data.validation?.reasonCodes?.length ? data.validation.reasonCodes.join(", ") : "N/D"}</dd></div>
            <div><dt>Error code</dt><dd>{displayValue(data.errorCode)}</dd></div>
            <div><dt>Mensaje</dt><dd>{displayValue(data.errorMessage || data.validation?.message)}</dd></div>
          </dl>
          <details className="mdc-extraction-json">
            <summary>JSON completo</summary>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </details>
        </div>
      </details>
    </>
  );
}

type ApplicationFlowStep = {
  id: string;
  label: string;
  owner: string;
  state: "done" | "current" | "failed" | "pending";
  startedAt: string;
  completedAt: string | null;
  minutes: number;
  note: string;
};

function buildApplicationFlow(app: Application, mode: MdcApplicantMode): ApplicationFlowStep[] {
  const isMoral = mode === "moral";
  const baseDate = new Date(app.submittedAt).getTime();
  const seed = quickHash(`${app.id}:${app.appNo}:${app.status}`);
  const stageDurations = [
    18 + (seed % 24),
    24 + (seed % 42),
    35 + (seed % 55),
    20 + (seed % 36),
    28 + (seed % 48),
    16 + (seed % 34),
  ];
  const currentIndex =
    app.status === "pending"
      ? 1
      : app.status === "manualReview"
        ? 4
        : app.status === "declined"
          ? 5
          : 5;

  const definitions = [
    {
      id: "capture",
      label: "Captura de solicitud",
      owner: "Originacion digital",
      note: `Alta inicial de ${app.product} por ${money(app.requestedAmount)}.`,
    },
    {
      id: "docs",
      label: "Validacion documental",
      owner: isMoral ? "Mesa KYB" : "Mesa KYC",
      note: isMoral ? "Revision de expediente corporativo y soportes legales." : "Revision de identidad, domicilio e ingresos.",
    },
    {
      id: isMoral ? "kyb" : "kyc",
      label: isMoral ? "KYB / existencia legal" : "KYC / listas",
      owner: isMoral ? "Analista KYB" : "Analista KYC",
      note: isMoral ? "Validacion de RFC, estructura societaria y beneficiarios." : "Validacion de listas y consistencia documental.",
    },
    {
      id: "aml",
      label: "AML / PLD",
      owner: "Cumplimiento",
      note: "Cruce contra listas, alertas regulatorias y observaciones de prensa.",
    },
    {
      id: "engine",
      label: "Motor de decision",
      owner: "Sistema MDC",
      note: "Evaluacion de score, reglas, capacidad de pago y politicas de originacion.",
    },
    {
      id: "decision",
      label: "Decision y salida",
      owner: app.status === "overridden" ? "Comite / analista" : "Sistema / analista",
      note:
        app.status === "approved"
          ? "Solicitud aprobada y lista para formalizacion."
          : app.status === "declined"
            ? "Solicitud cerrada por rechazo de politica."
            : app.status === "manualReview"
              ? "Solicitud enviada a revision manual."
              : app.status === "overridden"
                ? "Solicitud ajustada con override manual."
                : "Solicitud pendiente por completar validaciones.",
    },
  ];

  let cursor = baseDate;
  return definitions.map((definition, index) => {
    const minutes = stageDurations[index] ?? 20;
    const startedAt = new Date(cursor).toISOString();
    const completedAt = index < currentIndex || app.status !== "pending"
      ? new Date(cursor + minutes * 60_000).toISOString()
      : index === currentIndex
        ? null
        : null;
    cursor += minutes * 60_000;

    let state: "done" | "current" | "failed" | "pending" = "done";
    if (index > currentIndex) state = "pending";
    if (index === currentIndex && (app.status === "pending" || app.status === "manualReview" || app.status === "overridden")) state = "current";
    if (definition.id === "decision" && app.status === "declined") state = "failed";

    return {
      ...definition,
      state,
      startedAt,
      completedAt,
      minutes,
    };
  });
}

function ApplicationFlowModal({
  app,
  mode,
  onClose,
}: {
  app: Application;
  mode: MdcApplicantMode;
  onClose: () => void;
}) {
  const steps = useMemo(() => buildApplicationFlow(app, mode), [app, mode]);
  const totalMinutes = steps.reduce((sum, step) => sum + step.minutes, 0);
  const completedSteps = steps.filter((step) => step.state === "done").length;
  const resolvedIndex = steps.findIndex((step) => step.state === "current" || step.state === "failed");
  const currentIndex =
    resolvedIndex >= 0
      ? resolvedIndex
      : Math.max(0, steps.map((step) => step.state).lastIndexOf("done"));
  const [selectedStepId, setSelectedStepId] = useState<string>(steps[currentIndex]?.id ?? steps[0]?.id ?? "");

  const selectedStep = steps.find((step) => step.id === selectedStepId) ?? steps[currentIndex] ?? steps[0];

  return (
    <div className="mdc-modal-backdrop" onClick={onClose}>
      <div className="mdc-modal mdc-modal--flow" onClick={(e) => e.stopPropagation()}>
        <header className="mdc-modal-head mdc-flow-head">
          <div>
            <p>Solicitud · Flujo visual</p>
            <h3>{app.applicantName}</h3>
            <span className="mdc-flow-head__meta">{app.appNo} · {app.product} · {shortDate(app.submittedAt)}</span>
          </div>
          <button type="button" className="mdc-icon-btn" onClick={onClose}>×</button>
        </header>

        <section className="mdc-flow-summary">
          <div className="mdc-flow-summary__card">
            <span>Estado actual</span>
            <strong>{STATUS_LABELS[app.status]}</strong>
          </div>
          <div className="mdc-flow-summary__card">
            <span>Etapas cerradas</span>
            <strong>{completedSteps} / {steps.length}</strong>
          </div>
          <div className="mdc-flow-summary__card">
            <span>Tiempo acumulado</span>
            <strong>{formatDurationLabel(totalMinutes)}</strong>
          </div>
          <div className="mdc-flow-summary__card">
            <span>Riesgo</span>
            <strong>{RISK_LABELS[riskFromApplicationStatus(app.status, app.riskScore)]} · {normalizeRiskScoreForStatus(app.status, app.riskScore)}</strong>
          </div>
        </section>

        <section className="mdc-flow-layout">
          <div className="mdc-flow-canvas-shell">
            <div className="mdc-flow-toolbar">
              <div>
                <strong>Mapa del flujo</strong>
                <span>Selecciona una tarea para revisar responsable, tiempo y salida de esa etapa.</span>
              </div>
              <div className="mdc-flow-toolbar__pill">Etapa actual: {selectedStep?.label ?? "N/D"}</div>
            </div>

            {(() => {
              const isMoral = mode === "moral";
              const stepMap = Object.fromEntries(steps.map((step) => [step.id, step]));
              const docStepId = isMoral ? "kyb" : "kyc";
              const statusKind =
                app.status === "approved"
                  ? "approved"
                  : app.status === "declined"
                    ? "declined"
                    : app.status === "manualReview" || app.status === "overridden"
                      ? "review"
                      : "pending";
              const buildVisualDetail = (
                stepId: string | null,
                fallback: {
                  owner: string;
                  note: string;
                  state?: "done" | "current" | "failed" | "pending";
                  startedAt?: string;
                  completedAt?: string | null;
                  minutes?: number;
                },
              ) => {
                const step = stepId ? stepMap[stepId] : null;
                return {
                  owner: step?.owner ?? fallback.owner,
                  note: step?.note ?? fallback.note,
                  state: step?.state ?? fallback.state ?? "pending",
                  startedAt: step?.startedAt ?? fallback.startedAt ?? app.submittedAt,
                  completedAt: step?.completedAt ?? fallback.completedAt ?? null,
                  minutes: step?.minutes ?? fallback.minutes ?? 0,
                };
              };

              const visualNodes = [
                { id: "start", label: "Inicio", x: 36, y: 300, type: "event", clickable: false, compact: false, outcome: false, ...buildVisualDetail("capture", { owner: "Canal digital", note: "Recepcion inicial del caso.", state: "done", minutes: 5 }) },
                { id: "capture", label: "Captura de solicitud", x: 205, y: 180, type: "task", clickable: true, compact: false, outcome: false, ...buildVisualDetail("capture", { owner: "Originacion digital", note: "Alta inicial y datos basicos de la solicitud." }) },
                { id: "docs", label: "Validacion documental", x: 425, y: 180, type: "task", clickable: true, compact: false, outcome: false, ...buildVisualDetail("docs", { owner: isMoral ? "Mesa KYB" : "Mesa KYC", note: "Revision de anexos y soporte documental." }) },
                { id: docStepId, label: isMoral ? "KYB / existencia legal" : "KYC / listas", x: 645, y: 180, type: "task", clickable: true, compact: false, outcome: false, ...buildVisualDetail(docStepId, { owner: isMoral ? "Analista KYB" : "Analista KYC", note: "Validacion de identidad, estructura y consistencia." }) },
                { id: "buro", label: isMoral ? "Buro empresa" : "Consulta buro", x: 425, y: 395, type: "task", clickable: true, compact: false, outcome: false, ...buildVisualDetail("engine", { owner: "Motor externo", note: "Consulta de buro y antecedentes de riesgo.", state: stepMap.engine?.state === "done" ? "done" : stepMap.engine?.state === "failed" ? "failed" : stepMap.engine?.state === "current" ? "current" : "pending", minutes: 18 }) },
                { id: "aml", label: "AML / PLD", x: 645, y: 395, type: "task", clickable: true, compact: false, outcome: false, ...buildVisualDetail("aml", { owner: "Cumplimiento", note: "Cruce contra listas, alertas y hallazgos regulatorios." }) },
                { id: "engine", label: "Motor de decision", x: 940, y: 395, type: "task", clickable: true, compact: false, outcome: false, ...buildVisualDetail("engine", { owner: "Sistema MDC", note: "Ejecucion de score, politicas y capacidad de pago." }) },
                { id: "decision", label: "Nodo de decision", x: 1175, y: 395, type: "diamond", clickable: true, compact: false, outcome: false, ...buildVisualDetail("decision", { owner: "Sistema / analista", note: "Define aprobacion, rechazo o revision manual." }) },
                { id: "approved", label: "Aprobacion", x: 1375, y: 150, type: "task", clickable: true, compact: false, outcome: true, ...buildVisualDetail("decision", { owner: "Sistema / analista", note: "Caso aprobado y enviado a formalizacion.", state: statusKind === "approved" ? "done" : "pending", minutes: 14 }) },
                { id: "review", label: "Revision manual", x: 1375, y: 395, type: "task", clickable: true, compact: false, outcome: true, ...buildVisualDetail("decision", { owner: "Sistema / analista", note: "Caso escalado para revision o override.", state: statusKind === "review" ? "current" : "pending", minutes: 22 }) },
                { id: "declined", label: "Rechazo", x: 1375, y: 640, type: "task", clickable: true, compact: false, outcome: true, ...buildVisualDetail("decision", { owner: "Sistema / analista", note: "Solicitud rechazada por politica o riesgo.", state: statusKind === "declined" ? "failed" : "pending", minutes: 12 }) },
                { id: "notifyClient", label: "Send update to client", x: 565, y: 56, type: "task", clickable: false, compact: true, outcome: false, ...buildVisualDetail(null, { owner: "Canal cliente", note: "Actualizacion automatica al cliente.", state: "pending", minutes: 8 }) },
                { id: "notifyEnd", label: "Fin", x: 705, y: 56, type: "event", clickable: false, compact: false, outcome: false, ...buildVisualDetail(null, { owner: "Canal cliente", note: "Notificacion entregada.", state: "pending", minutes: 0 }) },
              ] as const;

              const decorativeNodes = [
                { id: "support", label: "Ask clerk for support", x: 1005, y: 200, type: "ghost" },
                { id: "createRecord", label: "Create customer record", x: 520, y: 560, type: "ghost" },
                { id: "rejectMessage", label: "Send rejection message to client", x: 1040, y: 560, type: "ghost" },
                { id: "clientUpdate", label: "See update", x: 365, y: 705, type: "ghost-small" },
                { id: "universalUpdate", label: "Universal update", x: 845, y: 705, type: "ghost-small" },
              ] as const;

              const nodesById = Object.fromEntries(visualNodes.map((node) => [node.id, node]));
              const selectedVisual = nodesById[selectedStepId] ?? nodesById.engine ?? visualNodes[0];
              const selectedDetail = selectedVisual;

              const routeByStatus = {
                approved: ["start", "capture", "docs", docStepId, "aml", "engine", "decision", "approved"],
                review: ["start", "capture", "docs", docStepId, "aml", "engine", "decision", "review"],
                declined: ["start", "capture", "docs", docStepId, "aml", "engine", "decision", "declined"],
                pending: ["start", "capture", "docs", docStepId, "aml", "engine"],
              } as const;
              const activeRoute = routeByStatus[statusKind];
              const activeRouteSet = new Set(activeRoute);
              const point = (nodeId: string) => `${nodesById[nodeId].x},${nodesById[nodeId].y}`;
              const routePoints = activeRoute.map(point).join(" ");
              const routeMotion = `M ${activeRoute.map(point).join(" L ")}`;
              const edgeLabels = [
                { key: "t1", text: formatDurationLabel(nodesById.capture.minutes), x: 315, y: 98 },
                { key: "t2", text: formatDurationLabel(nodesById.docs.minutes), x: 535, y: 98 },
                { key: "t3", text: formatDurationLabel(nodesById[docStepId].minutes), x: 695, y: 288 },
                { key: "t4", text: formatDurationLabel(nodesById.aml.minutes), x: 535, y: 344 },
                { key: "t5", text: formatDurationLabel(nodesById.engine.minutes), x: 795, y: 318 },
                { key: "t6", text: formatDurationLabel(nodesById.decision.minutes), x: 1175, y: 324 },
              ];
              const finalLabel = statusKind === "approved" ? "Aprobada" : statusKind === "declined" ? "Rechazada" : statusKind === "review" ? "Revision" : "En proceso";
              const labelState = (state: "done" | "current" | "failed" | "pending") =>
                state === "done" ? "Completado" : state === "failed" ? "Rechazo" : state === "pending" ? "Pendiente" : "En curso";

              return (
                <>
                  <div className="mdc-flow-diagram mdc-flow-diagram--bpmn" aria-label="Flujo de la solicitud">
                    <svg className="mdc-flow-svg" viewBox="0 0 1480 820" preserveAspectRatio="none" aria-hidden>
                      <polyline className="mdc-flow-svg__route-base" points="36,300 100,300 100,180 205,180" />
                      <polyline className="mdc-flow-svg__route-base" points="205,180 425,180 645,180" />
                      <polyline className="mdc-flow-svg__route-base" points="425,180 425,395" />
                      <polyline className="mdc-flow-svg__route-base" points="425,395 645,395" />
                      <polyline className="mdc-flow-svg__route-base" points="645,180 645,395" />
                      <polyline className="mdc-flow-svg__route-base" points="645,395 940,395" />
                      <polyline className="mdc-flow-svg__route-base" points="940,395 1175,395" />
                      <polyline className="mdc-flow-svg__route-base" points="1175,395 1175,150 1375,150" />
                      <polyline className="mdc-flow-svg__route-base" points="1175,395 1375,395" />
                      <polyline className="mdc-flow-svg__route-base" points="1175,395 1175,640 1375,640" />
                      <polyline className="mdc-flow-svg__route-base" points="410,70 410,56 565,56 705,56" />
                      <polyline className="mdc-flow-svg__route-glow" points={routePoints} />
                      <circle className="mdc-flow-svg__light" r="1.15">
                        <animateMotion dur="3.6s" repeatCount="1" fill="freeze" path={routeMotion} />
                      </circle>
                    </svg>

                    <div className="mdc-flow-process-frame">
                      <span className="mdc-flow-process-frame__title">Customer Validation and Verification</span>
                    </div>
                    <div className="mdc-flow-process-border mdc-flow-process-border--validation">
                      <span>Validation tools</span>
                    </div>
                    <div className="mdc-flow-process-border mdc-flow-process-border--reporting">
                      <span>Reporting findings</span>
                    </div>
                    <div className="mdc-flow-process-border mdc-flow-process-border--actions">
                      <span>Actions</span>
                    </div>
                    <div className="mdc-flow-process-border mdc-flow-process-border--updates-left">
                      <span>Client update</span>
                    </div>
                    <div className="mdc-flow-process-border mdc-flow-process-border--updates-right">
                      <span>Universal update</span>
                    </div>

                    <span className="mdc-flow-sla">SLA warning</span>
                    <span className="mdc-flow-branch-label mdc-flow-branch-label--approved">Approved</span>
                    <span className="mdc-flow-branch-label mdc-flow-branch-label--review">Review</span>
                    <span className="mdc-flow-branch-label mdc-flow-branch-label--declined">Reject</span>

                    {edgeLabels.map((edge) => (
                      <span key={edge.key} className="mdc-flow-edge-label mdc-flow-edge-label--active" style={{ left: `${edge.x}px`, top: `${edge.y}px` }}>
                        {edge.text}
                      </span>
                    ))}

                    {visualNodes.map((node, index) => {
                      const isSelected = selectedVisual.id === node.id;
                      const isEvent = node.type === "event";
                      const isDiamond = node.type === "diamond";
                      const clickable = node.clickable !== false;
                      const content = isEvent ? (
                        <span className="mdc-flow-item__event-core" />
                      ) : (
                        <>
                          <div className="mdc-flow-item__chrome">
                            <span className={`mdc-flow-node__state mdc-flow-node__state--${node.state}`}>{labelState(node.state)}</span>
                            <span className="mdc-flow-item__step">{index + 1}</span>
                          </div>
                          <strong>{node.label}</strong>
                          <span>{node.owner}</span>
                          {!isDiamond && <em>Ver detalle</em>}
                        </>
                      );

                      const className = `mdc-flow-item mdc-flow-item--${node.type}${node.compact ? " mdc-flow-item--compact" : ""}${node.outcome ? " mdc-flow-item--outcome" : ""} mdc-flow-item--${node.state}${isSelected ? " mdc-flow-item--selected" : ""}${!clickable ? " mdc-flow-item--static" : ""}`;
                      const style = { left: `${node.x}px`, top: `${node.y}px` };

                      return clickable ? (
                        <button key={`${app.id}-${node.id}`} type="button" className={className} style={style} onClick={() => setSelectedStepId(node.id)}>
                          {content}
                        </button>
                      ) : (
                        <div key={`${app.id}-${node.id}`} className={className} style={style}>
                          {content}
                        </div>
                      );
                    })}

                    {decorativeNodes.map((node) => (
                      <div key={node.id} className={`mdc-flow-item mdc-flow-item--${node.type} mdc-flow-item--static`} style={{ left: `${node.x}px`, top: `${node.y}px` }}>
                        <strong>{node.label}</strong>
                      </div>
                    ))}

                    <div className="mdc-flow-orb" style={{ left: `${nodesById[activeRoute[activeRoute.length - 1]].x}px`, top: `${nodesById[activeRoute[activeRoute.length - 1]].y}px` }} />
                  </div>

                  <aside className="mdc-flow-detail mdc-flow-detail--inline">
                    <div className="mdc-flow-detail__head">
                      <span className={`mdc-flow-node__state mdc-flow-node__state--${selectedDetail.state}`}>
                        {labelState(selectedDetail.state)}
                      </span>
                      <strong>{selectedDetail.label}</strong>
                      <p>{selectedDetail.note}</p>
                    </div>

                    <dl className="mdc-flow-detail__grid">
                      <div>
                        <dt>Responsable</dt>
                        <dd>{selectedDetail.owner}</dd>
                      </div>
                      <div>
                        <dt>Inicio</dt>
                        <dd>{shortDate(selectedDetail.startedAt)}</dd>
                      </div>
                      <div>
                        <dt>Fin</dt>
                        <dd>{selectedDetail.completedAt ? shortDate(selectedDetail.completedAt) : "En proceso"}</dd>
                      </div>
                      <div>
                        <dt>Tiempo</dt>
                        <dd>{formatDurationLabel(selectedDetail.minutes)}</dd>
                      </div>
                    </dl>

                    <div className="mdc-flow-detail__timeline">
                      <strong>Detalle operativo</strong>
                      <ul>
                        <li>Fecha de registro: {shortDate(selectedDetail.startedAt)}</li>
                        <li>Tiempo transcurrido: {formatDurationLabel(selectedDetail.minutes)}</li>
                        <li>Resultado visible: {selectedDetail.state === "done" ? "Paso validado" : selectedDetail.state === "failed" ? "Corte por rechazo" : selectedDetail.state === "pending" ? "Aun no inicia" : "Sigue abierto"}</li>
                        <li>Salida de la etapa: {selectedDetail.completedAt ? `Cerro el ${shortDate(selectedDetail.completedAt)}` : "Aun no hay cierre"}</li>
                        <li>Ruta actual: {finalLabel}</li>
                      </ul>
                    </div>
                  </aside>
                </>
              );
            })()}
          </div>
        </section>
      </div>
    </div>
  );
}

export function AppDetailModal({
  app,
  rules,
  mode,
  creditStore,
  onClose,
  layout = "modal",
}: {
  app: Application;
  rules: CreditRuleRow[];
  mode: MdcApplicantMode;
  creditStore: ReturnType<typeof useCreditDemoStore>;
  onClose: () => void;
  layout?: "modal" | "page";
}) {
  const isMoralApplicant = mode === "moral";
  const isDemoOrganization = getStoredOrganization()?.id === "demo-bypass-org";
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState("");
  const [overrideChoice, setOverrideChoice] = useState<ApplicationStatus>("manualReview");
  const [overrideReason, setOverrideReason] = useState("");
  const [breakdown, setBreakdown] = useState<any[] | null>(isDemoOrganization ? app.rulesBreakdown || null : null);
  const [breakdownStatus, setBreakdownStatus] = useState<string | null>(isDemoOrganization ? app.rulesBreakdownStatus || app.analysis?.status || null : null);
  const [evaluatedDti, setEvaluatedDti] = useState<number | null>(null);
  const [isEvaluatingRules, setIsEvaluatingRules] = useState(false);
  const [actionErrors, setActionErrors] = useState<Record<string, DetailDocError | null>>({});
  const [manualReviewAction, setManualReviewAction] = useState<ManualReviewAction>(null);
  const [manualReviewReason, setManualReviewReason] = useState("");
  const [manualReviewNotes, setManualReviewNotes] = useState("");
  const [documentActionFeedback, setDocumentActionFeedback] = useState<DocumentActionFeedback>(null);
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [extractionSelection, setExtractionSelection] = useState<{
    analysisId: string;
    documentId: string | null;
    title: string;
    fileName: string;
    category: "nomina" | "extracto" | "comprobante_domicilio";
    status?: string | null;
  } | null>(null);

  const suppliedUserId = app.userId && isUuidLike(app.userId) ? app.userId : null;
  const financeRequestDetailQuery = useQuery({
    queryKey: ["finance-request", app.id],
    queryFn: () => fetchFinanceRequestById(app.id),
    enabled: !isMoralApplicant && !isDemoOrganization,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const resolvedUserId = suppliedUserId || (financeRequestDetailQuery.data ? extractFinanceRequestUserId(financeRequestDetailQuery.data) : null);
  const organizationId = getStoredOrganization()?.id || null;
  const userRulesQuery = useQuery({
    queryKey: ["user-rules", organizationId, resolvedUserId],
    queryFn: () => fetchUserRules(organizationId!, resolvedUserId!),
    enabled: !isDemoOrganization && Boolean(organizationId && resolvedUserId),
    staleTime: 0,
    refetchOnMount: "always",
  });
  const documentProgressQuery = useDocumentProgress(resolvedUserId, "nomina", !isMoralApplicant);
  const bankStatementProgressQuery = useDocumentProgress(resolvedUserId, "extracto", !isMoralApplicant);
  const addressProgressQuery = useDocumentProgress(resolvedUserId, "comprobante_domicilio", !isMoralApplicant);
  const manualReviewMutation = useManualReviewAnalysis(resolvedUserId);
  const reprocessAnalysisMutation = useReprocessAnalysis(resolvedUserId);
  const extractionDocStatus = extractionSelection?.status ?? null;
  const extractionQuery = useAnalysisExtraction(
    extractionSelection?.analysisId || null,
    Boolean(extractionSelection),
    { status: extractionDocStatus },
  );
  const fileUrlQuery = useDocumentFileUrl(extractionSelection?.documentId || null, Boolean(extractionSelection));
  const documentProgress = documentProgressQuery.data || null;
  const bankStatementProgress = bankStatementProgressQuery.data || null;
  const addressProgress = addressProgressQuery.data || null;
  const documentLoading = financeRequestDetailQuery.isLoading || documentProgressQuery.isLoading || bankStatementProgressQuery.isLoading || addressProgressQuery.isLoading;
  const documentRefreshing = financeRequestDetailQuery.isFetching || documentProgressQuery.isFetching || bankStatementProgressQuery.isFetching || addressProgressQuery.isFetching;
  const documentErrorSource = financeRequestDetailQuery.error || documentProgressQuery.error || bankStatementProgressQuery.error || addressProgressQuery.error;
  const documentError = documentErrorSource
    ? toDetailDocError(documentErrorSource, "Documentación no disponible temporalmente")
    : financeRequestDetailQuery.isSuccess && !resolvedUserId
      ? { message: "No fue posible resolver el userId real del solicitante." }
    : null;
  const payrollDocumentError = documentProgressQuery.error
    ? toDetailDocError(documentProgressQuery.error, "No fue posible cargar nómina.")
    : financeRequestDetailQuery.error || (financeRequestDetailQuery.isSuccess && !resolvedUserId)
      ? documentError
      : null;
  const bankStatementDocumentError = bankStatementProgressQuery.error
    ? toDetailDocError(bankStatementProgressQuery.error, "No fue posible cargar el extracto bancario.")
    : financeRequestDetailQuery.error || (financeRequestDetailQuery.isSuccess && !resolvedUserId)
      ? documentError
      : null;
  const addressDocumentError = addressProgressQuery.error
    ? toDetailDocError(addressProgressQuery.error, "No fue posible cargar el comprobante de domicilio.")
    : financeRequestDetailQuery.error || (financeRequestDetailQuery.isSuccess && !resolvedUserId)
      ? documentError
      : null;
  const reprocessingAnalysisId = reprocessAnalysisMutation.isPending ? reprocessAnalysisMutation.variables : null;
  const extractionData = extractionQuery.data || null;
  const extractionManualDecision = extractionData?.manualDecision || null;
  const extractionRequiresManualReview = !extractionManualDecision && (extractionData?.status === "MANUAL_REVIEW_REQUIRED" || Boolean(extractionData?.validation?.requiresManualReview));
  const extractionAnalysisId = extractionSelection?.analysisId || null;
  const extractionIsAnalyzing = isDocumentAnalyzing(extractionDocStatus);

  const prevAddressProcessingRef = useRef<number | null>(null);
  useEffect(() => {
    const processing = addressProgressQuery.data?.processing ?? 0;
    const prev = prevAddressProcessingRef.current;
    prevAddressProcessingRef.current = processing;
    if (prev != null && prev > 0 && processing === 0) {
      void financeRequestDetailQuery.refetch();
    }
  }, [addressProgressQuery.data?.processing, financeRequestDetailQuery.refetch]);

  // Mantener status del modal de extracción al día con el poll de progress
  useEffect(() => {
    if (!extractionSelection?.analysisId) return;
    const pools = [documentProgress, bankStatementProgress, addressProgress];
    for (const progress of pools) {
      const match = progress?.documents?.find((doc) => doc.analysisId === extractionSelection.analysisId);
      if (match?.status && match.status !== extractionSelection.status) {
        setExtractionSelection((current) =>
          current && current.analysisId === match.analysisId
            ? { ...current, status: match.status }
            : current,
        );
        break;
      }
    }
  }, [documentProgress, bankStatementProgress, addressProgress, extractionSelection?.analysisId, extractionSelection?.status]);

  useEffect(() => {
    setReviewerEmail(getStoredUser()?.email || "");
  }, []);

  useEffect(() => {
    setManualReviewAction(null);
    setManualReviewReason("");
    setManualReviewNotes("");
  }, [extractionSelection?.analysisId]);

  useEffect(() => {
    if (!isDemoOrganization) {
      setBreakdown(null);
      setBreakdownStatus(null);
      return;
    }

    if (app.rulesBreakdown && app.rulesBreakdown.length > 0) {
      setBreakdown(app.rulesBreakdown);
      setBreakdownStatus(app.rulesBreakdownStatus || app.analysis?.status || null);
      return;
    }
    const analyzePayload = app.rawPayload || {
      product: app.product,
      personType: mode,
      orgId: getStoredOrganization()?.id || "ORG-001",
      identificationNumber: app.applicantId || app.id || "APP-001",
      firstName: app.applicantName?.split(" ")[0] || "Cliente",
      lastName: app.applicantName?.split(" ").slice(1).join(" ") || "",
      email: app.applicantEmail,
      amount: app.requestedAmount,
      montoCredito: app.requestedAmount,
      tipoEmpleo: "Jubilado Confianza",
      edad: 10,
      plazo: 1000,
      capacidadPago: 25.5,
    };
    analyzeFinanceRequest(analyzePayload)
      .then((res) => {
        if (res && Array.isArray(res.rulesBreakdown) && res.rulesBreakdown.length > 0) {
          setBreakdown(res.rulesBreakdown);
          setBreakdownStatus(res.status);
        }
      })
      .catch((err) => {
        console.debug("Rules breakdown fetch fallback", err);
      });
  }, [app, isDemoOrganization, mode]);

  useEffect(() => {
    if (!isDemoOrganization) setEvaluatedDti(null);
  }, [app.id, isDemoOrganization]);

  useEffect(() => {
    const userRules = userRulesQuery.data;
    if (!userRules || Object.keys(userRules.rule).length === 0) return;

    const ruleBreakdown = Object.entries(userRules.rule).map(([ruleId, status]) => ({
      id: ruleId,
      name: rules.find((rule) => rule.id === ruleId)?.name || "Regla de decisión",
      status,
      passed: /aprob/i.test(status),
    }));

    setBreakdown(ruleBreakdown);
    setBreakdownStatus(userRules.finalDecision || null);
  }, [rules, userRulesQuery.data]);


  const [mdcKycSessionId, setMdcKycSessionId] = useState<string | null>(
    app.kycSessionId || financeRequestDetailQuery.data?.kycSessionId || null,
  );
  const [mdcKycWebviewUrl, setMdcKycWebviewUrl] = useState<string | null>(
    app.kycWebviewUrl || financeRequestDetailQuery.data?.kycWebviewUrl || null,
  );
  const [mdcZelifyUserId, setMdcZelifyUserId] = useState<string | null>(
    app.zelifyUserId ||
      financeRequestDetailQuery.data?.zelifyUserId ||
      financeRequestDetailQuery.data?.user?.zelifyUserId ||
      null,
  );
  const [kycResending, setKycResending] = useState(false);
  const syncedZelifyUserIdRef = useRef<string | null>(
    app.zelifyUserId ||
      financeRequestDetailQuery.data?.zelifyUserId ||
      financeRequestDetailQuery.data?.user?.zelifyUserId ||
      null,
  );

  useEffect(() => {
    setMdcKycSessionId(app.kycSessionId || financeRequestDetailQuery.data?.kycSessionId || null);
    setMdcKycWebviewUrl(app.kycWebviewUrl || financeRequestDetailQuery.data?.kycWebviewUrl || null);
    setMdcZelifyUserId(
      app.zelifyUserId ||
        financeRequestDetailQuery.data?.zelifyUserId ||
        financeRequestDetailQuery.data?.user?.zelifyUserId ||
        null,
    );
  }, [
    app.kycSessionId,
    app.kycWebviewUrl,
    app.zelifyUserId,
    financeRequestDetailQuery.data?.kycSessionId,
    financeRequestDetailQuery.data?.kycWebviewUrl,
    financeRequestDetailQuery.data?.zelifyUserId,
    financeRequestDetailQuery.data?.user?.zelifyUserId,
  ]);

  const kycSessionQuery = useQuery({
    queryKey: ["zelify-kyc-session", mdcKycSessionId],
    queryFn: async () => {
      kycLog("detalle · poll GET Auth /sessions", { kycSessionId: mdcKycSessionId, appId: app.id });
      return fetchZelifyKycOnboardingSession(mdcKycSessionId as string);
    },
    enabled: Boolean(mdcKycSessionId) && !isMoralApplicant && !isDemoOrganization,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "rejected" || status === "failed" || status === "expired") {
        kycLog("detalle · poll STOP (status terminal)", { status, kycSessionId: mdcKycSessionId });
        return false;
      }
      return 12_000;
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  useEffect(() => {
    if (kycSessionQuery.data?.status !== "completed" || !resolvedUserId) return;
    queryClient.invalidateQueries({ queryKey: ["financial-documents"] });
    queryClient.invalidateQueries({ queryKey: ["finance-request", app.id] });
  }, [kycSessionQuery.data?.status, resolvedUserId, app.id, queryClient]);

  useEffect(() => {
    if (kycSessionQuery.isError) {
      kycError("detalle · poll query error", kycSessionQuery.error, {
        kycSessionId: mdcKycSessionId,
        appId: app.id,
      });
    }
  }, [kycSessionQuery.isError, kycSessionQuery.error, mdcKycSessionId, app.id]);

  useEffect(() => {
    const userId = kycSessionQuery.data?.userId;
    const status = kycSessionQuery.data?.status;
    kycLog("detalle · sesión Auth observada", {
      appId: app.id,
      kycSessionId: mdcKycSessionId,
      status,
      userId,
      mdcZelifyUserId,
      hasMdcWebviewUrl: Boolean(mdcKycWebviewUrl),
    });
    if (!mdcKycSessionId || !mdcKycWebviewUrl || !userId) return;
    if (syncedZelifyUserIdRef.current === userId) {
      kycLog("detalle · zelifyUserId ya sincronizado, skip", { userId });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        kycLog("detalle · pegar zelifyUserId a MDC /kyc", {
          appId: app.id,
          kycSessionId: mdcKycSessionId,
          zelifyUserId: userId,
          status,
        });
        await attachFinanceRequestKyc(app.id, {
          kycSessionId: mdcKycSessionId,
          kycWebviewUrl: mdcKycWebviewUrl,
          zelifyUserId: userId,
        });
        if (!cancelled) {
          syncedZelifyUserIdRef.current = userId;
          setMdcZelifyUserId(userId);
          kycLog("detalle · zelifyUserId sincronizado OK", { userId });
        }
      } catch (err) {
        kycError("detalle · falló POST MDC /kyc con zelifyUserId", err, {
          fixOwner: "MDC",
          appId: app.id,
          kycSessionId: mdcKycSessionId,
          zelifyUserId: userId,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [app.id, kycSessionQuery.data?.userId, kycSessionQuery.data?.status, mdcKycSessionId, mdcKycWebviewUrl, mdcZelifyUserId]);

  const handleResendKyc = async () => {
    const curp =
      (app.rawPayload?.identificationNumber as string | undefined) ||
      financeRequestDetailQuery.data?.identificationNumber ||
      "";
    const email = app.applicantEmail;
    const phoneRaw = (app.rawPayload?.phone as string | undefined) || "";
    kycLog("reenviar · inicio", { appId: app.id, curp, email, phoneRaw });
    if (!isCurpLike(curp) || !email || email === "N/A") {
      kycWarn("reenviar · abortado: faltan CURP/email", { curp, email, fixOwner: "Front/datos solicitud" });
      setFeedback("Faltan CURP/email para reenviar la verificación.");
      return;
    }
    setKycResending(true);
    try {
      const phone10 = phoneRaw ? normalizeMxPhone10(phoneRaw) : "";
      const session = await createZelifyKycOnboardingSession({
        email,
        curp: curp.replace(/\s+/g, "").toUpperCase(),
        ...(phone10.length === 10 ? { phone: phone10 } : {}),
      });
      await attachFinanceRequestKyc(app.id, {
        kycSessionId: session.sessionId,
        kycWebviewUrl: session.webviewUrl,
      });
      setMdcKycSessionId(session.sessionId);
      setMdcKycWebviewUrl(session.webviewUrl);
      syncedZelifyUserIdRef.current = null;
      setMdcZelifyUserId(null);
      kycLog("reenviar · OK (overwrite MDC)", {
        appId: app.id,
        kycSessionId: session.sessionId,
        note: "zelifyUserId quedó null a propósito",
      });
      setFeedback("Nuevo link KYC generado (válido ~24h).");
    } catch (err) {
      kycError("reenviar · falló", err, { appId: app.id, curp, email });
      setFeedback(err instanceof Error ? err.message : "No se pudo reenviar KYC.");
    } finally {
      setKycResending(false);
    }
  };


  if (isMoralApplicant) {
    return <MoralApplicantDetailModal app={app} rules={rules} onClose={onClose} layout={layout} />;
  }
  const isAutomotriz = app.product === "Credito automotriz";
  const interestRate = isAutomotriz ? 13.8 : 21.2;
  const termMonths = isAutomotriz ? 48 : 24;
  const downPayment = isAutomotriz ? Math.round(app.requestedAmount * 0.15) : 0;
  const financedAmount = Math.max(app.requestedAmount - downPayment, 0);
  const totalWithInterest = financedAmount * (1 + (interestRate / 100) * (termMonths / 12));
  const monthlyEstimate = Math.round(totalWithInterest / Math.max(termMonths, 1));
  const dti = Math.min(0.62, Math.max(0.19, app.requestedAmount / (isAutomotriz ? 8_500_000 : 2_100_000)));
  const backendDti = financeRequestDetailQuery.data?.dti;
  const parsedBackendDti = typeof backendDti === "number"
    ? backendDti
    : typeof backendDti === "string" && backendDti.trim() !== ""
      ? Number(backendDti)
      : Number.NaN;
  const dtiFromApi = Number.isFinite(parsedBackendDti)
    ? parsedBackendDti > 1 ? parsedBackendDti / 100 : parsedBackendDti
    : null;
  const backendRiskIndex = financeRequestDetailQuery.data?.riskIndex;
  const parsedRiskIndex = typeof backendRiskIndex === "number"
    ? backendRiskIndex
    : typeof backendRiskIndex === "string" && backendRiskIndex.trim() !== ""
      ? Number(backendRiskIndex)
      : Number.NaN;
  const visibleRiskScore = isDemoOrganization
    ? app.riskScore
    : Number.isFinite(parsedRiskIndex) ? parsedRiskIndex : 0;
  const visibleDti = isDemoOrganization ? dti : dtiFromApi ?? evaluatedDti ?? 0;
  const docs = [
    {
      type: "INE / Pasaporte",
      file: `id_${app.appNo}.pdf`,
      automated: app.riskScore < 65 ? "Aprobada" : "Revision",
      manual: "Pendiente",
      confidence: `${84 + (quickHash(app.id + "id") % 12)}%`,
    },
    {
      type: "Comprobante domicilio",
      file: `dom_${app.appNo}.pdf`,
      automated: app.riskScore < 72 ? "Aprobada" : "Revision",
      manual: "Pendiente",
      confidence: `${81 + (quickHash(app.id + "dom") % 15)}%`,
    },
    {
      type: "Comprobante ingresos",
      file: `ing_${app.appNo}.pdf`,
      automated: app.riskScore < 74 ? "Aprobada" : "Revision",
      manual: "Pendiente",
      confidence: `${79 + (quickHash(app.id + "ing") % 17)}%`,
    },
  ];
  const incomeMinRule = rules.find((rule) => rule.status === "active" && rule.field === "income.monthlyNet");
  const dtiRule = rules.find((rule) => rule.status === "active" && rule.field === "ratios.dti");
  const ageRule = rules.find((rule) => rule.status === "active" && rule.field === "applicant.age");
  const bureauRule = rules.find((rule) => rule.status === "active" && rule.field === "bureau.score");
  const delinquencyRule = rules.find((rule) => rule.status === "active" && rule.field === "credit.maxDaysPastDue");
  const historyRule = rules.find((rule) => rule.status === "active" && rule.field === "credit.historyMonths");
  const incomeMin = Number(incomeMinRule?.value ?? 12000) || 12000;
  const dtiMax = Number(dtiRule?.value ?? 0.45) || 0.45;
  const ageMin = Number(ageRule?.value ?? 18) || 18;
  const bureauBaseMin = Number(bureauRule?.value ?? 620) || 620;
  const maxDaysPastDueAllowed = Number(delinquencyRule?.value ?? 29) || 29;
  const historyMinMonths = Number(historyRule?.value ?? 12) || 12;
  const bureauMinByProduct = isAutomotriz ? 680 : 620;
  const bureauMin = Math.max(bureauBaseMin, bureauMinByProduct);
  const estimatedIncomeMonthly = Math.max(
    6000,
    Math.round(isAutomotriz ? app.requestedAmount / 70 : app.requestedAmount / 28),
  );
  const estimatedAge = 20 + (quickHash(`${app.id}-age`) % 28);
  const backendBureauScore = financeRequestDetailQuery.data?.buroScore;
  const bureauScoreFromApi = Number.isFinite(backendBureauScore) ? Number(backendBureauScore) : null;
  const bureauScoreEstimated = bureauScoreFromApi ?? (isDemoOrganization ? bureauScoreFromRiskIndex(app.riskScore) : 0);
  const maxDaysPastDue = Math.max(
    0,
    Math.min(120, Math.round(app.riskScore * 1.15 + (quickHash(`${app.id}-dpd`) % 21) - 8)),
  );
  const creditHistoryMonths = Math.max(3, Math.round(96 - app.riskScore + (quickHash(`${app.id}-hist`) % 36)));
  const employmentMonths = Math.max(1, Math.round(12 + (quickHash(`${app.id}-employment`) % 36)));
  const hasDocumentAlerts = docs.filter((doc) => doc.automated === "Revision").length >= 2;
  const hasCapacityPressure = monthlyEstimate > estimatedIncomeMonthly * 0.45;
  const metricByField: Partial<Record<CreditRuleRow["field"], number>> = {
    "income.monthlyNet": estimatedIncomeMonthly,
    "ratios.dti": dti,
    "applicant.age": estimatedAge,
    "bureau.score": bureauScoreEstimated,
    "credit.maxDaysPastDue": maxDaysPastDue,
    "credit.historyMonths": creditHistoryMonths,
    "employment.months": employmentMonths,
  };
  const policyByField: Partial<Record<CreditRuleRow["field"], boolean>> = {
    "income.monthlyNet": estimatedIncomeMonthly < incomeMin || hasCapacityPressure,
    "ratios.dti": dti > dtiMax,
    "applicant.age": estimatedAge < ageMin,
    "bureau.score": bureauScoreEstimated < bureauMin,
    "credit.maxDaysPastDue": maxDaysPastDue > maxDaysPastDueAllowed,
    "credit.historyMonths": creditHistoryMonths < historyMinMonths,
  };
  const documentVisualStatus = deriveCombinedDocumentStatus([documentProgress, bankStatementProgress, addressProgress]);
  const documentStageState =
    documentVisualStatus === "Con errores"
      ? "failed"
      : documentVisualStatus === "Completado"
        ? "done"
        : "current";

  // Tarjeta superior KYC: dueño = Auth GET /sessions → status (no app.status / riskScore).
  const zelifyKycStatus = kycSessionQuery.data?.status ?? null;
  const kycStageState: "done" | "current" | "failed" =
    zelifyKycStatus === "completed"
      ? "done"
      : zelifyKycStatus === "rejected" || zelifyKycStatus === "failed" || zelifyKycStatus === "expired"
        ? "failed"
        : mdcKycSessionId || mdcKycWebviewUrl || zelifyKycStatus === "pending" || zelifyKycStatus === "in_progress"
          ? "current"
          : app.status === "pending"
            ? "current"
            : "done";
  const kycStageDescription =
    zelifyKycStatus != null
      ? kycStatusLabel(zelifyKycStatus)
      : mdcKycSessionId || mdcKycWebviewUrl
        ? "Verificación pendiente"
        : kycSessionQuery.isLoading
          ? "Consultando…"
          : "Sin sesión KYC";

  const normalizedRulesStatus = breakdownStatus?.toLowerCase() || "";
  const rulesStageState: "done" | "current" | "failed" =
    /aprob/.test(normalizedRulesStatus)
      ? "done"
      : /rechaz/.test(normalizedRulesStatus)
        ? "failed"
        : /revision/.test(normalizedRulesStatus)
          ? "current"
          : app.status === "pending"
            ? "current"
            : "done";
  const rulesStageDescription =
    /aprob/.test(normalizedRulesStatus)
      ? "Aprobada"
      : /rechaz/.test(normalizedRulesStatus)
        ? "Rechazada"
        : /revision/.test(normalizedRulesStatus)
          ? "En revisión"
          : rulesStageState === "done"
            ? "Completado"
            : "En proceso";

  const stages = [
    { id: "request", label: "Solicitud", state: "done" as const, description: "Solicitud levantada" },
    { id: "kyc", label: "KYC / KYB", state: kycStageState, description: kycStageDescription },
    { id: "docs", label: "Documentos", state: documentStageState },
    { id: "rules", label: "Reglas de decision", state: rulesStageState, description: rulesStageDescription },
    {
      id: "decision",
      label: "Decision final",
      state: app.status === "pending" ? ("current" as const) : app.status === "declined" ? ("failed" as const) : ("done" as const),
    },
  ];
  let activeRules = rules
    .filter((rule) => rule.status === "active")
    .slice(0, 6)
    .map((rule) => {
      let result: RuleSeverity = "pass";
      const metricValue = metricByField[rule.field];
      if (metricValue !== undefined) {
        result = evaluateRuleResult(rule, metricValue, app.status);
      } else if (app.status === "manualReview" && (rule.severity === "warn" || (rule.field === "bureau.score" && bureauScoreEstimated < 700))) {
        result = "warn";
      }
      return { ...rule, result };
    });
  const fallbackField =
    (Object.entries(policyByField).find(([, value]) => value)?.[0] as CreditRuleRow["field"] | undefined) ??
    activeRules.find((rule) =>
      [
        "ratios.dti",
        "income.monthlyNet",
        "bureau.score",
        "credit.maxDaysPastDue",
        "credit.historyMonths",
      ].includes(rule.field),
    )?.field ??
    activeRules[0]?.field;
  if (fallbackField && app.status === "declined" && !activeRules.some((rule) => rule.result === "fail")) {
    activeRules = activeRules.map((rule) => (rule.field === fallbackField ? { ...rule, result: "fail" as RuleSeverity } : rule));
  }
  if (app.status === "manualReview" && !activeRules.some((rule) => rule.result === "warn" || rule.result === "fail")) {
    activeRules = activeRules.map((rule) => (rule.field === fallbackField ? { ...rule, result: "warn" as RuleSeverity } : rule));
  }
  if (app.status === "approved") {
    activeRules = activeRules.map((rule) => ({ ...rule, result: "pass" as RuleSeverity }));
  }
  if (app.status === "overridden" && !activeRules.some((rule) => rule.result === "fail")) {
    activeRules = activeRules.map((rule) => (rule.field === fallbackField ? { ...rule, result: "fail" as RuleSeverity } : rule));
  }
  const failedRuleRows = activeRules.filter((rule) => rule.result === "fail");
  const warnedRuleRows = activeRules.filter((rule) => rule.result === "warn");
  const failedRules = failedRuleRows.map((rule) => rule.name);
  const appRiskLevel = riskFromScore(app.riskScore);
  const hasHighRiskTrigger = bureauScoreEstimated <= 549 || maxDaysPastDue >= 90 || appRiskLevel === "high";
  const ruleResultLabel: Record<RuleSeverity, string> = {
    pass: "Aprobado",
    warn: "Revision",
    fail: "Rechazado",
  };
  const ruleSummaryLabel =
    app.status === "declined"
      ? "Rechazado"
      : app.status === "manualReview" || app.status === "pending"
        ? "Revision"
        : app.status === "overridden"
          ? "Aprobado con override"
          : "Aprobado";
  const ruleSummaryBadgeClass =
    app.status === "declined"
      ? "mdc-badge mdc-badge--bad"
      : app.status === "manualReview" || app.status === "pending"
        ? "mdc-badge mdc-badge--warn"
        : app.status === "overridden"
          ? "mdc-badge mdc-badge--info"
          : "mdc-badge mdc-badge--ok";

  const reasonFromRule = (rule: CreditRuleRow) => {
    if (rule.field === "income.monthlyNet") {
      return `Ingreso mensual estimado (${money(estimatedIncomeMonthly)}) por debajo del minimo requerido (${money(incomeMin)}).`;
    }
    if (rule.field === "ratios.dti") {
      if (rule.decisionBands?.rejectMin !== undefined && dti >= rule.decisionBands.rejectMin) {
        return `Relacion deuda/ingreso (DTI) en ${ratioLabel(dti)}, dentro del rango de rechazo automatico (>= ${ratioLabel(rule.decisionBands.rejectMin)}).`;
      }
      if (rule.decisionBands?.reviewMin !== undefined && rule.decisionBands?.reviewMax !== undefined) {
        return `Relacion deuda/ingreso (DTI) en ${ratioLabel(dti)}, dentro de la banda de revision (${ratioLabel(rule.decisionBands.reviewMin)} a ${ratioLabel(rule.decisionBands.reviewMax)}).`;
      }
      return `Relacion deuda/ingreso (DTI) en ${ratioLabel(dti)}, superior al limite permitido (${ratioLabel(dtiMax)}).`;
    }
    if (rule.field === "applicant.age") {
      return `Edad estimada del solicitante (${estimatedAge} anos) menor al minimo requerido (${ageMin} anos).`;
    }
    if (rule.field === "bureau.score") {
      return `Score de buro estimado (${bureauScoreEstimated}) por debajo del umbral requerido para ${app.product} (${bureauMin}).`;
    }
    if (rule.field === "credit.maxDaysPastDue") {
      return `Atraso maximo reciente de ${maxDaysPastDue} dias, excede el limite permitido (${maxDaysPastDueAllowed} dias).`;
    }
    if (rule.field === "credit.historyMonths") {
      return `Antiguedad de historial (${creditHistoryMonths} meses) por debajo del minimo recomendado (${historyMinMonths} meses).`;
    }
    if (rule.field === "employment.months") {
      return `Antiguedad laboral estimada (${employmentMonths} meses) por debajo del minimo requerido (${rule.value} meses).`;
    }
    return `${rule.name}: incumplimiento en ${ruleFieldLabel(rule.field)} (valor politica: ${rule.value}).`;
  };

  const declinedReasonsFromPolicy: string[] = [];
  if (estimatedIncomeMonthly < incomeMin) {
    declinedReasonsFromPolicy.push(
      `Ingreso mensual estimado (${money(estimatedIncomeMonthly)}) por debajo del minimo requerido (${money(incomeMin)}).`,
    );
  }
  if (dti > dtiMax) {
    declinedReasonsFromPolicy.push(
      `Relacion deuda/ingreso (DTI) en ${ratioLabel(dti)}, superior al limite permitido (${ratioLabel(dtiMax)}).`,
    );
  }
  if (rules.some((rule) => rule.field === "employment.months" && rule.status === "active") && employmentMonths < 6) {
    declinedReasonsFromPolicy.push(
      `Antiguedad laboral estimada (${employmentMonths} meses) por debajo del minimo requerido.`,
    );
  }
  if (hasCapacityPressure) {
    declinedReasonsFromPolicy.push(
      `La cuota mensual estimada (${money(monthlyEstimate)}) compromete la capacidad de pago frente al ingreso estimado.`,
    );
  }
  if (bureauScoreEstimated < bureauMin) {
    declinedReasonsFromPolicy.push(
      `Score de buro estimado (${bureauScoreEstimated}) por debajo del umbral requerido para ${app.product} (${bureauMin}).`,
    );
  }
  if (maxDaysPastDue > maxDaysPastDueAllowed) {
    declinedReasonsFromPolicy.push(
      `Atraso maximo reciente de ${maxDaysPastDue} dias, excede el limite permitido (${maxDaysPastDueAllowed} dias).`,
    );
  }
  if (creditHistoryMonths < historyMinMonths) {
    declinedReasonsFromPolicy.push(
      `Antiguedad de historial (${creditHistoryMonths} meses) por debajo del minimo recomendado (${historyMinMonths} meses).`,
    );
  }
  if (hasDocumentAlerts) {
    declinedReasonsFromPolicy.push("Inconsistencias documentales detectadas en validacion automatica (OCR/KYC).");
  }

  const decisionReason =
    app.status === "declined"
      ? failedRuleRows.length > 0
        ? `Rechazada por incumplimiento de politica: ${failedRuleRows.map(reasonFromRule).join(" ")}`
        : declinedReasonsFromPolicy.length > 0
          ? `Rechazada por politica de originacion: ${declinedReasonsFromPolicy.slice(0, 2).join(" ")}`
          : hasHighRiskTrigger
            ? `Rechazada por score de buro bajo (${bureauScoreEstimated}) y nivel de riesgo ${RISK_LABELS[appRiskLevel].toLowerCase()}.`
            : `Rechazada por validacion integral: se detectaron condiciones no elegibles en capacidad de pago y/o consistencia documental.`
      : app.status === "manualReview"
        ? warnedRuleRows.length > 0
          ? `En revision manual por alertas de politica: ${warnedRuleRows.map(reasonFromRule).slice(0, 2).join(" ")}`
          : hasDocumentAlerts
            ? "En revision manual por inconsistencias documentales detectadas en OCR/KYC."
            : `En revision manual por validaciones complementarias de capacidad de pago (score ${app.riskScore}).`
        : app.status === "overridden"
          ? failedRules.length > 0
            ? `Override aplicado por analista pese a: ${failedRules.join(", ")}. Requiere trazabilidad de aprobacion.`
            : `Override aplicado por criterio comercial y mitigantes de riesgo documentados.`
          : "";

  const runAction = (label: string) => {
    setFeedback(`${label} ejecutado · ${new Intl.DateTimeFormat("es-MX", { timeStyle: "short", timeZone: getConfiguredTimezone() }).format(new Date())}`);
  };

  const applyOverride = () => {
    if (!overrideReason.trim()) {
      setFeedback("Debe registrar una razon para override manual.");
      return;
    }
    setFeedback(`Override aplicado: ${STATUS_LABELS[overrideChoice]}. Queda registrado en Trazabilidad.`);
  };

  const handleEvaluateRules = async () => {
    const orgId = getStoredOrganization()?.id;
    const userId = resolvedUserId;
    const ruleIds = [...new Set(rules.filter((rule) => rule.status === "active").map((rule) => rule.id))];

    if (!orgId || orgId === "demo-bypass-org") {
      setFeedback("La ejecución de reglas está disponible para solicitudes reales.");
      return;
    }
    if (!userId) {
      setFeedback("No fue posible identificar al solicitante para ejecutar las reglas.");
      return;
    }
    if (ruleIds.length === 0) {
      setFeedback("No hay reglas activas para el producto de esta solicitud.");
      return;
    }

    setIsEvaluatingRules(true);
    setFeedback("");
    try {
      const evaluations = await Promise.all(ruleIds.map((ruleId) => evaluateDecisionRule(ruleId, { orgId, userId })));
      const evaluatedBreakdown = evaluations.flatMap((evaluation, evaluationIndex) => {
        const reasons = evaluation.reasons || [];
        const ruleBreakdown = evaluation.rulesBreakdown?.length
          ? evaluation.rulesBreakdown
          : [{
              id: ruleIds[evaluationIndex],
              name: rules.find((rule) => rule.id === ruleIds[evaluationIndex])?.name || "Regla de decisión",
              status: evaluation.status,
              passed: /aprob/i.test(evaluation.status),
              reason: undefined,
            }];

        return ruleBreakdown.map((rule, index) => ({
          ...rule,
          // The evaluator's top-level reason contains the concrete document/value that failed.
          reason: reasons[index] || reasons[0] || rule.reason,
        }));
      });
      const dtiFromEvaluation = evaluations
        .flatMap((evaluation) => [evaluation, ...(evaluation.rulesBreakdown || [])])
        .map((entry) => entry.averageDti ?? entry.averageDTI ?? entry.dti ?? entry.dtiAverage ?? entry.average_dti)
        .map((value) => Number(value))
        .find((value) => Number.isFinite(value) && value >= 0);
      const dtiFromReason = [
        ...evaluations.flatMap((evaluation) => evaluation.reasons || []),
        ...evaluatedBreakdown.map((rule) => rule.reason),
      ]
        .map((reason) => reason?.match(/\bDTI(?:\s+promedio)?[^0-9]{0,160}(\d+(?:[.,]\d+)?)\s*%/i)?.[1])
        .map((value) => value ? Number(value.replace(",", ".")) : Number.NaN)
        .find((value) => Number.isFinite(value) && value >= 0);
      const resolvedDti = dtiFromEvaluation ?? dtiFromReason;
      const finalStatus = evaluations.some((evaluation) => /rechaz/i.test(evaluation.status))
        ? "Rechazado"
        : evaluations.some((evaluation) => /revision/i.test(evaluation.status))
          ? "Revision manual"
          : evaluations[evaluations.length - 1]?.status || "Pendiente";

      setBreakdown(evaluatedBreakdown);
      setBreakdownStatus(finalStatus);
      setEvaluatedDti(resolvedDti === undefined ? null : resolvedDti > 1 ? resolvedDti / 100 : resolvedDti);
      await financeRequestDetailQuery.refetch();
      setFeedback("Reglas ejecutadas correctamente.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible ejecutar las reglas.");
    } finally {
      setIsEvaluatingRules(false);
    }
  };

  const handleRefreshDocumentProgress = async () => {
    // Siempre refetch del detalle: el domicilio KYC vive en user.address (MDC),
    // no en el progress de documentos.
    if (!resolvedUserId) {
      await financeRequestDetailQuery.refetch();
      return;
    }
    await Promise.all([
      financeRequestDetailQuery.refetch(),
      documentProgressQuery.refetch(),
      bankStatementProgressQuery.refetch(),
      addressProgressQuery.refetch(),
    ]);
  };

  const handleReprocessFromRow = async (analysisId: string, rowKey: string) => {
    setActionErrors((current) => ({ ...current, [rowKey]: null }));
    try {
      await reprocessAnalysisMutation.mutateAsync(analysisId);
      setFeedback("Se creó una nueva invocación BDA para el documento.");
    } catch (error: unknown) {
      setActionErrors((current) => ({ ...current, [rowKey]: toDetailDocError(error, "No fue posible reprocesar el documento.") }));
    }
  };

  const startManualReview = (decision: "APPROVED" | "REJECTED") => {
    setDocumentActionFeedback(null);
    setManualReviewAction(decision);
    setManualReviewReason(
      decision === "APPROVED"
        ? "Información validada contra el documento original"
        : "El documento no cumple con la validación manual",
    );
    setManualReviewNotes("");
  };

  const handleManualReview = async () => {
    if (!extractionAnalysisId || (manualReviewAction !== "APPROVED" && manualReviewAction !== "REJECTED")) return;
    if (!reviewerEmail) {
      setDocumentActionFeedback({ type: "error", message: "No fue posible identificar el correo del operador autenticado." });
      return;
    }
    if (!manualReviewReason.trim()) {
      setDocumentActionFeedback({ type: "error", message: "El motivo de la decisión es obligatorio." });
      return;
    }

    setDocumentActionFeedback(null);
    try {
      await manualReviewMutation.mutateAsync({
        analysisId: extractionAnalysisId,
        payload: {
          decision: manualReviewAction,
          reason: manualReviewReason.trim(),
          notes: manualReviewNotes.trim(),
          reviewedBy: reviewerEmail,
        },
      });
      setManualReviewAction(null);
      setDocumentActionFeedback({
        type: "success",
        message: manualReviewAction === "APPROVED" ? "Documento aprobado manualmente." : "Documento rechazado manualmente.",
      });
    } catch (error: unknown) {
      setDocumentActionFeedback({ type: "error", message: toDetailDocError(error, "No fue posible registrar la revisión manual.").message });
    }
  };

  const handleReprocessDocument = async () => {
    if (!extractionAnalysisId) return;
    setDocumentActionFeedback(null);
    try {
      const result = await reprocessAnalysisMutation.mutateAsync(extractionAnalysisId);
      setExtractionSelection((current) =>
        current ? { ...current, analysisId: result.analysisId, status: "PROCESSING" } : current,
      );
      setManualReviewAction(null);
      setDocumentActionFeedback({ type: "success", message: "Se creó una nueva invocación BDA para el documento." });
    } catch (error: unknown) {
      setDocumentActionFeedback({ type: "error", message: toDetailDocError(error, "No fue posible reprocesar el documento.").message });
    }
  };

  const handleViewExtraction = (
    analysisId: string,
    documentId: string | null,
    label: string,
    fileName: string,
    category: "nomina" | "extracto" | "comprobante_domicilio",
    status?: string | null,
  ) => {
    setDocumentActionFeedback(null);
    setExtractionSelection({
      analysisId,
      documentId,
      title: `${label} · ${fileName}`,
      fileName,
      category,
      status: status ?? null,
    });
  };

  return (
    <div className={layout === "page" ? "mdc-modal mdc-modal--page" : "mdc-modal-backdrop"} onClick={layout === "page" ? undefined : onClose}>
      <div className="mdc-modal mdc-modal--detail" onClick={(e) => e.stopPropagation()}>
        <header className="mdc-detail-head">
          <div className="mdc-detail-head__title">
            {layout === "page" ? null : (
            <button type="button" className="mdc-link-btn" onClick={onClose}>
              ← Volver a solicitudes
            </button>
            )}
            <div className="mdc-detail-head__line">
              <h3>Detalle de solicitud</h3>
              <span className={classForStatus(app.status)}>{STATUS_LABELS[app.status]}</span>
            </div>
            <p>
              {app.appNo} · {app.id.slice(0, 12)} · {shortDate(app.submittedAt)}
            </p>
          </div>
        </header>

        {feedback ? <p className="mdc-detail-feedback">{feedback}</p> : null}

        <div className="mdc-detail-progress">
          {stages.map((stage) => (
            <div key={stage.id} className="mdc-stage-card">
              <span className={`mdc-stage-dot mdc-stage-dot--${stage.state}`} />
              <strong>{stage.label}</strong>
              {stage.id === "docs" ? (
                documentLoading ? <em>Cargando documentación...</em> : documentError ? <em>No disponible</em> : (
                  <div className="mdc-stage-document-lines">
                    <span>
                      <b>Nómina</b>
                      <em>{documentProgress?.uploaded ?? 0}/{documentProgress?.required ?? 5}</em>
                      <small>{documentProgress?.completed ?? 0} {(documentProgress?.completed ?? 0) === 1 ? "procesado" : "procesados"}</small>
                    </span>
                    <span>
                      <b>Extracto</b>
                      <em>{bankStatementProgress?.uploaded ?? 0}/{bankStatementProgress?.required ?? 1}</em>
                      <small>{bankStatementProgress?.completed ?? 0} {(bankStatementProgress?.completed ?? 0) === 1 ? "procesado" : "procesados"}</small>
                    </span>
                    <span>
                      <b>Domicilio</b>
                      <em>{addressProgress?.uploaded ?? 0}/{addressProgress?.required ?? 1}</em>
                      <small>{addressProgress?.completed ?? 0} {(addressProgress?.completed ?? 0) === 1 ? "procesado" : "procesados"}</small>
                    </span>
                  </div>
                )
              ) : (
                <em>{"description" in stage ? stage.description : stage.state === "done" ? "Completado" : stage.state === "current" ? "En proceso" : "Con observacion"}</em>
              )}
            </div>
          ))}
        </div>

        <div className="mdc-detail-layout">
          <div className="mdc-detail-main">
            <section className="mdc-detail-card mdc-detail-card--summary">
              <h4>{isMoralApplicant ? "Empresa solicitante" : "Solicitante"}</h4>
              <dl className="mdc-detail-dl mdc-detail-dl--compact">
                <div>
                  <dt>Nombre</dt>
                  <dd>
                    {(() => {
                      const mdcUser = financeRequestDetailQuery.data?.user;
                      const mdcKycDone =
                        String(mdcUser?.kycStatus || "").toLowerCase() === "completed";
                      const fromMdc =
                        mdcKycDone
                          ? (mdcUser?.fullName?.trim() ||
                              [mdcUser?.firstName, mdcUser?.lastName].filter(Boolean).join(" ").trim())
                          : "";
                      if (fromMdc) return fromMdc;

                      const identity = kycSessionQuery.data?.identity;
                      const fromKyc = identity
                        ? [identity.firstNames, identity.lastNames].filter(Boolean).join(" ").trim()
                        : "";
                      if (fromKyc) return fromKyc;
                      if (app.applicantName && app.applicantName !== "Desconocido" && app.applicantName !== "Sin nombre") {
                        return app.applicantName;
                      }
                      return resolveApplicantDisplayName({
                        email: app.applicantEmail,
                        identificationNumber: app.rawPayload?.identificationNumber,
                        firstName: app.rawPayload?.firstName,
                        lastName: app.rawPayload?.lastName,
                        businessName: app.rawPayload?.businessName,
                        personType: mode,
                      });
                    })()}
                  </dd>
                </div>
                <div><dt>Email</dt><dd>{app.applicantEmail}</dd></div>
                <div><dt>Fecha de envío</dt><dd>{shortDate(app.submittedAt)}</dd></div>
              </dl>
            </section>

            <section className="mdc-detail-card mdc-detail-card--summary">
              <h4>Producto y condiciones</h4>
              <dl className="mdc-detail-dl mdc-detail-dl--compact">
                <div><dt>Producto</dt><dd>{app.product}</dd></div>
                <div><dt>Monto solicitado</dt><dd>{money(app.requestedAmount)}</dd></div>
                <div><dt>Tasa anual estimada</dt><dd>{interestRate.toFixed(1)}%</dd></div>
                <div><dt>Plazo</dt><dd>{termMonths} meses</dd></div>
                <div><dt>Enganche</dt><dd>{money(downPayment)}</dd></div>
                <div><dt>Cuota mensual estimada</dt><dd>{money(monthlyEstimate)}</dd></div>
              </dl>
            </section>

            <section className="mdc-detail-card">
              <div className="mdc-detail-card__head">
                <h4>Validación documental</h4>
                <div className="mdc-document-card-actions">
                  <button type="button" className="mdc-btn mdc-btn--ghost mdc-btn--sm" onClick={handleRefreshDocumentProgress} disabled={documentRefreshing || !resolvedUserId}>
                    {documentRefreshing ? "Actualizando..." : "Actualizar"}
                  </button>
                </div>
              </div>
              <DocumentCategoryPanel
                title="Comprobantes de nómina"
                itemLabel={(index) => `Nómina ${index + 1}`}
                progress={documentProgress}
                loading={financeRequestDetailQuery.isLoading || documentProgressQuery.isLoading}
                error={payrollDocumentError}
                reprocessingAnalysisId={reprocessingAnalysisId}
                extractionAnalysisId={extractionAnalysisId}
                extractionData={extractionData}
                actionErrors={actionErrors}
                onReprocess={handleReprocessFromRow}
                onViewExtraction={(analysisId, documentId, label, fileName) => {
                  const status = documentProgress?.documents?.find((d) => d.analysisId === analysisId)?.status;
                  handleViewExtraction(analysisId, documentId, label, fileName, "nomina", status);
                }}
              />

              <DocumentCategoryPanel
                title="Extracto bancario"
                itemLabel={() => "Extracto"}
                progress={bankStatementProgress}
                loading={financeRequestDetailQuery.isLoading || bankStatementProgressQuery.isLoading}
                error={bankStatementDocumentError}
                reprocessingAnalysisId={reprocessingAnalysisId}
                extractionAnalysisId={extractionAnalysisId}
                extractionData={extractionData}
                actionErrors={actionErrors}
                onReprocess={handleReprocessFromRow}
                onViewExtraction={(analysisId, documentId, label, fileName) => {
                  const status = bankStatementProgress?.documents?.find((d) => d.analysisId === analysisId)?.status;
                  handleViewExtraction(analysisId, documentId, label, fileName, "extracto", status);
                }}
              />

              <DocumentCategoryPanel
                title="Comprobante de domicilio"
                itemLabel={() => "Domicilio"}
                progress={addressProgress}
                loading={financeRequestDetailQuery.isLoading || addressProgressQuery.isLoading}
                error={addressDocumentError}
                reprocessingAnalysisId={reprocessingAnalysisId}
                extractionAnalysisId={extractionAnalysisId}
                extractionData={extractionData}
                actionErrors={actionErrors}
                onReprocess={handleReprocessFromRow}
                onViewExtraction={(analysisId, documentId, label, fileName) => {
                  const status = addressProgress?.documents?.find((d) => d.analysisId === analysisId)?.status;
                  handleViewExtraction(analysisId, documentId, label, fileName, "comprobante_domicilio", status);
                }}
              />
            </section>

            <section className="mdc-detail-card">
              <div className="mdc-detail-card__head">
                <h4>Desglose de reglas</h4>
                <div className="mdc-document-card-actions">
                  <button type="button" className="mdc-btn mdc-btn--primary mdc-btn--sm" onClick={handleEvaluateRules} disabled={isEvaluatingRules}>
                    {isEvaluatingRules ? "Ejecutando..." : "Ejecutar reglas"}
                  </button>
                  {breakdownStatus ? <span className={
                    breakdownStatus === "Aprobada" || breakdownStatus === "Aprobado" ? "mdc-badge mdc-badge--ok" :
                      breakdownStatus === "Rechazada" || breakdownStatus === "Rechazado" ? "mdc-badge mdc-badge--bad" :
                        breakdownStatus === "Revision manual" || breakdownStatus === "Revision" ? "mdc-badge mdc-badge--warn" :
                          ruleSummaryBadgeClass
                  }>
                    {breakdownStatus}
                  </span> : null}
                </div>
              </div>
              <div className="mdc-detail-rule-list">
                {breakdown && breakdown.length > 0 ? (
                  breakdown.map((rule, idx) => {
                    const rawStatus = rule.status || (rule.passed ? (rule.severity === "Revision" || rule.severity === "warn" ? "Revision" : "Aprobado") : "Rechazado");
                    const isApproved =
                      rawStatus === "Aprobado" || rawStatus === "Aprobada" || rawStatus === "pass" || rule.passed === true;

                    const isRevision =
                      !isApproved &&
                      (rawStatus === "Revision" ||
                        rawStatus === "Revision manual" ||
                        rawStatus === "warn" ||
                        rule.severity === "Revision" ||
                        rule.severity === "warn");

                    const isDeclined =
                      !isRevision &&
                      !isApproved &&
                      (rawStatus === "Rechazado" || rawStatus === "Rechazada" || rawStatus === "Rechazo" || rawStatus === "fail" || rule.passed === false);

                    const displayStatus = isRevision ? "Revision" : isApproved ? "Aprobado" : isDeclined ? "Rechazado" : rawStatus;
                    const badgeClass =
                      isApproved
                        ? "mdc-badge mdc-badge--ok"
                        : isDeclined
                          ? "mdc-badge mdc-badge--bad"
                          : "mdc-badge mdc-badge--warn";

                    return (
                      <article key={rule.id || `rule-breakdown-${idx}`} className="mdc-detail-rule">
                        <div>
                          <strong>{rule.name}</strong>
                          {rule.reason ? <p>{rule.reason}</p> : null}
                        </div>
                        <span className={badgeClass}>
                          {displayStatus}
                        </span>
                      </article>
                    );
                  })
                ) : isDemoOrganization ? (
                  activeRules.map((rule) => (
                    <article key={rule.id} className="mdc-detail-rule">
                      <div>
                        <strong>{rule.name}</strong>
                        <p>{rule.description}</p>
                      </div>
                      <span className={rule.result === "pass" ? "mdc-badge mdc-badge--ok" : rule.result === "warn" ? "mdc-badge mdc-badge--warn" : "mdc-badge mdc-badge--bad"}>
                        {ruleResultLabel[rule.result]}
                      </span>
                    </article>
                  ))
                ) : null}
              </div>
            </section>

            {app.status === "approved" && (
              <ApprovedCrossSellPanel app={app} creditStore={creditStore} />
            )}
          </div>

          <aside className="mdc-detail-side">
            <section className="mdc-detail-card">
              <h4>Resumen del motor</h4>
              <div className="mdc-detail-score-grid">
                <div>
                  <span>Score Buró</span>
                  <strong>{isDemoOrganization ? bureauScoreEstimated : financeRequestDetailQuery.isLoading ? "..." : bureauScoreFromApi ?? ""}</strong>
                </div>
                <div>
                  <span>Indice de riesgo</span>
                  <strong>{visibleRiskScore}/100</strong>
                </div>
                <div>
                  <span>DTI estimado</span>
                  <strong>{ratioLabel(visibleDti)}</strong>
                </div>
              </div>
              <div className="mdc-score-track" aria-hidden>
                <span style={{ width: `${Math.min(100, Math.round(visibleRiskScore))}%` }} />
              </div>
              {decisionReason ? (
                <div className="mdc-detail-decision-reason">
                  <strong>Motivo de decision</strong>
                  <p>{decisionReason}</p>
                </div>
              ) : null}
            </section>

            <section className="mdc-detail-card mdc-kyc-panel">
              <h4>KYC</h4>
              {(() => {
                const session = kycSessionQuery.data;
                const status: ZelifyKycSessionStatus | null = session?.status ?? null;
                const hasLink = Boolean(mdcKycWebviewUrl);
                const pendingVisual =
                  status === "pending" ||
                  status === "in_progress" ||
                  (!status && hasLink && mdcZelifyUserId == null);
                const showContinue =
                  status === "pending" ||
                  status === "in_progress" ||
                  (!status && hasLink);
                const showResend = status === "expired" || status === "rejected" || status === "failed";
                const identity = session?.identity ?? null;
                const onboarding = session?.onboarding ?? null;
                const mdcUser = financeRequestDetailQuery.data?.user;
                const ocrConfidence = mdcUser?.ocrConfidence ?? identity?.ocrConfidence ?? null;
                const faceMatchScore = mdcUser?.faceMatchScore ?? identity?.faceMatchScore ?? null;
                const contact = onboarding?.contact ?? null;
                const personal = onboarding?.personal ?? null;
                const references = onboarding?.references ?? null;
                const mdcAddress = mdcUser?.address ?? null;
                const mdcAddressLines = formatMdcUserAddressLines(mdcAddress);
                const ineMatched = identity?.ineMatched ?? null;
                const ineLabel = formatIneMatched(ineMatched);
                const identitySummary = formatKycIdentitySummary(identity);
                const housingLabel = formatHousingType(personal?.housingType ?? null, personal?.housingTypeOther);
                const showExpediente =
                  identity != null ||
                  contact != null ||
                  personal != null ||
                  mdcAddress != null ||
                  (references != null && references.length > 0) ||
                  Boolean(mdcUser);

                if (!mdcKycSessionId && !hasLink) {
                  return <p className="mdc-kyc-empty">Sin sesión KYC vinculada.</p>;
                }

                const copyKycLink = async () => {
                  if (!mdcKycWebviewUrl) return;
                  try {
                    await navigator.clipboard.writeText(mdcKycWebviewUrl);
                    setFeedback("Link KYC copiado al portapapeles.");
                  } catch {
                    setFeedback("No se pudo copiar el link KYC.");
                  }
                };

                const dash = <span className="mdc-kyc-muted">—</span>;

                return (
                  <div className="mdc-kyc-stack">
                    <div className="mdc-kyc-status-row">
                      <span className="mdc-kyc-label">Estado</span>
                      <span
                        className={
                          status === "completed"
                            ? "mdc-badge mdc-badge--ok"
                            : status === "rejected" || status === "failed" || status === "expired"
                              ? "mdc-badge mdc-badge--bad"
                              : "mdc-badge mdc-badge--warn"
                        }
                      >
                        {kycSessionQuery.isLoading && !session
                          ? "Consultando…"
                          : kycStatusLabel(status || (pendingVisual ? "pending" : undefined))}
                      </span>
                      {session?.completedAt ? (
                        <small className="mdc-kyc-meta">Completado: {new Date(session.completedAt).toLocaleString("es-MX")}</small>
                      ) : null}
                    </div>

                    {hasLink ? (
                      <div className="mdc-kyc-link-block">
                        <span className="mdc-kyc-label">Link de verificación</span>
                        <div className="mdc-kyc-link-row">
                          <input
                            className="mdc-kyc-link-input"
                            type="text"
                            readOnly
                            value={mdcKycWebviewUrl || ""}
                            aria-label="Link KYC"
                            onFocus={(e) => e.currentTarget.select()}
                          />
                          <button
                            type="button"
                            className="mdc-kyc-icon-btn"
                            title="Copiar link"
                            aria-label="Copiar link KYC"
                            onClick={copyKycLink}
                          >
                            <Copy size={16} />
                          </button>
                          {showContinue ? (
                            <a
                              className="mdc-kyc-icon-btn mdc-kyc-icon-btn--primary"
                              href={mdcKycWebviewUrl || "#"}
                              target="_blank"
                              rel="noreferrer"
                              title="Abrir verificación"
                              aria-label="Abrir verificación KYC"
                            >
                              <ExternalLink size={16} />
                            </a>
                          ) : null}
                        </div>
                        <small className="mdc-kyc-meta">Link operable de MDC (con token). Válido ~24h.</small>
                      </div>
                    ) : null}

                    {showExpediente ? (
                      <div className="mdc-kyc-sections">
                        <div className="mdc-kyc-section">
                          <h5>Identidad / INE</h5>
                          {identity == null && ocrConfidence == null && faceMatchScore == null ? (
                            dash
                          ) : identity == null ? (
                            <dl className="mdc-kyc-dl">
                              <div>
                                <dt>OCR</dt>
                                <dd>
                                  {formatKycPercent(ocrConfidence) ? (
                                    <span className={`mdc-badge mdc-badge--${kycScoreTone(ocrConfidence)}`}>
                                      {formatKycPercent(ocrConfidence)}
                                    </span>
                                  ) : (
                                    dash
                                  )}
                                </dd>
                              </div>
                              <div>
                                <dt>Face match</dt>
                                <dd>
                                  {formatKycPercent(faceMatchScore) ? (
                                    <span className={`mdc-badge mdc-badge--${kycScoreTone(faceMatchScore)}`}>
                                      {formatKycPercent(faceMatchScore)}
                                    </span>
                                  ) : (
                                    dash
                                  )}
                                </dd>
                              </div>
                            </dl>
                          ) : (
                            <dl className="mdc-kyc-dl">
                              <div>
                                <dt>INE / liveness</dt>
                                <dd>
                                  {ineLabel ? (
                                    <span
                                      className={
                                        ineMatched === false
                                          ? "mdc-badge mdc-badge--bad"
                                          : ineMatched === true
                                            ? "mdc-badge mdc-badge--ok"
                                            : "mdc-badge mdc-badge--neutral"
                                      }
                                    >
                                      {ineLabel}
                                    </span>
                                  ) : (
                                    dash
                                  )}
                                </dd>
                              </div>
                              <div>
                                <dt>Nombre</dt>
                                <dd>{[identity.firstNames, identity.lastNames].filter(Boolean).join(" ") || dash}</dd>
                              </div>
                              <div>
                                <dt>CURP</dt>
                                <dd>{identity.curp || dash}</dd>
                              </div>
                              <div>
                                <dt>Sexo</dt>
                                <dd>{formatSexLabel(identity.sex) || dash}</dd>
                              </div>
                              <div>
                                <dt>Nacimiento</dt>
                                <dd>{identity.birthDate || dash}</dd>
                              </div>
                              <div>
                                <dt>OCR</dt>
                                <dd>
                                  {formatKycPercent(ocrConfidence) ? (
                                    <span className={`mdc-badge mdc-badge--${kycScoreTone(ocrConfidence)}`}>
                                      {formatKycPercent(ocrConfidence)}
                                    </span>
                                  ) : (
                                    dash
                                  )}
                                </dd>
                              </div>
                              <div>
                                <dt>Face match</dt>
                                <dd>
                                  {formatKycPercent(faceMatchScore) ? (
                                    <span className={`mdc-badge mdc-badge--${kycScoreTone(faceMatchScore)}`}>
                                      {formatKycPercent(faceMatchScore)}
                                    </span>
                                  ) : (
                                    dash
                                  )}
                                </dd>
                              </div>
                              {!identitySummary && !ineLabel ? <div><dt /><dd>{dash}</dd></div> : null}
                            </dl>
                          )}
                        </div>

                        <div className="mdc-kyc-section">
                          <h5>Contacto</h5>
                          {contact == null ? (
                            dash
                          ) : (
                            <dl className="mdc-kyc-dl">
                              <div>
                                <dt>Email</dt>
                                <dd className="mdc-kyc-inline">
                                  <span>{contact.email || dash}</span>
                                  {contact.emailVerified === true ? <span className="mdc-badge mdc-badge--ok">Verificado</span> : null}
                                  {contact.emailVerified === false ? <span className="mdc-badge mdc-badge--warn">No verificado</span> : null}
                                </dd>
                              </div>
                              <div>
                                <dt>Teléfono</dt>
                                <dd className="mdc-kyc-inline">
                                  <span>{contact.phone || dash}</span>
                                  {contact.phoneVerified === true ? <span className="mdc-badge mdc-badge--ok">Verificado</span> : null}
                                  {contact.phoneVerified === false ? <span className="mdc-badge mdc-badge--warn">No verificado</span> : null}
                                </dd>
                              </div>
                            </dl>
                          )}
                        </div>

                        <div className="mdc-kyc-section">
                          <h5>Situación</h5>
                          {personal == null ? (
                            dash
                          ) : (
                            <dl className="mdc-kyc-dl">
                              <div>
                                <dt>Estado civil</dt>
                                <dd>{formatMaritalStatus(personal.maritalStatus, personal.maritalStatusOther) || dash}</dd>
                              </div>
                              <div>
                                <dt>Escolaridad</dt>
                                <dd>{formatEducation(personal.education, personal.educationOther) || dash}</dd>
                              </div>
                              {personal.hasSpouse === true || personal.spouse ? (
                                <>
                                  <div>
                                    <dt>Cónyuge</dt>
                                    <dd>{personal.spouse?.fullName || dash}</dd>
                                  </div>
                                  <div>
                                    <dt>Tel. cónyuge</dt>
                                    <dd>{personal.spouse?.phone || dash}</dd>
                                  </div>
                                </>
                              ) : null}
                              <div>
                                <dt>Tipo de vivienda</dt>
                                <dd>{housingLabel || dash}</dd>
                              </div>
                              <div>
                                <dt>Referencia / landmark</dt>
                                <dd>{personal.landmark || dash}</dd>
                              </div>
                            </dl>
                          )}
                        </div>

                        <div className="mdc-kyc-section">
                          <h5>Domicilio</h5>
                          {mdcAddress == null ? (
                            <p className="mdc-kyc-muted">Pendiente de comprobante</p>
                          ) : mdcAddressLines.length > 0 ? (
                            <div className="mdc-kyc-address">
                              {mdcAddressLines.map((line) => (
                                <span key={line}>{line}</span>
                              ))}
                            </div>
                          ) : (
                            <p className="mdc-kyc-muted">Pendiente de comprobante</p>
                          )}
                        </div>

                        <div className="mdc-kyc-section">
                          <h5>Referencias</h5>
                          {references == null || references.length === 0 ? (
                            dash
                          ) : (
                            <ul className="mdc-kyc-refs">
                              {references.map((ref, idx) => (
                                <li key={`${ref.fullName || "ref"}-${idx}`}>
                                  <strong>{ref.fullName || "Sin nombre"}</strong>
                                  <span>{formatRelation(ref.relation, ref.relationOther) || "—"}</span>
                                  <span>{ref.phone || "—"}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {kycSessionQuery.isError ? (
                      <p className="mdc-kyc-warn">
                        No se pudo consultar Auth KYC. Se muestra el link de MDC si existe.
                      </p>
                    ) : null}

                    {showContinue || showResend ? (
                      <div className="mdc-kyc-actions">
                        {showContinue && mdcKycWebviewUrl ? (
                          <a
                            className="mdc-btn mdc-btn--primary"
                            href={mdcKycWebviewUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ textDecoration: "none" }}
                          >
                            Continuar verificación
                          </a>
                        ) : null}
                        {showResend ? (
                          <button
                            type="button"
                            className="mdc-btn mdc-btn--primary"
                            disabled={kycResending}
                            onClick={handleResendKyc}
                          >
                            {kycResending ? "Reenviando…" : "Reenviar verificación"}
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })()}
            </section>

            <section className="mdc-detail-card">
              <h4>Override manual</h4>
              <label className="mdc-detail-field">
                <span>Nueva decision</span>
                <select value={overrideChoice} onChange={(e) => setOverrideChoice(e.target.value as ApplicationStatus)}>
                  <option value="approved">Aprobada</option>
                  <option value="declined">Rechazada</option>
                  <option value="manualReview">Revision manual</option>
                  <option value="overridden">Override</option>
                </select>
              </label>
              <label className="mdc-detail-field">
                <span>Justificacion</span>
                <textarea
                  rows={4}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Mitigantes, comite, soporte documental o aprobacion comercial."
                />
              </label>
              <button type="button" className="mdc-btn mdc-btn--primary" onClick={applyOverride}>
                Aplicar override
              </button>
            </section>
          </aside>
        </div>

        {extractionSelection ? (
          <div className="mdc-modal-backdrop mdc-extraction-backdrop" onClick={() => setExtractionSelection(null)}>
            <div className="mdc-extraction-modal" onClick={(event) => event.stopPropagation()}>
              <header className="mdc-extraction-head">
                <div>
                  <p>Extracción documental</p>
                  <div className="mdc-extraction-head__title">
                    <h3>{extractionSelection.title}</h3>
                    <span className={bdaStatusBadgeClass(extractionQuery.error ? "FAILED" : extractionData?.status, extractionData?.manualDecision)}>
                      {extractionQuery.isLoading ? "Cargando" : extractionQuery.error ? "Error" : bdaStatusLabel(extractionData?.status, extractionData?.manualDecision, extractionData?.errorCode)}
                    </span>
                    <DocumentMatchBadge match={extractionData?.documentMatch} />
                  </div>
                </div>
                <button type="button" className="mdc-icon-btn" onClick={() => setExtractionSelection(null)} aria-label="Cerrar extracción">×</button>
              </header>

              <div className="mdc-extraction-layout">
                <section className="mdc-extraction-pdf">
                  <div className="mdc-extraction-section-head">
                    <div>
                      <span>Documento original</span>
                      <strong>{extractionSelection.fileName}</strong>
                    </div>
                    {fileUrlQuery.data?.url ? (
                      <a className="mdc-btn mdc-btn--ghost mdc-btn--sm" href={fileUrlQuery.data.url} target="_blank" rel="noreferrer">
                        Abrir en nueva pestaña
                      </a>
                    ) : null}
                  </div>

                  {fileUrlQuery.isLoading ? (
                    <div className="mdc-extraction-skeleton">Preparando vista previa del PDF...</div>
                  ) : fileUrlQuery.error || !extractionSelection.documentId ? (
                    <div className="mdc-extraction-empty">
                      <strong>No fue posible cargar el PDF</strong>
                      <span>{!extractionSelection.documentId ? "El documento no incluye documentId." : toDetailDocError(fileUrlQuery.error, "No fue posible obtener la URL temporal.").message}</span>
                      {extractionSelection.documentId ? (
                        <button type="button" className="mdc-btn mdc-btn--ghost mdc-btn--sm" onClick={() => fileUrlQuery.refetch()}>Reintentar</button>
                      ) : null}
                    </div>
                  ) : fileUrlQuery.data?.url ? (
                    <iframe className="mdc-extraction-iframe" src={fileUrlQuery.data.url} title={extractionSelection.fileName} />
                  ) : null}
                </section>

                <section className="mdc-extraction-result">
                  <div className="mdc-extraction-result__head">
                    <div>
                      <span>Resultado del documento</span>
                      <strong>Datos extraídos y normalizados</strong>
                    </div>
                    {extractionIsAnalyzing ? (
                      <span className="mdc-badge mdc-badge--info">Analizando con Bedrock…</span>
                    ) : null}
                  </div>

                  {extractionIsAnalyzing ? (
                    <div className="mdc-extraction-skeleton">Analizando documento… Bedrock todavía está trabajando. No es necesario procesar manualmente.</div>
                  ) : extractionQuery.isLoading ? (
                    <div className="mdc-extraction-skeleton">Cargando extracción BDA...</div>
                  ) : extractionQuery.error ? (
                    <div className="mdc-document-error">
                      <strong>No fue posible cargar la extracción</strong>
                      <span>{toDetailDocError(extractionQuery.error, "No fue posible cargar la extracción.").message}</span>
                      <button type="button" className="mdc-btn mdc-btn--ghost mdc-btn--sm" onClick={() => extractionQuery.refetch()}>Reintentar</button>
                    </div>
                  ) : extractionData ? (
                    <div className="mdc-extraction-sections">
                      {documentActionFeedback ? <p className={`mdc-document-action-feedback mdc-document-action-feedback--${documentActionFeedback.type}`}>{documentActionFeedback.message}</p> : null}
                      {extractionManualDecision ? (
                        <section className={`mdc-manual-decision mdc-manual-decision--${extractionManualDecision === "APPROVED" ? "approved" : "rejected"}`}>
                          <div>
                            <span>Decisión del operador</span>
                            <strong>{extractionManualDecision === "APPROVED" ? "Aprobado manualmente" : "Rechazado manualmente"}</strong>
                          </div>
                          <dl>
                            <div><dt>Operador</dt><dd>{displayValue(extractionData.reviewedBy)}</dd></div>
                            <div><dt>Fecha</dt><dd>{formatExtractionDate(extractionData.reviewedAt)}</dd></div>
                            <div><dt>Motivo</dt><dd>{displayValue(extractionData.manualReason)}</dd></div>
                            <div><dt>Notas</dt><dd>{displayValue(extractionData.manualNotes)}</dd></div>
                          </dl>
                        </section>
                      ) : extractionRequiresManualReview ? (
                        <section className="mdc-manual-review-panel">
                          <div className="mdc-manual-review-panel__head">
                            <div>
                              <span>Revisión del operador</span>
                              <strong>Este documento requiere una decisión manual</strong>
                            </div>
                            <small>{reviewerEmail || "Operador no identificado"}</small>
                          </div>
                          <p>{displayValue(extractionData.validation?.message || extractionData.errorMessage || "Revisa los datos extraídos contra el documento original antes de tomar una decisión.")}</p>
                          <div className="mdc-manual-review-panel__actions">
                            <button type="button" className="mdc-btn mdc-btn--ghost" onClick={() => setManualReviewAction("REPROCESS")} disabled={reprocessAnalysisMutation.isPending || manualReviewMutation.isPending}>
                              Reprocesar análisis
                            </button>
                            <button type="button" className="mdc-btn mdc-btn--danger" onClick={() => startManualReview("REJECTED")} disabled={reprocessAnalysisMutation.isPending || manualReviewMutation.isPending}>
                              Rechazar
                            </button>
                            <button type="button" className="mdc-btn mdc-btn--primary" onClick={() => startManualReview("APPROVED")} disabled={reprocessAnalysisMutation.isPending || manualReviewMutation.isPending || !reviewerEmail}>
                              Aprobar manualmente
                            </button>
                          </div>

                          {manualReviewAction === "REPROCESS" ? (
                            <div className="mdc-manual-review-form">
                              <strong>Confirmar reprocesamiento</strong>
                              <p>Se creará una nueva invocación BDA para este mismo PDF y el análisis actual quedará como antecedente.</p>
                              <div className="mdc-manual-review-form__actions">
                                <button type="button" className="mdc-btn mdc-btn--ghost" onClick={() => setManualReviewAction(null)} disabled={reprocessAnalysisMutation.isPending}>Cancelar</button>
                                <button type="button" className="mdc-btn mdc-btn--primary" onClick={handleReprocessDocument} disabled={reprocessAnalysisMutation.isPending}>
                                  {reprocessAnalysisMutation.isPending ? "Reprocesando..." : "Confirmar reproceso"}
                                </button>
                              </div>
                            </div>
                          ) : manualReviewAction ? (
                            <div className="mdc-manual-review-form">
                              <strong>{manualReviewAction === "APPROVED" ? "Aprobar documento manualmente" : "Rechazar documento manualmente"}</strong>
                              <label>
                                <span>Motivo</span>
                                <input value={manualReviewReason} onChange={(event) => setManualReviewReason(event.target.value)} placeholder="Describe el motivo de la decisión" />
                              </label>
                              <label>
                                <span>Notas</span>
                                <textarea value={manualReviewNotes} onChange={(event) => setManualReviewNotes(event.target.value)} rows={2} placeholder="Información adicional para auditoría" />
                              </label>
                              <div className="mdc-manual-review-form__actions">
                                <button type="button" className="mdc-btn mdc-btn--ghost" onClick={() => setManualReviewAction(null)} disabled={manualReviewMutation.isPending}>Cancelar</button>
                                <button type="button" className={manualReviewAction === "APPROVED" ? "mdc-btn mdc-btn--primary" : "mdc-btn mdc-btn--danger"} onClick={handleManualReview} disabled={manualReviewMutation.isPending || !manualReviewReason.trim() || !reviewerEmail}>
                                  {manualReviewMutation.isPending ? "Guardando decisión..." : manualReviewAction === "APPROVED" ? "Confirmar aprobación" : "Confirmar rechazo"}
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </section>
                      ) : extractionData.errorMessage ? (
                        <div className="mdc-document-error">
                          <strong>{extractionData.errorMessage}</strong>
                          {extractionData.step ? <span>Paso: {extractionData.step}</span> : null}
                          {extractionData.detail ? <details><summary>Detalle técnico</summary><p>{extractionData.detail}</p></details> : null}
                        </div>
                      ) : null}

                      {extractionData.errorCode === "INVALID_DOCUMENT_TYPE" ? (
                        <div className="mdc-document-error">
                          <strong>Documento que no corresponde</strong>
                          <span>{extractionData.errorMessage || "El archivo analizado no es un documento válido para esta categoría."}</span>
                          <p>Este intento quedó registrado. El cupo quedó libre: vuelve a subir un documento válido.</p>
                        </div>
                      ) : extractionSelection.category === "extracto" ? (
                        <>
                          <BankStatementExtractionDetails data={extractionData} />

                          <details className="mdc-extraction-json">
                            <summary>JSON completo</summary>
                            <pre>{JSON.stringify(extractionData, null, 2)}</pre>
                          </details>
                        </>
                      ) : extractionSelection.category === "comprobante_domicilio" ? (
                        <ProofOfAddressExtractionDetails data={extractionData} />
                      ) : (
                        <>
                          <DocumentMatchPanel match={extractionData.documentMatch} />
                          <section className="mdc-extraction-card">
                            <div className="mdc-extraction-card__head"><h4>Datos requeridos para la solicitud</h4></div>
                            <dl className="mdc-extraction-data-grid mdc-extraction-required-grid">
                              <div>
                                <dt>Ficha / ID adicional</dt>
                                <dd>{displayValue(extractionData.extraction?.numero_empleado_ficha)}</dd>
                                <small>{extractionData.extraction?.numero_empleado_ficha ? "Extraído" : "No disponible"}</small>
                              </div>
                              <div>
                                <dt>RFC</dt>
                                <dd>{displayValue(extractionData.extraction?.rfc)}</dd>
                                <small>{extractionData.extraction?.rfc ? "Extraído" : "No disponible"}</small>
                              </div>
                            </dl>
                          </section>

                          <section className="mdc-extraction-card">
                            <div className="mdc-extraction-card__head"><h4>Datos del trabajador / pensionado</h4></div>
                            <dl className="mdc-extraction-data-grid">
                              <div className={documentMatchFieldClass(documentMatchField(extractionData.documentMatch, "nombre"))}>
                                <dt>Nombre completo</dt>
                                <dd>{displayValue(extractionData.extraction?.nombre_completo)}</dd>
                              </div>
                              <div className={documentMatchFieldClass(documentMatchField(extractionData.documentMatch, "curp"))}>
                                <dt>CURP</dt>
                                <dd>{displayValue(extractionData.extraction?.curp)}</dd>
                              </div>
                              <div><dt>Sexo</dt><dd>{displayValue(extractionData.extraction?.sexo)}</dd></div>
                              <div><dt>Emisor</dt><dd>{displayValue(extractionData.extraction?.nombre_emisor)}</dd></div>
                              <div><dt>Tipo de documento</dt><dd>{displayValue(extractionData.extraction?.tipo_documento)}</dd></div>
                              <div><dt>Periodo</dt><dd>{displayValue(extractionData.extraction?.periodo_pago)}</dd></div>
                              <div><dt>Fecha expedición</dt><dd>{displayValue(extractionData.extraction?.fecha_expedicion)}</dd></div>
                              <div><dt>Fecha de pago</dt><dd>{displayValue(extractionData.extraction?.fecha_pago_liquidacion)}</dd></div>
                              <div><dt>Número de recibo</dt><dd>{displayValue(extractionData.extraction?.numero_recibo)}</dd></div>
                              <div><dt>Centro de trabajo</dt><dd>{displayValue(extractionData.extraction?.centro_trabajo)}</dd></div>
                              <div><dt>Régimen laboral</dt><dd>{displayValue(extractionData.extraction?.regimen_laboral)}</dd></div>
                              <div><dt>Conducto de pago</dt><dd>{displayValue(extractionData.extraction?.conducto_pago)}</dd></div>
                            </dl>
                          </section>

                          <section className="mdc-extraction-card">
                            <div className="mdc-extraction-card__head"><h4>Resumen financiero</h4></div>
                            <div className="mdc-extraction-financial-grid">
                              <article><span>Percepciones</span><strong>{formatDocumentMoney(extractionData.extraction?.resumen_financiero?.total_percepciones)}</strong></article>
                              <article><span>Deducciones</span><strong>{formatDocumentMoney(extractionData.extraction?.resumen_financiero?.total_deducciones)}</strong></article>
                              <article><span>Neto a pagar</span><strong>{formatDocumentMoney(extractionData.extraction?.resumen_financiero?.neto_pagar)}</strong></article>
                              <article><span>ISR</span><strong>{formatDocumentMoney(extractionData.extraction?.resumen_financiero?.isr)}</strong></article>
                              <article><span>Ingresos gravables</span><strong>{formatDocumentMoney(extractionData.extraction?.resumen_financiero?.ingresos_gravables)}</strong></article>
                            </div>
                          </section>

                          <section className="mdc-extraction-card">
                            <div className="mdc-extraction-card__head"><h4>Movimientos de nómina</h4></div>
                            {extractionData.extraction?.movimientos_nomina?.length ? (
                              <div className="mdc-table-wrap">
                                <table className="mdc-table mdc-extraction-movements">
                                  <thead><tr><th>Clave</th><th>Concepto</th><th>Días</th><th>Percepciones</th><th>Deducciones</th><th>Saldo adeudo</th><th>Referencia</th></tr></thead>
                                  <tbody>
                                    {extractionData.extraction.movimientos_nomina.map((movement, index) => (
                                      <tr key={`${movement.clave || "movimiento"}-${index}`}>
                                        <td>{displayValue(movement.clave)}</td>
                                        <td>{displayValue(movement.concepto)}</td>
                                        <td>{displayValue(movement.dias)}</td>
                                        <td>{formatDocumentMoney(movement.percepciones)}</td>
                                        <td>{formatDocumentMoney(movement.deducciones)}</td>
                                        <td>{formatDocumentMoney(movement.saldo_adeudo)}</td>
                                        <td>{displayValue(movement.referencia)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : <p className="mdc-extraction-note">Sin movimientos detectados.</p>}
                          </section>

                          <details className="mdc-extraction-technical">
                            <summary>
                              <span>Detalles técnicos del análisis</span>
                              <span className={bdaStatusBadgeClass(extractionData.status)}>{displayValue(extractionData.status)}</span>
                            </summary>
                            <div className="mdc-extraction-technical__body">
                              <dl className="mdc-extraction-data-grid">
                                <div><dt>Procesado</dt><dd>{extractionData.processed ? "Sí" : "No"}</dd></div>
                                <div><dt>Estado de salida</dt><dd>{displayValue(extractionData.validation?.customOutputStatus)}</dd></div>
                                <div><dt>Tipo de documento</dt><dd>{displayValue(extractionData.documentType)}</dd></div>
                                <div><dt>Confianza</dt><dd>{formatConfidence(extractionData.confidence)}</dd></div>
                                <div><dt>Reason codes</dt><dd>{extractionData.validation?.reasonCodes?.length ? extractionData.validation.reasonCodes.join(", ") : "N/D"}</dd></div>
                                <div><dt>Error code</dt><dd>{displayValue(extractionData.errorCode)}</dd></div>
                                <div><dt>Fecha de procesamiento</dt><dd>{formatExtractionDate(extractionData.updatedAt)}</dd></div>
                                <div><dt>Mensaje</dt><dd>{displayValue(extractionData.errorMessage || extractionData.validation?.message)}</dd></div>
                              </dl>
                              {!extractionData.processed ? <p className="mdc-extraction-note">El análisis todavía no tiene extracción procesada.</p> : null}
                              <details className="mdc-extraction-json">
                                <summary>JSON completo</summary>
                                <pre>{JSON.stringify(extractionData, null, 2)}</pre>
                              </details>
                            </div>
                          </details>
                        </>
                      )}
                    </div>
                  ) : null}
                </section>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
function AlertModal({ message, type, onClose }: { message: string, type: "error" | "success", onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="mdc-modal-backdrop" style={{ zIndex: 9999 }}>
      <div className="mdc-modal" style={{ maxWidth: 400 }}>
        <header className="mdc-modal-head">
          <div>
            <p>{type === "error" ? "Atención" : "Listo"}</p>
            <h3>{type === "error" ? "Aviso" : "Notificación"}</h3>
          </div>
          <button className="mdc-icon-btn" onClick={onClose}>×</button>
        </header>
        <div style={{ padding: "20px", fontSize: "15px", color: type === "error" ? "#d32f2f" : "#2e7d32", textAlign: "center" }}>
          {message}
        </div>
        <footer className="mdc-modal-actions" style={{ justifyContent: "center" }}>
          <button className="mdc-btn mdc-btn--primary" onClick={onClose}>Aceptar</button>
        </footer>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({
  open,
  title = "Eliminar regla",
  ruleName,
  description,
  isLoading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title?: string;
  ruleName?: string;
  description?: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="mdc-modal-backdrop"
      style={{ zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        className="mdc-modal"
        style={{
          maxWidth: 440,
          width: "100%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mdc-modal-head">
          <div>
            <p>Confirmación</p>
            <h3>{title}</h3>
          </div>
          <button type="button" className="mdc-icon-btn" onClick={onClose} aria-label="Cerrar">×</button>
        </header>

        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "#fff1f2",
            border: "1px solid #ffe4e6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            color: "#e11d48",
          }}
        >
          <Trash2 style={{ width: "28px", height: "28px" }} />
        </div>

        <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.5", marginBottom: "24px", textAlign: "center" }}>
          {description || (
            <>
              ¿Estás seguro de que deseas eliminar la regla{" "}
              {ruleName ? <strong style={{ color: "#0f172a" }}>"{ruleName}"</strong> : "seleccionada"}?
              <br />
              Esta acción no se puede deshacer.
            </>
          )}
        </p>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button
            type="button"
            className="mdc-btn mdc-btn--ghost"
            style={{ flex: 1, padding: "10px 16px", fontSize: "14px", fontWeight: 500 }}
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="mdc-btn"
            style={{
              flex: 1,
              padding: "10px 16px",
              fontSize: "14px",
              fontWeight: 600,
              backgroundColor: "#e11d48",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.7 : 1,
            }}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RuleViewModal({
  open,
  policy,
  rule,
  productDetails,
  onClose,
  onRuleUpdated,
}: {
  open: boolean;
  policy?: { product: string; rules: CreditRuleRow[]; activeCount: number } | null;
  rule?: CreditRuleRow | null;
  productDetails?: any[];
  onClose: () => void;
  onRuleUpdated?: (ruleId: string, updates: Partial<CreditRuleRow>) => void;
}) {
  const baseRule = policy ? policy.rules[0] : rule;
  const initialConditions: any[] = (baseRule as any)?.conditions || [];
  const [editableConditions, setEditableConditions] = useState<any[]>(initialConditions);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setEditableConditions((baseRule as any)?.conditions || []);
    setSaveError("");
  }, [baseRule]);

  if (!open || (!policy && !rule)) return null;

  const productName = policy ? policy.product : ((rule as any)?.financialProduct || rule?.products?.[0] || "Producto");
  const selectedProductDetail = productDetails?.find(p => p.financialProduct === productName);
  const contractType = selectedProductDetail?.contractType || selectedProductDetail?.contract_type || "No definido";

  const conditions = editableConditions;
  const hasConditions = conditions.length > 0;
  const payrollCondition = conditions.find((condition) => condition.type === "payroll_minimum_net_after_deduction");
  const dtiCondition = conditions.find((condition) => condition.type === "payroll_average_dti");
  const bureauScoreCondition = conditions.find((condition) => condition.type === "credit_bureau_minimum_score");
  const editableCondition = payrollCondition || dtiCondition || bureauScoreCondition;

  const saveConditions = async () => {
    if (!baseRule?.id || !editableCondition) return;

    setIsSaving(true);
    setSaveError("");
    const patch = {
      value: String(
        payrollCondition?.deduction ??
        dtiCondition?.maximumAverageDti ??
        bureauScoreCondition?.minimumScore ??
        "",
      ),
      conditions,
    };

    try {
      const updated = await updateRule(baseRule.id, patch, getStoredOrganization()?.id);
      if (!updated) throw new Error("No fue posible actualizar la regla.");
      onRuleUpdated?.(baseRule.id, { ...patch, ...updated });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "No fue posible actualizar la regla.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mdc-modal-backdrop" style={{ zIndex: 9999 }} onClick={onClose}>
      <div className="mdc-modal mdc-modal--wide" style={{ maxWidth: "680px" }} onClick={(e) => e.stopPropagation()}>
        <header className="mdc-modal-head">
          <div>
            <p>Visualización de regla de crédito</p>
            <h3>{baseRule?.name || `Política - ${productName}`}</h3>
          </div>
          <button type="button" className="mdc-icon-btn" onClick={onClose}>×</button>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Producto Financiero</span>
            <strong style={{ display: "block", fontSize: "14px", color: "#0f172a", marginTop: "4px" }}>{productName}</strong>
          </div>
          <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Tipo de contrato</span>
            <strong style={{ display: "block", fontSize: "14px", color: "#0f172a", marginTop: "4px" }}>{contractType}</strong>
          </div>
          <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Estado</span>
            <div style={{ marginTop: "4px" }}>
              <span className={baseRule?.status === "inactive" ? "mdc-badge mdc-badge--neutral" : "mdc-badge mdc-badge--ok"}>
                {baseRule?.status === "inactive" ? "Inactiva" : "Activa"}
              </span>
            </div>
          </div>
          <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Severidad</span>
            <strong style={{ display: "block", fontSize: "14px", color: "#0f172a", marginTop: "4px" }}>
              {baseRule?.severity === "fail" ? "Rechazo" : baseRule?.severity === "warn" ? "Revisión" : "Aprobación"}
            </strong>
          </div>
        </div>

        {baseRule?.description && (
          <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Descripción</span>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#334155", lineHeight: "1.5" }}>{baseRule.description}</p>
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Condiciones y Parámetros ({hasConditions ? conditions.length : policy ? policy.rules.length : 1})
          </h4>

          {hasConditions ? (
            <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
              <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                  <tr>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>VARIABLE / CAMPO</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>OPERADOR</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>VALOR / UMBRAL</th>
                  </tr>
                </thead>
                <tbody>
                  {conditions.map((cond: any, idx: number) => {
                    const isPayrollNetCondition = cond.type === "payroll_minimum_net_after_deduction";
                    const isDtiCondition = cond.type === "payroll_average_dti";
                    const isBureauScoreCondition = cond.type === "credit_bureau_minimum_score";
                    const label = isPayrollNetCondition
                      ? "Neto mínimo de nóminas"
                      : isDtiCondition
                        ? "DTI promedio de nóminas"
                        : isBureauScoreCondition
                          ? "Score crediticio mínimo"
                      : FORM_CONFIG.find(c => (c.id || c.field) === cond.field)?.label || cond.field || cond.type;
                    const operator = isPayrollNetCondition
                      ? "Neto después de descuento"
                      : isDtiCondition
                        ? "DTI promedio máximo"
                        : isBureauScoreCondition
                          ? "Score Buró mínimo"
                      : RULE_OPERATOR_LABELS[cond.operator as RuleOperator] || cond.operator || "No definido";
                    const value = cond.value ?? "No definido";
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 600, color: "#1e293b" }}>{label}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center", color: "#475569" }}>
                          {operator}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: "#0f172a" }}>
                          {isPayrollNetCondition ? (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", textAlign: "left" }}>
                              <label>
                                <span style={{ display: "block", color: "#64748b", fontSize: "10px", marginBottom: "4px" }}>Nóminas</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={cond.requiredPayrolls ?? ""}
                                  onChange={(event) => setEditableConditions((current) => current.map((condition, conditionIndex) =>
                                    conditionIndex === idx ? { ...condition, requiredPayrolls: Number(event.target.value) } : condition,
                                  ))}
                                />
                              </label>
                              <label>
                                <span style={{ display: "block", color: "#64748b", fontSize: "10px", marginBottom: "4px" }}>Descuento</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={cond.deduction ?? ""}
                                  onChange={(event) => setEditableConditions((current) => current.map((condition, conditionIndex) =>
                                    conditionIndex === idx ? { ...condition, deduction: Number(event.target.value) } : condition,
                                  ))}
                                />
                              </label>
                            </div>
                          ) : isDtiCondition ? (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", textAlign: "left" }}>
                              <label>
                                <span style={{ display: "block", color: "#64748b", fontSize: "10px", marginBottom: "4px" }}>Nóminas</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={cond.requiredPayrolls ?? ""}
                                  onChange={(event) => setEditableConditions((current) => current.map((condition, conditionIndex) =>
                                    conditionIndex === idx ? { ...condition, requiredPayrolls: Number(event.target.value) } : condition,
                                  ))}
                                />
                              </label>
                              <label>
                                <span style={{ display: "block", color: "#64748b", fontSize: "10px", marginBottom: "4px" }}>DTI máximo (%)</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={cond.maximumAverageDti ?? ""}
                                  onChange={(event) => setEditableConditions((current) => current.map((condition, conditionIndex) =>
                                    conditionIndex === idx ? { ...condition, maximumAverageDti: Number(event.target.value) } : condition,
                                  ))}
                                />
                              </label>
                            </div>
                          ) : isBureauScoreCondition ? (
                            <label style={{ display: "block", textAlign: "left" }}>
                              <span style={{ display: "block", color: "#64748b", fontSize: "10px", marginBottom: "4px" }}>Score mínimo</span>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={cond.minimumScore ?? ""}
                                onChange={(event) => setEditableConditions((current) => current.map((condition, conditionIndex) =>
                                  conditionIndex === idx ? { ...condition, minimumScore: Number(event.target.value) } : condition,
                                ))}
                              />
                            </label>
                          ) : value}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : policy && policy.rules.length > 0 ? (
            <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
              <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                  <tr>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>NOMBRE DE REGLA</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>OPERADOR</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>VALOR</th>
                  </tr>
                </thead>
                <tbody>
                  {policy.rules.map((r, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "#1e293b" }}>{r.name}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: "#475569" }}>{renderRuleOperator(r)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: "#0f172a" }}>{renderRuleValue(r)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : rule ? (
            <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b" }}>Campo evaluado</span>
                <p style={{ margin: "2px 0 0", fontWeight: 600, color: "#0f172a" }}>{(rule as any).fieldEvaluated || rule.field}</p>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b" }}>Operador</span>
                <p style={{ margin: "2px 0 0", color: "#475569" }}>{renderRuleOperator(rule)}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "11px", color: "#64748b" }}>Valor umbral</span>
                <p style={{ margin: "2px 0 0", fontWeight: 600, color: "#0f172a" }}>{renderRuleValue(rule)}</p>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: "13px", color: "#94a3b8", textAlign: "center", padding: "16px" }}>Sin condiciones configuradas.</p>
          )}
        </div>

        <footer className="mdc-modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
          {saveError ? <span style={{ marginRight: "auto", alignSelf: "center", color: "#dc2626", fontSize: "12px" }}>{saveError}</span> : null}
          <button type="button" className="mdc-btn mdc-btn--primary" onClick={saveConditions} disabled={isSaving || !editableCondition}>
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>
          <button type="button" className="mdc-btn mdc-btn--ghost" onClick={onClose}>Cerrar</button>
        </footer>
      </div>
    </div>
  );
}

function buildPlazoOptions(product?: FinanceProductOption | null): number[] {
  const max = Math.max(1, Number(product?.dueDatesCount || product?.termMax || 12));
  const min = Math.max(1, Number(product?.termMin || 1));
  const steps = [3, 6, 9, 12, 18, 24, 30, 36, 48, 60, 72, 84, 96, 120, 180, 240];
  const options = steps.filter((value) => value >= min && value <= max);
  if (!options.includes(min)) options.unshift(min);
  if (!options.includes(max)) options.push(max);
  return Array.from(new Set(options)).sort((a, b) => a - b);
}

function estimateInstallmentAmount(
  principal: number,
  annualRatePct: number,
  plazo: number,
  frequency?: string,
): number {
  const n = Math.max(1, Math.floor(plazo || 1));
  const value = (frequency || "mensual").toLowerCase();
  const perYear = value.includes("seman")
    ? 52
    : value.includes("catorcen")
      ? 26
      : value.includes("quincen")
        ? 24
        : value.includes("anual")
          ? 1
          : 12;
  const rate = (Number(annualRatePct) || 0) / 100 / perYear;
  if (!principal || !Number.isFinite(principal)) return 0;
  if (rate === 0) return principal / n;
  return (principal * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
}

function frequencyLabel(frequency?: string): string {
  const value = (frequency || "mensual").toLowerCase();
  if (value.includes("seman")) return "semanas";
  if (value.includes("catorcen")) return "catorcenas";
  if (value.includes("quincen")) return "quincenas";
  if (value.includes("anual")) return "años";
  return "meses";
}

function AddApplicationModal({
  open,
  onClose,
  onCreate,
  mode,
  products,
}: {
  open: boolean;
  onClose: () => void;
  mode: MdcApplicantMode;
  products: readonly RuleProduct[];
  onCreate: (values: {
    identificationNumber: string;
    email: string;
    product: string;
    amount: number;
    plazo?: number;
    phone?: string;
    bank?: string;
    businessName?: string;
  }) => void | Promise<void>;
}) {
  const localProductOptions = useMemo<FinanceProductOption[]>(() => {
    const catalog = MDC_PRODUCTS_BY_MODE[mode] ?? [];
    const allowedProducts = new Set(products);
    return catalog
      .filter((item) => allowedProducts.size === 0 || allowedProducts.has(item.name as RuleProduct))
      .map((item) => ({
        financialProduct: item.name,
        minimumAmount: item.configuration.amount.min,
        maximumAmount: item.configuration.amount.max,
        dueDatesCount: item.configuration.term.max,
        termMin: item.configuration.term.min,
        termMax: item.configuration.term.max,
        creditRate: item.configuration.interestRate.min,
        paymentFrequency: item.configuration.term.frequency,
      }));
  }, [mode, products]);
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bank, setBank] = useState("");
  const [product, setProduct] = useState<string>(products[0] ?? NATURAL_CREDIT_PRODUCTS[0]);
  const [amount, setAmount] = useState("12000");
  const [plazo, setPlazo] = useState("12");
  const [apiProducts, setApiProducts] = useState<FinanceProductOption[]>(localProductOptions);
  const [alertMsg, setAlertMsg] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isMoral = mode === "moral";

  useEffect(() => {
    let cancelled = false;
    const apiBase = getMdcApiBaseUrl("");

    if (!apiBase) {
      setApiProducts(localProductOptions);
      return () => {
        cancelled = true;
      };
    }

    fetch(`${apiBase}/finance-products`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data: unknown) => {
        if (cancelled) return;
        const normalized = Array.isArray(data)
          ? data.flatMap((item) => {
              if (!item || typeof item !== "object") return [];
              const row = item as Record<string, unknown>;
              const name = String(row.financialProduct ?? row.financial_product ?? "");
              if (!name) return [];
              return [{
                financialProduct: name,
                minimumAmount: Number(row.minimumAmount ?? row.minimum_amount ?? 0) || undefined,
                maximumAmount: Number(row.maximumAmount ?? row.maximum_amount ?? 0) || undefined,
                dueDatesCount: Number(row.dueDatesCount ?? row.due_dates_count ?? 0) || undefined,
                creditRate: Number(row.creditRate ?? row.credit_rate ?? 0) || undefined,
                paymentFrequency: String(row.paymentFrequency ?? row.payment_frequency ?? "MENSUAL"),
              } satisfies FinanceProductOption];
            })
          : [];
        setApiProducts(normalized.length > 0 ? normalized : localProductOptions);
      })
      .catch(() => {
        if (!cancelled) {
          setApiProducts(localProductOptions);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [localProductOptions]);

  const displayProducts = apiProducts.length > 0 ? apiProducts.map((p) => p.financialProduct) : products;
  const selectedProduct = apiProducts.find((item) => item.financialProduct === product);
  const plazoOptions = useMemo(
    () => buildPlazoOptions(selectedProduct),
    [selectedProduct],
  );
  const estimatedInstallment = estimateInstallmentAmount(
    Number(amount) || 0,
    Number(selectedProduct?.creditRate || 0),
    Number(plazo) || 12,
    selectedProduct?.paymentFrequency,
  );

  const reset = () => {
    setIdentificationNumber("");
    setBusinessName("");
    setEmail("");
    setPhone("");
    setBank("");
    setProduct(displayProducts[0] ?? NATURAL_CREDIT_PRODUCTS[0]);
    setAmount("12000");
    setPlazo(String(buildPlazoOptions(apiProducts[0])[0] ?? 12));
    setSubmitting(false);
  };

  useEffect(() => {
    if (!displayProducts.includes(product)) {
      setProduct(displayProducts[0] ?? NATURAL_CREDIT_PRODUCTS[0]);
    }
  }, [displayProducts, product]);

  useEffect(() => {
    if (!plazoOptions.length) return;
    if (!plazoOptions.includes(Number(plazo))) {
      setPlazo(String(plazoOptions[plazoOptions.length - 1]));
    }
  }, [plazo, plazoOptions]);

  if (!open) return null;

  return (
    <>
      <div className="mdc-modal-backdrop" onClick={() => { reset(); onClose(); }}>
        <div className="mdc-modal" onClick={(e) => e.stopPropagation()}>
          <header className="mdc-modal-head">
            <div>
              <p>Nueva solicitud</p>
              <h3>Alta manual</h3>
            </div>
            <button type="button" className="mdc-icon-btn" onClick={() => { reset(); onClose(); }}>×</button>
          </header>
          <div className="mdc-form-grid">
            <label>
              <span>{isMoral ? "RFC *" : "ID (CURP) *"}</span>
              <input
                value={identificationNumber}
                onChange={(e) => setIdentificationNumber(e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase())}
                maxLength={isMoral ? 13 : 18}
                required
              />
            </label>
            {isMoral ? (
              <label>
                <span>Razón social *</span>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
              </label>
            ) : null}
            <label>
              <span>{isMoral ? "Correo corporativo *" : "Email *"}</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </label>
            {!isMoral ? (
              <label>
                <span>Teléfono (10 dígitos, sin +52)</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  type="tel"
                  inputMode="numeric"
                  placeholder="5512345678"
                />
              </label>
            ) : null}
            <label>
              <span>Banco</span>
              <input value={bank} onChange={(e) => setBank(e.target.value)} />
            </label>
            <label>
              <span>Producto *</span>
              <select value={product} onChange={(e) => setProduct(e.target.value)}>
                {displayProducts.map((p, i) => (
                  <option key={`${p}-${i}`} value={p}>{p}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Monto (MXN) *</span>
              <input
                value={amount}
                onChange={(e) => {
                  let val = e.target.value;
                  const maxAmt = apiProducts.find((p) => p.financialProduct === product)?.maximumAmount;
                  const maxLimit = maxAmt ? Number(maxAmt) : 9999999;
                  if (Number(val) > maxLimit) val = maxLimit.toString();
                  setAmount(val);
                }}
                type="number"
                min={apiProducts.find((p) => p.financialProduct === product)?.minimumAmount ? Number(apiProducts.find((p) => p.financialProduct === product)?.minimumAmount) : 0}
                max={apiProducts.find((p) => p.financialProduct === product)?.maximumAmount ? Number(apiProducts.find((p) => p.financialProduct === product)?.maximumAmount) : 9999999}
                step="0.01"
                required
              />
            </label>
            <label>
              <span>Plazo (cuotas) *</span>
              <select value={plazo} onChange={(e) => setPlazo(e.target.value)}>
                {plazoOptions.map((option) => (
                  <option key={option} value={option}>
                    {option} {frequencyLabel(selectedProduct?.paymentFrequency)}
                  </option>
                ))}
              </select>
            </label>
            <p className="mdc-form-hint mdc-form-grid__full">
              Tasa del producto {Number(selectedProduct?.creditRate || 0).toFixed(2)}% · cuota estimada ${Number(estimatedInstallment || 0).toLocaleString("es-MX", { maximumFractionDigits: 2 })} MXN
            </p>
          </div>
          <footer className="mdc-modal-actions">
            <button type="button" className="mdc-btn mdc-btn--ghost" onClick={() => { reset(); onClose(); }}>Cancelar</button>
            <button
              type="button"
              className="mdc-btn mdc-btn--primary"
              disabled={submitting}
              onClick={async () => {
                if (!identificationNumber.trim() || !email.trim() || !product) {
                  setAlertMsg({ message: "Completa identificación, email y producto.", type: "error" });
                  return;
                }
                if (isMoral && !businessName.trim()) {
                  setAlertMsg({ message: "La razón social es obligatoria para persona moral.", type: "error" });
                  return;
                }
                if (!email.includes("@")) {
                  setAlertMsg({ message: "Correo inválido", type: "error" });
                  return;
                }
                const amountNum = Number(amount);
                if (!Number.isFinite(amountNum) || amountNum <= 0) {
                  setAlertMsg({ message: "El monto (amount) es obligatorio y debe ser mayor a 0.", type: "error" });
                  return;
                }
                const minAmt = apiProducts.find((p) => p.financialProduct === product)?.minimumAmount;
                const minLimit = minAmt ? Number(minAmt) : 0;
                if (amountNum < minLimit) {
                  setAlertMsg({ message: `El monto mínimo para este producto es de ${minLimit} MXN`, type: "error" });
                  return;
                }
                if (!isMoral && phone && phone.length > 0 && phone.length !== 10) {
                  setAlertMsg({ message: "El teléfono debe tener 10 dígitos (sin +52).", type: "error" });
                  return;
                }
                setSubmitting(true);
                try {
                  await onCreate({
                    identificationNumber: identificationNumber.trim().toUpperCase(),
                    email: email.trim(),
                    product,
                    amount: amountNum,
                    plazo: Number(plazo) || undefined,
                    phone: !isMoral && phone ? phone : undefined,
                    bank: bank.trim() || undefined,
                    businessName: isMoral ? businessName.trim() : undefined,
                  });
                  reset();
                  onClose();
                } catch {
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? "Creando…" : "Crear solicitud"}
            </button>
          </footer>
        </div>
      </div>
      {alertMsg ? <AlertModal message={alertMsg.message} type={alertMsg.type} onClose={() => setAlertMsg(null)} /> : null}
    </>
  );
}

function UploadModal({ app, onClose, onSuccess, onError }: { app: Application, onClose: () => void, onSuccess: (msg: string) => void, onError: (msg: string) => void }) {
  const resolvedUserId = app.userId && app.userId !== "N/A" ? app.userId : null;

  return (
    <FinancialDocumentUploader
      userId={resolvedUserId}
      financeRequestId={app.id}
      onClose={() => {
        onClose();
      }}
    />
  );
}

const FORM_CONFIG = [
  { id: "tipoEmpleo", type: "string", label: "Tipo de empleo", field: "applicant.employmentType" },
  { id: "edad", type: "number", label: "Edad al termino del contrato", field: "applicant.ageAtTerm" },
  { id: "plazo", type: "number", label: "Plazo solicitado", field: "loan.requestedTerm" },
  { id: "montoCredito", type: "number", label: "Monto solicitado", field: "loan.requestedAmount" },
  { id: "capacidadPago", type: "number", label: "Liquido restante (Resguardo)", field: "income.remainingLiquid" }
];

export function RuleModal({
  open,
  onClose,
  initial,
  availableFields,
  isEditing,
  products,
  productDetails,
  onSave,
  onDelete,
  initialBulkRules,
  layout = "modal",
}: {
  open: boolean;
  onClose: () => void;
  initial: RuleFormState;
  availableFields: { value: string; label: string }[];
  isEditing: boolean;
  products: readonly RuleProduct[];
  productDetails?: any[];
  initialBulkRules?: CreditRuleRow[];
  onSave: (form: RuleFormState, duplicateToProduct?: RuleProduct) => void;
  onDelete?: () => void;
  layout?: "modal" | "page";
}) {
  const isDemoOrg = getStoredOrganization()?.id === "demo-bypass-org";
  const [form, setForm] = useState<RuleFormState>(() => initial);
  const [serverConditions, setServerConditions] = useState<any[]>(() =>
    (initialBulkRules?.[0]?.conditions || []).filter((condition: any) => condition?.type && !condition.field),
  );

  const selectedProductDetail = productDetails?.find(p => p.financialProduct === form.product);
  const contractType = selectedProductDetail?.contractType || selectedProductDetail?.contract_type || "No definido";

  const dynamicFormConfig = useMemo(() => {
    if (selectedProductDetail) {
      const raw = selectedProductDetail.form_config || selectedProductDetail.formConfig;
      if (typeof raw === "string") {
        try { return JSON.parse(raw); } catch (e) { console.error("Error parsing form_config", e); }
      } else if (Array.isArray(raw)) {
        return raw;
      }
    }
    return FORM_CONFIG;
  }, [selectedProductDetail]);

  // State for bulk fields
  const [bulkFields, setBulkFields] = useState<Record<string, { enabled: boolean, operator: RuleOperator, value: string, type: RuleDataType }>>(() => {
    const initialBulk: any = {};
    dynamicFormConfig.forEach((c: any) => {
      const fieldKey = c.id || c.field;

      let existingRule: any;
      if (!isDemoOrg && initialBulkRules?.length) {
        existingRule = initialBulkRules[0].conditions?.find((cond: any) => cond.field === fieldKey);
      } else {
        existingRule = initialBulkRules?.find(r => r.fieldEvaluated === fieldKey);
      }

      if (existingRule) {
        const val = existingRule.value !== undefined ? existingRule.value : existingRule.thresholdValue;
        const op = existingRule.operator === "eq" ? "equals" : existingRule.operator;
        initialBulk[fieldKey] = { enabled: true, operator: op || (c.type === "number" ? "gte" : "equals"), value: val || "", type: c.type as RuleDataType };
      } else if (!initialBulkRules || initialBulkRules.length === 0) {
        if (initial.field === fieldKey) {
          initialBulk[fieldKey] = { enabled: true, operator: initial.operator || (c.type === "number" ? "gte" : "equals"), value: initial.value || "", type: c.type as RuleDataType };
        } else {
          initialBulk[fieldKey] = { enabled: false, operator: c.type === "number" ? "gte" : "equals", value: "", type: c.type as RuleDataType };
        }
      } else {
        initialBulk[fieldKey] = { enabled: false, operator: c.type === "number" ? "gte" : "equals", value: "", type: c.type as RuleDataType };
      }
    });
    return initialBulk;
  });

  useEffect(() => {
    const newBulk: any = {};
    dynamicFormConfig.forEach((c: any) => {
      const fieldKey = c.id || c.field;

      let existingRule: any;
      if (!isDemoOrg && initialBulkRules?.length) {
        existingRule = initialBulkRules[0].conditions?.find((cond: any) => cond.field === fieldKey);
      } else {
        existingRule = initialBulkRules?.find(r => r.fieldEvaluated === fieldKey);
      }

      if (existingRule) {
        const val = existingRule.value !== undefined ? existingRule.value : existingRule.thresholdValue;
        const op = existingRule.operator === "eq" ? "equals" : existingRule.operator;
        newBulk[fieldKey] = { enabled: true, operator: op || (c.type === "number" ? "gte" : "equals"), value: val || "", type: c.type as RuleDataType };
      } else {
        newBulk[fieldKey] = { enabled: false, operator: c.type === "number" ? "gte" : "equals", value: "", type: c.type as RuleDataType };
      }
    });
    setBulkFields(newBulk);
  }, [dynamicFormConfig, initialBulkRules, isDemoOrg]);
  useEffect(() => {
    setServerConditions((initialBulkRules?.[0]?.conditions || []).filter((condition: any) => condition?.type && !condition.field));
  }, [initialBulkRules]);
  const [duplicateToProduct, setDuplicateToProduct] = useState<"" | RuleProduct>("");
  const duplicateOptions = products.filter(
    (product) => product !== form.product && (PRODUCT_RULE_FIELDS[product] || FALLBACK_RULE_FIELDS).includes(form.field),
  ) as RuleProduct[];
  const isBandMode = form.evaluationMode === "bands";
  const payrollNetCondition = serverConditions.find((condition) => condition.type === "payroll_minimum_net_after_deduction");

  if (!open) return null;

  const formBody = (
    <>
        <div className="mdc-form-grid">
          <label>
            <span>Nombre</span>
            <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
          </label>
          <label>
            <span>Producto activo</span>
            <input value={form.product || "Sin producto"} disabled style={{ backgroundColor: '#f1f5f9', color: '#334155', fontWeight: 600, cursor: 'not-allowed' }} />
          </label>
          <label>
            <span>Tipo de credito / contrato</span>
            <input value={contractType} disabled style={{ backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }} />
          </label>
          {isEditing && (
            <label>
              <span>Copiar regla a</span>
              <select value={duplicateToProduct} onChange={(e) => setDuplicateToProduct(e.target.value as "" | RuleProduct)}>
                <option value="">No copiar</option>
                {duplicateOptions.map((product) => (
                  <option key={product} value={product}>{product}</option>
                ))}
              </select>
            </label>
          )}

          {isDemoOrg ? (
            <>
              <label>
                <span>Campo</span>
                <select
                  value={form.field}
                  onChange={(e) => {
                    const newField = e.target.value;
                    setForm((s) => {
                      const isStringField = ["applicant.employmentType", "company.taxComplianceStatus"].includes(newField);
                      const isBooleanField = ["payroll.directDeposit"].includes(newField);

                      let newType = s.type;
                      let newOperator = s.operator;

                      if (isStringField) {
                        newType = "string";
                        if (!["equals", "notEquals", "contains"].includes(newOperator)) {
                          newOperator = "equals";
                        }
                      } else if (isBooleanField) {
                        newType = "boolean";
                        if (!["equals", "notEquals"].includes(newOperator)) {
                          newOperator = "equals";
                        }
                      } else {
                        newType = "number";
                        if (newField === "loan.requestedAmount") {
                          newOperator = "between";
                        } else if (newField === "loan.requestedTerm" || newField === "applicant.ageAtTerm") {
                          newOperator = "lte";
                        } else if (newField === "income.remainingLiquid") {
                          newOperator = "gte";
                        } else if (["string", "boolean"].includes(s.type)) {
                          newOperator = "gte";
                        }
                      }

                      return {
                        ...s,
                        field: newField,
                        type: newType,
                        operator: newOperator,
                      };
                    });
                  }}
                >
                  <option value="">Selecciona variable</option>
                  {availableFields.map((field) => (
                    <option key={field.value} value={field.value}>{field.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Modo de evaluacion</span>
                <select
                  value={form.evaluationMode}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      evaluationMode: e.target.value as "single" | "bands",
                    }))
                  }
                >
                  <option value="single">Umbral unico</option>
                  <option value="bands">Por bandas</option>
                </select>
              </label>
              {isBandMode ? (
                <>
                  <label>
                    <span>Aprobacion desde</span>
                    <input value={form.approveMin} onChange={(e) => setForm((s) => ({ ...s, approveMin: e.target.value }))} type="number" step="0.01" />
                  </label>
                  <label>
                    <span>Aprobacion hasta</span>
                    <input value={form.approveMax} onChange={(e) => setForm((s) => ({ ...s, approveMax: e.target.value }))} type="number" step="0.01" />
                  </label>
                  <label>
                    <span>Revision desde</span>
                    <input value={form.reviewMin} onChange={(e) => setForm((s) => ({ ...s, reviewMin: e.target.value }))} type="number" step="0.01" />
                  </label>
                  <label>
                    <span>Revision hasta</span>
                    <input value={form.reviewMax} onChange={(e) => setForm((s) => ({ ...s, reviewMax: e.target.value }))} type="number" step="0.01" />
                  </label>
                  <label>
                    <span>Rechazo desde</span>
                    <input value={form.rejectMin} onChange={(e) => setForm((s) => ({ ...s, rejectMin: e.target.value }))} type="number" step="0.01" />
                  </label>
                  <label>
                    <span>Rechazo hasta</span>
                    <input value={form.rejectMax} onChange={(e) => setForm((s) => ({ ...s, rejectMax: e.target.value }))} type="number" step="0.01" />
                  </label>
                </>
              ) : (
                <>
                  <label>
                    <span>Operador</span>
                    <select value={form.operator} onChange={(e) => setForm((s) => ({ ...s, operator: e.target.value as RuleOperator }))}>
                      {RULE_OPERATORS.map((operator) => (
                        <option key={operator} value={operator}>{RULE_OPERATOR_LABELS[operator]}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Valor</span>
                    {form.field === "applicant.employmentType" ? (
                      <select value={form.value} onChange={(e) => setForm((s) => ({ ...s, value: e.target.value }))}>
                        <option value="">Seleccione una opcion...</option>
                        <option value="Jubilado Sindicalizado">Jubilado Sindicalizado</option>
                        <option value="Jubilado Confianza">Jubilado Confianza</option>
                      </select>
                    ) : form.type === "number" ? (
                      <input type="number" min="0" step="any" value={form.value} onChange={(e) => setForm((s) => ({ ...s, value: e.target.value }))} placeholder="Ingrese un numero" />
                    ) : (
                      <input type="text" value={form.value} onChange={(e) => setForm((s) => ({ ...s, value: e.target.value }))} placeholder="Ingrese un valor" />
                    )}
                  </label>
                </>
              )}
            </>
          ) : (
            dynamicFormConfig.map((config: any) => {
              const fieldKey = config.id || config.field;
              const state = bulkFields[fieldKey];
              if (!state) return null;

              return (
                <div
                  key={fieldKey}
                  className="mdc-form-grid__full"
                  style={{
                    border: state.enabled ? "1.5px solid var(--mdc-primary, #2563eb)" : "1.5px solid #e2e8f0",
                    borderRadius: "10px",
                    background: state.enabled ? "linear-gradient(135deg, #eff6ff 0%, #f8faff 100%)" : "#f8fafc",
                    transition: "all 0.2s ease",
                    overflow: "hidden",
                    marginBottom: "2px",
                  }}
                >
                  {/* Header row: toggle button + label */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 16px",
                      cursor: "pointer",
                    }}
                    onClick={() => setBulkFields(prev => ({ ...prev, [fieldKey]: { ...prev[fieldKey], enabled: !prev[fieldKey].enabled } }))}
                  >
                    {/* Toggle pill */}
                    <div
                      style={{
                        width: "40px",
                        height: "22px",
                        borderRadius: "11px",
                        background: state.enabled ? "var(--mdc-primary, #2563eb)" : "#cbd5e1",
                        position: "relative",
                        transition: "background 0.2s ease",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          background: "#fff",
                          position: "absolute",
                          top: "3px",
                          left: state.enabled ? "21px" : "3px",
                          transition: "left 0.2s ease",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: state.enabled ? "var(--mdc-primary, #2563eb)" : "#64748b",
                        transition: "color 0.2s ease",
                      }}
                    >
                      {config.label}
                    </span>
                    {state.enabled && (
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          background: "var(--mdc-primary, #2563eb)",
                          color: "#fff",
                          borderRadius: "20px",
                          padding: "2px 10px",
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                        }}
                      >
                        Habilitado
                      </span>
                    )}
                  </div>

                  {/* Expanded inputs when enabled */}
                  {state.enabled && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px",
                        padding: "0 16px 16px 16px",
                        borderTop: "1px solid #dbeafe",
                      }}
                    >
                      <label>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Operador</span>
                        <select
                          value={state.operator}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setBulkFields(prev => ({ ...prev, [fieldKey]: { ...prev[fieldKey], operator: e.target.value as RuleOperator } }))}
                        >
                          {(config.type === "number" ? RULE_OPERATORS : ["equals", "notEquals"] as RuleOperator[]).map((op) => (
                            <option key={op} value={op}>{RULE_OPERATOR_LABELS[op]}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Valor</span>
                        {config.type === "number" ? (
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={state.value}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setBulkFields(prev => ({ ...prev, [fieldKey]: { ...prev[fieldKey], value: e.target.value } }))}
                            placeholder="Ingrese un número"
                          />
                        ) : (
                          <select
                            value={state.value}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setBulkFields(prev => ({ ...prev, [fieldKey]: { ...prev[fieldKey], value: e.target.value } }))}
                          >
                            <option value="">Seleccione...</option>
                            {config.options ? config.options.map((opt: string) => (
                              <option key={opt} value={opt}>{opt}</option>
                            )) : (
                              <>
                                <option value="Jubilado Sindicalizado">Jubilado Sindicalizado</option>
                                <option value="Jubilado Confianza">Jubilado Confianza</option>
                              </>
                            )}
                          </select>
                        )}
                      </label>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {!isDemoOrg && payrollNetCondition ? (
            <div className="mdc-form-grid__full" style={{ border: "1.5px solid var(--mdc-primary, #2563eb)", borderRadius: "10px", background: "#f8faff", padding: "16px" }}>
              <strong style={{ display: "block", color: "#1e293b", marginBottom: "12px" }}>Neto mínimo de nóminas</strong>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label>
                  <span>Nóminas requeridas</span>
                  <input
                    type="number"
                    min="1"
                    value={payrollNetCondition.requiredPayrolls ?? ""}
                    onChange={(e) => setServerConditions((current) => current.map((condition) =>
                      condition.type === "payroll_minimum_net_after_deduction"
                        ? { ...condition, requiredPayrolls: Number(e.target.value) }
                        : condition,
                    ))}
                  />
                </label>
                <label>
                  <span>Descuento</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={payrollNetCondition.deduction ?? ""}
                    onChange={(e) => {
                      const deduction = Number(e.target.value);
                      setForm((current) => ({ ...current, value: e.target.value }));
                      setServerConditions((current) => current.map((condition) =>
                        condition.type === "payroll_minimum_net_after_deduction"
                          ? { ...condition, deduction }
                          : condition,
                      ));
                    }}
                  />
                </label>
              </div>
            </div>
          ) : null}

          {isBandMode ? (
            <label>
              <span>Severidad base</span>
              <input value="Definida por bandas" disabled />
            </label>
          ) : (
            <label>
              <span>Severidad</span>
              <select value={form.severity} onChange={(e) => setForm((s) => ({ ...s, severity: e.target.value as RuleSeverity }))}>
                {RULE_SEVERITIES.map((severity) => (
                  <option key={severity} value={severity}>{RULE_SEVERITY_LABELS[severity]}</option>
                ))}
              </select>
            </label>
          )}
          <label className="mdc-form-grid__full">
            <span>Descripcion</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            />
          </label>
          <label>
            <span>Estado</span>
            <select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as "active" | "inactive" }))}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </label>
        </div>
        <footer className="mdc-modal-actions" style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px" }}>
          <button type="button" className="mdc-btn mdc-btn--ghost" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="mdc-btn mdc-btn--primary"
              onClick={() => {
                if (isDemoOrg) {
                  onSave(form, duplicateToProduct || undefined);
                  onClose();
                  return;
                }

                const conditions: any[] = [...serverConditions];
                Object.entries(bulkFields).forEach(([fieldId, state]) => {
                  if (state.enabled && state.value !== "") {
                    const config = dynamicFormConfig.find((c: any) => (c.id || c.field) === fieldId);
                    conditions.push({
                      field: fieldId,
                      operator: state.operator === "equals" ? "eq" : state.operator,
                      value: state.value,
                      dataType: state.type,
                    });
                  }
                });

                onSave({
                  ...form,
                  conditions,
                }, duplicateToProduct || undefined);

                onClose();
              }}
            >
              {isEditing ? "Actualizar" : "Guardar"}
            </button>
        </footer>
    </>
  );

  if (layout === "page") {
    return formBody;
  }

  return (
    <div className="mdc-modal-backdrop" onClick={onClose}>
      <div className="mdc-modal" onClick={(e) => e.stopPropagation()}>
        <header className="mdc-modal-head">
          <div>
            <p>Regla de credito</p>
            <h3>{isEditing ? "Editar regla" : "Nueva regla"}</h3>
          </div>
          <button type="button" className="mdc-icon-btn" onClick={onClose}>×</button>
        </header>
        {formBody}
      </div>
    </div>
  );
}

type MdcScreenVariant = "full" | "panel" | "config";

export function MdcScreen({ variant = "full" }: { variant?: MdcScreenVariant }) {
  const lockedTab: MdcTab | null = variant === "panel" ? "overview" : variant === "config" ? "configuration" : null;
  const [globalAlert, setGlobalAlert] = useState<{ message: string, type: "error" | "success" } | null>(null);
  const [kycPrompt, setKycPrompt] = useState<{ requestId: string; webviewUrl: string; expiresAt?: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const creditStore = useCreditDemoStore();
  const [applicantMode, setApplicantMode] = useState<MdcApplicantMode>("natural");
  const [activeTab, setActiveTabState] = useState<MdcTab>(lockedTab ?? "overview");
  const syncMdcQuery = (tab: MdcTab, mode: MdcApplicantMode) => {
    if (lockedTab || variant !== "full") return;
    const params = new URLSearchParams();
    params.set("tab", tab);
    params.set("mode", mode);
    const section = searchParams.get("section");
    if (tab === "configuration" && section) {
      params.set("section", section);
    }
    router.replace(`/mdc?${params.toString()}`, { scroll: false });
  };
  const setActiveTab = (tab: MdcTab) => {
    if (lockedTab) return;
    setActiveTabState(tab);
    syncMdcQuery(tab, applicantMode);
  };
  const setApplicantModeAndQuery = (mode: MdcApplicantMode) => {
    setApplicantMode(mode);
    if (!lockedTab) syncMdcQuery(activeTab, mode);
  };

  useEffect(() => {
    if (lockedTab) return;
    const tab = searchParams.get("tab") as MdcTab | null;
    const mode = searchParams.get("mode") as MdcApplicantMode | null;
    if (tab && (TABS.some((item) => item.id === tab) || tab === "configuration")) {
      setActiveTabState(tab);
    }
    if (mode === "natural" || mode === "moral") {
      setApplicantMode(mode);
    }
    // Solo hidratar desde la URL al montar / cuando vuelve de otra ruta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const [activeProducts, setActiveProducts] = useState<readonly RuleProduct[]>(() => {
    return [] as readonly RuleProduct[];
  });
  const [productDetails, setProductDetails] = useState<any[]>([]);

  useEffect(() => {
    const org = getStoredOrganization();
    const orgId = org?.id || "ORG-001";
    if (orgId === "demo-bypass-org") {
      const demoProducts = CREDIT_PRODUCTS_BY_MODE[applicantMode] as readonly RuleProduct[];
      setActiveProducts(demoProducts);
      setProductDetails(demoProducts.map((financialProduct) => ({ financialProduct, contractType: "N/A" })));
      return;
    }

    fetchFinanceProducts(orgId)
      .then(data => {
        console.log("[MDC][products] screen catalog", {
          orgId,
          applicantMode,
          count: Array.isArray(data) ? data.length : 0,
          data,
        });
        if (Array.isArray(data) && data.length > 0) {
          setProductDetails(data);
          setActiveProducts(data.map(d => d.financialProduct) as readonly RuleProduct[]);
        } else {
          setProductDetails([]);
          setActiveProducts([] as readonly RuleProduct[]);
        }
      })
      .catch(err => {
        console.error("[MDC][products] Error fetching rules products", err);
        setProductDetails([]);
        setActiveProducts([] as readonly RuleProduct[]);
      });
  }, [applicantMode]);

  const activeStorageKeys = MODE_STORAGE_KEYS[applicantMode];
  const defaultApplications = useMemo(() => APPLICATIONS_BY_MODE[applicantMode], [applicantMode]);
  const defaultRules = useMemo(() => CREDIT_RULES_BY_MODE[applicantMode], [applicantMode]);
  const [apps, setApps] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [rules, setRules] = useState<CreditRuleRow[]>(() => {
    const orgId = getStoredOrganization()?.id;
    if (orgId !== "demo-bypass-org") return [];
    return mergeRulesWithDefaults(
      readStoredJson<CreditRuleRow[]>(MODE_STORAGE_KEYS.natural.rules, []),
      CREDIT_PRODUCTS_BY_MODE.natural as readonly RuleProduct[],
      CREDIT_RULES_BY_MODE.natural,
    );
  });

  const [showAddApplication, setShowAddApplication] = useState(false);
  const [detailApp, setDetailApp] = useState<Application | null>(null);
  const [flowApp, setFlowApp] = useState<Application | null>(null);
  const [uploadApp, setUploadApp] = useState<Application | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [productFilter, setProductFilter] = useState<string | "all">("all");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");
  const [page, setPage] = useState(0);
  const [traceabilityPage, setTraceabilityPage] = useState(0);

  const [ruleQuery, setRuleQuery] = useState("");
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleModalState, setRuleModalState] = useState<RuleFormState>(defaultRuleForm(CREDIT_PRODUCTS_BY_MODE.natural as readonly RuleProduct[]));
  const [ruleProductFilter, setRuleProductFilter] = useState<RuleProduct>((CREDIT_PRODUCTS_BY_MODE.natural[0] ?? NATURAL_CREDIT_PRODUCTS[0]) as RuleProduct);
  const [rangeFilter, setRangeFilter] = useState<RangePreset>("7d");
  const productNamesById = useMemo(() => {
    return new Map(
      productDetails
        .filter((product) => typeof product?.id === "string" && typeof product?.financialProduct === "string")
        .map((product) => [product.id, product.financialProduct]),
    );
  }, [productDetails]);
  const normalizedRules = useMemo(() => {
    return rules.map(rule => {
      let productReferences: string[] = [];
      let finProd = "Credito simple";
      const toProductReference = (product: unknown): string | null => {
        if (typeof product === "string" || typeof product === "number") return String(product);
        if (!product || typeof product !== "object") return null;
        const record = product as Record<string, unknown>;
        const reference = record.id ?? record.productId ?? record.financialProductId ?? record.financialProduct ?? record.name;
        return typeof reference === "string" || typeof reference === "number" ? String(reference) : null;
      };
      const singleProduct = (rule as any).product ?? (rule as any).productId ?? (rule as any).financialProductId;

      if (singleProduct != null) {
        const reference = toProductReference(singleProduct);
        productReferences = reference ? [reference] : [];
      } else if (Array.isArray(rule.products) && rule.products.length > 0) {
        productReferences = rule.products.map(toProductReference).filter((reference): reference is string => Boolean(reference));
      } else if (typeof rule.products === "string") {
        try {
          const parsed = JSON.parse(rule.products);
          productReferences = Array.isArray(parsed)
            ? parsed.map(toProductReference).filter((reference): reference is string => Boolean(reference))
            : [toProductReference(parsed) || rule.products];
        } catch {
          productReferences = [rule.products];
        }
      }
      const products = productReferences.map((reference) => productNamesById.get(reference) ?? reference);
      finProd = products[0] ?? finProd;

      return {
        ...rule,
        products: products as RuleProduct[],
        financialProduct: finProd,
        fieldEvaluated: rule.field || "custom.field",
        operator: rule.operator || "gte",
        thresholdValue: rule.value || "0"
      };
    });
  }, [rules, productNamesById]);

  const isDemoOrg = getStoredOrganization()?.id === "demo-bypass-org";

  const filteredLegacyRules = useMemo(() => {
    const q = ruleQuery.trim().toLowerCase();
    let scopedRules = normalizedRules;
    if (ruleProductFilter && ruleProductFilter !== "all") {
      scopedRules = scopedRules.filter((rule) => rule.financialProduct === ruleProductFilter || rule.products.includes(ruleProductFilter));
    }
    if (!q) return scopedRules;
    return scopedRules.filter((r) => `${r.name} ${r.fieldEvaluated} ${r.description}`.toLowerCase().includes(q));
  }, [normalizedRules, ruleProductFilter, ruleQuery]);

  const policiesByProduct = useMemo(() => {
    const map = new Map<string, CreditRuleRow[]>();
    if (isDemoOrg) {
      activeProducts.forEach(p => map.set(p, []));
    }
    normalizedRules.forEach(r => {
      const ruleProducts = r.products.length > 0 ? r.products : [r.financialProduct];
      ruleProducts.forEach((product) => {
        if (!map.has(product)) map.set(product, []);
        map.get(product)!.push(r);
      });
    });
    return Array.from(map.entries()).map(([product, productRules]) => ({
      product,
      rules: productRules,
      activeCount: productRules.filter(r => r.status === 'active').length,
    }));
  }, [normalizedRules, activeProducts, isDemoOrg]);

  const filteredPolicies = policiesByProduct.filter((policy) => {
    if (ruleProductFilter && ruleProductFilter !== "all" && policy.product !== ruleProductFilter) return false;

    if (ruleQuery) {
      const q = ruleQuery.toLowerCase();
      if (policy.product.toLowerCase().includes(q)) return true;
      return policy.rules.some(r =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  useEffect(() => {
    seedScotiaCreditStorage();
  }, []);

  useEffect(() => {
    const fetchRequests = async () => {
      setAppsLoading(true);
      try {
        const baseUrl = getMdcApiBaseUrl("http://localhost:3000");
        const currentOrg = getStoredOrganization();
        const orgId = currentOrg?.id || "ORG-001";

        if (orgId === "demo-bypass-org") {
          setApps(APPLICATIONS_BY_MODE[applicantMode]);
          setAppsLoading(false);
          return;
        }

        const data = await fetchFinanceRequests(orgId, applicantMode);
        const mapped: Application[] = data.map((item: any) => ({
          id: item.id,
          appNo: `APP-${item.id.split("-")[0].toUpperCase()}`,
          userId: item.user?.id || null,
          applicantId: item.user?.id || item.identificationNumber || item.applicantId || 'N/A',
          applicantName: resolveApplicantDisplayName(item),
          applicantEmail: item.email || 'N/A',
          product: item.product || 'N/A',
          requestedAmount: Number(item.amount) || 0,
          currency: 'MXN',
          status: item.status === "Aprobada" || item.status === "Aprobado" ? "approved" :
            item.status === "Rechazada" || item.status === "Rechazado" ? "declined" :
              item.status === "Revision manual" || item.status === "Revision" ? "manualReview" :
                item.status === "Override" ? "overridden" : "pending",
          risk: item.riskLevel === "Bajo" ? "low" :
            item.riskLevel === "Alto" ? "high" : "medium",
          riskScore: item.riskScore || 50,
          submittedAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
          kycSessionId: item.kycSessionId || item.kyc_session_id || null,
          kycWebviewUrl: item.kycWebviewUrl || item.kyc_webview_url || null,
          zelifyUserId: item.zelifyUserId || item.zelify_user_id || null,
          rawPayload: {
            product: item.product,
            personType: item.personType || applicantMode,
            orgId: item.orgId || orgId,
            identificationNumber: item.identificationNumber || item.applicantId || item.id,
            firstName: item.firstName || "",
            lastName: item.lastName || "",
            businessName: item.businessName || "",
            email: item.email,
            phone: item.phone,
            bank: item.bank,
            birthPlace: item.birthPlace,
            maritalStatus: item.maritalStatus,
            educationLevel: item.educationLevel,
            amount: Number(item.amount) || 0,
            montoCredito: Number(item.montoCredito || item.amount) || 0,
            tipoEmpleo: item.tipoEmpleo || "Jubilado Confianza",
            edad: Number(item.edad) || 10,
            plazo: Number(item.plazo) || 1000,
            capacidadPago: Number(item.capacidadPago) || 25.5,
          },
          rulesBreakdown: item.rulesBreakdown || undefined,
          rulesBreakdownStatus: item.status || undefined,
        }));

        setApps(mapped);
      } catch (err) {
        console.error("Failed to load applications from API", err);
      } finally {
        setAppsLoading(false);
      }
    };
    fetchRequests();
    const loadRules = async () => {
      try {
        const orgId = getStoredOrganization()?.id || "demo-bypass-org";
        const data = await fetchRules(applicantMode, orgId);
        if (Array.isArray(data)) {
          setRules(data);
        } else {
          setRules(orgId === "demo-bypass-org" ? defaultRules : []);
        }
      } catch (err) {
        console.error("Error fetching rules", err);
        const orgId = getStoredOrganization()?.id || "demo-bypass-org";
        setRules(orgId === "demo-bypass-org" ? defaultRules : []);
      }
    };
    loadRules();
    setProductFilter("all");
    setStatusFilter("all");
    setRiskFilter("all");
    setSearch("");
    setRuleQuery("");
    setPage(0);
    setTraceabilityPage(0);
    setRuleProductFilter((activeProducts[0] ?? NATURAL_CREDIT_PRODUCTS[0]) as RuleProduct);
    setRuleModalState(defaultRuleForm(activeProducts));
    setDetailApp(null);
    setFlowApp(null);
  }, [activeProducts, activeStorageKeys.applications, activeStorageKeys.rules, applicantMode, defaultApplications, defaultRules]);

  useEffect(() => {
    writeStoredJson(activeStorageKeys.applications, apps);
  }, [activeStorageKeys.applications, apps]);

  useEffect(() => {
    writeStoredJson(activeStorageKeys.rules, normalizedRules);
  }, [activeStorageKeys.rules, normalizedRules]);

  useEffect(() => {
    const closeOpenRowMenus = () => {
      document.querySelectorAll<HTMLDetailsElement>(".mdc-row-menu[open]").forEach((menu) => {
        menu.open = false;
      });
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest(".mdc-row-menu")) return;
      closeOpenRowMenus();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeOpenRowMenus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const rangeDays = RANGE_DAYS[rangeFilter];

  const { rangeScopedApps, previousRangeApps, applicationsTrendPoints } = useMemo(() => {
    const currentWindow = rangeWindow(apps, rangeDays);
    if (!currentWindow) {
      return {
        rangeScopedApps: [] as Application[],
        previousRangeApps: [] as Application[],
        applicationsTrendPoints: [] as { label: string; value: number }[],
      };
    }

    const currentRows = apps.filter((app) => {
      const dateToUse = app.updatedAt ?? app.submittedAt;
      return isWithinRange(dateToUse, currentWindow.startMs, currentWindow.endMs);
    });
    const previousStart = currentWindow.startMs - rangeDays * DAY_MS;
    const previousEnd = currentWindow.startMs - 1;
    const previousRows = apps.filter((app) => {
      const dateToUse = app.updatedAt ?? app.submittedAt;
      return isWithinRange(dateToUse, previousStart, previousEnd);
    });

    const pointsByDay = new Map<number, number>();
    for (const app of currentRows) {
      const dateToUse = app.updatedAt ?? app.submittedAt;
      const dayMs = utcDayStartMs(dateToUse);
      pointsByDay.set(dayMs, (pointsByDay.get(dayMs) ?? 0) + 1);
    }

    const points = Array.from({ length: rangeDays }, (_, index) => {
      const dayMs = currentWindow.startMs + index * DAY_MS;
      return {
        label: chartDayLabel(new Date(dayMs)),
        value: pointsByDay.get(dayMs) ?? 0,
      };
    });

    return {
      rangeScopedApps: currentRows,
      previousRangeApps: previousRows,
      applicationsTrendPoints: points,
    };
  }, [apps, rangeDays]);

  const overview = useMemo(() => {
    const total = rangeScopedApps.length;
    const approved = rangeScopedApps.filter((a) => a.status === "approved").length;
    const declined = rangeScopedApps.filter((a) => a.status === "declined").length;
    const manualOrPending = rangeScopedApps.filter((a) => a.status === "pending" || a.status === "manualReview").length;
    const avgAmount = total > 0 ? rangeScopedApps.reduce((sum, a) => sum + a.requestedAmount, 0) / total : 0;
    const avgRisk = total > 0 ? rangeScopedApps.reduce((sum, a) => sum + a.riskScore, 0) / total : 0;

    const previousTotal = previousRangeApps.length;
    const previousApproved = previousRangeApps.filter((a) => a.status === "approved").length;
    const previousDeclined = previousRangeApps.filter((a) => a.status === "declined").length;
    const previousAvgAmount =
      previousTotal > 0 ? previousRangeApps.reduce((sum, a) => sum + a.requestedAmount, 0) / previousTotal : 0;
    const previousAvgRisk =
      previousTotal > 0 ? previousRangeApps.reduce((sum, a) => sum + a.riskScore, 0) / previousTotal : 0;
    const approvedPct = approved / Math.max(total, 1);
    const declinedPct = declined / Math.max(total, 1);
    const previousApprovedPct = previousApproved / Math.max(previousTotal, 1);
    const previousDeclinedPct = previousDeclined / Math.max(previousTotal, 1);

    const approvalRatio = [
      { label: "Aprobadas automáticas", value: approved, color: "#b8a4d8" },
      { label: "Rechazadas por política", value: declined, color: "#6d5a9c" },
      { label: "En revisión manual", value: manualOrPending, color: "#1f1638" },
    ];

    const lowTarget = rangeScopedApps.filter((a) => riskFromApplicationStatus(a.status, a.riskScore) === "low").length;
    const mediumTarget = rangeScopedApps.filter((a) => riskFromApplicationStatus(a.status, a.riskScore) === "medium").length;
    const highTarget = rangeScopedApps.filter((a) => riskFromApplicationStatus(a.status, a.riskScore) === "high").length;

    const riskDistribution = [
      { label: "Bajo", value: lowTarget, color: "#b8a4d8" },
      { label: "Medio", value: mediumTarget, color: "#6d5a9c" },
      { label: "Alto", value: highTarget, color: "#1f1638" },
    ];

    const recent = [...rangeScopedApps]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 8);

    return {
      total,
      approved,
      declined,
      approvedPct,
      declinedPct,
      avgAmount,
      avgRisk,
      approvalRatio,
      riskDistribution,
      recent,
      deltas: {
        total: pctDelta(total, previousTotal),
        approvedPct: pctDelta(approvedPct, previousApprovedPct),
        declinedPct: pctDelta(declinedPct, previousDeclinedPct),
        avgAmount: pctDelta(avgAmount, previousAvgAmount),
        avgRisk: pctDelta(avgRisk, previousAvgRisk),
      },
    };
  }, [previousRangeApps, rangeScopedApps]);

  const filteredApps = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rangeScopedApps.filter((app) => {
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      if (productFilter !== "all" && app.product !== productFilter) return false;
      if (riskFilter !== "all" && riskFromApplicationStatus(app.status, app.riskScore) !== riskFilter) return false;
      if (!q) return true;
      const blob = `${app.appNo} ${app.applicantName} ${app.applicantEmail} ${app.product}`.toLowerCase();
      return blob.includes(q);
    });
  }, [productFilter, rangeScopedApps, riskFilter, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredApps.length / PAGE_SIZE));
  const paginatedApps = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredApps.slice(start, start + PAGE_SIZE);
  }, [filteredApps, page]);

  const openKybForApplication = (application: Application, rfc?: string | null) => {
    activateKybCompanyContext(
      {
        id: application.id,
        appNo: application.appNo,
        applicantName: application.applicantName,
        applicantEmail: application.applicantEmail,
        product: application.product,
        requestedAmount: application.requestedAmount,
        riskScore: application.riskScore,
        status: application.status,
      },
      { rfc },
    );
    router.push("/kyb");
  };

  const ruleFieldOptions = useMemo(() => getRuleFieldsForProduct(ruleProductFilter), [ruleProductFilter]);
  const [traceabilityLocal, setTraceabilityLocal] = useState<MdcTraceabilityEntry[]>(() => {
    const stored = readStoredJson<MdcTraceabilityEntry[] | null>(`mdc:traceability:v3:${applicantMode}`, null);
    if (stored) return stored;
    if (getStoredOrganization()?.id !== "demo-bypass-org") return [];
    return applicantMode === "moral"
      ? MORAL_TRACEABILITY
      : (creditStore.state.auditLog as MdcTraceabilityEntry[]);
  });

  const logTraceabilityAction = (
    action: string,
    details: string,
    oldValue?: string,
    newValue?: string
  ) => {
    const timestamp = new Date().toISOString();
    const correlationId = `trc-${Date.now().toString(36)}`;
    const user = getStoredOrganization()?.name || "Administrador";

    const entry: MdcTraceabilityEntry = {
      id: correlationId,
      timestamp,
      action,
      details,
      channel: "Consola Web",
      user,
      correlationId,
      oldValue,
      newValue
    };

    setTraceabilityLocal((prev) => {
      const updated = [entry, ...prev];
      writeStoredJson(`mdc:traceability:v3:${applicantMode}`, updated);
      return updated;
    });
  };

  const openEditPolicy = (policy: { product: string; rules: CreditRuleRow[] }) => {
    setRuleProductFilter(policy.product as RuleProduct);
    const baseRule = policy.rules[0];

    if (baseRule) {
      setEditingRuleId(baseRule.id);
      setEditingPolicyRules(policy.rules);
      setRuleModalState(ruleToFormState(baseRule, policy.product as RuleProduct));
    } else {
      setEditingRuleId(null);
      setEditingPolicyRules([]);
      setRuleModalState({
        ...defaultRuleForm(activeProducts),
        product: policy.product as RuleProduct,
      });
    }
    writeRuleFormSession({
      initial: baseRule
        ? ruleToFormState(baseRule, policy.product as RuleProduct)
        : { ...defaultRuleForm(activeProducts), product: policy.product as RuleProduct },
      isEditing: Boolean(baseRule),
      editingRuleId: baseRule?.id || null,
      initialBulkRules: policy.rules,
      mode: applicantMode,
      availableFields: getRuleFieldsForProduct(policy.product as RuleProduct),
      products: activeProducts,
      productDetails,
    });
    router.push(`/mdc/rules/form`);
  };

  const openEditRule = (rule: CreditRuleRow) => {
    const activeProduct = rule.products.includes(ruleProductFilter) ? ruleProductFilter : rule.products[0] ?? ruleProductFilter;
    setRuleProductFilter(activeProduct);
    setEditingRuleId(rule.id);
    setRuleModalState(ruleToFormState(rule, activeProduct));
    writeRuleFormSession({
      initial: ruleToFormState(rule, activeProduct),
      isEditing: true,
      editingRuleId: rule.id,
      initialBulkRules: [rule],
      mode: applicantMode,
      availableFields: getRuleFieldsForProduct(activeProduct),
      products: activeProducts,
      productDetails,
    });
    router.push(`/mdc/rules/form`);
  };

  const activeTraceability = useMemo<MdcTraceabilityEntry[]>(
    () => traceabilityLocal,
    [traceabilityLocal],
  );
  const traceabilityPageCount = Math.max(1, Math.ceil(activeTraceability.length / TRACEABILITY_PAGE_SIZE));
  const paginatedTraceability = useMemo(() => {
    const start = traceabilityPage * TRACEABILITY_PAGE_SIZE;
    return activeTraceability.slice(start, start + TRACEABILITY_PAGE_SIZE);
  }, [activeTraceability, traceabilityPage]);
  const visibleTabs = useMemo(
    () => TABS.filter((tab) => !tab.moralOnly || applicantMode === "moral"),
    [applicantMode],
  );

  useEffect(() => {
    async function loadTraceability() {
      const orgId = getStoredOrganization()?.id;
      if (orgId && orgId !== "demo-bypass-org") {
        const logs = await fetchTraceabilityLogs(orgId);
        const mapped: MdcTraceabilityEntry[] = logs.map((log) => ({
          id: log.id || `trc-${Date.now()}-${Math.random()}`,
          timestamp: log.createdAt || new Date().toISOString(),
          action: log.action,
          details: log.detail,
          channel: log.channel,
          user: log.userName,
          correlationId: log.correlationId || "-",
          rateBefore: log.rateBefore ?? undefined,
          rateAfter: log.rateAfter ?? undefined,
        }));
        // Update local state with fetched logs (sorted descending by timestamp if not already)
        setTraceabilityLocal(mapped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }
    }

    if (activeTab === "traceability") {
      loadTraceability();
    }
  }, [activeTab]);

  useEffect(() => {
    if (applicantMode !== "moral" && activeTab === "reports") {
      setActiveTab("overview");
    }
  }, [activeTab, applicantMode]);

  const [editingPolicyRules, setEditingPolicyRules] = useState<CreditRuleRow[]>([]);

  const openCreateRule = () => {
    const selectedProd = (ruleProductFilter && ruleProductFilter !== "all")
      ? ruleProductFilter
      : (activeProducts[0] ?? NATURAL_CREDIT_PRODUCTS[0]);

    const existingRulesForProduct = normalizedRules.filter(
      (r) => r.financialProduct === selectedProd || (Array.isArray(r.products) && r.products.includes(selectedProd as any))
    );

    const initial = existingRulesForProduct.length > 0
      ? ruleToFormState(existingRulesForProduct[0], selectedProd as RuleProduct)
      : {
          ...defaultRuleForm(activeProducts),
          name: `Regla - ${selectedProd}`,
          product: selectedProd as RuleProduct,
          field: (PRODUCT_RULE_FIELDS[selectedProd as RuleProduct] || FALLBACK_RULE_FIELDS)[0] ?? "",
        };
    writeRuleFormSession({
      initial,
      isEditing: existingRulesForProduct.length > 0,
      editingRuleId: existingRulesForProduct[0]?.id || null,
      initialBulkRules: existingRulesForProduct,
      mode: applicantMode,
      availableFields: getRuleFieldsForProduct(selectedProd as RuleProduct),
      products: activeProducts,
      productDetails,
    });
    router.push("/mdc/rules/form");
  };

  const [viewingPolicy, setViewingPolicy] = useState<{ product: string; rules: CreditRuleRow[]; activeCount: number } | null>(null);
  const [viewingRule, setViewingRule] = useState<CreditRuleRow | null>(null);

  const [deleteRuleTarget, setDeleteRuleTarget] = useState<{
    type: "policy" | "single";
    product?: string;
    ruleId?: string;
    ruleName?: string;
    ruleIds?: string[];
  } | null>(null);
  const [isDeletingRule, setIsDeletingRule] = useState(false);

  const handleConfirmDeleteRule = async () => {
    if (!deleteRuleTarget) return;
    setIsDeletingRule(true);
    try {
      const orgId = getStoredOrganization()?.id || "demo-bypass-org";
      if (deleteRuleTarget.type === "policy") {
        const product = deleteRuleTarget.product;
        const idsToDelete = deleteRuleTarget.ruleIds || [];
        for (const id of idsToDelete) {
          await deleteRule(id, orgId);
        }

        const doesRuleMatch = (r: CreditRuleRow) => {
          if (!r) return false;
          const cleanIds = idsToDelete.map((i) => (i || "").split("::")[0]).filter(Boolean);
          const ruleBaseId = (r.id || "").split("::")[0];
          if (r.id && idsToDelete.includes(r.id)) return true;
          if (ruleBaseId && cleanIds.includes(ruleBaseId)) return true;

          if (!product) return false;
          if ((r as any).financialProduct === product) return true;
          if ((r as any).product === product) return true;
          if (Array.isArray(r.products) && (r.products as any[]).some((p: any) => p === product || (typeof p === "string" && p.includes(product)))) return true;
          if (typeof r.products === "string") {
            const strProd = r.products as string;
            if (strProd === product) return true;
            try {
              const parsed = JSON.parse(strProd);
              if (Array.isArray(parsed) && parsed.some((p: any) => p === product || (typeof p === "string" && p.includes(product)))) return true;
              if (parsed === product) return true;
            } catch {
              if (strProd.includes(product)) return true;
            }
          }
          return false;
        };

        const updatedRules = rules.filter((r) => !doesRuleMatch(r));
        setRules(updatedRules);
        writeStoredJson(activeStorageKeys.rules, updatedRules);

        logTraceabilityAction("ELIMINAR", `Eliminación de regla para producto "${product}"`, `${idsToDelete.length} regla(s) eliminada(s)`, "Eliminado");
        setGlobalAlert({ message: `Configuración de regla para "${product}" eliminada correctamente.`, type: "success" });
      } else if (deleteRuleTarget.type === "single" && deleteRuleTarget.ruleId) {
        const id = deleteRuleTarget.ruleId;
        const name = deleteRuleTarget.ruleName || "Regla";
        await deleteRule(id, orgId);
        const cleanId = id.split("::")[0];
        const updatedRules = rules.filter((item) => item.id !== id && (item.id || "").split("::")[0] !== cleanId);
        setRules(updatedRules);
        writeStoredJson(activeStorageKeys.rules, updatedRules);

        logTraceabilityAction("ELIMINAR", `Eliminación de regla "${name}"`, id, "Eliminado");
        setGlobalAlert({ message: `Regla "${name}" eliminada correctamente.`, type: "success" });
      }
    } catch (err) {
      console.error("Error al eliminar la regla:", err);
      setGlobalAlert({ message: "Error al eliminar la regla. Por favor intente nuevamente.", type: "error" });
    } finally {
      setIsDeletingRule(false);
      setDeleteRuleTarget(null);
      setShowRuleModal(false);
    }
  };

  return (
    <div className={`zelify-workspace-page mdc-workspace${variant !== "full" ? " mdc-workspace--solo" : ""}`}>
      <ZelifyTopNavbar variant="mdc" />
      <div className="zelify-workspace-page__scroll mdc-workspace__body">
        {variant === "full" ? (
        <aside className="mdc-sidebar" aria-label="Navegación MDC">
          <div className="mdc-tabs" role="tablist" aria-label="MDC tabs">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`mdc-tab${activeTab === tab.id ? " mdc-tab--active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </aside>
        ) : null}
        <div className="mdc-workspace__main">
        <div className={`mdc-root${activeTab === "configuration" || variant === "config" ? " mdc-root--fluid" : ""}`}>
          {variant !== "config" ? (
          <header className="mdc-header">
            <div className="mdc-header__row">
              <div>
                <p className="mdc-header__eyebrow">Core Module</p>
                <h1>{MODE_COPY[applicantMode].title}</h1>
                <p className="mdc-header__sub">{MODE_COPY[applicantMode].subtitle}</p>
              </div>
              <div className="mdc-persona-switch" role="tablist" aria-label="Tipo de solicitante">
                {PERSONA_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`mdc-persona-switch__btn${applicantMode === option.id ? " mdc-persona-switch__btn--active" : ""}`}
                    onClick={() => setApplicantModeAndQuery(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="mdc-header__date">
                <label htmlFor="mdc-range">Rango</label>
                <select
                  id="mdc-range"
                  value={rangeFilter}
                  onChange={(e) => {
                    setRangeFilter(e.target.value as RangePreset);
                    setPage(0);
                  }}
                >
                  <option value="7d">Últimos 7 días</option>
                  <option value="30d">Últimos 30 días</option>
                  <option value="90d">Últimos 90 días</option>
                </select>
              </div>
            </div>
          </header>
          ) : null}

          {activeTab === "overview" && (
            <section className="mdc-section">
              {appsLoading && (
                <div style={{ padding: "0.5rem 1rem", background: "rgba(76,40,140,0.08)", borderRadius: "0.5rem", marginBottom: "0.75rem", color: "#4c288c", fontSize: "0.83rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#4c288c", opacity: 0.7 }} />
                  Sincronizando datos del motor...
                </div>
              )}
              <div className="mdc-overview-hero mdc-overview-hero--plain">
                <h2 className="mdc-overview-hero__title">Tablero</h2>
                <div className="mdc-kpis">
                  <MdcStatCard
                    title="Solicitudes totales"
                    value={appsLoading ? "—" : String(overview.total)}
                    deltaPct={overview.deltas.total}
                    positive={overview.deltas.total >= 0}
                    comparisonLabel="vs periodo anterior"
                  />
                  <MdcStatCard
                    title="Porcentaje de aprobación"
                    value={appsLoading ? "—" : ratioLabel(overview.approvedPct)}
                    deltaPct={overview.deltas.approvedPct}
                    positive={overview.deltas.approvedPct >= 0}
                    comparisonLabel="vs periodo anterior"
                  />
                  <MdcStatCard
                    title="Porcentaje de rechazo"
                    value={appsLoading ? "—" : ratioLabel(overview.declinedPct)}
                    deltaPct={overview.deltas.declinedPct}
                    positive={overview.deltas.declinedPct >= 0}
                    comparisonLabel="vs periodo anterior"
                  />
                  <MdcStatCard
                    title="Monto promedio solicitado / aprobado"
                    value={appsLoading ? "—" : money(overview.avgAmount)}
                    deltaPct={overview.deltas.avgAmount}
                    positive={overview.deltas.avgAmount >= 0}
                    comparisonLabel="vs periodo anterior"
                  />
                </div>
              </div>

              <article className="mdc-card">
                <div className="mdc-card__head">
                  <h3>Solicitudes por día</h3>
                  <p>{TREND_COPY[rangeFilter]}</p>
                </div>
                <LineChart points={applicationsTrendPoints} />
              </article>

              <div className="mdc-grid-2">
                <article className="mdc-card">
                  <div className="mdc-card__head">
                    <h3>Ratio de decisión</h3>
                    <p>Distribución por estado principal</p>
                  </div>
                  <SegmentedBar data={overview.approvalRatio} />
                </article>
                <article className="mdc-card">
                  <div className="mdc-card__head">
                    <h3>Distribución de riesgo</h3>
                    <p>Bajo, medio y alto</p>
                  </div>
                  <DonutChart data={overview.riskDistribution} />
                </article>
              </div>

              <div className="mdc-overview-recent-block">
                <div className="mdc-card__head mdc-card__head--row">
                  <h3>{MODE_COPY[applicantMode].recentTitle}</h3>
                  <button type="button" className="mdc-link-btn" onClick={() => setActiveTab("applications")}>
                    Ver todas
                  </button>
                </div>
              <article className="mdc-card mdc-card--tight mdc-overview-recent">
                <div className="mdc-table-wrap">
                  <table className="mdc-table mdc-overview-table">
                    <thead>
                      <tr>
                        <th>Número</th>
                        <th>Solicitante</th>
                        <th>Producto</th>
                        <th>Monto</th>
                        <th>Estado</th>
                        <th>Riesgo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.recent.length === 0 ? (
                        <tr>
                          <td colSpan={6}>Sin solicitudes en el rango seleccionado.</td>
                        </tr>
                      ) : (
                        overview.recent.map((app) => (
                          <tr key={app.id}>
                            <td>{app.appNo}</td>
                            <td>
                              <div style={{ display: "grid", gap: 2 }}>
                                <span>{app.applicantName}</span>
                                {app.applicantEmail && app.applicantEmail !== "N/A" ? (
                                  <small style={{ color: "#64748b", fontSize: 11 }}>{app.applicantEmail}</small>
                                ) : null}
                              </div>
                            </td>
                            <td>{app.product}</td>
                            <td>{money(app.requestedAmount)}</td>
                            <td><span className={classForStatus(app.status)}>{STATUS_LABELS[app.status]}</span></td>
                            <td>
                              <span className={classForRisk(riskFromApplicationStatus(app.status, app.riskScore))}>
                                {RISK_LABELS[riskFromApplicationStatus(app.status, app.riskScore)]}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </article>
              </div>
            </section>
          )}

          {activeTab === "products" && (
            <MdcProductsTab
              mode={applicantMode}
              storageKey={activeStorageKeys.products}
              initialProducts={MDC_PRODUCTS_BY_MODE[applicantMode]}
              title={applicantMode === "moral" ? "Productos empresariales" : "Productos"}
              subtitle={
                applicantMode === "moral"
                  ? "Configuracion de lineas y productos para originacion de persona moral."
                  : "Gestion de productos y performance del portafolio."
              }
            />
          )}

          {activeTab === "applications" && (
            <section className="mdc-section mdc-apps-section">
              <div className="mdc-overview-hero mdc-prod-hero">
                <div className="mdc-prod-hero__row">
                  <div>
                    <h2 className="mdc-overview-hero__title">Solicitudes</h2>
                    <p className="mdc-prod-hero__sub">Gestión y seguimiento del pipeline</p>
                  </div>
                  <button type="button" className="mdc-prod-hero__cta" onClick={() => setShowAddApplication(true)}>
                    Agregar solicitud <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <article className="mdc-card mdc-apps-panel">
                <div className="mdc-card__head">
                  <h3>Resumen de desempeño</h3>
                  <p>Indicadores principales de la familia de productos.</p>
                </div>

                <div className="mdc-filters mdc-apps-filters">
                  <label>
                    <span>Buscar</span>
                    <input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(0);
                      }}
                      placeholder="APP, cliente, mail"
                    />
                  </label>
                  <label>
                    <span>Estado</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value as ApplicationStatus | "all");
                        setPage(0);
                      }}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status === "all" ? "Todos" : STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Producto</span>
                    <select
                      value={productFilter}
                      onChange={(e) => {
                        setProductFilter(e.target.value);
                        setPage(0);
                      }}
                    >
                      <option value="all">Todos</option>
                      {activeProducts.map((product) => (
                        <option key={product} value={product}>{product}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Riesgo</span>
                    <select
                      value={riskFilter}
                      onChange={(e) => {
                        setRiskFilter(e.target.value as RiskLevel | "all");
                        setPage(0);
                      }}
                    >
                      {RISK_OPTIONS.map((risk) => (
                        <option key={risk} value={risk}>
                          {risk === "all" ? "Todos" : RISK_LABELS[risk]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="mdc-table-wrap">
                  <table className="mdc-table mdc-apps-table">
                    <thead>
                      <tr>
                        <th>Número</th>
                        <th>Solicitante</th>
                        <th>Email</th>
                        <th>Producto</th>
                        <th>Monto</th>
                        <th>Estado</th>
                        <th>Riesgo</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appsLoading ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>Cargando solicitudes...</td>
                        </tr>
                      ) : paginatedApps.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>Sin solicitudes. Crea la primera con el botón “Agregar solicitud”.</td>
                        </tr>
                      ) : (
                        paginatedApps.map((app) => (
                          <tr key={app.id}>
                            <td>{app.appNo}</td>
                            <td>
                              <div style={{ display: "grid", gap: 2 }}>
                                <span>{app.applicantName}</span>
                                {app.applicantEmail && app.applicantEmail !== "N/A" ? (
                                  <small style={{ color: "#64748b", fontSize: 11 }}>{app.applicantEmail}</small>
                                ) : null}
                              </div>
                            </td>
                            <td>{app.applicantEmail}</td>
                            <td>{app.product}</td>
                            <td>{money(app.requestedAmount)}</td>
                            <td><span className={classForStatus(app.status)}>{STATUS_LABELS[app.status]}</span></td>
                            <td>
                              <span className={classForRisk(riskFromApplicationStatus(app.status, app.riskScore))}>
                                {RISK_LABELS[riskFromApplicationStatus(app.status, app.riskScore)]}
                              </span>
                            </td>
                            <td>{shortDate(app.submittedAt)}</td>
                            <td>
                              <div className="mdc-actions">
                                <button
                                  type="button"
                                  className="mdc-btn mdc-btn--xs mdc-btn--icon"
                                  onClick={() => {
                                    writeApplicationDetailSession({
                                      app,
                                      mode: applicantMode,
                                      rules: normalizedRules.filter((rule) => rule.products.includes(app.product as RuleProduct)),
                                    });
                                    router.push(`/mdc/applications/${app.id}?mode=${applicantMode}`);
                                  }}
                                  aria-label={`Ver detalle de ${app.appNo}`}
                                  title="Ver detalle"
                                >
                                  <Eye size={14} aria-hidden />
                                </button>
                                <details className="mdc-row-menu">
                                  <summary
                                    className="mdc-row-menu__summary-icon"
                                    aria-label={`Opciones de ${app.appNo}`}
                                    title="Opciones"
                                  >
                                    <Settings size={14} aria-hidden />
                                  </summary>
                                  <div className="mdc-row-menu__items">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const newStatus = statusFromScore(app.riskScore);
                                        const newRiskScore = normalizeRiskScoreForStatus(newStatus, app.riskScore);
                                        const newRisk = riskFromApplicationStatus(newStatus, app.riskScore);

                                        const backendStatus = newStatus === "approved" ? "Aprobada" :
                                          newStatus === "declined" ? "Rechazada" :
                                            newStatus === "manualReview" ? "Revision manual" :
                                              newStatus === "overridden" ? "Override" : "Pendiente";
                                        const backendRiskLevel = newRisk === "low" ? "Bajo" : newRisk === "high" ? "Alto" : "Medio";

                                        try {
                                          await updateFinanceRequest(app.id, {
                                            status: backendStatus,
                                            riskLevel: backendRiskLevel,
                                            riskScore: newRiskScore
                                          });

                                          if (getStoredOrganization()?.id !== "demo-bypass-org") {
                                            await createTraceabilityLog({
                                              orgId: getStoredOrganization()?.id || "ORG-001",
                                              action: "RISK_UPDATE",
                                              detail: `Riesgo actualizado a ${newRiskScore} para solicitud ${app.appNo}`,
                                              channel: "Sucursal",
                                              userName: "Ejecutivo Frontline",
                                              correlationId: `corr-risk-${app.id.substring(0, 8)}`,
                                              rateBefore: Number(app.riskScore),
                                              rateAfter: Number(newRiskScore)
                                            });
                                          }
                                          setApps((current) =>
                                            current.map((row) =>
                                              row.id === app.id
                                                ? {
                                                  ...row,
                                                  status: newStatus,
                                                  riskScore: newRiskScore,
                                                  risk: newRisk,
                                                }
                                                : row,
                                            ),
                                          );
                                        } catch (err) { console.error("Failed to execute evaluation", err); }
                                      }}
                                    >
                                      Ejecutar evaluacion
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const newStatus = "pending";
                                        const newRiskScore = normalizeRiskScoreForStatus("pending", app.riskScore);
                                        const newRisk = riskFromApplicationStatus("pending", app.riskScore);
                                        const backendRiskLevel = newRisk === "low" ? "Bajo" : newRisk === "high" ? "Alto" : "Medio";

                                        try {
                                          await updateFinanceRequest(app.id, {
                                            status: "Pendiente",
                                            riskLevel: backendRiskLevel,
                                            riskScore: newRiskScore
                                          });
                                          setApps((current) =>
                                            current.map((row) =>
                                              row.id === app.id
                                                ? {
                                                  ...row,
                                                  status: newStatus,
                                                  riskScore: newRiskScore,
                                                  risk: newRisk,
                                                }
                                                : row,
                                            ),
                                          );
                                        } catch (err) { console.error("Failed to resend onboarding", err); }
                                      }}
                                    >
                                      Reenviar onboarding
                                    </button>
                                    {app.status === "pending" && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setUploadApp(app);
                                        }}
                                      >
                                        Subir documentos
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFlowApp(app);
                                      }}
                                    >
                                      Ver flujo
                                    </button>
                                    {applicantMode === "moral" && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          openKybForApplication(app);
                                        }}
                                      >
                                        KYB editar
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="mdc-row-menu__danger"
                                      onClick={async () => {
                                        try {
                                          await deleteFinanceRequest(app.id);
                                          setApps((current) => current.filter((row) => row.id !== app.id));
                                        } catch (err) { console.error("Failed to delete application", err); }
                                      }}
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </details>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mdc-pagination">
                  <p>
                    Mostrando {filteredApps.length === 0 ? 0 : page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, filteredApps.length)} de {filteredApps.length}
                  </p>
                  <div>
                    <button
                      type="button"
                      className="mdc-btn mdc-btn--ghost"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      className="mdc-btn mdc-btn--ghost"
                      onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                      disabled={page >= pageCount - 1}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </article>
            </section>
          )}

          {activeTab === "rules" && (
            <section className="mdc-section mdc-rules-section">
              <div className="mdc-overview-hero mdc-prod-hero">
                <div className="mdc-prod-hero__row">
                  <div>
                    <h2 className="mdc-overview-hero__title">Reglas y thresholds</h2>
                    <p className="mdc-prod-hero__sub">Configuración operativa del motor MDC</p>
                  </div>
                  <button type="button" className="mdc-prod-hero__cta" onClick={openCreateRule}>
                    Agregar regla <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <article className="mdc-card mdc-rules-panel">
                <div className="mdc-filters mdc-rules-filters">
                  <label>
                    <span>Producto activo</span>
                    <select
                      value={ruleProductFilter}
                      onChange={(e) => setRuleProductFilter(e.target.value as RuleProduct)}
                    >
                      <option value="all">Todos los productos</option>
                      {activeProducts.map((product) => (
                        <option key={product} value={product}>{product}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Buscar regla</span>
                    <input
                      value={ruleQuery}
                      onChange={(e) => setRuleQuery(e.target.value)}
                      placeholder="Nombre, campo o descripción"
                    />
                  </label>
                </div>

                <div className="mdc-table-wrap">
                  {isDemoOrg ? (
                    <table className="mdc-table mdc-rules-table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Descripción</th>
                          <th>Operador</th>
                          <th>Valor</th>
                          <th>Tipo</th>
                          <th>Severidad</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLegacyRules.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>Sin reglas para el producto seleccionado. Haz clic en “Agregar regla” para comenzar.</td>
                          </tr>
                        ) : filteredLegacyRules.map((rule) => (
                          <tr key={rule.id}>
                            <td>{rule.name}</td>
                            <td>{rule.description}</td>
                            <td>{renderRuleOperator(rule)}</td>
                            <td>{renderRuleValue(rule)}</td>
                            <td>{RULE_TYPE_LABELS[rule.dataType]}</td>
                            <td>{renderRuleSeverity(rule)}</td>
                            <td>
                              <span className={rule.status === "active" ? "mdc-badge mdc-badge--ok" : "mdc-badge mdc-badge--neutral"}>
                                {rule.status === "active" ? "Activa" : "Inactiva"}
                              </span>
                            </td>
                            <td>
                              <div className="mdc-actions">
                                <button
                                  type="button"
                                  className="mdc-btn mdc-btn--xs mdc-btn--icon"
                                  onClick={() => setViewingRule(rule)}
                                  aria-label={`Visualizar regla ${rule.name}`}
                                  title="Visualizar regla"
                                >
                                  <Eye size={14} aria-hidden />
                                </button>
                                <details className="mdc-row-menu">
                                  <summary
                                    className="mdc-row-menu__summary-icon"
                                    aria-label={`Opciones de ${rule.name}`}
                                    title="Opciones"
                                  >
                                    <Settings size={14} aria-hidden />
                                  </summary>
                                  <div className="mdc-row-menu__items">
                                    <button type="button" onClick={() => openEditRule(rule)}>
                                      Configurar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const newStatus = rule.status === "active" ? "inactive" : "active";
                                        const updated = await updateRule(rule.id, { status: newStatus }, getStoredOrganization()?.id || "demo-bypass-org");
                                        if (updated) {
                                          setRules((current) =>
                                            current.map((item) => (item.id === rule.id ? { ...item, status: newStatus } : item)),
                                          );
                                          logTraceabilityAction("ACTUALIZAR", `Cambio de estado en regla "${rule.name}"`, rule.status, newStatus);
                                        }
                                      }}
                                    >
                                      {rule.status === "active" ? "Desactivar" : "Activar"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const duplicated: Partial<CreditRuleRow> = {
                                          ...rule,
                                          name: `${rule.name} (copia)`,
                                          individualPerson: applicantMode === "natural",
                                          legalEntity: applicantMode === "moral",
                                        } as any;
                                        delete duplicated.id;
                                        delete duplicated.createdAt;
                                        const created = await createRule(duplicated, getStoredOrganization()?.id || "demo-bypass-org");
                                        if (created) {
                                          setRules((current) => [...current, created]);
                                          logTraceabilityAction("DUPLICAR", `Duplicación de regla "${rule.name}"`, "N/A", `Nueva regla: ${duplicated.name}`);
                                        }
                                      }}
                                    >
                                      Duplicar
                                    </button>
                                    <button
                                      type="button"
                                      className="mdc-row-menu__danger"
                                      onClick={() => {
                                        setDeleteRuleTarget({
                                          type: "single",
                                          ruleId: rule.id,
                                          ruleName: rule.name,
                                        });
                                      }}
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </details>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="mdc-table mdc-rules-table">
                      <thead>
                        <tr>
                          <th>Producto Financiero</th>
                          <th>Nombre de la regla</th>
                          <th>Estado de la regla</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPolicies.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>No hay productos disponibles o reglas configuradas.</td>
                          </tr>
                        ) : filteredPolicies.flatMap((policy) =>
                          policy.rules.length > 0
                            ? policy.rules.map((rule) => ({ policy, rule }))
                            : [{ policy, rule: null }],
                        ).map(({ policy, rule }) => {
                          const isRuleActive = rule?.status === "active";
                          return (
                            <tr key={rule?.id || policy.product}>
                              <td className="font-semibold text-slate-800">{policy.product}</td>
                              <td>{rule?.name || "Sin configurar"}</td>
                              <td>
                                <span className={isRuleActive ? "mdc-badge mdc-badge--ok" : "mdc-badge mdc-badge--neutral"}>
                                  {isRuleActive ? "Activa" : "Sin configurar"}
                                </span>
                              </td>
                              <td>
                                <div className="mdc-actions">
                                  <button
                                    type="button"
                                    className="mdc-btn mdc-btn--xs mdc-btn--icon"
                                    onClick={() => rule ? setViewingRule(rule) : setViewingPolicy(policy)}
                                    aria-label={`Visualizar regla de ${rule?.name || policy.product}`}
                                    title="Visualizar regla"
                                  >
                                    <Eye size={14} aria-hidden />
                                  </button>
                                  <details className="mdc-row-menu">
                                    <summary
                                      className="mdc-row-menu__summary-icon"
                                      aria-label={`Opciones de ${rule?.name || policy.product}`}
                                      title="Opciones"
                                    >
                                      <Settings size={14} aria-hidden />
                                    </summary>
                                    <div className="mdc-row-menu__items">
                                      <button
                                        type="button"
                                        onClick={() => rule ? openEditRule(rule) : openEditPolicy(policy)}
                                      >
                                        Configurar
                                      </button>
                                      {rule && (
                                        <button
                                          type="button"
                                          className="mdc-row-menu__danger"
                                          onClick={() => {
                                            setDeleteRuleTarget({
                                              type: "single",
                                              product: policy.product,
                                              ruleId: rule.id,
                                              ruleName: rule.name,
                                            });
                                          }}
                                        >
                                          Eliminar
                                        </button>
                                      )}
                                    </div>
                                  </details>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </article>
            </section>
          )}

          {activeTab === "traceability" && (
            <section className="mdc-section mdc-trace-section">
              <div className="mdc-overview-hero mdc-prod-hero">
                <div className="mdc-prod-hero__row">
                  <div>
                    <h2 className="mdc-overview-hero__title">Trazabilidad</h2>
                    <p className="mdc-prod-hero__sub">Reglas, IA, cross-sell y fijaciones.</p>
                  </div>
                </div>
              </div>

              <article className="mdc-card mdc-trace-panel">
                <div className="mdc-table-wrap">
                  <table className="mdc-table mdc-trace-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Acción</th>
                        <th>Detalle</th>
                        <th>Canal</th>
                        <th>Usuario</th>
                        <th>Correlación</th>
                        <th>Valores Anteriores</th>
                        <th>Valores Posteriores</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTraceability.map((entry) => (
                        <tr key={entry.id}>
                          <td className="mdc-traceability__date">{new Date(entry.timestamp).toLocaleString("es-MX", { timeZone: getConfiguredTimezone() })}</td>
                          <td>
                            <span className="mdc-badge mdc-badge--info">{entry.action}</span>
                          </td>
                          <td className="mdc-traceability__detail">{entry.details || "—"}</td>
                          <td>{entry.channel}</td>
                          <td>{entry.user}</td>
                          <td className="mdc-traceability__correlation">{entry.correlationId}</td>
                          <td>{entry.rateBefore !== undefined ? formatPctCredit(entry.rateBefore) : (entry.oldValue || "—")}</td>
                          <td>{entry.rateAfter !== undefined ? formatPctCredit(entry.rateAfter) : (entry.newValue || "—")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mdc-pagination">
                  <p>
                    Mostrando {activeTraceability.length === 0 ? 0 : traceabilityPage * TRACEABILITY_PAGE_SIZE + 1} - {Math.min((traceabilityPage + 1) * TRACEABILITY_PAGE_SIZE, activeTraceability.length)} de {activeTraceability.length}
                  </p>
                  <div>
                    <button
                      type="button"
                      className="mdc-btn mdc-btn--ghost"
                      onClick={() => setTraceabilityPage((p) => Math.max(0, p - 1))}
                      disabled={traceabilityPage === 0}
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      className="mdc-btn mdc-btn--ghost"
                      onClick={() => setTraceabilityPage((p) => Math.min(traceabilityPageCount - 1, p + 1))}
                      disabled={traceabilityPage >= traceabilityPageCount - 1}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </article>
            </section>
          )}

          {activeTab === "payments" && (
            <MdcPaymentsTab
              mode={applicantMode}
              range={rangeFilter}
              onRangeChange={(nextRange) => {
                setRangeFilter(nextRange as RangePreset);
                setPage(0);
              }}
            />
          )}
          {activeTab === "collections" && (
            <MdcCollectionsTab mode={applicantMode} />
          )}
          {activeTab === "reports" && applicantMode === "moral" && <MdcReportsTab />}
          {activeTab === "configuration" && <MdcConfigurationTab />}
        </div>
        </div>
      </div>

      <AddApplicationModal
        open={showAddApplication}
        onClose={() => setShowAddApplication(false)}
        mode={applicantMode}
        products={activeProducts}
        onCreate={async ({
          identificationNumber,
          email,
          phone,
          bank,
          product,
          amount,
          plazo,
          businessName,
        }) => {
          try {
            const orgId = getStoredOrganization()?.id || "ORG-001";
            kycLog("create · inicio alta", {
              personType: applicantMode,
              orgId,
              identificationNumber,
              email,
              product,
              amount: Number(amount),
              phone: phone || null,
              bank: bank || null,
              businessName: businessName || null,
            });
            const createPayload = {
              product,
              personType: applicantMode,
              orgId,
              identificationNumber,
              email,
              amount: Number(amount),
              montoCredito: Number(amount),
              plazo: Number(plazo) || undefined,
              status: "Pendiente" as const,
              ...(phone ? { phone: normalizeMxPhone10(phone) } : {}),
              ...(bank ? { bank } : {}),
              ...(applicantMode === "moral" && businessName ? { businessName } : {}),
            };

            let analysisResult: AnalyzeFinanceRequestResponse | null = null;
            try {
              analysisResult = await analyzeFinanceRequest(createPayload);
            } catch (analysisErr) {
              console.warn("Failed to analyze finance request", analysisErr);
            }

            const response = await createFinanceRequest({
              ...createPayload,
              riskLevel: analysisResult?.riskLevel || "Medio",
              riskScore: analysisResult?.status === "Rechazado" || analysisResult?.status === "Rechazada" ? 85 : 50,
            });

            if (response?.notification) {
              setGlobalAlert({ message: response.notification, type: "success" });
            }

            const item = response.data || response;
            const mappedStatus: ApplicationStatus =
              item.status === "Aprobada" || item.status === "Aprobado" ? "approved" :
                item.status === "Rechazada" || item.status === "Rechazado" ? "declined" :
                  item.status === "Revision" || item.status === "Revision manual" ? "manualReview" :
                    item.status === "Override" ? "overridden" : "pending";

            const mappedRisk: RiskLevel =
              analysisResult?.riskLevel === "Alto" || item.riskLevel === "Alto" ? "high" :
                analysisResult?.riskLevel === "Bajo" || item.riskLevel === "Bajo" ? "low" : "medium";

            let kycSessionId: string | null = item.kycSessionId || null;
            let kycWebviewUrl: string | null = item.kycWebviewUrl || null;

            // KYC Zelify solo natural + CURP (18). Moral / RFC: no llamar.
            const shouldStartKyc = applicantMode === "natural" && Boolean(item.id) && isCurpLike(identificationNumber);
            kycLog("create · decisión post-MDC", {
              financeRequestId: item.id,
              personType: applicantMode,
              identificationNumber,
              isCurp18: isCurpLike(identificationNumber),
              shouldStartKyc,
              skipReason: shouldStartKyc
                ? null
                : applicantMode !== "natural"
                  ? "moral → no KYC"
                  : !item.id
                    ? "sin id de solicitud MDC"
                    : "RFC/ID ≠ CURP 18 → no KYC",
            });

            if (shouldStartKyc) {
              try {
                const phone10 = phone ? normalizeMxPhone10(phone) : "";
                kycLog("create · paso 1/2 Auth POST /sessions", {
                  email,
                  curp: identificationNumber.replace(/\s+/g, "").toUpperCase(),
                  phone: phone10 || null,
                });
                const kycSession = await createZelifyKycOnboardingSession({
                  email,
                  curp: identificationNumber.replace(/\s+/g, "").toUpperCase(),
                  ...(phone10.length === 10 ? { phone: phone10 } : {}),
                });
                kycLog("create · paso 2/2 MDC POST …/kyc", {
                  financeRequestId: item.id,
                  kycSessionId: kycSession.sessionId,
                });
                await attachFinanceRequestKyc(item.id, {
                  kycSessionId: kycSession.sessionId,
                  kycWebviewUrl: kycSession.webviewUrl,
                });
                kycSessionId = kycSession.sessionId;
                kycWebviewUrl = kycSession.webviewUrl;
                setKycPrompt({
                  requestId: item.id,
                  webviewUrl: kycSession.webviewUrl,
                  expiresAt: kycSession.expiresAt,
                });
                kycLog("create · KYC OK", {
                  financeRequestId: item.id,
                  kycSessionId,
                  expiresAt: kycSession.expiresAt,
                });
              } catch (kycErr: any) {
                kycError("create · KYC falló (solicitud MDC ya existe)", kycErr, {
                  financeRequestId: item.id,
                  identificationNumber,
                  email,
                  note: "Si teamHint=Auth → bug en zelify-core-products. Si MDC → credit-decision-engine.",
                });
                setGlobalAlert({
                  message: kycErr?.message || "Solicitud creada, pero no se pudo iniciar KYC Zelify.",
                  type: "error",
                });
              }
            }

            const next: Application = {
              id: item.id || `local-${Date.now()}`,
              appNo: `APP-${(item.id || String(Date.now())).split("-")[0].toUpperCase()}`,
              userId: item.user?.id || null,
              applicantId: item.user?.id || item.applicantId || identificationNumber || "N/A",
              applicantName: resolveApplicantDisplayName({
                personType: applicantMode,
                firstName: item.firstName,
                lastName: item.lastName,
                businessName: businessName || item.businessName,
                email,
                identificationNumber,
              }),
              applicantEmail: email,
              product,
              requestedAmount: Number(amount) || 0,
              currency: "MXN",
              status: mappedStatus,
              risk: mappedRisk,
              riskScore: analysisResult?.status === "Rechazado" || analysisResult?.status === "Rechazada" ? 85 : (item.riskScore || 50),
              submittedAt: item.createdAt || new Date().toISOString(),
              kycSessionId,
              kycWebviewUrl,
              rawPayload: createPayload,
              analysis: analysisResult || undefined,
              rulesBreakdown: analysisResult?.rulesBreakdown || undefined,
              rulesBreakdownStatus: analysisResult?.status || undefined,
            };
            setApps((current) => [next, ...current]);
            setPage(0);
            if (applicantMode === "moral") {
              openKybForApplication(next, identificationNumber);
            }
          } catch (e: any) {
            setGlobalAlert({ message: e.message || "Error al crear la solicitud", type: "error" });
            console.error("Failed to create application", e);
            throw e;
          }
        }}
      />

      {globalAlert && <AlertModal message={globalAlert.message} type={globalAlert.type} onClose={() => setGlobalAlert(null)} />}

      {kycPrompt ? (
        <div className="mdc-modal-backdrop" onClick={() => setKycPrompt(null)}>
          <div className="mdc-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <header className="mdc-modal-head">
              <div>
                <p>Verificación KYC</p>
                <h3>Continuar verificación</h3>
              </div>
              <button type="button" className="mdc-icon-btn" onClick={() => setKycPrompt(null)}>×</button>
            </header>
            <p style={{ margin: "0 0 12px", color: "#475569", fontSize: 14 }}>
              El enlace de verificación dura 24 horas. Ábrelo en una pestaña o cópialo para enviárselo al cliente.
            </p>
            {kycPrompt.expiresAt ? (
              <p style={{ margin: "0 0 12px", fontSize: 12, color: "#64748b" }}>Expira: {new Date(kycPrompt.expiresAt).toLocaleString("es-MX")}</p>
            ) : null}
            <footer className="mdc-modal-actions">
              <button
                type="button"
                className="mdc-btn mdc-btn--ghost"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(kycPrompt.webviewUrl);
                    setGlobalAlert({ message: "Link KYC copiado al portapapeles.", type: "success" });
                  } catch {
                    setGlobalAlert({ message: "No se pudo copiar el link.", type: "error" });
                  }
                }}
              >
                Copiar link
              </button>
              <a
                className="mdc-btn mdc-btn--primary"
                href={kycPrompt.webviewUrl}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
              >
                Continuar verificación
              </a>
            </footer>
          </div>
        </div>
      ) : null}

      {detailApp && (
        <AppDetailModal
          app={detailApp}
          rules={normalizedRules.filter((rule) => rule.products.includes(detailApp.product as RuleProduct))}
          mode={applicantMode}
          creditStore={creditStore}
          onClose={() => setDetailApp(null)}
        />
      )}

      {flowApp && (
        <ApplicationFlowModal
          key={`${flowApp.id}-${applicantMode}`}
          app={flowApp}
          mode={applicantMode}
          onClose={() => setFlowApp(null)}
        />
      )}

      {uploadApp && (
        <UploadModal
          app={uploadApp}
          onClose={() => setUploadApp(null)}
          onSuccess={(msg) => {
            setGlobalAlert({ message: msg, type: "success" });
            setUploadApp(null);
          }}
          onError={(msg) => {
            setGlobalAlert({ message: msg, type: "error" });
          }}
        />
      )}

      <RuleModal
        key={`${editingPolicyRules.length ? "edit" : "new"}-${showRuleModal ? "open" : "closed"}`}
        open={showRuleModal}
        onClose={() => setShowRuleModal(false)}
        initial={ruleModalState}
        initialBulkRules={editingPolicyRules}
        availableFields={ruleFieldOptions}
        isEditing={Boolean(editingRuleId)}
        products={activeProducts}
        productDetails={productDetails}
        onDelete={() => {
          if (editingRuleId) {
            const rule = rules.find((r) => r.id === editingRuleId);
            setDeleteRuleTarget({
              type: "single",
              ruleId: editingRuleId,
              ruleName: rule?.name || ruleModalState.name || "Regla de crédito",
              product: ruleModalState.product,
            });
          } else if (editingPolicyRules.length > 0) {
            setDeleteRuleTarget({
              type: "policy",
              product: ruleModalState.product,
              ruleIds: editingPolicyRules.map((r) => r.id).filter(Boolean) as string[],
              ruleName: ruleModalState.product,
            });
          }
        }}
        onSave={async (form, duplicateToProduct) => {
          const isDemoOrg = getStoredOrganization()?.id === "demo-bypass-org";
          const decisionBands = buildDecisionBands(form);
          const updatedRule: any = {
            name: form.name || "Nueva regla",
            products: form.product ? [form.product] : [],
            field: form.field || "custom.field",
            operator: form.operator,
            value: form.evaluationMode === "bands" ? "" : form.value || "0",
            dataType: form.dataType,
            severity: form.evaluationMode === "bands" ? "warn" : form.severity,
            description: form.description,
            status: form.status,
            decisionBands,
            individualPerson: applicantMode === "natural",
            legalEntity: applicantMode === "moral",
          };

          if (!isDemoOrg && form.conditions) {
            updatedRule.conditions = form.conditions;
          }

          if (editingRuleId) {
            const ruleBefore = normalizedRules.find(r => r.id === editingRuleId);
            const payrollCondition = !isDemoOrg
              ? form.conditions?.find((condition: any) => condition.type === "payroll_minimum_net_after_deduction")
              : null;
            const patch = payrollCondition
              ? {
                  value: String(payrollCondition.deduction ?? form.value),
                  conditions: form.conditions,
                }
              : updatedRule;
            const saved = await updateRule(editingRuleId, patch, getStoredOrganization()?.id || "demo-bypass-org");
            if (saved) {
              setRules((current) =>
                current.map((rule) => (rule.id === editingRuleId ? { ...rule, ...saved } : rule))
              );
              logTraceabilityAction("ACTUALIZAR", `Modificación de regla "${updatedRule.name}"`, ruleBefore ? `Valor: ${ruleBefore.value}, Operador: ${ruleBefore.operator}` : "Desconocido", `Valor: ${updatedRule.value}, Operador: ${updatedRule.operator}`);
            }
            if (duplicateToProduct && (PRODUCT_RULE_FIELDS[duplicateToProduct] || FALLBACK_RULE_FIELDS).includes(form.field)) {
              const dupRule = { ...updatedRule, products: [duplicateToProduct] };
              const createdDup = await createRule(dupRule, getStoredOrganization()?.id || "demo-bypass-org");
              if (createdDup) {
                setRules((current) => [...current, createdDup]);
              }
            }
            return;
          }

          const created = await createRule(updatedRule, getStoredOrganization()?.id || "demo-bypass-org");
          if (created) {
            setRules((current) => [...current, created]);
            logTraceabilityAction("CREAR", `Creación de regla "${updatedRule.name}"`, "N/A", `Valor: ${updatedRule.value}, Operador: ${updatedRule.operator}`);
          }
        }}
      />

      <RuleViewModal
        open={Boolean(viewingPolicy || viewingRule)}
        policy={viewingPolicy}
        rule={viewingRule}
        productDetails={productDetails}
        onClose={() => {
          setViewingPolicy(null);
          setViewingRule(null);
        }}
        onRuleUpdated={(ruleId, updates) => {
          setRules((current) => current.map((rule) => rule.id === ruleId ? { ...rule, ...updates } : rule));
        }}
      />

      {deleteRuleTarget && (
        <ConfirmDeleteModal
          open={Boolean(deleteRuleTarget)}
          ruleName={deleteRuleTarget.ruleName || deleteRuleTarget.product}
          title={deleteRuleTarget.type === "policy" ? "Eliminar regla de producto" : "Eliminar regla"}
          description={
            deleteRuleTarget.type === "policy"
              ? `¿Estás seguro de que deseas eliminar la configuración de reglas para el producto "${deleteRuleTarget.product}"? Esta acción no se puede deshacer.`
              : `¿Estás seguro de que deseas eliminar la regla "${deleteRuleTarget.ruleName}"? Esta acción no se puede deshacer.`
          }
          isLoading={isDeletingRule}
          onClose={() => setDeleteRuleTarget(null)}
          onConfirm={handleConfirmDeleteRule}
        />
      )}
    </div>
  );
}
