import type {
  CreditClientProfile,
  CreditProductTemplate,
  CreditQuoteResult,
  CrossSellOption,
  ProductRule,
} from "../types/credit-pricing.types";
import { formatMxnFull } from "@/modules/scotia/utils/format-mxn";

function monthlyPayment(principal: number, annualRate: number, months: number): number {
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

const CORE_DISCOUNTS: { key: keyof CreditClientProfile["clientProducts"]; label: string; bps: number }[] = [
  { key: "nomina", label: "Nómina activa", bps: 50 },
  { key: "tdc", label: "TDC activa", bps: 50 },
];

export function calculateCreditQuote(params: {
  product: CreditProductTemplate;
  client: CreditClientProfile;
  rules: ProductRule[];
  crossSellOptions: CrossSellOption[];
  crossSellAccepted: Record<string, boolean>;
}): CreditQuoteResult {
  const { product, client, rules, crossSellOptions, crossSellAccepted } = params;
  const discountsApplied: CreditQuoteResult["discountsApplied"] = [];
  const discountsPotential: CreditQuoteResult["discountsPotential"] = [];
  const rulesEvaluated: string[] = [];
  let rate = product.baseRate;
  let rejected = false;
  let rejectReason = "";

  for (const rule of rules.filter((r) => r.enabled)) {
    rulesEvaluated.push(rule.label);
    if (rule.id.includes("buro") && client.creditScore < 650) {
      if (rule.blocksApproval) {
        rejected = true;
        rejectReason = `Buró ${client.creditScore} < 650`;
      }
    }
    if (rule.id === "r-pers-capacidad" && client.creditScore < 640) {
      rejected = true;
      rejectReason = "Capacidad de pago insuficiente";
    }
    if (rule.id === "r-plazo-monto" && client.amount < product.amountMin) {
      rejected = true;
      rejectReason = `Monto ${client.amount} bajo mínimo`;
    }
    if (rule.id === "r-plazo-kyb" && client.entityType === "PM" && !client.kyb?.beneficialOwnersVerified) {
      rejected = true;
      rejectReason = "KYB incompleto";
    }
  }

  if (client.aiApproved === false) {
    rejected = true;
    rejectReason = rejectReason || "IA · score bajo umbral";
  }

  for (const rule of rules.filter((r) => r.enabled && r.bpsDiscount > 0)) {
    const applies =
      (rule.id.includes("nomina") && client.clientProducts.nomina) ||
      (rule.id.includes("tdc") && client.clientProducts.tdc) ||
      (rule.id.includes("relacion") && client.clientProducts.cuentaAhorro) ||
      (rule.id.includes("eco") && product.id.includes("AUTO-EV")) ||
      (rule.id.includes("volumen") && client.amount >= 2_000_000) ||
      (rule.id.includes("nomina") && rule.id.includes("plazo") && client.clientProducts.nomina);
    if (applies) {
      discountsApplied.push({ label: rule.label, bps: rule.bpsDiscount, applied: true, potential: false });
      rate -= rule.bpsDiscount / 100;
    }
  }

  for (const cd of CORE_DISCOUNTS) {
    if (client.clientProducts[cd.key]) {
      const already = discountsApplied.some((d) => d.label.includes(cd.label.split(" ")[0]!));
      if (!already) {
        discountsApplied.push({ label: cd.label, bps: cd.bps, applied: true, potential: false });
        rate -= cd.bps / 100;
      }
    }
  }

  for (const xs of crossSellOptions) {
    const active = crossSellAccepted[xs.id] === true;
    if (active) {
      discountsApplied.push({ label: xs.label, bps: xs.bps, applied: true, potential: false });
      rate -= xs.bps / 100;
    } else {
      discountsPotential.push({ label: xs.label, bps: xs.bps, applied: false, potential: true });
    }
  }

  rate = Math.max(rate, product.discountBandMin);
  rate = Math.min(rate, product.discountBandMax);

  const openingFeeMxn = Math.round(client.amount * (product.openingFeePct / 100));
  const payment = monthlyPayment(client.amount, rate, client.termMonths);
  const estimatedCat = rate + product.openingFeePct * 0.8;

  let decision: CreditQuoteResult["decision"] = "APROBADO";
  if (rejected) decision = "RECHAZADO";
  else if (client.aiApproved === null) decision = "CONDICIONAL";

  return {
    decision,
    decisionReason: rejectReason || undefined,
    baseRate: product.baseRate,
    finalRate: Math.round(rate * 100) / 100,
    discountsApplied,
    discountsPotential,
    monthlyPayment: Math.round(payment),
    openingFeeMxn,
    estimatedCat: Math.round(estimatedCat * 100) / 100,
    fixedForTerm: product.fixedRateForTerm,
    termMonths: client.termMonths,
    amount: client.amount,
    rulesEvaluated,
  };
}

export interface RuleCompliance {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export function evaluateRuleCompliance(
  client: CreditClientProfile,
  product: CreditProductTemplate,
  rules: ProductRule[],
): RuleCompliance[] {
  return rules.filter((r) => r.enabled).map((rule) => {
    if (rule.id.includes("mora")) {
      const ok = client.creditScore >= 650;
      return { id: rule.id, label: rule.label, passed: ok, detail: ok ? "Sin mora reportada" : "Mora potencial en buró" };
    }
    if (rule.id.includes("enganche")) {
      const ok = client.creditScore >= 640;
      return { id: rule.id, label: rule.label, passed: ok, detail: ok ? "Enganche ≥ 20% validado" : "Enganche insuficiente" };
    }
    if (rule.id.includes("capacidad") && client.kyc.incomeMonthly) {
      const payment = client.amount / client.termMonths;
      const ratio = (payment / client.kyc.incomeMonthly) * 100;
      const ok = ratio <= 35;
      return { id: rule.id, label: rule.label, passed: ok, detail: ok ? `${ratio.toFixed(0)}% capacidad` : `${ratio.toFixed(0)}% excede 35%` };
    }
    if (rule.id.endsWith("-plazo")) {
      const ok = client.termMonths >= product.termMinMonths && client.termMonths <= product.termMaxMonths;
      return { id: rule.id, label: rule.label, passed: ok, detail: ok ? `${client.termMonths} meses` : "Plazo no permitido" };
    }
    if (rule.id.includes("aml")) {
      const ok = !client.kyb || client.kyb.amlRisk !== "ALTO";
      return { id: rule.id, label: rule.label, passed: ok, detail: ok ? `AML ${client.kyb?.amlRisk ?? "N/A"}` : "AML alto" };
    }
    if (rule.id.includes("eco")) {
      const ok = product.id.includes("AUTO-EV");
      return { id: rule.id, label: rule.label, passed: ok, detail: ok ? "Producto eco elegible" : "No aplica" };
    }
    if (rule.id.includes("seguro")) {
      const ok = client.clientProducts.seguroAuto || client.creditScore >= 650;
      return { id: rule.id, label: rule.label, passed: ok, detail: ok ? "Seguro en orden" : "Seguro pendiente" };
    }
    if (rule.id.includes("buro") || rule.id === "r-pers-buro") {
      const ok = client.creditScore >= 650;
      return { id: rule.id, label: rule.label, passed: ok, detail: ok ? `Score ${client.creditScore}` : `Score ${client.creditScore} insuficiente` };
    }
    if (rule.id.includes("kyc")) {
      const ok = client.kyc.idVerified && !client.kyc.pep;
      return { id: rule.id, label: rule.label, passed: ok, detail: ok ? "KYC verificado" : "KYC pendiente o PEP" };
    }
    if (rule.id.includes("kyb")) {
      const ok = client.entityType === "PF" || (client.kyb?.beneficialOwnersVerified ?? false);
      return { id: rule.id, label: rule.label, passed: ok, detail: ok ? "KYB completo" : "KYB incompleto" };
    }
    if (rule.id.includes("monto") && rule.blocksApproval) {
      const ok = client.amount >= product.amountMin;
      return { id: rule.id, label: rule.label, passed: ok, detail: ok ? formatMxnCredit(client.amount) : "Bajo mínimo" };
    }
    if (rule.id === "r-pers-monto" && client.kyc.incomeMonthly) {
      const ok = client.amount <= client.kyc.incomeMonthly * 18;
      return { id: rule.id, label: rule.label, passed: ok, detail: ok ? "Dentro de tope" : "Excede 18× ingreso" };
    }
    if (rule.id.includes("nomina")) {
      const ok = client.clientProducts.nomina;
      return { id: rule.id, label: rule.label, passed: ok, detail: ok ? "Nómina activa" : "Sin nómina" };
    }
    if (rule.id.includes("tdc")) {
      const ok = client.clientProducts.tdc;
      return { id: rule.id, label: rule.label, passed: ok, detail: ok ? "TDC activa" : "Sin TDC" };
    }
    if (rule.id.includes("volumen")) {
      const ok = client.amount >= 2_000_000;
      return { id: rule.id, label: rule.label, passed: ok, detail: ok ? "Volumen preferente" : "Bajo umbral $2M" };
    }
    if (rule.id.includes("relacion")) {
      const ok = client.clientProducts.cuentaAhorro;
      return { id: rule.id, label: rule.label, passed: ok, detail: ok ? "Relación > 2 años" : "Relación nueva" };
    }
    return { id: rule.id, label: rule.label, passed: true, detail: "Cumple" };
  });
}

export function crossSellRatePreview(
  baseBeforeCross: number,
  floor: number,
  options: CrossSellOption[],
  accepted: Record<string, boolean>,
  throughIndex: number,
  hypotheticallyAddIndex?: number,
): number {
  let bps = 0;
  for (let i = 0; i <= throughIndex; i++) {
    const on = accepted[options[i]!.id] || i === hypotheticallyAddIndex;
    if (on) bps += options[i]!.bps;
  }
  return Math.max(Math.round((baseBeforeCross - bps / 100) * 100) / 100, floor);
}

export function formatMxnCredit(value: number): string {
  return formatMxnFull(value);
}

export function formatPctCredit(value: number | string): string {
  const num = Number(value);
  if (isNaN(num)) return `${value}%`;
  return `${num.toFixed(2)}%`;
}

export function rateBeforeCrossSell(
  baseRate: number,
  discounts: { label: string; bps: number }[],
  crossSellLabels: string[],
): number {
  const core = discounts.filter((d) => !crossSellLabels.some((xs) => d.label.includes(xs) || xs.includes(d.label.split(" ")[0]!)));
  const totalBps = core.reduce((s, d) => s + d.bps, 0);
  return Math.round((baseRate - totalBps / 100) * 100) / 100;
}

export function aiPropensity(client: CreditClientProfile): number {
  let score = Math.min(95, Math.round(client.creditScore / 10));
  if (client.clientProducts.nomina) score += 3;
  if (client.clientProducts.tdc) score += 2;
  return Math.min(98, score);
}

export function runAiBatch(clients: CreditClientProfile[]) {
  return clients.map((c) => {
    const approved = c.creditScore >= 650;
    return {
      clientId: c.id,
      clientName: c.name,
      score: c.creditScore,
      approved,
      reason: approved ? "Score y capacidad dentro de política" : "Score bajo umbral · mora potencial",
    };
  });
}
