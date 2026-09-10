"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { DEMO_STORAGE_KEYS, readDemoJson, writeDemoJson } from "@/lib/demo-storage";
import { createFreshScotiaDemoState, enrichLimAuditLog } from "../data/scotiabank-demo.seed";
import {
  buildFullLimClientList,
  syncLimBalancesFromCredit,
} from "@/modules/scotia/data/scotia-demo-bridge";
import type { CreditClientProfile } from "@/modules/cortex/types/credit-pricing.types";
import { SCOTIA_CREDIT_SEED } from "@/modules/cortex/data/scotiabank-credit.seed";
import {
  buildTreasurySummary,
  calculateClientRate,
  recalculateAllClientRates,
  tiieVariationBps,
} from "../services/deposit-pricing.engine";
import type { LimDemoState, TierRow } from "../types/deposit-pricing.types";

function migrateToCurrentVersion(stored: LimDemoState): LimDemoState {
  const fresh = createFreshScotiaDemoState();
  return recalculateAllClientRates({
    ...stored,
    version: fresh.version,
    tiie: fresh.tiie,
    clients: buildFullLimClientList(SCOTIA_CREDIT_SEED.clients),
    auditLog: enrichLimAuditLog(stored.auditLog ?? []),
  });
}

function loadState(): LimDemoState {
  const stored = readDemoJson<LimDemoState | null>(DEMO_STORAGE_KEYS.lim, null);
  if (stored?.version === 3) {
    const enriched = {
      ...stored,
      auditLog: enrichLimAuditLog(stored.auditLog ?? []),
    };
    if (enriched !== stored) writeDemoJson(DEMO_STORAGE_KEYS.lim, enriched);
    return enriched;
  }
  if (stored?.version === 2) {
    const migrated = migrateToCurrentVersion(stored);
    writeDemoJson(DEMO_STORAGE_KEYS.lim, migrated);
    return migrated;
  }
  if (stored?.version === 1) {
    const migrated = migrateToCurrentVersion(stored as LimDemoState);
    writeDemoJson(DEMO_STORAGE_KEYS.lim, migrated);
    return migrated;
  }
  const fresh = createFreshScotiaDemoState();
  return recalculateAllClientRates(fresh);
}

export function seedScotiaDemoStorage(force = false): LimDemoState {
  if (typeof window === "undefined") return createFreshScotiaDemoState();
  const existing = readDemoJson<LimDemoState | null>(DEMO_STORAGE_KEYS.lim, null);
  if (existing?.version === 3 && !force) {
    const enriched = {
      ...existing,
      auditLog: enrichLimAuditLog(existing.auditLog ?? []),
    };
    writeDemoJson(DEMO_STORAGE_KEYS.lim, enriched);
    return enriched;
  }
  if ((existing?.version === 2 || existing?.version === 1) && !force) {
    const migrated = migrateToCurrentVersion(existing as LimDemoState);
    writeDemoJson(DEMO_STORAGE_KEYS.lim, migrated);
    writeDemoJson(DEMO_STORAGE_KEYS.seeded, true);
    return migrated;
  }
  const fresh = recalculateAllClientRates(createFreshScotiaDemoState());
  writeDemoJson(DEMO_STORAGE_KEYS.lim, fresh);
  writeDemoJson(DEMO_STORAGE_KEYS.seeded, true);
  return fresh;
}

export function useLimDemoStore() {
  const [state, setState] = useState<LimDemoState>(() => loadState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadState();
    if (!loaded.clientRates || Object.keys(loaded.clientRates).length === 0) {
      const recalced = recalculateAllClientRates(loaded);
      writeDemoJson(DEMO_STORAGE_KEYS.lim, recalced);
      startTransition(() => setState(recalced));
    } else {
      startTransition(() => setState(loaded));
    }
    startTransition(() => setHydrated(true));
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== DEMO_STORAGE_KEYS.lim || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue) as LimDemoState;
        if (parsed?.version === 3) setState(parsed);
        else if (parsed?.version === 2 || parsed?.version === 1) {
          setState(migrateToCurrentVersion(parsed));
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: LimDemoState) => {
    setState(next);
    writeDemoJson(DEMO_STORAGE_KEYS.lim, next);
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = recalculateAllClientRates(createFreshScotiaDemoState());
    persist(fresh);
    return fresh;
  }, [persist]);

  const updateTiersPm = useCallback(
    (tiersPm: TierRow[]) => {
      const next = recalculateAllClientRates({
        ...state,
        tiersPm,
        auditLog: [
          {
            id: `audit-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: "UPDATE_TIERS_PM",
            details: "Tabla tier PM actualizada en consola LIM",
            user: "Admin Producto",
          },
          ...state.auditLog,
        ].slice(0, 100),
      });
      persist(next);
    },
    [state, persist],
  );

  const updateTiersPf = useCallback(
    (tiersPf: TierRow[]) => {
      const next = recalculateAllClientRates({
        ...state,
        tiersPf,
        auditLog: [
          {
            id: `audit-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: "UPDATE_TIERS_PF",
            details: "Tabla tier PF actualizada en consola LIM",
            user: "Admin Producto",
          },
          ...state.auditLog,
        ].slice(0, 100),
      });
      persist(next);
    },
    [state, persist],
  );

  const simulateTiieChange = useCallback(
    (newRate: number, requireApproval = false) => {
      const variationBps = tiieVariationBps(state.tiie.rate, newRate);
      const needsApproval = requireApproval && Math.abs(variationBps) >= 50;

      if (needsApproval) {
        persist({
          ...state,
          pendingApproval: {
            id: `pending-${Date.now()}`,
            tiieBefore: state.tiie.rate,
            tiieAfter: newRate,
            variationBps,
            status: "PENDING",
          },
        });
        return { needsApproval: true, variationBps };
      }

      const next = recalculateAllClientRates({
        ...state,
        tiie: {
          ...state.tiie,
          rate: newRate,
          effectiveDate: new Date().toISOString().slice(0, 10),
          history: [
            ...state.tiie.history,
            { date: new Date().toISOString().slice(0, 10), rate: newRate },
          ].slice(-14),
        },
        pendingApproval: null,
        auditLog: [
          {
            id: `audit-tiie-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: "TIIE_UPDATE",
            tiieInput: newRate,
            rateBefore: state.tiie.rate,
            rateAfter: newRate,
            details: `TIIE 28d ${state.tiie.rate.toFixed(2)}% → ${newRate.toFixed(2)}% (${variationBps >= 0 ? "+" : ""}${variationBps} pbs) · Recálculo automático`,
            user: "Feed Banxico",
          },
          ...state.auditLog,
        ].slice(0, 100),
      });
      persist(next);
      return { needsApproval: false, variationBps };
    },
    [state, persist],
  );

  const approvePendingTiie = useCallback(() => {
    if (!state.pendingApproval) return;
    simulateTiieChange(state.pendingApproval.tiieAfter, false);
  }, [state.pendingApproval, simulateTiieChange]);

  const toggleBonus = useCallback(
    (bonusId: string, active: boolean) => {
      const bonuses = state.bonuses.map((b) =>
        b.id === bonusId ? { ...b, active, crmNotified: active ? true : b.crmNotified } : b,
      );
      const next = recalculateAllClientRates({
        ...state,
        bonuses,
        auditLog: [
          {
            id: `audit-bonus-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: active ? "BONUS_ACTIVATED" : "BONUS_DEACTIVATED",
            details: `Bonificación ${bonusId} ${active ? "activada" : "desactivada"}${active ? " · CRM notificado" : ""}`,
            user: "Gestor Comercial",
          },
          ...state.auditLog,
        ].slice(0, 100),
      });
      persist(next);
    },
    [state, persist],
  );

  const setTourStep = useCallback(
    (step: number, completed = false) => {
      persist({
        ...state,
        tour: { ...state.tour, currentStep: step, completed, dismissed: false },
      });
    },
    [state, persist],
  );

  const dismissTour = useCallback(() => {
    persist({ ...state, tour: { ...state.tour, dismissed: true } });
  }, [state, persist]);

  const completeTour = useCallback(() => {
    persist({ ...state, tour: { completed: true, currentStep: 0, dismissed: true } });
  }, [state, persist]);

  const getClientPricing = useCallback(
    (clientId: string) => {
      const client = state.clients.find((c) => c.id === clientId);
      if (!client) return null;
      const override = state.overrides.find((o) => o.clientId === clientId);
      return calculateClientRate({
        client,
        tiersPm: state.tiersPm,
        tiersPf: state.tiersPf,
        tiieRate: state.tiie.rate,
        override,
        bonuses: state.bonuses,
      });
    },
    [state],
  );

  const syncFromCredit = useCallback(
    (creditClients: CreditClientProfile[]) => {
      const next = syncLimBalancesFromCredit(state, creditClients);
      const changed = JSON.stringify(next.clients) !== JSON.stringify(state.clients);
      if (changed) persist(next);
    },
    [state, persist],
  );

  const treasury = useMemo(() => buildTreasurySummary(state), [state]);

  return {
    state,
    hydrated,
    treasury,
    resetDemo,
    updateTiersPm,
    updateTiersPf,
    simulateTiieChange,
    approvePendingTiie,
    toggleBonus,
    setTourStep,
    dismissTour,
    completeTour,
    getClientPricing,
    syncFromCredit,
  };
}
