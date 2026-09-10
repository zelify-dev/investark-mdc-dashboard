"use client";

import { useCallback, useEffect, useState } from "react";
import { ScotiaDemoTour, type ScotiaDemoTab, type ScotiaTourAction } from "@/components/tour/scotia-demo-tour";
import { CreditAdminPanel, CreditAuditPanel, CreditQuotePanel } from "@/modules/cortex/components/credit-demo-panels";
import { seedScotiaCreditStorage, useCreditDemoStore } from "@/modules/cortex/hooks/use-credit-demo-store";
import type { CreditProductCategory } from "@/modules/cortex/types/credit-pricing.types";
import type { Customer } from "@/modules/customers/types/customer.types";
import { DEMO_STORAGE_KEYS } from "@/lib/demo-storage";
import {
  LCC_CUSTOMERS_CHANGED_EVENT,
  collectCustomersForLccSync,
} from "@/modules/scotia/services/lcc-customer-sync";
import { LimDepositsSyncBar } from "./lim-deposits-sync-bar";
import { LimDepositPricingPanel } from "./lim-deposit-pricing-panel";
import { LimPricingAuditPanel } from "./lim-pricing-audit-panel";
import { LimTreasuryDepositsPanel } from "./lim-treasury-deposits-panel";
import { seedScotiaDemoStorage, useLimDemoStore } from "../hooks/use-lim-demo-store";

export type { ScotiaDemoTab };
export type { CreditProductCategory };

interface ScotiaDemoSectionProps {
  activeTab: ScotiaDemoTab;
  creditCategory: CreditProductCategory;
  selectedClient: string;
  onSelectedClientChange: (id: string) => void;
  limStore: ReturnType<typeof useLimDemoStore>;
  creditStore: ReturnType<typeof useCreditDemoStore>;
  onTabChange?: (tab: ScotiaDemoTab) => void;
  enablePricingNavigation?: boolean;
}

export function ScotiaDemoSection({
  activeTab,
  creditCategory,
  selectedClient,
  onSelectedClientChange,
  limStore,
  creditStore,
  onTabChange,
  enablePricingNavigation = true,
}: ScotiaDemoSectionProps) {

  if (!limStore.hydrated || !creditStore.hydrated) {
    return (
      <div className="lim-panel">
        <p className="lim-section-subhead">Cargando módulos…</p>
      </div>
    );
  }

  if (activeTab === "credito-admin") return <CreditAdminPanel store={creditStore} activeCategory={creditCategory} />;
  if (activeTab === "credito-cotizacion") return <CreditQuotePanel store={creditStore} activeCategory={creditCategory} />;
  if (activeTab === "credito-trazabilidad") return <CreditAuditPanel store={creditStore} />;
  if (activeTab === "tesoreria") {
    return (
      <>
        <LimDepositsSyncBar
          store={limStore}
          activeModule="tesoreria"
          onGoPricing={enablePricingNavigation ? () => onTabChange?.("pricing") : undefined}
        />
        <LimTreasuryDepositsPanel store={limStore} creditClients={creditStore.state.clients} />
      </>
    );
  }
  if (activeTab === "trazabilidad") return <LimPricingAuditPanel store={limStore} />;
  return (
    <>
      <LimDepositsSyncBar
        store={limStore}
        activeModule="pricing"
        onGoTreasury={() => onTabChange?.("tesoreria")}
      />
      <LimDepositPricingPanel
        store={limStore}
        creditClients={creditStore.state.clients}
        selectedClient={selectedClient}
        onSelectedClientChange={onSelectedClientChange}
      />
    </>
  );
}

export function ScotiaDemoTourHost({
  active,
  onClose,
  onTabChange,
  onSelectedClientChange,
  limStore,
  creditStore,
}: {
  active: boolean;
  onClose: () => void;
  onTabChange: (tab: ScotiaDemoTab) => void;
  onSelectedClientChange: (id: string) => void;
  limStore: ReturnType<typeof useLimDemoStore>;
  creditStore: ReturnType<typeof useCreditDemoStore>;
}) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (active) setStepIndex(0);
  }, [active]);

  const handleAction = useCallback(
    (action: ScotiaTourAction) => {
      switch (action) {
        case "load-client-cl-demo-001":
          creditStore.selectClient("CL-AUTO-001");
          creditStore.runQuote();
          break;
        case "enable-cross-sell-seguro": {
          const cat = creditStore.getProduct().category;
          const opts = creditStore.state.crossSellByCategory[cat];
          if (opts[0]) creditStore.setCrossSellOptions({ [opts[0].id]: true });
          break;
        }
        case "enable-cross-sell": {
          const cat = creditStore.getProduct().category;
          const opts = creditStore.state.crossSellByCategory[cat].slice(0, 2);
          creditStore.setCrossSellOptions(Object.fromEntries(opts.map((o) => [o.id, true])));
          break;
        }
        case "fix-credit-quote":
          creditStore.fixQuote();
          break;
        case "select-client-pm002":
          onSelectedClientChange("PM-DEMO-002");
          break;
        case "select-client-pm003":
          onSelectedClientChange("PM-DEMO-003");
          break;
        case "select-client-pm004":
          onSelectedClientChange("PM-DEMO-004");
          break;
        case "simulate-tiie-drop":
          limStore.simulateTiieChange(6.2);
          break;
        case "reset-tiie":
          limStore.simulateTiieChange(6.6);
          break;
      }
    },
    [creditStore, limStore, onSelectedClientChange],
  );

  return (
    <ScotiaDemoTour
      active={active}
      stepIndex={stepIndex}
      onStepChange={setStepIndex}
      onTabChange={onTabChange}
      onAction={handleAction}
      onComplete={() => {
        limStore.completeTour();
        onClose();
      }}
      onDismiss={() => {
        limStore.dismissTour();
        onClose();
      }}
    />
  );
}

export function useScotiaDemoMode() {
  const [activeTab, setActiveTab] = useState<ScotiaDemoTab>("credito-cotizacion");
  const [creditCategory, setCreditCategory] = useState<CreditProductCategory>("personal");
  const [tourActive, setTourActive] = useState(false);
  const [selectedClient, setSelectedClient] = useState("PM-DEMO-002");
  const limStore = useLimDemoStore();
  const creditStore = useCreditDemoStore();

  useEffect(() => {
    seedScotiaDemoStorage();
    seedScotiaCreditStorage();
  }, []);

  useEffect(() => {
    if (!creditStore.hydrated) return;
    const cat = creditStore.getProduct().category;
    setCreditCategory(cat);
  }, [creditStore.hydrated, creditStore.state.selectedProductId, creditStore]);

  useEffect(() => {
    if (!creditStore.hydrated) return;

    const runSync = () => {
      void creditStore.mergeInboundCustomers();
    };

    runSync();

    const onStorage = (e: StorageEvent) => {
      if (e.key === DEMO_STORAGE_KEYS.lccInboundCustomers) runSync();
    };
    const onLccCustomers = () => runSync();

    window.addEventListener("storage", onStorage);
    window.addEventListener(LCC_CUSTOMERS_CHANGED_EVENT, onLccCustomers);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(LCC_CUSTOMERS_CHANGED_EVENT, onLccCustomers);
    };
  }, [creditStore.hydrated, creditStore.mergeInboundCustomers]);

  useEffect(() => {
    if (!limStore.hydrated || !creditStore.hydrated) return;
    limStore.syncFromCredit(creditStore.state.clients);
  }, [limStore, creditStore.hydrated, creditStore.state.clients]);

  const setCreditCategoryAndProduct = useCallback(
    (cat: CreditProductCategory) => {
      setCreditCategory(cat);
      creditStore.selectCategory(cat);
    },
    [creditStore],
  );

  useEffect(() => {
    if (limStore.hydrated && !limStore.state.tour.dismissed && !limStore.state.tour.completed) {
      const t = setTimeout(() => setTourActive(true), 700);
      return () => clearTimeout(t);
    }
  }, [limStore.hydrated, limStore.state.tour.dismissed, limStore.state.tour.completed]);

  const resetAll = useCallback(() => {
    limStore.resetDemo();
    creditStore.resetDemo();
  }, [limStore, creditStore]);

  return {
    activeTab,
    setActiveTab,
    creditCategory,
    setCreditCategory: setCreditCategoryAndProduct,
    tourActive,
    setTourActive,
    selectedClient,
    setSelectedClient,
    limStore,
    creditStore,
    resetAll,
  };
}

export function isScotiaDemoTab(tab: string): tab is ScotiaDemoTab {
  return [
    "credito-admin",
    "credito-cotizacion",
    "credito-trazabilidad",
    "pricing",
    "tesoreria",
    "trazabilidad",
  ].includes(tab);
}
