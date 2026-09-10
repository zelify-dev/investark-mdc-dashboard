import { DepositAccount, DepositHold, DepositTransaction } from "../types/deposit-lifecycle.types";

export const depositsLifecycleService = {
  async listAccounts(): Promise<DepositAccount[]> {
    const response = await fetch("/api/deposits", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = (await response.json()) as { data: DepositAccount[] };
    return json.data ?? [];
  },
  async createAccount(payload: {
    id: string;
    productTypeId: string;
    holderKind: "INDIVIDUAL" | "COMPANY";
    holderId: string;
    holderName: string;
    branchId?: string;
    nominalRate: number;
    overdraftLimit: number;
  }): Promise<void> {
    const response = await fetch("/api/deposits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  },
  async getTransactions(accountId: string): Promise<DepositTransaction[]> {
    const response = await fetch(`/api/deposits/${accountId}/transactions`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = (await response.json()) as { data: DepositTransaction[] };
    return json.data ?? [];
  },
  async getHolds(accountId: string): Promise<DepositHold[]> {
    const response = await fetch(`/api/deposits/${accountId}/holds`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = (await response.json()) as { data: DepositHold[] };
    return json.data ?? [];
  },
  async applyAction(accountId: string, payload: { action: string; [k: string]: unknown }): Promise<void> {
    const response = await fetch(`/api/deposits/${accountId}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  },
};
