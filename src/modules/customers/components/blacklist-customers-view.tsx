"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import "@/components/ui/templates/workspace-page.css";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { SandboxBanner } from "./sandbox-banner";
import { CustomerSummaryCards } from "./customer-summary-cards";
import { CustomerSegmentFilters } from "./customer-segment-filters";
import { BlacklistCustomersTable } from "./blacklist-customers-table";
import { customersSegmentService } from "../services/customers-segment.service";
import type { BlacklistCustomerRow } from "../types/customer-segment.types";
import { buildBlacklistSummaryCards } from "../utils/customers-segment-summary";
import { useI18n } from "@/providers/i18n-provider";

import "./customers-segment-views.css";

export function BlacklistCustomersView() {
  const { t } = useI18n();
  const [rows, setRows] = useState<BlacklistCustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await customersSegmentService.getBlacklistCustomers();
        if (!cancelled) setRows(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const summaryItems = useMemo(() => buildBlacklistSummaryCards(filtered, t), [filtered, t]);

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />

      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner">
          <header>
            <h1 className="zelify-workspace-page__title">{t("customers.blacklist.title")}</h1>
            <p className="zelify-customer-segment-page__subtitle">{t("customers.blacklist.subtitle")}</p>
          </header>

          <div className="zelify-customer-segment-page__search">
            <AppInput
              type="search"
              variant="surface"
              placeholder={t("customers.blacklist.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              aria-label={t("customers.blacklist.searchAria")}
            />
          </div>

          <div className="zelify-customer-segment-page__summary">
            <CustomerSummaryCards items={summaryItems} />
          </div>

          <div className="zelify-customer-segment-page__filters">
            <CustomerSegmentFilters variant="blacklist" />
          </div>

          <div className="zelify-customer-segment-page__table">
            {loading ? (
              <div className="zelify-workspace-page__loading">
                <div className="zelify-workspace-page__spinner" aria-hidden />
                <span>{t("customers.blacklist.loading")}</span>
              </div>
            ) : (
              <>
                <BlacklistCustomersTable rows={filtered} />
                {filtered.length > 0 ? (
                  <div className="zelify-data-table-footer">
                    <div className="zelify-data-table-footer__page-size">
                      <span className="zelify-data-table-footer__info">{t("customers.common.show")}</span>
                      <span className="zelify-data-table-footer__page-size-value">25</span>
                    </div>
                    <div className="zelify-data-table-footer__controls">
                      <span className="zelify-data-table-footer__info">
                        {t("customers.common.allCount").replace("{count}", String(filtered.length))}
                      </span>
                      <div className="zelify-data-table-footer__pages">
                        <button
                          type="button"
                          className="zelify-pagination-btn"
                          disabled
                          aria-label={t("customers.common.prevPageAria")}
                        >
                          <ChevronLeft size={16} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className="zelify-pagination-btn"
                          disabled
                          aria-label={t("customers.common.nextPageAria")}
                        >
                          <ChevronRight size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
