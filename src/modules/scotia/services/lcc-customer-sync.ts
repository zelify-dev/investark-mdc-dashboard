import type { CreditClientProfile, CreditDemoState } from "@/modules/cortex/types/credit-pricing.types";
import type { Customer } from "@/modules/customers/types/customer.types";
import { DEMO_STORAGE_KEYS, readDemoJson, writeDemoJson } from "@/lib/demo-storage";
import {
  LCC_CUSTOMER_ELIGIBLE_FROM,
  LCC_DEFAULT_CREDIT_ROTATION,
} from "../constants/lcc-customer-sync.constants";
import { buildFullLimClientList, syncLimBalancesFromCredit } from "../data/scotia-demo-bridge";
import type { LimDemoState } from "@/modules/lim/types/deposit-pricing.types";
import { recalculateAllClientRates } from "@/modules/lim/services/deposit-pricing.engine";

/** Disparado al registrar un cliente para LCC (misma pestaña u otra). */
export const LCC_CUSTOMERS_CHANGED_EVENT = "zelify:lcc-customers-changed";
const LEGACY_NARIAT_SOURCE_ID = "CU-841200";
const LEGACY_NARIAT_BIRTH_DATE = "1990-01-01";
const LEGACY_NARIAT_NAME = "NARIT OSBALD BENITEZ LEON";

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function isLegacyNariatInboundCustomer(customer: Customer): boolean {
  return (
    customer.id === LEGACY_NARIAT_SOURCE_ID &&
    customer.birthDate === LEGACY_NARIAT_BIRTH_DATE &&
    normalizeName(customer.fullName) === LEGACY_NARIAT_NAME
  );
}

function dateOnly(isoOrDate: string): string {
  return isoOrDate.slice(0, 10);
}

/** API / histórico: solo desde el 24-may-2026. */
export function isEligibleForLcc(customer: Customer): boolean {
  const marker = customer.createdAt ?? customer.lastModified;
  if (!marker) return false;
  return dateOnly(marker) >= LCC_CUSTOMER_ELIGIBLE_FROM;
}

function inferEntityType(customer: Customer): "PF" | "PM" {
  const name = customer.fullName.toUpperCase();
  if (/\b(S\.?A\.?|SAPI|SA DE CV|SC|SPR|SPRIM)\b/.test(name)) return "PM";
  return "PF";
}

function simpleRfc(customer: Customer): string {
  const parts = customer.fullName.trim().split(/\s+/);
  const first = (parts[0] ?? "XX").slice(0, 2).toUpperCase();
  const last = (parts[parts.length - 1] ?? "XX").slice(0, 2).toUpperCase();
  const birth = customer.birthDate?.replace(/-/g, "").slice(2, 8) ?? "900101";
  return `${first}${last}${birth}XX1`.slice(0, 13);
}

function creditScoreForCustomer(customer: Customer, slot: number): number {
  const base = customer.kycStatus === "VERIFIED" ? 720 : 650;
  return Math.min(850, base + (slot % 5) * 12);
}

export function creditSlotIndexForCustomer(customerId: string, totalBefore = 0): number {
  let hash = 0;
  for (let i = 0; i < customerId.length; i++) hash = (hash + customerId.charCodeAt(i)) % 997;
  return (totalBefore + hash) % LCC_DEFAULT_CREDIT_ROTATION.length;
}

export function customerToCreditClient(
  customer: Customer,
  slotIndex: number,
): CreditClientProfile {
  const slot = LCC_DEFAULT_CREDIT_ROTATION[slotIndex % LCC_DEFAULT_CREDIT_ROTATION.length]!;
  const entityType = slot.preferEntityType === "PM" && inferEntityType(customer) === "PM" ? "PM" : "PF";
  const amount = slot.amount;

  const kycVerified = customer.kycStatus === "VERIFIED" || customer.kycStatus === undefined;
  const amlApproved = customer.amlStatus === "CLEAR" || customer.amlStatus === undefined;

  return {
    id: `CL-LCC-${customer.id}`,
    sourceCustomerId: customer.id,
    productId: slot.productId,
    name: customer.fullName,
    entityType,
    amount,
    termMonths: slot.termMonths,
    creditScore: creditScoreForCustomer(customer, slotIndex),
    aiApproved: null,
    clientProducts: {
      nomina: kycVerified,
      tdc: kycVerified,
      seguroAuto: slot.productId === "AUTO-EV-01",
      inversionPatrimonial: false,
      cuentaAhorro: true,
    },
    kyc: {
      curp: customer.documentType === "CURP" ? customer.documentNumber : undefined,
      idDocument: customer.documentNumber,
      rfc: customer.documentType === "RFC" ? customer.documentNumber : simpleRfc(customer),
      birthDate: customer.birthDate || undefined,
      nationality: "Mexicana",
      address: customer.address ?? "México",
      phone: customer.mobilePhone || "+52",
      email: customer.email || `${customer.id}@zelify.local`,
      idVerified: kycVerified,
      amlApproved,
      pep: false,
      incomeMonthly: Math.round(amount / 18),
    },
    kyb:
      entityType === "PM"
        ? {
            rfc: customer.documentType === "RFC" ? customer.documentNumber : simpleRfc(customer),
            legalName: customer.fullName,
            sector: "Comercial",
            employees: 25,
            annualRevenue: amount * 4,
            beneficialOwnersVerified: kycVerified,
            amlRisk: amlApproved ? "BAJO" : "MEDIO",
          }
        : undefined,
  };
}

export function mergeCustomersIntoCreditState(
  state: CreditDemoState,
  customers: Customer[],
  options?: { includeAllInbound?: boolean },
): CreditDemoState {
  const inboundPinned = readLccInboundCustomers();
  const pinnedIds = new Set(inboundPinned.map((c) => c.id));

  const toProcess = customers.filter((c) => {
    if (pinnedIds.has(c.id)) return true;
    if (options?.includeAllInbound) return true;
    return isEligibleForLcc(c);
  });

  const mergedList = dedupeCustomers([...inboundPinned, ...toProcess]);
  if (mergedList.length === 0) return state;

  const existingSource = new Set(
    state.clients.map((c) => c.sourceCustomerId).filter((id): id is string => Boolean(id)),
  );
  const existingIds = new Set(state.clients.map((c) => c.id));

  const toAdd: CreditClientProfile[] = [];
  let slot = state.clients.length;

  for (const customer of mergedList) {
    if (existingSource.has(customer.id)) continue;
    const profile = customerToCreditClient(customer, creditSlotIndexForCustomer(customer.id, slot));
    if (existingIds.has(profile.id)) continue;
    toAdd.push(profile);
    existingIds.add(profile.id);
    existingSource.add(customer.id);
    slot += 1;
  }

  if (toAdd.length === 0) return state;

  const firstNew = toAdd[0]!;

  return {
    ...state,
    clients: [...state.clients, ...toAdd],
    selectedClientId: firstNew.id,
    selectedProductId: firstNew.productId,
    auditLog: [
      {
        id: `credit-lcc-sync-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "LCC_SYNC",
        details: `+${toAdd.length} cliente(s) Zelify → LCC · ${toAdd.map((c) => `${c.name} · ${c.productId}`).join(", ")}`,
        user: "Sistema LCC",
        channel: "Consola",
        correlationId: `corr-lcc-${Date.now()}`,
      },
      ...state.auditLog,
    ].slice(0, 50),
  };
}

export function mergeCustomersIntoLimState(
  limState: LimDemoState,
  creditClients: CreditClientProfile[],
): LimDemoState {
  const withClients = {
    ...limState,
    clients: buildFullLimClientList(creditClients),
  };
  return syncLimBalancesFromCredit(recalculateAllClientRates(withClients), creditClients);
}

export function readLccInboundCustomers(): Customer[] {
  const list = readDemoJson<Customer[]>(DEMO_STORAGE_KEYS.lccInboundCustomers, []);
  const cleaned = list.filter((customer) => !isLegacyNariatInboundCustomer(customer));
  if (cleaned.length !== list.length) {
    writeDemoJson(DEMO_STORAGE_KEYS.lccInboundCustomers, cleaned);
  }
  return cleaned;
}

/** Siempre guarda el cliente para LCC (sin filtro de fecha). */
export function registerZelifyCustomerForLcc(customer: Customer): void {
  const withMeta: Customer = {
    ...customer,
    createdAt: customer.createdAt ?? new Date().toISOString(),
    lastModified: customer.lastModified ?? new Date().toISOString().slice(0, 10),
  };
  const list = readLccInboundCustomers();
  const idx = list.findIndex((c) => c.id === withMeta.id);
  if (idx >= 0) list[idx] = withMeta;
  else list.push(withMeta);
  writeDemoJson(DEMO_STORAGE_KEYS.lccInboundCustomers, list);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LCC_CUSTOMERS_CHANGED_EVENT, { detail: { customerId: withMeta.id } }));
  }
}

export function dedupeCustomers(customers: Customer[]): Customer[] {
  const map = new Map<string, Customer>();
  for (const c of customers) map.set(c.id, c);
  return [...map.values()];
}

export async function fetchZelifyCustomersForLcc(): Promise<Customer[]> {
  try {
    const res = await fetch("/api/customers", { cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: Customer[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export function collectCustomersForLccSync(): Customer[] {
  const local = readLccInboundCustomers();
  return dedupeCustomers(local);
}
