"use client";

import { useCallback, useEffect, useState } from "react";
import { getStoredOrganization } from "@/lib/auth-api";
import { DEMO_STORAGE_KEYS, readDemoJson, writeDemoJson } from "@/lib/demo-storage";
import {
  clientsForProduct,
  createFreshCreditDemoState,
  enrichCreditAuditLog,
  getClient,
  getProduct,
  getDefaultQuoteContext,
  mergeCreditDemoState,
} from "../data/scotiabank-credit.seed";
import { calculateCreditQuote, runAiBatch } from "../services/credit-pricing.engine";
import { CATEGORY_PRODUCT_ID } from "../data/credit-catalog";
import type { CreditDemoState, CreditProductCategory, CreditProductTemplate } from "../types/credit-pricing.types";
import type { Customer } from "@/modules/customers/types/customer.types";
import {
  collectCustomersForLccSync,
  fetchZelifyCustomersForLcc,
  mergeCustomersIntoCreditState,
} from "@/modules/scotia/services/lcc-customer-sync";
import type { CreditClientProfile } from "../types/credit-pricing.types";

const LEGACY_NARIAT_SEED_ID = "CL-LCC-CU-841200";
const LEGACY_NARIAT_SOURCE_ID = "CU-841200";
const LEGACY_NARIAT_CURP = "BELN900101HDFNNR09";
const LEGACY_NARIAT_BIRTH_DATE = "1990-01-01";
const LEGACY_DISPLAY_CLIENTS = new Set(["Roberto Méndez García", "María González Ruiz"]);

function preferredClientForProduct(state: CreditDemoState, productId: string, fallbackClientId = state.selectedClientId) {
  const candidates = state.clients.filter((client) => client.productId === productId);
  const preferred = candidates.find((client) => client.sourceCustomerId) ?? candidates.find((client) => !LEGACY_DISPLAY_CLIENTS.has(client.name));
  return preferred?.id ?? candidates[0]?.id ?? fallbackClientId;
}

function normalizeSelectedClient(state: CreditDemoState): CreditDemoState {
  const preferredId = preferredClientForProduct(state, state.selectedProductId);
  if (preferredId === state.selectedClientId) return state;
  return {
    ...state,
    selectedClientId: preferredId,
  };
}

function isLegacyNariatSeedClient(client: CreditClientProfile): boolean {
  return (
    client.id === LEGACY_NARIAT_SEED_ID &&
    client.sourceCustomerId === LEGACY_NARIAT_SOURCE_ID &&
    client.kyc?.curp === LEGACY_NARIAT_CURP &&
    client.kyc?.birthDate === LEGACY_NARIAT_BIRTH_DATE
  );
}

function stripLegacyNariatSeed(state: CreditDemoState): CreditDemoState {
  const clients = state.clients.filter((client) => !isLegacyNariatSeedClient(client));
  if (clients.length === state.clients.length) return state;

  const nextSelectedClientId = clients.some((client) => client.id === state.selectedClientId)
    ? state.selectedClientId
    : preferredClientForProduct({ ...state, clients } as CreditDemoState, state.selectedProductId, clients[0]?.id ?? "");

  const nextSelectedProductId = clients.some((client) => client.id === nextSelectedClientId)
    ? (clients.find((client) => client.id === nextSelectedClientId)?.productId ?? state.selectedProductId)
    : state.selectedProductId;

  return {
    ...state,
    clients,
    selectedClientId: nextSelectedClientId,
    selectedProductId: nextSelectedProductId,
    aiBatchResults: state.aiBatchResults.filter((result) => result.clientId !== LEGACY_NARIAT_SEED_ID),
    auditLog: [
      {
        id: `audit-remove-legacy-nariat-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "DATA_CLEANUP",
        details: "Se removió cliente seed heredado CU-841200 para pruebas de re-registro.",
        user: "Sistema",
        channel: "Consola",
        correlationId: `corr-cleanup-${Date.now()}`,
      },
      ...state.auditLog,
    ].slice(0, 50),
  };
}

function loadCreditState(): CreditDemoState {
  const stored = readDemoJson<CreditDemoState | null>(DEMO_STORAGE_KEYS.credit, null);
  if (stored?.version === 6) {
    const cleaned = normalizeSelectedClient(stripLegacyNariatSeed({
      ...stored,
      auditLog: enrichCreditAuditLog(stored.auditLog ?? []),
    }));
    if (cleaned !== stored) writeDemoJson(DEMO_STORAGE_KEYS.credit, cleaned);
    return cleaned;
  }
  if (stored?.version === 5) {
    const migrated = recalcQuote({
      ...normalizeSelectedClient(stripLegacyNariatSeed(mergeCreditDemoState(stored))),
      ...getDefaultQuoteContext(getProduct(stored, stored.selectedProductId)),
    });
    writeDemoJson(DEMO_STORAGE_KEYS.credit, migrated);
    return migrated;
  }
  if (stored?.version === 4) {
    const cleaned = normalizeSelectedClient(stripLegacyNariatSeed({
      ...stored,
      auditLog: enrichCreditAuditLog(stored.auditLog ?? []),
    }));
    if (cleaned !== stored) writeDemoJson(DEMO_STORAGE_KEYS.credit, cleaned);
    return cleaned;
  }
  if (stored?.version === 3) {
    const migrated = recalcQuote(stripLegacyNariatSeed(mergeCreditDemoState(stored)));
    writeDemoJson(DEMO_STORAGE_KEYS.credit, migrated);
    return migrated;
  }
  const fresh = recalcQuote(stripLegacyNariatSeed(createFreshCreditDemoState()));
  writeDemoJson(DEMO_STORAGE_KEYS.credit, fresh);
  return fresh;
}

export function seedScotiaCreditStorage(force = false): CreditDemoState {
  if (typeof window === "undefined") return createFreshCreditDemoState();
  const existing = readDemoJson<CreditDemoState | null>(DEMO_STORAGE_KEYS.credit, null);
  if (existing?.version === 6 && !force) {
    const enriched = normalizeSelectedClient(stripLegacyNariatSeed({
      ...existing,
      auditLog: enrichCreditAuditLog(existing.auditLog ?? []),
    }));
    writeDemoJson(DEMO_STORAGE_KEYS.credit, enriched);
    return enriched;
  }
  if (existing?.version === 5 && !force) {
    const migrated = recalcQuote({
      ...stripLegacyNariatSeed(mergeCreditDemoState(existing)),
      ...getDefaultQuoteContext(getProduct(existing, existing.selectedProductId)),
    });
    writeDemoJson(DEMO_STORAGE_KEYS.credit, migrated);
    return migrated;
  }
  if (existing?.version === 4 && !force) return normalizeSelectedClient(stripLegacyNariatSeed(existing));
  if (existing?.version === 3 && !force) {
    const migrated = recalcQuote(stripLegacyNariatSeed(mergeCreditDemoState(existing)));
    writeDemoJson(DEMO_STORAGE_KEYS.credit, migrated);
    return migrated;
  }
  const fresh = recalcQuote(normalizeSelectedClient(stripLegacyNariatSeed(createFreshCreditDemoState())));
  writeDemoJson(DEMO_STORAGE_KEYS.credit, fresh);
  return fresh;
}

function recalcQuote(state: CreditDemoState): CreditDemoState {
  const product = getProduct(state, state.selectedProductId);
  const client =
    state.clients.find((c) => c.id === state.selectedClientId) ??
    state.clients.find((c) => c.productId === state.selectedProductId) ??
    state.clients[0];
  if (!client) return state;
  const quoteClient = {
    ...client,
    amount: state.quoteAmountMxn,
    termMonths: state.quoteTermMonths,
  };
  const quote = calculateCreditQuote({
    product,
    client: quoteClient,
    rules: state.rulesByCategory[product.category],
    crossSellOptions: state.crossSellByCategory[product.category],
    crossSellAccepted: state.crossSellAccepted,
  });
  return { ...state, quote };
}

function normalizeQuoteContext(state: CreditDemoState): CreditDemoState {
  const product = getProduct(state, state.selectedProductId);
  return {
    ...state,
    ...getDefaultQuoteContext(product),
  };
}

export function useCreditDemoStore() {
  const [state, setState] = useState<CreditDemoState>(() => loadCreditState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadCreditState();
    const isDemoBypassOrg = getStoredOrganization()?.id === "demo-bypass-org";
    const pinned = isDemoBypassOrg ? [] : collectCustomersForLccSync();
    const merged = isDemoBypassOrg ? loaded : mergeCustomersIntoCreditState(loaded, pinned, { includeAllInbound: true });
    const normalized = normalizeQuoteContext(merged);
    const withQuote = recalcQuote(normalized);
    writeDemoJson(DEMO_STORAGE_KEYS.credit, withQuote);
    const timer = window.setTimeout(() => {
      setState(withQuote);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const persist = useCallback((next: CreditDemoState) => {
    setState(next);
    writeDemoJson(DEMO_STORAGE_KEYS.credit, next);
  }, []);

  const audit = useCallback(
    (action: string, details: string, extra?: { rateBefore?: number; rateAfter?: number }) => ({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      user: "Ejecutivo Frontline",
      channel: "Sucursal",
      correlationId: `corr-${Date.now()}`,
      ...extra,
    }),
    [],
  );

  const updateProduct = useCallback(
    (product: CreditProductTemplate) => {
      const products = state.products.map((p) => (p.id === product.id ? product : p));
      const next = recalcQuote({
        ...state,
        products,
        ...getDefaultQuoteContext(product),
        auditLog: [audit("UPDATE_PRODUCT", `Plantilla ${product.id} · tasa ${product.baseRate}%`), ...state.auditLog].slice(0, 50),
      });
      persist(next);
    },
    [state, persist, audit],
  );

  const selectProduct = useCallback(
    (productId: string) => {
      const product = state.products.find((p) => p.id === productId);
      const firstClient = preferredClientForProduct(state, productId);
      const next = recalcQuote({
        ...state,
        selectedProductId: productId,
        selectedClientId: firstClient,
        ...(product ? getDefaultQuoteContext(product) : {}),
        quoteFixed: false,
        quoteFixedAt: null,
        managerApproved: false,
        crossSellAccepted: Object.fromEntries(Object.keys(state.crossSellAccepted).map((k) => [k, false])),
      });
      persist(next);
    },
    [state, persist],
  );

  const selectClient = useCallback(
    (clientId: string) => {
      const client = state.clients.find((c) => c.id === clientId);
      if (!client) return;
      const next = recalcQuote({
        ...state,
        selectedClientId: clientId,
        selectedProductId: client.productId,
        quoteFixed: false,
        quoteFixedAt: null,
        managerApproved: false,
      });
      persist(next);
    },
    [state, persist],
  );

  const toggleRule = useCallback(
    (category: CreditProductCategory, ruleId: string, enabled: boolean) => {
      const rulesByCategory = {
        ...state.rulesByCategory,
        [category]: state.rulesByCategory[category].map((r) => (r.id === ruleId ? { ...r, enabled } : r)),
      };
      const next = recalcQuote({
        ...state,
        rulesByCategory,
        auditLog: [audit("UPDATE_RULE", `Regla ${ruleId} → ${enabled ? "ON" : "OFF"}`), ...state.auditLog].slice(0, 50),
      });
      persist(next);
    },
    [state, persist, audit],
  );

  const setCrossSellOptions = useCallback(
    (updates: Record<string, boolean>) => {
      const crossSellAccepted = { ...state.crossSellAccepted, ...updates };
      const next = recalcQuote({
        ...state,
        crossSellAccepted,
        auditLog: [
          audit("CROSS_SELL", `Cross-sell actualizado`, { rateBefore: state.quote?.finalRate }),
          ...state.auditLog,
        ].slice(0, 50),
      });
      const withRate = {
        ...next,
        auditLog: next.auditLog.map((e, i) =>
          i === 0 && e.action === "CROSS_SELL" ? { ...e, rateAfter: next.quote?.finalRate } : e,
        ),
      };
      persist(withRate);
    },
    [state, persist, audit],
  );

  const setCrossSellOption = useCallback(
    (optionId: string, accepted: boolean) => {
      setCrossSellOptions({ [optionId]: accepted });
    },
    [setCrossSellOptions],
  );

  const runQuote = useCallback(() => {
    const next = recalcQuote({
      ...state,
      auditLog: [audit("QUOTE", `Cotización ${state.selectedClientId} · reglas evaluadas`), ...state.auditLog].slice(0, 50),
    });
    persist(next);
  }, [state, persist, audit]);

  const runAiVerification = useCallback(() => {
    const product = getProduct(state);
    const batch = clientsForProduct(state, product.id).slice(0, 4);
    const results = runAiBatch(batch);
    const clients = state.clients.map((c) => {
      const hit = results.find((r) => r.clientId === c.id);
      if (!hit) return c;
      return { ...c, aiApproved: hit.approved };
    });
    const next = recalcQuote({
      ...state,
      clients,
      aiVerificationRun: true,
      aiBatchResults: results,
      auditLog: [
        audit("AI_VERIFY", `IA · ${results.filter((r) => r.approved).length} aprobados / ${results.filter((r) => !r.approved).length} rechazados`),
        ...state.auditLog,
      ].slice(0, 50),
    });
    persist(next);
  }, [state, persist, audit]);

  const approveManager = useCallback(() => {
    persist({
      ...state,
      managerApproved: true,
      auditLog: [audit("MANAGER_APPROVE", `Aprobación gerencial · tasa ${state.quote?.finalRate}%`), ...state.auditLog].slice(0, 50),
    });
  }, [state, persist, audit]);

  const fixQuote = useCallback(() => {
    if (!state.quote || state.quote.decision === "RECHAZADO") return;
    persist({
      ...state,
      quoteFixed: true,
      quoteFixedAt: new Date().toISOString(),
      auditLog: [
        audit("FIX_QUOTE", `Cotización fijada ${state.quote.finalRate}% · ${state.quote.termMonths} meses · Core`, {
          rateAfter: state.quote.finalRate,
        }),
        ...state.auditLog,
      ].slice(0, 50),
    });
  }, [state, persist, audit]);

  const mergeInboundCustomers = useCallback(async (customers?: Customer[]) => {
    const local = customers ?? collectCustomersForLccSync();
    const remote = await fetchZelifyCustomersForLcc();
    const bundle = [...local, ...remote.filter((c) => !local.some((l) => l.id === c.id))];

    setState((current) => {
      const merged = mergeCustomersIntoCreditState(current, bundle, { includeAllInbound: true });
      if (merged.clients.length === current.clients.length) return current;
      const next = recalcQuote(normalizeQuoteContext(merged));
      writeDemoJson(DEMO_STORAGE_KEYS.credit, next);
      return next;
    });
  }, []);

  const zelifyLccClients = state.clients.filter((c) => c.sourceCustomerId);

  const resetDemo = useCallback(() => {
    const fresh = stripLegacyNariatSeed(createFreshCreditDemoState());
    persist(recalcQuote(normalizeQuoteContext({
      ...fresh,
      selectedClientId: preferredClientForProduct(fresh, fresh.selectedProductId, fresh.selectedClientId),
      ...getDefaultQuoteContext(getProduct(fresh, fresh.selectedProductId)),
    })));
  }, [persist]);

  const selectCategory = useCallback(
    (category: CreditProductCategory) => {
      selectProduct(CATEGORY_PRODUCT_ID[category]);
    },
    [selectProduct],
  );

  return {
    state,
    hydrated,
    getProduct: (id?: string) => getProduct(state, id),
    getClient: (id?: string) => getClient(state, id),
    clientsForProduct: (productId?: string) => clientsForProduct(state, productId),
    updateProduct,
    selectProduct,
    selectCategory,
    selectClient,
    toggleRule,
    setCrossSellOption,
    setCrossSellOptions,
    runQuote,
    runAiVerification,
    approveManager,
    fixQuote,
    resetDemo,
    mergeInboundCustomers,
    zelifyLccClients,
  };
}
