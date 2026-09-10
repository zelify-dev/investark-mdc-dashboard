"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  Pencil,
  X,
} from "lucide-react";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { AppSelect } from "@/components/ui/atoms/select/app-select";
import {
  COA_CATEGORY_COUNTS,
  COA_TOTAL,
  filterChartOfAccounts,
  MOCK_CHART_OF_ACCOUNTS_FULL,
} from "../data/chart-of-accounts.mock";
import type { CoaCategory } from "../types/chart-of-accounts.types";
import { AccountingPageHeader } from "../components/accounting-page-header";

import "@/components/ui/organisms/settings-data-table/settings-data-table.css";
import "./chart-of-accounts-screen.css";

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

const FILTER_TABS: { id: CoaCategory; label: string; count: number }[] = [
  { id: "all", label: "All", count: COA_TOTAL },
  { id: "assets", label: "Assets", count: COA_CATEGORY_COUNTS.assets },
  { id: "liabilities", label: "Liabilities", count: COA_CATEGORY_COUNTS.liabilities },
  { id: "equity", label: "Equity", count: COA_CATEGORY_COUNTS.equity },
  { id: "income", label: "Income", count: COA_CATEGORY_COUNTS.income },
  { id: "expenses", label: "Expenses", count: COA_CATEGORY_COUNTS.expenses },
];

export function ChartOfAccountsScreen() {
  const [category, setCategory] = useState<CoaCategory>("all");
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(1);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const filtered = useMemo(
    () => filterChartOfAccounts(MOCK_CHART_OF_ACCOUNTS_FULL, category),
    [category]
  );

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const rangeStart = totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalFiltered);

  const goFirst = () => setPage(1);
  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));
  const goLast = () => setPage(totalPages);
  const mockAction = (label: string) => setActionMessage(`Acción ejecutada: ${label}`);

  return (
    <div className="zelify-accounting-coa">
      <AccountingPageHeader />
      {actionMessage ? <div className="zelify-workspace-page__subtitle">{actionMessage}</div> : null}

      <div className="zelify-accounting-coa__filters">
        <div className="zelify-accounting-coa__filter-pills" role="tablist" aria-label="Account category">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={category === tab.id}
              className={`zelify-accounting-coa__pill ${category === tab.id ? "is-active" : ""}`}
              onClick={() => {
                setCategory(tab.id);
                setPage(1);
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
        <button
          type="button"
          className="zelify-accounting-coa__filter-help"
          aria-label="Ayuda: categorías"
          title="Categorías"
          onClick={() => mockAction("Ayuda de categorías")}
        >
          <CircleHelp size={18} strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      <div className="zelify-accounting-coa__toolbar">
        <div className="zelify-accounting-coa__page-size">
          <span className="zelify-accounting-coa__page-size-label">Show</span>
          <AppSelect
            aria-label="Filas por página"
            size="md"
            value={String(pageSize)}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="zelify-accounting-coa__page-size-select"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </AppSelect>
        </div>

        <div className="zelify-accounting-coa__pagination">
          <span className="zelify-accounting-coa__range">
            {rangeStart} – {rangeEnd} of {totalFiltered}
          </span>
          <span className="zelify-accounting-coa__all">All {totalFiltered}</span>
          <div className="zelify-accounting-coa__page-btns">
            <button
              type="button"
              className="zelify-pagination-btn"
              disabled={page <= 1}
              aria-label="Primera página"
              onClick={goFirst}
            >
              <ChevronsLeft size={16} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="zelify-pagination-btn"
              disabled={page <= 1}
              aria-label="Página anterior"
              onClick={goPrev}
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="zelify-pagination-btn"
              disabled={page >= totalPages}
              aria-label="Página siguiente"
              onClick={goNext}
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="zelify-pagination-btn"
              disabled={page >= totalPages}
              aria-label="Última página"
              onClick={goLast}
            >
              <ChevronsRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      <div className="zelify-accounting-coa__table-wrap">
        <SettingsDataTable variant="clients" className="zelify-accounting-coa__data-table">
          <thead>
            <tr>
              <th>GL Code</th>
              <th>Account Name</th>
              <th>Type</th>
              <th>Usage</th>
              <th>Currency</th>
              <th>In Use</th>
              <th>Manual Entries Allowed</th>
              <th className="zelify-settings-data-table__actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.id}>
                <td className="is-numeric">{row.glCode}</td>
                <td>{row.accountName}</td>
                <td>{row.type}</td>
                <td>{row.usage}</td>
                <td>{row.currency}</td>
                <td>
                  <span
                    className={`zelify-accounting-coa__flag ${row.inUse ? "is-on" : ""}`}
                    aria-label={row.inUse ? "In use" : "Not in use"}
                    title={row.inUse ? "In use" : "Not in use"}
                  />
                </td>
                <td>
                  <span
                    className={`zelify-accounting-coa__flag ${row.manualEntriesAllowed ? "is-on" : ""}`}
                    aria-label={row.manualEntriesAllowed ? "Allowed" : "Not allowed"}
                    title={row.manualEntriesAllowed ? "Allowed" : "Not allowed"}
                  />
                </td>
                <td className="is-actions">
                  <div className="zelify-accounting-coa__actions">
                    <button
                      type="button"
                      className="zelify-accounting-coa__icon-btn"
                      aria-label="Edit"
                      onClick={() => mockAction(`Editar cuenta ${row.glCode}`)}
                    >
                      <Pencil size={14} strokeWidth={2} aria-hidden />
                    </button>
                    {row.showDeleteAction ? (
                      <button
                        type="button"
                        className="zelify-accounting-coa__icon-btn"
                        aria-label="Remove"
                        onClick={() => mockAction(`Eliminar cuenta ${row.glCode}`)}
                      >
                        <X size={14} strokeWidth={2} aria-hidden />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </SettingsDataTable>
      </div>
    </div>
  );
}
