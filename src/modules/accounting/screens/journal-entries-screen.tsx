"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Home, Info, LayoutList } from "lucide-react";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppIconButton } from "@/components/ui/atoms/icon-button/app-icon-button";
import { AppSelect } from "@/components/ui/atoms/select/app-select";
import { FieldLabel } from "@/components/ui/atoms/field-label/field-label";
import { useI18n } from "@/providers/i18n-provider";
import { getJournalEntriesSlice, JOURNAL_ENTRIES_TOTAL } from "../data/journal-entries.mock";
import { AccountingPageHeader } from "../components/accounting-page-header";

import "@/components/ui/organisms/settings-data-table/settings-data-table.css";
import "./journal-entries-screen.css";

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

const formatUsd = (n: number | null) => {
  if (n === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
};

function formatJournalRange(t: (key: string) => string, start: number, end: number, total: number) {
  return t("accounting.journalEntries.range")
    .replace("{start}", String(start))
    .replace("{end}", String(end))
    .replace("{total}", String(total));
}

export function JournalEntriesScreen() {
  const { t } = useI18n();
  const [branch, setBranch] = useState("all");
  const [filter, setFilter] = useState("none");
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(1);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(JOURNAL_ENTRIES_TOTAL / pageSize));

  const rows = useMemo(() => getJournalEntriesSlice(page, pageSize), [page, pageSize]);

  const rangeStart = JOURNAL_ENTRIES_TOTAL === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, JOURNAL_ENTRIES_TOTAL);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));
  const mockAction = (label: string) => setActionMessage(`Acción ejecutada: ${label}`);

  return (
    <div className="zelify-journal-entries">
      <AccountingPageHeader />
      {actionMessage ? <div className="zelify-workspace-page__subtitle">{actionMessage}</div> : null}

      <div className="zelify-journal-entries__filters">
        <div className="zelify-journal-entries__filters-left">
          <div className="zelify-journal-entries__field">
            <FieldLabel htmlFor="je-branch">{t("accounting.journalEntries.branch")}</FieldLabel>
            <div className="zelify-journal-entries__branch-wrap">
              <AppSelect
                id="je-branch"
                size="md"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="zelify-journal-entries__branch-select"
              >
                <option value="all">{t("accounting.journalEntries.allBranches")}</option>
                <option value="main">{t("accounting.journalEntries.mainBranch")}</option>
              </AppSelect>
              <Home className="zelify-journal-entries__branch-home" size={16} strokeWidth={2} aria-hidden />
            </div>
          </div>

          <div className="zelify-journal-entries__field">
            <FieldLabel htmlFor="je-filter">{t("accounting.journalEntries.filter")}</FieldLabel>
            <AppSelect
              id="je-filter"
              size="md"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="zelify-journal-entries__filter-select"
            >
              <option value="none">{t("accounting.journalEntries.noFilter")}</option>
              <option value="date">{t("accounting.journalEntries.byDate")}</option>
            </AppSelect>
          </div>

          <div className="zelify-journal-entries__filter-btn-wrap">
            <AppButton type="button" tone="neutral" className="zelify-journal-entries__filter-btn" onClick={() => mockAction("Aplicar filtro de asientos")}>
              {t("accounting.journalEntries.filterButton")}
            </AppButton>
          </div>
        </div>

        <div className="zelify-journal-entries__filters-right">
          <button
            type="button"
            className="zelify-journal-entries__help"
            aria-label={t("accounting.journalEntries.helpAria")}
            title={t("accounting.journalEntries.helpTitle")}
            onClick={() => mockAction("Abrir ayuda de asientos")}
          >
            <CircleHelp size={18} strokeWidth={1.75} aria-hidden />
          </button>
          <AppButton type="button" tone="neutral" className="zelify-journal-entries__primary-action" onClick={() => mockAction("Nuevo asiento contable")}>
            {t("accounting.journalEntries.newJournalEntry")}
          </AppButton>
          <AppButton type="button" tone="primary" className="zelify-journal-entries__columns-btn" onClick={() => mockAction("Configurar columnas personalizadas")}>
            {t("accounting.journalEntries.customColumns")}
            <ChevronDown size={16} strokeWidth={2} aria-hidden />
          </AppButton>
          <AppIconButton ariaLabel={t("accounting.journalEntries.viewAria")} className="zelify-journal-entries__settings-icon" onClick={() => mockAction("Cambiar vista de asientos")}>
            <LayoutList size={20} strokeWidth={1.75} />
          </AppIconButton>
        </div>
      </div>

      <div className="zelify-journal-entries__edit-row">
        <button type="button" className="zelify-journal-entries__edit-columns" onClick={() => mockAction("Editar columnas")}>
          {t("accounting.journalEntries.editColumns")}
        </button>
      </div>

      <div className="zelify-journal-entries__table-toolbar">
        <div className="zelify-journal-entries__page-size">
          <span className="zelify-journal-entries__page-size-label">{t("accounting.journalEntries.show")}</span>
          <AppSelect
            aria-label={t("accounting.journalEntries.rowsPerPageAria")}
            size="md"
            value={String(pageSize)}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="zelify-journal-entries__page-size-select"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </AppSelect>
        </div>
        <div className="zelify-journal-entries__pagination">
          <span className="zelify-journal-entries__range">
            {formatJournalRange(t, rangeStart, rangeEnd, JOURNAL_ENTRIES_TOTAL)}
          </span>
          <div className="zelify-data-table-footer__pages">
            <button
              type="button"
              className="zelify-pagination-btn"
              disabled={page <= 1}
              aria-label={t("accounting.journalEntries.prevPageAria")}
              onClick={goPrev}
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="zelify-pagination-btn"
              disabled={page >= totalPages}
              aria-label={t("accounting.journalEntries.nextPageAria")}
              onClick={goNext}
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      <div className="zelify-journal-entries__table-wrap">
        <SettingsDataTable variant="clients" className="zelify-journal-entries__data-table">
          <thead>
            <tr>
              <th className="zelify-journal-entries__th zelify-journal-entries__th--accent">{t("accounting.journalEntries.colEntryId")}</th>
              <th className="zelify-journal-entries__th zelify-journal-entries__th--accent">
                {t("accounting.journalEntries.colBookingDate")}
              </th>
              <th className="zelify-journal-entries__th zelify-journal-entries__th--accent">{t("accounting.journalEntries.colTransactionId")}</th>
              <th className="zelify-journal-entries__th zelify-journal-entries__th--muted">{t("accounting.journalEntries.colGlAccountName")}</th>
              <th className="zelify-journal-entries__th zelify-journal-entries__th--muted is-numeric-header">
                {t("accounting.journalEntries.colDebitAmount")}
              </th>
              <th className="zelify-journal-entries__th zelify-journal-entries__th--muted is-numeric-header">
                {t("accounting.journalEntries.colCreditAmount")}
              </th>
              <th
                scope="col"
                aria-label={t("accounting.journalEntries.colActionsAria")}
                className="zelify-journal-entries__th zelify-journal-entries__th--muted zelify-journal-entries__th--icon"
              />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="is-numeric">{row.entryId}</td>
                <td>{row.bookingDate}</td>
                <td className="is-numeric">{row.transactionId}</td>
                <td>{row.glAccountName}</td>
                <td className="is-numeric">{formatUsd(row.debit)}</td>
                <td className="is-numeric">{formatUsd(row.credit)}</td>
                <td className="is-actions zelify-journal-entries__action-cell">
                  <button
                    type="button"
                    className="zelify-journal-entries__info-btn"
                    aria-label={t("accounting.journalEntries.rowInfoAria")}
                    onClick={() => mockAction(`Ver detalle de asiento ${row.entryId}`)}
                  >
                    <Info size={14} strokeWidth={2.5} aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </SettingsDataTable>
      </div>
    </div>
  );
}
