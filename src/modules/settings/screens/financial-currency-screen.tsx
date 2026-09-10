"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { FinancialTableRowActions } from "@/modules/settings/components/financial-table-row-actions/financial-table-row-actions";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { mockAccountingRates } from "../data/financial-accounting-rates.mock";
import { mockConversions } from "../data/financial-conversions.mock";
import { mockCurrenciesInUse } from "../data/financial-currencies.mock";
import { mockExchangeRatesFromUsd } from "../data/financial-exchange-rates.mock";
import type { CurrencyKind } from "../types/financial-currency.types";

import "./financial-currency-screen.css";

const KIND_LABEL: Record<CurrencyKind, string> = {
  FIAT: "Fiat Currency",
  CRYPTO: "Cryptocurrency",
  NON_TRADITIONAL: "Non-Traditional Currency",
};

export function FinancialCurrencyScreen() {
  return (
    <div className="zelify-financial-currency">
      <CollapsibleTableSection title="Currencies In Use" defaultOpen>
        <div className="zelify-financial-currency__table-wrap">
          <SettingsDataTable variant="clients">
            <thead>
              <tr>
                <th>Code</th>
                <th>Numerical code</th>
                <th>Name</th>
                <th>Symbol</th>
                <th>Type</th>
                <th className="zelify-settings-data-table__actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockCurrenciesInUse.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="zelify-financial-currency__code">{row.code}</span>
                  </td>
                  <td className="is-numeric">
                    {row.numericalCode ?? <span className="zelify-financial-currency__empty">—</span>}
                  </td>
                  <td>
                    <span className="zelify-financial-currency__name">
                      {row.name}
                      {row.isBase ? (
                        <AppBadge tone="neutral" size="sm" className="zelify-financial-currency__base-badge">
                          BASE
                        </AppBadge>
                      ) : null}
                    </span>
                  </td>
                  <td>{row.symbol}</td>
                  <td>{KIND_LABEL[row.kind]}</td>
                  <td className="is-actions">
                    <FinancialTableRowActions rowLabel={row.code} />
                  </td>
                </tr>
              ))}
            </tbody>
          </SettingsDataTable>
        </div>
      </CollapsibleTableSection>

      <div className="zelify-financial-currency__footer-actions">
        <AppButton tone="primary" type="button">
          Add Currency
        </AppButton>
      </div>

      <CollapsibleTableSection title="Accounting Rates" defaultOpen>
        <div className="zelify-financial-currency__table-wrap">
          <SettingsDataTable variant="clients">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th className="is-numeric-header">Rate</th>
                <th>Date set</th>
                <th className="zelify-settings-data-table__actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockAccountingRates.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="zelify-financial-currency__code">{row.code}</span>
                  </td>
                  <td>{row.name}</td>
                  <td className="is-numeric">
                    <NotSetOrValue
                      value={row.rate}
                      format={(n) => formatAccountingRate(n)}
                    />
                  </td>
                  <td className="is-numeric">
                    <NotSetOrDate dateSet={row.dateSet} />
                  </td>
                  <td className="is-actions">
                    <FinancialTableRowActions rowLabel={`${row.code}-accounting`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </SettingsDataTable>
        </div>
      </CollapsibleTableSection>

      <CollapsibleTableSection title="Exchange Rates - From US Dollar (USD)" defaultOpen>
        <div className="zelify-financial-currency__table-wrap">
          <SettingsDataTable variant="clients">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th className="is-numeric-header">Buy rate</th>
                <th className="is-numeric-header">Sell rate</th>
                <th>Date set</th>
                <th className="zelify-settings-data-table__actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockExchangeRatesFromUsd.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="zelify-financial-currency__code">{row.code}</span>
                  </td>
                  <td>{row.name}</td>
                  <td className="is-numeric">
                    <NotSetOrValue value={row.buyRate} format={(n) => formatExchangeRate(n)} />
                  </td>
                  <td className="is-numeric">
                    <NotSetOrValue value={row.sellRate} format={(n) => formatExchangeRate(n)} />
                  </td>
                  <td className="is-numeric">
                    <NotSetOrDate dateSet={row.dateSet} />
                  </td>
                  <td className="is-actions">
                    <FinancialTableRowActions rowLabel={`${row.code}-exchange`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </SettingsDataTable>
        </div>
      </CollapsibleTableSection>

      <CollapsibleTableSection title="Conversions Table" defaultOpen={false}>
        <div className="zelify-financial-currency__table-wrap">
          <SettingsDataTable variant="clients">
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th className="is-numeric-header">Conversion rate</th>
                <th>Date set</th>
                <th className="zelify-settings-data-table__actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockConversions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="zelify-financial-currency__empty-row">
                    No conversion rules defined.
                  </td>
                </tr>
              ) : (
                mockConversions.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className="zelify-financial-currency__code">{row.fromCode}</span>
                    </td>
                    <td>
                      <span className="zelify-financial-currency__code">{row.toCode}</span>
                    </td>
                    <td className="is-numeric">
                      <NotSetOrValue value={row.rate} format={(n) => formatExchangeRate(n)} />
                    </td>
                    <td className="is-numeric">
                      <NotSetOrDate dateSet={row.dateSet} />
                    </td>
                    <td className="is-actions">
                      <FinancialTableRowActions rowLabel={`${row.id}-conversion`} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </SettingsDataTable>
        </div>
      </CollapsibleTableSection>
    </div>
  );
}

type CollapsibleTableSectionProps = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

function CollapsibleTableSection({ title, defaultOpen = true, children }: CollapsibleTableSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="zelify-financial-currency__section">
      <button
        type="button"
        className="zelify-financial-currency__section-toggle"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <ChevronDown
          size={18}
          className={`zelify-financial-currency__chevron ${open ? "is-open" : ""}`}
          aria-hidden
        />
        <span>{title}</span>
      </button>
      {open ? children : null}
    </div>
  );
}

function NotSetOrValue({
  value,
  format,
}: {
  value: number | null;
  format: (n: number) => string;
}) {
  if (value === null) {
    return <span className="zelify-financial-currency__not-set">Not Set</span>;
  }
  return <span>{format(value)}</span>;
}

function NotSetOrDate({ dateSet }: { dateSet: string | null }) {
  if (dateSet === null) {
    return <span className="zelify-financial-currency__not-set">Not Set</span>;
  }
  return <span>{dateSet}</span>;
}

function formatAccountingRate(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) >= 1000) {
    return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  return n.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

function formatExchangeRate(n: number): string {
  const abs = Math.abs(n);
  if (abs > 0 && abs < 0.0001) {
    return n.toLocaleString("en-US", { maximumSignificantDigits: 6 });
  }
  if (abs >= 1000) {
    return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 });
}
