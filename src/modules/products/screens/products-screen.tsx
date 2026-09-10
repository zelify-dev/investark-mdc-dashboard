"use client";

import { useEffect, useMemo, useState } from "react";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { productsService } from "../services/products.service";
import type { ProductTypeDefinition, ProductKind } from "../types/product.types";

import "@/components/ui/templates/workspace-page.css";
import "./products-screen.css";

// ── Toggle switch ─────────────────────────────────────────────
function Toggle({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={[
        "zelify-ptype-toggle",
        checked ? "is-on" : "is-off",
        disabled ? "is-disabled" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onChange(!checked)}
    >
      <span className="zelify-ptype-toggle__thumb" aria-hidden />
    </button>
  );
}

// ── Feature list ──────────────────────────────────────────────
function FeatureList({ features }: { features: string[] | null }) {
  if (!features?.length) return <span className="zelify-ptype-na">—</span>;
  return (
    <details className="zelify-ptype-features">
      <summary>{features.length} features</summary>
      <ul>
        {features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </details>
  );
}

// ── Section (Loans / Deposits) ────────────────────────────────
function ProductSection({
  title,
  rows,
  togglingId,
  onToggle,
}: {
  title: string;
  rows: ProductTypeDefinition[];
  togglingId: string | null;
  onToggle: (id: string, next: boolean) => void;
}) {
  return (
    <section className="zelify-ptype-section">
      <div className="zelify-ptype-section__header">
        <h2 className="zelify-ptype-section__title">{title}</h2>
        <span className="zelify-ptype-section__count">{rows.length} tipos</span>
      </div>

      <SettingsDataTable variant="clients" className="zelify-ptype-table">
        <thead>
          <tr>
            <th>Tipo de producto</th>
            <th>Código</th>
            <th>Etiqueta</th>
            <th>Subtipo de</th>
            <th>Características</th>
            <th>Última actualización</th>
            <th>Activo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={!row.is_active ? "zelify-ptype-row--inactive" : ""}
            >
              <td>
                <span className="zelify-ptype-name">{row.name}</span>
                {row.description ? (
                  <p className="zelify-ptype-desc">{row.description}</p>
                ) : null}
              </td>
              <td>
                <span className="zelify-mono zelify-ptype-code">{row.code}</span>
              </td>
              <td>
                {row.badge ? (
                  <span className="zelify-ptype-badge">{row.badge}</span>
                ) : (
                  <span className="zelify-ptype-na">—</span>
                )}
              </td>
              <td>
                {row.subtype_of ? (
                  <span className="zelify-ptype-subtype">{row.subtype_of}</span>
                ) : (
                  <span className="zelify-ptype-na">—</span>
                )}
              </td>
              <td>
                <FeatureList features={row.features} />
              </td>
              <td className="zelify-ptype-date">{row.updated_at.slice(0, 10)}</td>
              <td>
                <Toggle
                  checked={row.is_active}
                  disabled={togglingId === row.id}
                  onChange={(next) => onToggle(row.id, next)}
                  label={`Activar ${row.name}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </SettingsDataTable>
    </section>
  );
}

// ── Main screen ───────────────────────────────────────────────
export function ProductsScreen() {
  const [rows, setRows] = useState<ProductTypeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"ALL" | ProductKind>("ALL");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    productsService
      .getAllTypes()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (kindFilter !== "ALL" && r.kind !== kindFilter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, query, kindFilter]);

  const loans = filtered.filter((r) => r.kind === "LOAN");
  const deposits = filtered.filter((r) => r.kind === "DEPOSIT");

  const handleToggle = async (id: string, next: boolean) => {
    setTogglingId(id);
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_active: next } : r))
    );
    try {
      await productsService.toggleActive(id, next);
    } catch {
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: !next } : r))
      );
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />
      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner zelify-ptype-screen">

          {/* Header */}
          <header className="zelify-ptype-screen__head">
            <div>
              <h1 className="zelify-workspace-page__title">Catálogo de productos</h1>
              <p className="zelify-ptype-meta">
                Tipos de producto disponibles: activa o desactiva cada tipo para controlar cuáles productos se pueden crear.
              </p>
            </div>
          </header>

          {/* Toolbar */}
          <section className="zelify-ptype-toolbar">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o código…"
              className="zelify-ptype-search"
            />
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value as typeof kindFilter)}
              className="zelify-ptype-filter"
            >
              <option value="ALL">Todos los tipos</option>
              <option value="LOAN">Solo préstamos</option>
              <option value="DEPOSIT">Solo depósitos</option>
            </select>
          </section>

          {/* Content */}
          {loading ? (
            <p className="zelify-ptype-loading">Cargando catálogo de productos…</p>
          ) : (
            <>
              {(kindFilter === "ALL" || kindFilter === "LOAN") && loans.length > 0 && (
                <ProductSection
                  title="Productos de Préstamo"
                  rows={loans}
                  togglingId={togglingId}
                  onToggle={handleToggle}
                />
              )}
              {(kindFilter === "ALL" || kindFilter === "DEPOSIT") && deposits.length > 0 && (
                <ProductSection
                  title="Productos de Depósito"
                  rows={deposits}
                  togglingId={togglingId}
                  onToggle={handleToggle}
                />
              )}
              {filtered.length === 0 && (
                <p className="zelify-ptype-empty">No hay tipos de producto que coincidan con la búsqueda.</p>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
