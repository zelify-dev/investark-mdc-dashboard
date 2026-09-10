import { Loan, LoanProductDefinition, LoanScheduleItem, LoanTransaction, LoanTranche } from "../types/loan-lifecycle.types";

async function requestJson<T>(input: string, init?: RequestInit): Promise<{ response: Response; json: T | null }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    const text = await response.text();
    const json = text ? JSON.parse(text) as T : null;
    return { response, json };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Tiempo de espera agotado.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const loansLifecycleService = {
  async listLoans(): Promise<Loan[]> {
    const { response, json } = await requestJson<{ data: Loan[]; error?: string }>("/api/loans", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return json?.data ?? [];
  },
  async listLoanProducts(): Promise<LoanProductDefinition[]> {
    const { response, json } = await requestJson<{
      data: Array<{
        id: string;
        name: string;
        code: string;
        badge: string | null;
        description: string | null;
        subtype_of: string | null;
        is_active: boolean;
      }>;
      error?: string;
    }>("/api/product-type-definitions?kind=LOAN", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (json?.data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      badge: p.badge,
      description: p.description,
      subtypeOf: p.subtype_of,
      isActive: p.is_active,
    }));
  },
  async createLoan(payload: {
    id: string;
    productTypeId: string;
    customerId: string;
    customerName: string;
    principalAmount: number;
    expectedDisbursementDate: string;
    nominalRate: number;
    disbursementChannel: string;
  }): Promise<void> {
    const { response, json } = await requestJson<{ error?: string }>("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(json?.error ?? `HTTP ${response.status}`);
  },
  async applyAction(
    loanId: string,
    payload: { action: string; [k: string]: unknown },
  ): Promise<{ ok: boolean; lifecycleState?: string }> {
    const { response, json } = await requestJson<{ ok?: boolean; lifecycleState?: string; error?: string }>(`/api/loans/${loanId}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(json.error ?? `HTTP ${response.status}`);
    return { ok: Boolean(json.ok), lifecycleState: json.lifecycleState };
  },
  async getSchedule(loanId: string): Promise<LoanScheduleItem[]> {
    const { response, json } = await requestJson<{ data: LoanScheduleItem[]; error?: string }>(`/api/loans/${loanId}/schedule`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return json?.data ?? [];
  },
  async getTransactions(loanId: string): Promise<LoanTransaction[]> {
    const { response, json } = await requestJson<{ data: LoanTransaction[]; error?: string }>(`/api/loans/${loanId}/transactions`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return json?.data ?? [];
  },
  async getTranches(loanId: string): Promise<LoanTranche[]> {
    const { response, json } = await requestJson<{ data: LoanTranche[]; error?: string }>(`/api/loans/${loanId}/tranches`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return json?.data ?? [];
  },
};
