"use client";

import { useState } from "react";

import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { FieldLabel } from "@/components/ui/atoms/field-label/field-label";
import { AppSelect } from "@/components/ui/atoms/select/app-select";
import { FormField } from "@/components/ui/molecules/form-field/form-field";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";

import "./client-types-screen.css";

type ClientTypeRow = {
  id: string;
  name: string;
  created: string;
  createdBy: string;
  isDefault?: boolean;
};

const MOCK_ROWS: ClientTypeRow[] = [
  { id: "1", name: "Cliente", created: "21-05-2025", createdBy: "Zelify Core", isDefault: true },
  { id: "2", name: "Microempresario", created: "02-06-2025", createdBy: "Camila Rojas" },
  { id: "3", name: "Profesional Independiente", created: "28-05-2025", createdBy: "Jose M. Herrera" },
];

export function ClientTypesScreen() {
  const [typeFilter, setTypeFilter] = useState("client");

  return (
    <div className="zelify-client-types">
      <div className="zelify-client-types__main">
        <div className="zelify-client-types__toolbar">
          <FormField
            className="zelify-client-types__filter-field"
            label={<FieldLabel htmlFor="client-type-filter">Type</FieldLabel>}
            control={
              <AppSelect
                id="client-type-filter"
                size="md"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Filter by type"
              >
                <option value="client">Client</option>
                <option value="group">Group</option>
              </AppSelect>
            }
          />
        </div>

        <SettingsDataTable>
          <thead>
            <tr>
              <th>Name</th>
              <th>Created</th>
              <th>Created By</th>
              <th className="zelify-settings-data-table__actions-col" />
            </tr>
          </thead>
          <tbody>
            {MOCK_ROWS.map((row) => (
              <tr key={row.id}>
                <td>
                  <span className="zelify-client-types__name">
                    {row.name}
                    {row.isDefault ? (
                      <AppBadge tone="neutral" size="sm" className="zelify-client-types__default-badge">
                        DEFAULT
                      </AppBadge>
                    ) : null}
                  </span>
                </td>
                <td>{row.created}</td>
                <td>{row.createdBy}</td>
                <td className="is-actions">
                  <AppButton type="button" tone="primary" className="zelify-button--compact">
                    Actions
                    <ChevronDownSmall />
                  </AppButton>
                </td>
              </tr>
            ))}
          </tbody>
        </SettingsDataTable>

        <div className="zelify-client-types__footer-actions">
          <AppButton type="button" tone="secondary">
            Rearrange
          </AppButton>
          <AppButton type="button" tone="primary">
            Add Type
          </AppButton>
        </div>
      </div>
    </div>
  );
}

function ChevronDownSmall() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3.5 5.25 7 8.75l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
