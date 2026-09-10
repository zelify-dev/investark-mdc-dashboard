import { getStoredOrganization, getStoredUser } from "@/lib/auth-api";
import { createTraceabilityLog } from "./mdc-traceability.service";
import { customFetch, getMdcApiBaseUrl } from "./mdc-api-client";
const API_URL = getMdcApiBaseUrl();

export type PaymentInstallment = {
  id?: string;
  installmentNumber: number;
  status: string;
  amount: number;
  dueDate: string;
  amountPaid?: number;
  principal?: number;
  interest?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type PaymentSession = {
  id?: string;
  userId: string;
  orgId?: string;
  applicantId: string;
  status: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  errorCode?: string;
  retryable?: boolean;
  individualPerson?: boolean;
  legalEntity?: boolean;
  plazo?: number | null;
  interestRate?: number | null;
  paymentFrequency?: string | null;
  principalAmount?: number | null;
  totalInterest?: number | null;
  totalAmount?: number | null;
  creditBalance?: number | null;
  installments?: PaymentInstallment[];
  createdAt?: string;
  updatedAt?: string;
  customerName?: string;
  identificationNumber?: string | null;
  product?: string | null;
  requestCode?: string;
  ficha?: string | null;
  bdaNombre?: string | null;
  lastImportedFicha?: string | null;
  lastImportedNombre?: string | null;
  lastImportedAmount?: number | null;
  lastImportedStatus?: string | null;
};

export type BankTransactionDTO = {
  id: string;
  orgId: string;
  bankReference: string;
  applicantNameRaw: string;
  amount: number;
  isMatched: boolean;
  matchedUserId?: string;
  createdAt: string;
};

export async function fetchPayments(mode: "natural" | "moral"): Promise<PaymentSession[]> {
  try {
    const res = await customFetch(`${API_URL}/payments?mode=${mode}`);
    if (!res.ok) throw new Error("Failed to fetch payments");
    return res.json();
  } catch (error) {
    console.warn("No se pudieron consultar pagos desde el backend, usando fallback vacio.", error);
    return [];
  }
}

export async function fetchPaymentByApplicant(applicantId: string): Promise<PaymentSession | null> {
  if (!applicantId) return null;
  try {
    const res = await customFetch(`${API_URL}/payments/by-applicant/${encodeURIComponent(applicantId)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch payment calendar");
    return res.json();
  } catch (error) {
    console.warn("No se pudo consultar el calendario de pagos.", error);
    return null;
  }
}

export async function createPayment(data: PaymentSession): Promise<PaymentSession | null> {
  try {
    const res = await customFetch(`${API_URL}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create payment");

    const created = await res.json();
    const orgId = getStoredOrganization()?.id || "demo-bypass-org";
    if (orgId !== "demo-bypass-org") {
      await createTraceabilityLog({
        orgId,
        action: "PAYMENT_CREATE",
        detail: `Pago creado por $${created.amount}`,
        channel: "Consola",
        userName: getStoredUser()?.first_name ? `${getStoredUser()?.first_name} ${getStoredUser()?.last_name || ""}`.trim() : "Ejecutivo Zelify",
        correlationId: `corr-pay-${created.id ? created.id.substring(0, 8) : Date.now()}`,
      });
    }
    return created;
  } catch (error) {
    console.warn("No se pudo crear el pago.", error);
    return null;
  }
}

export async function updatePayment(id: string, data: Partial<PaymentSession>): Promise<PaymentSession | null> {
  try {
    const res = await customFetch(`${API_URL}/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update payment");
    const updated = await res.json();
    const orgId = getStoredOrganization()?.id || "demo-bypass-org";
    if (orgId !== "demo-bypass-org") {
      await createTraceabilityLog({
        orgId,
        action: "PAYMENT_UPDATE",
        detail: `Pago actualizado`,
        channel: "Consola",
        userName: getStoredUser()?.first_name ? `${getStoredUser()?.first_name} ${getStoredUser()?.last_name || ""}`.trim() : "Ejecutivo Zelify",
        correlationId: `corr-pay-${id.substring(0, 8)}`,
      });
    }
    return updated;
  } catch (error) {
    console.warn("No se pudo actualizar el pago.", error);
    return null;
  }
}

export async function deletePayment(id: string): Promise<boolean> {
  try {
    const res = await customFetch(`${API_URL}/payments/${id}`, {
      method: "DELETE",
    });
    const ok = res.ok;
    if (ok) {
      const orgId = getStoredOrganization()?.id || "demo-bypass-org";
      if (orgId !== "demo-bypass-org") {
        await createTraceabilityLog({
          orgId,
          action: "PAYMENT_DELETE",
          detail: `Pago eliminado`,
          channel: "Consola",
          userName: getStoredUser()?.first_name ? `${getStoredUser()?.first_name} ${getStoredUser()?.last_name || ""}`.trim() : "Ejecutivo Zelify",
          correlationId: `corr-pay-del-${Date.now()}`,
        });
      }
    }
    return ok;
  } catch (error) {
    console.warn("No se pudo eliminar el pago.", error);
    return false;
  }
}

// --- Bank Transactions Integration ---

export type PaymentUploadRowResult = {
  ficha: string;
  nombre: string;
  amount: number;
  status:
    | "CAPTURADO"
    | "PARCIAL"
    | "SALDO_A_FAVOR"
    | "CREDITO_SIN_FICHA"
    | "SIN_CREDITO"
    | "NO_ENCONTRADO"
    | "SIN_CUENTA";
  userId?: string;
  applicantId?: string;
  collectionId?: string;
  amountDue?: number;
  creditBalance?: number;
  alert?: string;
};

export type PaymentUploadResult = {
  success: boolean;
  message?: string;
  processed?: number;
  matched?: number;
  partial?: number;
  unmatched?: number;
  overpaid?: number;
  noCredit?: number;
  collectionsCreated?: number;
  rows?: PaymentUploadRowResult[];
};

export async function uploadPaymentsFile(
  file: File,
  orgId: string,
  mode: "natural" | "moral" = "natural",
): Promise<PaymentUploadResult> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await customFetch(
      `${API_URL}/payments/upload?orgId=${encodeURIComponent(orgId)}&mode=${encodeURIComponent(mode)}`,
      { method: "POST", body: formData },
    );

    if (!res.ok) return { success: false, message: "Error al subir archivo" };

    const data = (await res.json()) as PaymentUploadResult;

    if (orgId !== "demo-bypass-org") {
      await createTraceabilityLog({
        orgId,
        action: "PAYMENT_UPLOAD",
        detail: data.message || `Archivo de pagos XLSX subido: ${file.name}`,
        channel: "Consola",
        userName: getStoredUser()?.first_name ? `${getStoredUser()?.first_name} ${getStoredUser()?.last_name || ""}`.trim() : "Ejecutivo Zelify",
        correlationId: `corr-pay-upl-${Date.now()}`,
      });
    }

    return {
      success: true,
      message: data.message || "Archivo subido exitosamente",
      processed: data.processed,
      matched: data.matched,
      partial: data.partial,
      unmatched: data.unmatched,
      overpaid: data.overpaid,
      noCredit: data.noCredit,
      collectionsCreated: data.collectionsCreated,
      rows: data.rows,
    };
  } catch (error) {
    console.warn("No se pudo subir el archivo de pagos.", error);
    return { success: false, message: "Error de red" };
  }
}

export async function fetchBankTransactions(orgId: string): Promise<BankTransactionDTO[]> {
  try {
    const res = await customFetch(`${API_URL}/payments/transactions?orgId=${encodeURIComponent(orgId)}`);
    if (!res.ok) {
      console.warn("Backend retornó un error al buscar transacciones bancarias, devolviendo lista vacía");
      return [];
    }
    return res.json();
  } catch (error) {
    console.warn("Fallo de red al buscar transacciones bancarias, devolviendo lista vacía", error);
    return [];
  }
}

export async function matchBankTransaction(id: string, userId: string): Promise<boolean> {
  try {
    const res = await customFetch(`${API_URL}/payments/transactions/${id}/match`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const ok = res.ok;

    if (ok) {
      const orgId = getStoredOrganization()?.id || "ORG-001";
      if (orgId !== "demo-bypass-org") {
        await createTraceabilityLog({
          orgId,
          action: "PAYMENT_MATCH",
          detail: `Transacción bancaria enlazada a usuario`,
          channel: "Consola",
          userName: getStoredUser()?.first_name ? `${getStoredUser()?.first_name} ${getStoredUser()?.last_name || ""}`.trim() : "Ejecutivo Zelify",
          correlationId: `corr-pay-mtch-${id.substring(0, 8)}`,
        });
      }
    }
    return ok;
  } catch (error) {
    console.warn("No se pudo enlazar la transaccion bancaria.", error);
    return false;
  }
}
