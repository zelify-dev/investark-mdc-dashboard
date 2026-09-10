"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { AppAvatar } from "@/components/ui/atoms/avatar/app-avatar";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import type { InactiveCustomerRow, InactiveSubStatus } from "../types/customer-segment.types";
import { CustomerTableRowActions } from "./customer-table-row-actions";
import { useI18n } from "@/providers/i18n-provider";

import "./customer-table.css";
import "./customer-segment-table.css";

type SortKey = "fullName" | "id" | "subStatus" | "branch" | "updatedAt";

function initialsFromName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function SubStatusBadge({ sub, t }: { sub: InactiveSubStatus; t: (key: string) => string }) {
  switch (sub) {
    case "INACTIVE":
      return (
        <AppBadge tone="neutral" size="sm">
          {t("customers.inactive.status.inactive")}
        </AppBadge>
      );
    case "SUSPENDED":
      return (
        <AppBadge tone="warning" size="sm">
          {t("customers.inactive.status.suspended")}
        </AppBadge>
      );
    case "DORMANT":
      return (
        <AppBadge tone="neutral" size="sm" className="zelify-badge--dormant">
          {t("customers.inactive.status.dormant")}
        </AppBadge>
      );
    case "CLOSED":
      return (
        <AppBadge size="sm" className="zelify-badge--closed-subtle">
          {t("customers.inactive.status.closed")}
        </AppBadge>
      );
    default:
      return (
        <AppBadge tone="neutral" size="sm">
          {sub}
        </AppBadge>
      );
  }
}

type InactiveCustomersTableProps = {
  rows: InactiveCustomerRow[];
};

export function InactiveCustomersTable({ rows }: InactiveCustomersTableProps) {
  const { t } = useI18n();
  const [sortKey, setSortKey] = useState<SortKey>("fullName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const inactiveActions = useMemo(
    () => [
      t("customers.inactive.rowActions.viewProfile"),
      t("customers.inactive.rowActions.reactivate"),
      t("customers.inactive.rowActions.edit"),
      t("customers.inactive.rowActions.addNote"),
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
        <p className="zelify-customer-segment-empty__msg">{t("customers.inactive.table.empty")}</p>
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
                  {t("customers.inactive.table.colCustomerName")}
                </th>
                <th
                  className="is-sortable"
                  scope="col"
                  onClick={() => toggleSort("id")}
                  aria-sort={sortKey === "id" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                >
                  {t("customers.inactive.table.colCustomerId")}
                </th>
                <th
                  className="is-sortable"
                  scope="col"
                  onClick={() => toggleSort("subStatus")}
                  aria-sort={sortKey === "subStatus" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                >
                  {t("customers.inactive.table.colStatus")}
                </th>
                <th scope="col">{t("customers.inactive.table.colBranch")}</th>
                <th scope="col">{t("customers.inactive.table.colCentre")}</th>
                <th className="is-numeric-header" scope="col">
                  {t("customers.inactive.table.colLastActivity")}
                </th>
                <th
                  className="is-sortable is-numeric-header"
                  scope="col"
                  onClick={() => toggleSort("updatedAt")}
                  aria-sort={sortKey === "updatedAt" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                >
                  {t("customers.inactive.table.colUpdatedAt")}
                </th>
                <th scope="col">{t("customers.inactive.table.colAssignedOfficer")}</th>
                <th scope="col" className="zelify-customer-segment-actions">
                  {t("customers.inactive.table.colActions")}
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
                    <SubStatusBadge sub={row.subStatus} t={t} />
                  </td>
                  <td>{row.branch}</td>
                  <td>{row.centre}</td>
                  <td className="is-numeric">{row.lastActivity}</td>
                  <td className="is-numeric">{row.updatedAt}</td>
                  <td>{row.assignedOfficer}</td>
                  <td className="is-actions">
                    <CustomerTableRowActions rowLabel={row.fullName} items={inactiveActions} />
                  </td>
                </tr>
              ))}
            </tbody>
      </SettingsDataTable>
    </div>
  );
}
