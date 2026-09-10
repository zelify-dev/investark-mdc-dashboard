"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppCheckbox } from "@/components/ui/atoms/checkbox/app-checkbox";
import { AppSelect } from "@/components/ui/atoms/select/app-select";
import { FinancialTableRowActions } from "@/modules/settings/components/financial-table-row-actions/financial-table-row-actions";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { CreateLoanProductModal } from "@/modules/settings/components/create-loan-product-modal/create-loan-product-modal";
import { mockAdminProductsDeposits } from "../data/admin-products-deposits.mock";
import { mockAdminProductsLoans } from "../data/admin-products-loans.mock";
import type { AdminProductKind, AdminProductRow, ProductTypeDefinition } from "../types/admin-product.types";

import "@/components/ui/templates/workspace-page.css";
import "./products-settings-screen.css";

type ScreenTab = AdminProductKind | "catalog";

// ─────────────────────────────────────────────────────────────
// Toggle switch component
// ─────────────────────────────────────────────────────────────
function ToggleSwitch({
  checked,
  onChange,
  disabled,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={[
        "zelify-products-toggle",
        checked ? "is-on" : "is-off",
        disabled ? "is-disabled" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onChange(!checked)}
    >
      <span className="zelify-products-toggle__thumb" aria-hidden />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Product instances table (Loans / Deposits tabs)
// ─────────────────────────────────────────────────────────────
function ProductsTable({
  rows,
  productKind,
  onToggleActive,
}: {
  rows: AdminProductRow[];
  productKind: AdminProductKind;
  onToggleActive: (id: string, next: boolean) => void;
}) {
  return (
    <SettingsDataTable variant="clients" className="zelify-products-settings__data-table">
      <thead>
        <tr>
          <th>Product</th>
          <th>ID</th>
          <th>Product category</th>
          <th>Product type</th>
          <th>Last modified</th>
          <th>Active</th>
          <th className="zelify-settings-data-table__actions-col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <Link
                href="#"
                className="zelify-products-settings__product-link"
                onClick={(e) => e.preventDefault()}
              >
                {row.productName}
              </Link>
            </td>
            <td>
              <span className="zelify-mono">{row.productCode}</span>
            </td>
            <td>{row.category}</td>
            <td>
              {row.productSubtype ? (
                <span title={`Subtype of: ${row.productSubtype}`}>
                  {row.productType}
                  <span className="zelify-products-settings__subtype-pill">
                    ↳ {row.productSubtype}
                  </span>
                </span>
              ) : (
                row.productType
              )}
            </td>
            <td>{row.lastModified}</td>
            <td>
              <ToggleSwitch
                checked={row.isActive}
                onChange={(next) => onToggleActive(row.id, next)}
                ariaLabel={`Toggle ${row.productName}`}
              />
            </td>
            <td className="is-actions">
              <FinancialTableRowActions rowLabel={`${productKind}-${row.id}`} />
            </td>
          </tr>
        ))}
      </tbody>
    </SettingsDataTable>
  );
}

// ─────────────────────────────────────────────────────────────
// Type catalog table (fetched from Supabase)
// ─────────────────────────────────────────────────────────────
function TypeCatalogTable({
  rows,
  loading,
  onToggle,
  togglingId,
}: {
  rows: ProductTypeDefinition[];
  loading: boolean;
  onToggle: (id: string, next: boolean) => void;
  togglingId: string | null;
}) {
  const loans = rows.filter((r) => r.kind === "LOAN");
  const deposits = rows.filter((r) => r.kind === "DEPOSIT");

  if (loading) {
    return <p className="zelify-products-catalog__loading">Loading product type catalog…</p>;
  }

  return (
    <div className="zelify-products-catalog">
      <CatalogSection
        title="Loan Products"
        badge="LOAN"
        rows={loans}
        onToggle={onToggle}
        togglingId={togglingId}
      />
      <CatalogSection
        title="Deposit Products"
        badge="DEPOSIT"
        rows={deposits}
        onToggle={onToggle}
        togglingId={togglingId}
      />
    </div>
  );
}

function CatalogSection({
  title,
  badge,
  rows,
  onToggle,
  togglingId,
}: {
  title: string;
  badge: string;
  rows: ProductTypeDefinition[];
  onToggle: (id: string, next: boolean) => void;
  togglingId: string | null;
}) {
  return (
    <section className="zelify-products-catalog__section">
      <div className="zelify-products-catalog__section-header">
        <h3 className="zelify-products-catalog__section-title">{title}</h3>
        <span className={`zelify-products-catalog__kind-badge is-${badge.toLowerCase()}`}>
          {badge}
        </span>
      </div>
      <SettingsDataTable variant="clients">
        <thead>
          <tr>
            <th>Type name</th>
            <th>Code</th>
            <th>Badge</th>
            <th>Subtype of</th>
            <th>Features</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={!row.is_active ? "zelify-products-catalog__row--inactive" : ""}>
              <td>
                <span className="zelify-products-catalog__type-name">{row.name}</span>
                {row.description ? (
                  <p className="zelify-products-catalog__type-desc">{row.description}</p>
                ) : null}
              </td>
              <td>
                <span className="zelify-mono zelify-products-catalog__code">{row.code}</span>
              </td>
              <td>
                {row.badge ? (
                  <span className="zelify-products-catalog__badge">{row.badge}</span>
                ) : (
                  <span className="zelify-products-catalog__no-badge">—</span>
                )}
              </td>
              <td>
                {row.subtype_of ? (
                  <span className="zelify-products-settings__subtype-pill">{row.subtype_of}</span>
                ) : (
                  <span className="zelify-products-catalog__no-badge">—</span>
                )}
              </td>
              <td>
                {row.features && row.features.length > 0 ? (
                  <details className="zelify-products-catalog__features">
                    <summary>{row.features.length} features</summary>
                    <ul>
                      {row.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <span className="zelify-products-catalog__no-badge">—</span>
                )}
              </td>
              <td>
                <ToggleSwitch
                  checked={row.is_active}
                  onChange={(next) => onToggle(row.id, next)}
                  disabled={togglingId === row.id}
                  ariaLabel={`Activate ${row.name}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </SettingsDataTable>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────
export function ProductsSettingsScreen() {
  const [tab, setTab] = useState<ScreenTab>("loans");
  const [branch, setBranch] = useState("");
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [createLoanOpen, setCreateLoanOpen] = useState(false);

  // ── Product instances state ──────────────────────────────
  const [loanRows, setLoanRows] = useState<AdminProductRow[]>(mockAdminProductsLoans);
  const [depositRows, setDepositRows] = useState<AdminProductRow[]>(mockAdminProductsDeposits);

  const toggleInstanceActive = useCallback(
    (id: string, next: boolean, kind: AdminProductKind) => {
      if (kind === "loans") {
        setLoanRows((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isActive: next, isDeactivated: !next } : r))
        );
      } else {
        setDepositRows((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isActive: next, isDeactivated: !next } : r))
        );
      }
    },
    []
  );

  const activeKind: AdminProductKind = tab === "catalog" ? "loans" : tab;
  const sourceRows = activeKind === "loans" ? loanRows : depositRows;
  const instanceRows = useMemo(() => {
    if (showDeactivated) return sourceRows;
    return sourceRows.filter((p) => !p.isDeactivated);
  }, [sourceRows, showDeactivated]);

  // ── Type catalog state ───────────────────────────────────
  const [catalogRows, setCatalogRows] = useState<ProductTypeDefinition[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const catalogFetched = useRef(false);

  useEffect(() => {
    if (tab !== "catalog" || catalogFetched.current) return;
    catalogFetched.current = true;
    setCatalogLoading(true);
    fetch("/api/product-type-definitions")
      .then((r) => r.json())
      .then((json: { data?: ProductTypeDefinition[] }) => {
        setCatalogRows(json.data ?? []);
      })
      .catch(() => {/* silently keep empty */})
      .finally(() => setCatalogLoading(false));
  }, [tab]);

  const handleCatalogToggle = useCallback(async (id: string, next: boolean) => {
    setTogglingId(id);
    setCatalogRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_active: next } : r))
    );
    try {
      await fetch("/api/product-type-definitions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: next }),
      });
    } catch {
      // revert on error
      setCatalogRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: !next } : r))
      );
    } finally {
      setTogglingId(null);
    }
  }, []);

  return (
    <div className="zelify-products-settings">
      <div className="zelify-products-settings__tabs" role="tablist" aria-label="Product section">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "loans"}
          className={["zelify-org-tab", tab === "loans" ? "is-active" : ""].filter(Boolean).join(" ")}
          onClick={() => setTab("loans")}
        >
          Loans
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "deposits"}
          className={["zelify-org-tab", tab === "deposits" ? "is-active" : ""].filter(Boolean).join(" ")}
          onClick={() => setTab("deposits")}
        >
          Deposits
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "catalog"}
          className={["zelify-org-tab", tab === "catalog" ? "is-active" : ""].filter(Boolean).join(" ")}
          onClick={() => setTab("catalog")}
        >
          Type Catalog
        </button>
      </div>

      {tab !== "catalog" ? (
        <>
          <div className="zelify-products-settings__toolbar">
            <div className="zelify-products-settings__branch-field">
              <AppSelect
                id="products-branch"
                size="md"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                aria-label="Branch"
              >
                <option value="">All Branches</option>
                <option value="milan">Milan Main</option>
                <option value="madrid">Madrid Central</option>
                <option value="northern">Northern Italy Cluster</option>
              </AppSelect>
              <span className="zelify-products-settings__branch-icon" aria-hidden>
                <Home size={18} strokeWidth={1.75} />
              </span>
            </div>
            <AppButton type="button" tone="primary">
              Filter
            </AppButton>
          </div>

          <div className="zelify-products-settings__checkbox">
            <AppCheckbox
              id="products-show-deactivated"
              checked={showDeactivated}
              onChange={(e) => setShowDeactivated(e.target.checked)}
              label="Show deactivated products"
            />
          </div>

          <div className="zelify-products-settings__table-wrap">
            <ProductsTable
              rows={instanceRows}
              productKind={activeKind}
              onToggleActive={(id, next) => toggleInstanceActive(id, next, activeKind)}
            />
          </div>

          {tab === "loans" ? (
            <div className="zelify-products-settings__create-loan">
              <AppButton type="button" tone="primary" onClick={() => setCreateLoanOpen(true)}>
                Create new loan product
              </AppButton>
            </div>
          ) : null}
        </>
      ) : (
        <div className="zelify-products-catalog__wrap">
          <p className="zelify-products-catalog__hint">
            Activate or deactivate product types to control which templates are available when creating new products.
            Changes are saved to the database immediately.
          </p>
          <TypeCatalogTable
            rows={catalogRows}
            loading={catalogLoading}
            onToggle={handleCatalogToggle}
            togglingId={togglingId}
          />
        </div>
      )}

      <CreateLoanProductModal open={createLoanOpen} onClose={() => setCreateLoanOpen(false)} />
    </div>
  );
}
