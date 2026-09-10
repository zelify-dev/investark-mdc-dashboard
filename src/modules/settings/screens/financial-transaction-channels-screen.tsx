"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppCheckbox } from "@/components/ui/atoms/checkbox/app-checkbox";
import { FinancialTableRowActions } from "@/modules/settings/components/financial-table-row-actions/financial-table-row-actions";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { mockTransactionChannels } from "../data/transaction-channels.mock";

import "./financial-transaction-channels-screen.css";

export function FinancialTransactionChannelsScreen() {
  const [showDeactivated, setShowDeactivated] = useState(false);

  const rows = useMemo(() => {
    if (showDeactivated) return mockTransactionChannels;
    return mockTransactionChannels.filter((c) => !c.isDeactivated);
  }, [showDeactivated]);

  return (
    <div className="zelify-tx-channels">
      <div className="zelify-tx-channels__toolbar">
        <AppCheckbox
          id="financial-tx-channels-show-deactivated"
          checked={showDeactivated}
          onChange={(e) => setShowDeactivated(e.target.checked)}
          label="Show deactivated transaction channels"
        />
      </div>

      <div className="zelify-tx-channels__table-wrap">
        <SettingsDataTable variant="clients">
          <thead>
            <tr>
              <th>Name</th>
              <th>Created</th>
              <th>Created by</th>
              <th>Active</th>
              <th className="zelify-settings-data-table__actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <span className="zelify-tx-channels__name">
                    {row.name}
                    {row.isDefault ? (
                      <AppBadge tone="neutral" size="sm" className="zelify-tx-channels__default-badge">
                        DEFAULT
                      </AppBadge>
                    ) : null}
                  </span>
                </td>
                <td>{row.created}</td>
                <td>
                  {row.createdByIsLink ? (
                    <Link
                      href="#"
                      className="zelify-tx-channels__creator-link"
                      onClick={(e) => e.preventDefault()}
                    >
                      {row.createdBy}
                    </Link>
                  ) : (
                    <span>{row.createdBy}</span>
                  )}
                </td>
                <td>
                  <span
                    className={`zelify-tx-channels__active ${row.isActive ? "is-on" : "is-off"}`}
                  >
                    <span className="zelify-tx-channels__active-dot" aria-hidden />
                    {row.isActive ? "Activated" : "Deactivated"}
                  </span>
                </td>
                <td className="is-actions">
                  <FinancialTableRowActions rowLabel={row.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </SettingsDataTable>
      </div>
    </div>
  );
}
