"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Download,
  FileSpreadsheet,
  List,
  ListChecks,
  Search,
  type LucideIcon,
} from "lucide-react";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { getAmlApiBaseUrl } from "@/modules/pld-aml/services/pld-aml-api-client";
import { AmlBanner } from "@/modules/pld-aml/components/pld-aml-ui";
import { PldAmlExportPanel } from "@/modules/pld-aml/components/pld-aml-export-panel";
import { PldAmlInternalListsPanel } from "@/modules/pld-aml/components/pld-aml-internal-lists-panel";
import { PldAmlScreeningsHistoryPanel } from "@/modules/pld-aml/components/pld-aml-screenings-history-panel";
import { PldAmlCatalogPanel, PldAmlSelectedListsPanel } from "@/modules/pld-aml/components/pld-aml-sources-panel";
import "@/modules/mdc/screens/mdc-screen.css";
import "@/components/ui/templates/workspace-page.css";
import "./pld-aml-screen.css";

type PldTab = "lists" | "selected" | "internal" | "screenings" | "export";

const TABS: { id: PldTab; label: string; icon: LucideIcon }[] = [
  { id: "lists", label: "Listas", icon: List },
  { id: "selected", label: "Listas seleccionadas", icon: ListChecks },
  { id: "internal", label: "Listas internas", icon: FileSpreadsheet },
  { id: "screenings", label: "Screenings", icon: Search },
  { id: "export", label: "Exportación", icon: Download },
];

const LEGACY_TABS: Record<string, PldTab> = {
  overview: "lists",
  groups: "lists",
  lists: "internal",
  users: "screenings",
  reports: "export",
  monitoring: "screenings",
  batches: "screenings",
  blocking: "export",
  alerts: "screenings",
  rescreening: "screenings",
  logs: "export",
  external: "internal",
  ebr: "export",
};

export function PldAmlScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTabState] = useState<PldTab>("lists");
  const apiConfigured = Boolean(getAmlApiBaseUrl());

  useEffect(() => {
    const raw = searchParams.get("tab");
    if (!raw) return;
    if (TABS.some((item) => item.id === raw)) {
      setTabState(raw as PldTab);
      return;
    }
    const mapped = LEGACY_TABS[raw];
    if (mapped) setTabState(mapped);
  }, [searchParams]);

  const setTab = (next: PldTab) => {
    setTabState(next);
    router.replace(`/pld-aml?tab=${next}`, { scroll: false });
  };

  return (
    <div className="zelify-workspace-page mdc-workspace pld-workspace">
      <ZelifyTopNavbar activeNavId="pld-aml" />
      <div className="zelify-workspace-page__scroll mdc-workspace__body">
        <aside className="mdc-sidebar">
          <div className="mdc-sidebar__brand">
            <h1 className="mdc-sidebar__title">PLD/AML</h1>
            <p className="mdc-sidebar__sub">Listas, validaciones e informes</p>
          </div>
          <div className="mdc-tabs" role="tablist" aria-label="PLD AML">
            {TABS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  className={`mdc-tab${tab === item.id ? " mdc-tab--active" : ""}`}
                  onClick={() => setTab(item.id)}
                >
                  <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </aside>
        <div className="mdc-workspace__main">
          <div className="mdc-root">
            {!apiConfigured ? (
              <AmlBanner tone="error">
                Falta NEXT_PUBLIC_AML_API_URL. Agrégala al .env y reinicia el servidor para operar los endpoints.
              </AmlBanner>
            ) : null}
            {tab === "lists" ? <PldAmlCatalogPanel /> : null}
            {tab === "selected" ? <PldAmlSelectedListsPanel /> : null}
            {tab === "internal" ? <PldAmlInternalListsPanel /> : null}
            {tab === "screenings" ? <PldAmlScreeningsHistoryPanel /> : null}
            {tab === "export" ? <PldAmlExportPanel /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
