import { type CreditRuleRow, CREDIT_RULES_BY_MODE } from "../data/mdc-rules-mock";
import { customFetch, getMdcApiBaseUrl } from "./mdc-api-client";

const getBaseUrl = (): string => getMdcApiBaseUrl();

// In-memory store for demo bypass org
let demoRulesNatural = [...CREDIT_RULES_BY_MODE.natural];
let demoRulesMoral = [...CREDIT_RULES_BY_MODE.moral];

export const resetDemoRulesState = (): void => {
  demoRulesNatural = [...CREDIT_RULES_BY_MODE.natural];
  demoRulesMoral = [...CREDIT_RULES_BY_MODE.moral];
};

export const fetchRules = async (mode: "natural" | "moral", orgId: string): Promise<CreditRuleRow[]> => {
  if (orgId === "demo-bypass-org") {
    return mode === "natural" ? [...demoRulesNatural] : [...demoRulesMoral];
  }

  const params = new URLSearchParams({ mode, orgId });
  const url = `${getBaseUrl()}/decision-rules?${params.toString()}`;
  const response = await customFetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.warn("Failed to fetch rules", response.statusText);
    return [];
  }
  return response.json();
};

function extractFinanceProductsPayload(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of ["data", "items", "products", "result"]) {
      if (Array.isArray(record[key])) return record[key] as Record<string, unknown>[];
    }
  }
  return [];
}

export const fetchFinanceProducts = async (orgId: string): Promise<Record<string, unknown>[]> => {
  if (orgId === "demo-bypass-org") {
    console.log("[MDC][products] fetchFinanceProducts demo-bypass-org → []");
    return [];
  }
  const url = `${getBaseUrl()}/finance-products?orgId=${encodeURIComponent(orgId)}`;
  console.log("[MDC][products] GET", url);
  const response = await customFetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const rawText = await response.text();
  let payload: unknown = rawText;
  try {
    payload = rawText ? JSON.parse(rawText) : null;
  } catch {
    payload = rawText;
  }
  const items = extractFinanceProductsPayload(payload);
  console.log("[MDC][products] response", {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    url,
    rawText,
    payload,
    extractedCount: items.length,
    extracted: items,
  });
  if (!response.ok) {
    console.warn("[MDC][products] Failed to fetch finance products", response.status, response.statusText);
    return [];
  }
  return items;
};

type DecisionRuleDtiMetrics = {
  averageDti?: number | string;
  averageDTI?: number | string;
  dti?: number | string;
  dtiAverage?: number | string;
  average_dti?: number | string;
};

export type DecisionRuleEvaluationResponse = DecisionRuleDtiMetrics & {
  decision: string;
  status: string;
  riskLevel: string;
  riskIndex?: number | string | null;
  reasons?: string[];
  summary?: {
    totalRules: number;
    evaluatedRules: number;
    approvedRules: number;
    reviewRules: number;
    rejectedRules: number;
    passedRules: number;
    failedRules: number;
  };
  rulesBreakdown?: Array<DecisionRuleDtiMetrics & {
    id: string;
    name: string;
    status: string;
    passed?: boolean;
    reason?: string;
  }>;
};

export type UserRulesResponse = {
  id: string;
  orgId: string;
  userId: string;
  rule: Record<string, string>;
  finalDecision?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function fetchUserRules(orgId: string, userId: string): Promise<UserRulesResponse | null> {
  const params = new URLSearchParams({ orgId, userId });
  const response = await customFetch(`${getBaseUrl()}/user-rules?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) return null;

  const payload: unknown = await response.json().catch(() => null);
  const record = Array.isArray(payload) ? payload[0] : payload;
  if (!record || typeof record !== "object") return null;
  const userRules = record as UserRulesResponse;
  return userRules.rule && typeof userRules.rule === "object" ? userRules : null;
}

export async function evaluateDecisionRule(ruleId: string, payload: { orgId: string; userId: string }): Promise<DecisionRuleEvaluationResponse> {
  const response = await customFetch(`${getBaseUrl()}/decision-rules/${encodeURIComponent(ruleId)}/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || `No fue posible ejecutar la regla (${response.status}).`);
  }

  return response.json();
}

export const createRule = async (rule: Partial<CreditRuleRow>, orgId: string): Promise<CreditRuleRow | null> => {
  if (orgId === "demo-bypass-org") {
    const newRule = { ...rule, id: `cr-mock-${Date.now()}` } as CreditRuleRow;
    demoRulesNatural = [...demoRulesNatural, newRule];
    demoRulesMoral = [...demoRulesMoral, newRule];
    return newRule;
  }

  const url = `${getBaseUrl()}/decision-rules`;
  const response = await customFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...rule, orgId }),
  });

  if (!response.ok) {
    console.error("Failed to create rule", response.statusText);
    return null;
  }
  return response.json();
};

export const updateRule = async (id: string, rule: Partial<CreditRuleRow>, orgId?: string): Promise<CreditRuleRow | null> => {
  if (orgId === "demo-bypass-org") {
    const updateInArray = (arr: CreditRuleRow[]) =>
      arr.map((r) => (r.id === id ? { ...r, ...rule } : r));
    demoRulesNatural = updateInArray(demoRulesNatural);
    demoRulesMoral = updateInArray(demoRulesMoral);
    return { ...demoRulesNatural.find((r) => r.id === id)!, ...rule } as CreditRuleRow;
  }

  const url = `${getBaseUrl()}/decision-rules/${id}`;
  const response = await customFetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(rule),
  });

  if (!response.ok) {
    console.error("Failed to update rule", response.statusText);
    return null;
  }
  return response.json();
};

export const deleteRule = async (id: string, orgId?: string): Promise<boolean> => {
  const cleanId = id.split("::")[0];
  if (orgId === "demo-bypass-org") {
    demoRulesNatural = demoRulesNatural.filter((r) => r.id !== id && r.id !== cleanId);
    demoRulesMoral = demoRulesMoral.filter((r) => r.id !== id && r.id !== cleanId);
    return true;
  }

  const query = orgId ? `?orgId=${encodeURIComponent(orgId)}` : "";
  const url = `${getBaseUrl()}/decision-rules/${cleanId}${query}`;
  try {
    const response = await customFetch(url, {
      method: "DELETE",
    });
    if (!response.ok) {
      console.warn(`Backend failed to delete rule ${cleanId} (status: ${response.status}), applying optimistically in UI`);
    }
  } catch (err) {
    console.warn(`Network error deleting rule ${cleanId}, applying optimistically in UI`, err);
  }
  return true;
};
