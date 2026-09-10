"use client";

import { useState } from "react";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";
import { ScotiaDemoSection, useScotiaDemoMode, type ScotiaDemoTab } from "@/modules/lim/components/lim-scotiabank-demo";
import { ScotiaSectionHeader } from "@/modules/scotia/components/scotia-section-header";

import "@/components/ui/templates/workspace-page.css";
import "@/modules/lim/screens/lim-screen.css";

export function DepositsPricingScreen() {
  const scotia = useScotiaDemoMode();
  const [activeModule, setActiveModule] = useState<ScotiaDemoTab>("pricing");

  const handleModuleChange = (tab: ScotiaDemoTab) => {
    if (tab === "pricing" || tab === "tesoreria" || tab === "trazabilidad") {
      setActiveModule(tab);
    }
  };

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />

      <div className="zelify-workspace-page__scroll">
        <div className="lim-root zelify-workspace-page__inner">
          <div className="lim-panel scotia-workspace scotia-card" style={{ marginBottom: 16 }}>
            <ScotiaSectionHeader
              badge="LCC · Depósitos"
              title="Depósitos"
              subtitle="Motor unificado de pricing, tesorería y trazabilidad."
            />
            <div className="lim-deposits-filter">
              <div className="lim-deposits-filter__label-block">
                <span className="lim-deposits-filter__eyebrow">Vista</span>
                <span className="lim-deposits-filter__title">Selecciona el frente de análisis</span>
              </div>
              <div className="lim-deposits-filter__tabs" role="tablist" aria-label="Vista de depósitos">
                {[
                  { id: "pricing", label: "Pricing" },
                  { id: "tesoreria", label: "Tesorería" },
                  { id: "trazabilidad", label: "Trazabilidad" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeModule === tab.id}
                    className={`lim-deposits-filter__tab${activeModule === tab.id ? " lim-deposits-filter__tab--active" : ""}`}
                    onClick={() => handleModuleChange(tab.id as ScotiaDemoTab)}
                  >
                    <span className="lim-deposits-filter__tab-kicker">Depósitos</span>
                    <strong>{tab.label}</strong>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <ScotiaDemoSection
            activeTab={activeModule}
            creditCategory={scotia.creditCategory}
            selectedClient={scotia.selectedClient}
            onSelectedClientChange={scotia.setSelectedClient}
            limStore={scotia.limStore}
            creditStore={scotia.creditStore}
            onTabChange={handleModuleChange}
          />
        </div>
      </div>
    </div>
  );
}
