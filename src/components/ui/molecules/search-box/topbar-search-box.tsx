"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { getStoredOrganization } from "@/lib/auth-api";
import { searchOrganizationUsers } from "@/lib/auth-dashboard";
import { fetchFinanceRequests, type FinanceRequest } from "@/modules/mdc/services/mdc-finance-requests.service";
import { useI18n } from "@/providers/i18n-provider";

import "@/components/ui/organisms/topbar/zelify-top-navbar.css";

export type TopbarSearchResult = {
  id?: string;
  group: string;
  label: string;
  href?: string;
  subtitle?: string;
};

type TopbarSearchBoxProps = {
  placeholder?: string;
  /** Resultados estáticos opcionales (p. ej. atomic design preview). */
  results?: TopbarSearchResult[];
};

const MDC_SHORTCUTS: { id: string; labelEs: string; labelEn: string; keywords: string[]; href: string }[] = [
  { id: "overview", labelEs: "Tablero", labelEn: "Dashboard", keywords: ["tablero", "dashboard", "panel", "home"], href: "/mdc?tab=overview" },
  { id: "products", labelEs: "Productos", labelEn: "Products", keywords: ["productos", "products", "producto"], href: "/mdc?tab=products" },
  { id: "applications", labelEs: "Solicitudes", labelEn: "Applications", keywords: ["solicitudes", "applications", "solicitud", "apps"], href: "/mdc?tab=applications" },
  { id: "rules", labelEs: "Reglas", labelEn: "Rules", keywords: ["reglas", "rules", "regla"], href: "/mdc?tab=rules" },
  { id: "traceability", labelEs: "Trazabilidad", labelEn: "Traceability", keywords: ["trazabilidad", "traceability", "logs", "auditoria"], href: "/mdc?tab=traceability" },
  { id: "payments", labelEs: "Pagos", labelEn: "Payments", keywords: ["pagos", "payments", "pago"], href: "/mdc?tab=payments" },
  { id: "collections", labelEs: "Cobranza", labelEn: "Collections", keywords: ["cobranza", "collections", "cobro"], href: "/mdc?tab=collections" },
  { id: "account", labelEs: "Mi cuenta", labelEn: "My account", keywords: ["cuenta", "account", "perfil", "profile", "password"], href: "/settings?section=profile" },
  { id: "configuration", labelEs: "Configuración", labelEn: "Configuration", keywords: ["configuracion", "configuration", "ajustes", "settings", "usuarios", "roles"], href: "/settings" },
  { id: "crm", labelEs: "CRM WhatsApp", labelEn: "CRM WhatsApp", keywords: ["crm", "whatsapp", "chat", "inbox", "prospecto"], href: "/crm" },
  { id: "pld-aml", labelEs: "PLD/AML", labelEn: "PLD/AML", keywords: ["pld", "aml", "lavado", "sanciones", "listas", "screening"], href: "/pld-aml" },
  { id: "pld-lists", labelEs: "Listas PLD", labelEn: "PLD lists", keywords: ["listas", "catalogo", "sdn", "ofac", "mexico"], href: "/pld-aml?tab=lists" },
  { id: "pld-selected", labelEs: "Listas seleccionadas", labelEn: "Selected lists", keywords: ["seleccionadas", "fuentes", "grupo"], href: "/pld-aml?tab=selected" },
  { id: "pld-internal", labelEs: "Listas internas AML", labelEn: "AML internal lists", keywords: ["listas", "watchlist", "cnbv", "interna", "excel"], href: "/pld-aml?tab=internal" },
  { id: "pld-screenings", labelEs: "Screenings AML", labelEn: "AML screenings", keywords: ["screening", "sanciones", "ofac", "pep", "validaciones"], href: "/pld-aml?tab=screenings" },
  { id: "pld-export", labelEs: "Exportación PLD", labelEn: "PLD export", keywords: ["exportar", "informe", "csv", "reporte"], href: "/pld-aml?tab=export" },
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function applicantLabel(item: FinanceRequest): string {
  const anyItem = item as FinanceRequest & {
    full_name?: string;
    firstName?: string;
    lastName?: string;
    businessName?: string;
    applicantName?: string;
  };
  return (
    anyItem.applicantName ||
    anyItem.full_name ||
    anyItem.businessName ||
    [anyItem.firstName, anyItem.lastName].filter(Boolean).join(" ") ||
    anyItem.email ||
    item.id
  );
}

export function TopbarSearchBox({
  placeholder,
  results: staticResults,
}: TopbarSearchBoxProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remoteResults, setRemoteResults] = useState<TopbarSearchResult[]>([]);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const financeCacheRef = useRef<FinanceRequest[] | null>(null);
  const requestIdRef = useRef(0);

  const resolvedPlaceholder = placeholder || t("topbar.searchPlaceholder");

  const shortcutResults = useMemo(() => {
    const q = normalize(query);
    const isEs = locale !== "en";
    return MDC_SHORTCUTS.filter((item) => {
      if (!q) return true;
      const hay = normalize([item.labelEs, item.labelEn, ...item.keywords].join(" "));
      return hay.includes(q);
    })
      .slice(0, q ? 6 : 5)
      .map((item) => ({
        id: `nav-${item.id}`,
        group: t("topbar.search.groupSections"),
        label: isEs ? item.labelEs : item.labelEn,
        href: item.href,
      }));
  }, [query, locale, t]);

  const runRemoteSearch = useCallback(async (raw: string) => {
    const q = raw.trim();
    const reqId = ++requestIdRef.current;

    if (q.length < 2) {
      setRemoteResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const orgId = getStoredOrganization()?.id;
    const next: TopbarSearchResult[] = [];

    try {
      if (orgId && orgId !== "demo-bypass-org") {
        const members = await searchOrganizationUsers(q, orgId);
        for (const member of members.slice(0, 6)) {
          next.push({
            id: `member-${member.id}`,
            group: t("topbar.search.groupUsers"),
            label: member.full_name || member.email,
            subtitle: [member.email, (member.roles || [])[0]].filter(Boolean).join(" · "),
            href: "/mdc?tab=configuration",
          });
        }

        if (!financeCacheRef.current) {
          try {
            financeCacheRef.current = await fetchFinanceRequests(orgId);
          } catch {
            financeCacheRef.current = [];
          }
        }

        const needle = normalize(q);
        const apps = (financeCacheRef.current || [])
          .filter((item) => {
            const blob = normalize(
              [
                item.id,
                applicantLabel(item),
                item.email,
                item.product,
                item.status,
              ]
                .filter(Boolean)
                .join(" ")
            );
            return blob.includes(needle);
          })
          .slice(0, 6);

        for (const app of apps) {
          const name = applicantLabel(app);
          const mode = String(app.personType || "").toLowerCase().includes("moral") ? "moral" : "natural";
          next.push({
            id: `app-${app.id}`,
            group: t("topbar.search.groupApplications"),
            label: name,
            subtitle: [app.product, app.status, app.email].filter(Boolean).join(" · "),
            href: `/mdc/applications/${app.id}?mode=${mode}`,
          });
        }
      }
    } catch {
      // ignore remote errors; still show shortcuts
    }

    if (reqId !== requestIdRef.current) return;
    setRemoteResults(next);
    setLoading(false);
  }, [t]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void runRemoteSearch(query);
    }, 280);
    return () => window.clearTimeout(handle);
  }, [query, runRemoteSearch]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchRef.current?.contains(target)) return;
      setIsOpen(false);
      setIsMobileExpanded(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsMobileExpanded(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const visibleResults = useMemo((): TopbarSearchResult[] => {
    if (staticResults?.length) {
      const q = normalize(query);
      const filtered = q
        ? staticResults.filter((item) => normalize(`${item.group} ${item.label}`).includes(q))
        : staticResults.slice(0, 4);
      return filtered;
    }

    const merged: TopbarSearchResult[] = [...shortcutResults, ...remoteResults];
    const seen = new Set<string>();
    return merged.filter((item) => {
      const key = item.id || `${item.group}-${item.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [staticResults, query, shortcutResults, remoteResults]);

  const goTo = (href: string) => {
    setIsOpen(false);
    setIsMobileExpanded(false);
    setQuery("");
    router.push(href);
  };

  const handleIconClick = () => {
    setIsMobileExpanded(true);
    setIsOpen(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  return (
    <div
      className={`zelify-topbar-search-wrap${isMobileExpanded ? " is-mobile-expanded" : ""}`}
      data-expanded={isMobileExpanded}
      ref={searchRef}
    >
      <div className="zelify-topbar-search">
        <button
          type="button"
          className="zelify-topbar-search-icon-btn"
          aria-label="Buscar"
          onClick={handleIconClick}
          tabIndex={-1}
        >
          <SearchIcon />
        </button>
        <input
          ref={inputRef}
          type="text"
          className="zelify-input zelify-input--ghost zelify-topbar-search-input"
          placeholder={resolvedPlaceholder}
          value={query}
          onFocus={() => {
            setIsOpen(true);
            setIsMobileExpanded(true);
          }}
          onBlur={() => {
            if (!query) setIsMobileExpanded(false);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && visibleResults[0]?.href) {
              event.preventDefault();
              goTo(visibleResults[0].href);
            }
          }}
        />
      </div>

      {isOpen ? (
        <div className="zelify-topbar-search-results" role="listbox">
          {loading ? (
            <div className="zelify-topbar-search-results__item" style={{ opacity: 0.7, cursor: "default" }}>
              <span className="zelify-topbar-search-results__group">{t("topbar.search.searching")}</span>
              <strong className="zelify-topbar-search-results__label">…</strong>
            </div>
          ) : null}

          {!loading && visibleResults.length === 0 ? (
            <div className="zelify-topbar-search-results__item" style={{ opacity: 0.75, cursor: "default" }}>
              <span className="zelify-topbar-search-results__group">{t("topbar.search.noResults")}</span>
              <strong className="zelify-topbar-search-results__label">
                {query.trim().length < 2 ? t("topbar.search.typeMore") : t("topbar.search.tryAnother")}
              </strong>
            </div>
          ) : null}

          {visibleResults.map((item) => (
            <button
              key={item.id || `${item.group}-${item.label}`}
              type="button"
              className="zelify-topbar-search-results__item"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (item.href) goTo(item.href);
              }}
            >
              <span className="zelify-topbar-search-results__group">{item.group}</span>
              <strong className="zelify-topbar-search-results__label">{item.label}</strong>
              {item.subtitle ? (
                <span style={{ display: "block", fontSize: 11, opacity: 0.7, marginTop: 2 }}>{item.subtitle}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SearchIcon() {
  return (
    <span className="zelify-topbar-search-icon" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M11.083 10.138l3.055 3.056-.944.944-3.056-3.055a5.333 5.333 0 1 1 .945-.945ZM6.667 10.667a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}
