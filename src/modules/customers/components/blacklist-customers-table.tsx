"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { AppAvatar } from "@/components/ui/atoms/avatar/app-avatar";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import type { BlacklistCustomerRow, BlacklistRiskLevel } from "../types/customer-segment.types";
import { CustomerTableRowActions } from "./customer-table-row-actions";
import { useI18n } from "@/providers/i18n-provider";

import "./customer-table.css";
import "./customer-segment-table.css";

type SortKey = "fullName" | "id" | "riskLevel" | "addedAt";

function initialsFromName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function RiskBadge({ level, t }: { level: BlacklistRiskLevel; t: (key: string) => string }) {
  switch (level) {
    case "CRITICAL":
      return (
        <AppBadge tone="error" size="sm">
          {t("customers.blacklist.risk.critical")}
        </AppBadge>
      );
    case "HIGH":
      return (
        <AppBadge tone="warning" size="sm">
          {t("customers.blacklist.risk.high")}
        </AppBadge>
      );
    case "MEDIUM":
      return (
        <AppBadge size="sm" className="zelify-badge--risk-medium">
          {t("customers.blacklist.risk.medium")}
        </AppBadge>
      );
    case "LOW":
      return (
        <AppBadge tone="neutral" size="sm">
          {t("customers.blacklist.risk.low")}
        </AppBadge>
      );
    default:
      return (
        <AppBadge tone="neutral" size="sm">
          {level}
        </AppBadge>
      );
  }
}

type BlacklistCustomersTableProps = {
  rows: BlacklistCustomerRow[];
};

export function BlacklistCustomersTable({ rows }: BlacklistCustomersTableProps) {
  const { t } = useI18n();
  const [sortKey, setSortKey] = useState<SortKey>("fullName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const blacklistActions = useMemo(
    () => [
      t("customers.blacklist.rowActions.viewProfile"),
      t("customers.blacklist.rowActions.reviewCase"),
      t("customers.blacklist.rowActions.removeRestriction"),
      t("customers.blacklist.rowActions.addInternalNote"),
    ],
    [t],
  );

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  if (rows.length === 0) {
    return (
      <div className="zelify-customer-segment-empty" role="status">
        <p className="zelify-customer-segment-empty__msg">{t("customers.blacklist.table.empty")}</p>
      </div>
    );
  }

  return (
    <div className="zelify-customer-segment-table-wrap">
      <SettingsDataTable variant="clients">
        <thead>
          <tr>
            <th
              className="is-sortable"
              scope="col"
              onClick={() => toggleSort("fullName")}
              aria-sort={sortKey === "fullName" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
            >
              {t("customers.blacklist.table.colCustomerName")}
            </th>
            <th
              className="is-sortable"
              scope="col"
              onClick={() => toggleSort("id")}
              aria-sort={sortKey === "id" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
            >
              {t("customers.blacklist.table.colCustomerId")}
            </th>
            <th scope="col">{t("customers.blacklist.table.colReason")}</th>
            <th
              className="is-sortable"
              scope="col"
              onClick={() => toggleSort("riskLevel")}
              aria-sort={sortKey === "riskLevel" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
            >
              {t("customers.blacklist.table.colRiskLevel")}
            </th>
            <th scope="col">{t("customers.blacklist.table.colStatus")}</th>
            <th scope="col">{t("customers.blacklist.table.colBranch")}</th>
            <th
              className="is-sortable is-numeric-header"
              scope="col"
              onClick={() => toggleSort("addedAt")}
              aria-sort={sortKey === "addedAt" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
            >
              {t("customers.blacklist.table.colAddedAt")}
            </th>
            <th scope="col">{t("customers.blacklist.table.colReviewedBy")}</th>
            <th scope="col" className="zelify-customer-segment-actions">
              {t("customers.blacklist.table.colActions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.id}>
              <td>
                <Link href={`/customers/${row.id}`} className="zelify-customer-table__name-link">
                  <AppAvatar initials={initialsFromName(row.fullName)} className="zelify-customer-table__avatar" />
                  <span>{row.fullName}</span>
                </Link>
              </td>
              <td>
                <span className="zelify-mono">{row.id}</span>
              </td>
              <td>
                <span className="zelify-customer-segment-reason">{row.reason}</span>
              </td>
              <td>
                <RiskBadge level={row.riskLevel} t={t} />
              </td>
              <td>{row.status}</td>
              <td>{row.branch}</td>
              <td className="is-numeric">{row.addedAt}</td>
              <td>{row.reviewedBy}</td>
              <td className="is-actions">
                <CustomerTableRowActions rowLabel={row.fullName} items={blacklistActions} />
              </td>
            </tr>
          ))}
        </tbody>
      </SettingsDataTable>
    </div>
  );
}
