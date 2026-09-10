"use client";

import { Inbox } from "lucide-react";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { AppAvatar } from "@/components/ui/atoms/avatar/app-avatar";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import type { Locale } from "@/i18n/locales";
import type { DepositAccountRow, DepositAccountState } from "../types/deposit-account.types";
import { formatDepositCurrency, formatRelativeMovement } from "../utils/deposits-format";
import { DepositsRowActions } from "./deposits-row-actions";

import "@/components/ui/organisms/settings-data-table/settings-data-table.css";
import "@/modules/customers/components/customer-table.css";
import "./deposits-table.css";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function stateTone(state: DepositAccountState): "success" | "error" | "warning" | "neutral" {
  switch (state) {
    case "ACTIVE":
      return "success";
    case "PENDING_APPROVAL":
      return "warning";
    case "LOCKED":
    case "BLOCKED":
      return "error";
    case "CLOSED":
      return "neutral";
    default:
      return "neutral";
  }
}

type DepositsTableProps = {
  rows: DepositAccountRow[];
  locale: Locale;
  t: Translate;
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  onViewDetail: (row: DepositAccountRow) => void;
  onDepositWithdraw: (row: DepositAccountRow) => void;
  onHoldFunds: (row: DepositAccountRow) => void;
  onChangeStatus: (row: DepositAccountRow) => void;
  onDownloadStatement: (row: DepositAccountRow) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
};

export function DepositsTable({
  rows,
  locale,
  t,
  selectedIds,
  onToggleRow,
  onToggleAll,
  allVisibleSelected,
  someVisibleSelected,
  onViewDetail,
  onDepositWithdraw,
  onHoldFunds,
  onChangeStatus,
  onDownloadStatement,
  onClearFilters,
  hasActiveFilters,
}: DepositsTableProps) {
  const productLabel = (key: string) => t(`deposits.products.${key}`);
  const stateLabel = (s: DepositAccountState) => t(`deposits.states.${s}`);

  if (rows.length === 0) {
    return (
      <div className="zelify-deposits-table__empty" role="status">
        <Inbox className="zelify-deposits-table__empty-icon" size={40} strokeWidth={1.5} aria-hidden />
        <p className="zelify-deposits-table__empty-title">{t("deposits.table.emptyTitle")}</p>
        <p className="zelify-deposits-table__empty-hint">{t("deposits.table.emptyHint")}</p>
        {hasActiveFilters ? (
          <AppButton type="button" tone="primary" onClick={onClearFilters}>
            {t("deposits.table.clearFilters")}
          </AppButton>
        ) : null}
      </div>
    );
  }

  return (
    <div className="zelify-deposits-table-scroll">
      <SettingsDataTable variant="clients">
        <thead>
          <tr>
            <th scope="col" className="zelify-deposits-table__cb-cell">
              <input
                type="checkbox"
                className="zelify-deposits-table__cb"
                checked={allVisibleSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected;
                }}
                onChange={onToggleAll}
                aria-label={t("deposits.table.selectAllAria")}
              />
            </th>
            <th scope="col">{t("deposits.table.colAccount")}</th>
            <th scope="col">{t("deposits.table.colHolder")}</th>
            <th scope="col">{t("deposits.table.colProduct")}</th>
            <th scope="col" className="is-numeric-header">
              {t("deposits.table.colTotal")}
            </th>
            <th scope="col" className="is-numeric-header">
              {t("deposits.table.colAvailable")}
            </th>
            <th scope="col" className="is-numeric-header">
              {t("deposits.table.colRate")}
            </th>
            <th scope="col">{t("deposits.table.colState")}</th>
            <th scope="col">{t("deposits.table.colLastMovement")}</th>
            <th scope="col" className="is-actions">
              {t("deposits.table.colActions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const holderTypeLabel =
              row.holder.type === "GROUP"
                ? t("deposits.table.holderTypeGroup")
                : t("deposits.table.holderTypeIndividual");
            const rowActions = [
              {
                id: "detail",
                label: t("deposits.rowActions.viewDetail"),
                onSelect: () => onViewDetail(row),
              },
              {
                id: "dw",
                label: t("deposits.rowActions.depositWithdraw"),
                onSelect: () => onDepositWithdraw(row),
              },
              {
                id: "hold",
                label: t("deposits.rowActions.holdFunds"),
                onSelect: () => onHoldFunds(row),
              },
              {
                id: "status",
                label: t("deposits.rowActions.changeStatus"),
                onSelect: () => onChangeStatus(row),
              },
              {
                id: "pdf",
                label: t("deposits.rowActions.downloadStatement"),
                onSelect: () => onDownloadStatement(row),
              },
            ];

            return (
              <tr key={row.id}>
                <td className="zelify-deposits-table__cb-cell">
                  <input
                    type="checkbox"
                    className="zelify-deposits-table__cb"
                    checked={selectedIds.has(row.id)}
                    onChange={() => onToggleRow(row.id)}
                    aria-label={t("deposits.table.selectRowAria").replace("{id}", row.id)}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="zelify-customer-table__name-link"
                    onClick={() => onViewDetail(row)}
                  >
                    <span className="zelify-deposits-table__mono">{row.id}</span>
                  </button>
                </td>
                <td>
                  <div className="zelify-deposits-table__holder">
                    <AppAvatar initials={initialsFromName(row.holder.name)} className="zelify-customer-table__avatar" />
                    <div className="zelify-deposits-table__holder-meta">
                      <span className="zelify-deposits-table__holder-name">{row.holder.name}</span>
                      <span className="zelify-deposits-table__holder-type">{holderTypeLabel}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="zelify-deposits-table__product-pill">{productLabel(row.productKey)}</span>
                </td>
                <td className="is-numeric">{formatDepositCurrency(row.balances.total, locale)}</td>
                <td className="is-numeric zelify-deposits-table__balance--avail">
                  {formatDepositCurrency(row.balances.available, locale)}
                </td>
                <td className="is-numeric">{row.interestRate}</td>
                <td>
                  <AppBadge tone={stateTone(row.state)} size="sm">
                    {stateLabel(row.state)}
                  </AppBadge>
                </td>
                <td>{formatRelativeMovement(row.lastMovement, locale)}</td>
                <td className="is-actions">
                  <DepositsRowActions
                    summaryLabel={t("customers.common.actions")}
                    ariaLabel={t("deposits.rowActions.menuAria").replace("{id}", row.id)}
                    items={rowActions}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </SettingsDataTable>
    </div>
  );
}
