"use client";

import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import type { Branch, BranchFormData, BranchStatus } from "../types/branch.types";

import "./branch-sidebar.css";

type Mode = "idle" | "create" | "edit";

type Props = {
  mode: Mode;
  form: BranchFormData;
  branches: Branch[];
  selectedBranch: Branch | null;
  saving: boolean;
  onFormChange: (patch: Partial<BranchFormData>) => void;
  onNew: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onSelectBranch: (branch: Branch) => void;
};

export function BranchSidebar({
  mode,
  form,
  branches,
  selectedBranch,
  saving,
  onFormChange,
  onNew,
  onSave,
  onCancel,
  onDelete,
  onSelectBranch,
}: Props) {
  const isFormOpen = mode === "create" || mode === "edit";

  const existingPrincipalBranch = branches.find(
    (b) => (b.type === "PRINCIPAL" || b.isPrincipal) && (mode === "create" || b.id !== selectedBranch?.id)
  );
  const isPrincipalDisabled = Boolean(existingPrincipalBranch);

  return (
    <aside className="branch-sidebar">
      {/* Header */}
      <div className="branch-sidebar__header">
        <div>
          <h2 className="branch-sidebar__title">Sucursales</h2>
          <p className="branch-sidebar__count">{branches.length} registradas</p>
        </div>
        {!isFormOpen && (
          <AppButton tone="primary" onClick={onNew} type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nueva
          </AppButton>
        )}
      </div>

      {/* Form */}
      {isFormOpen && (
        <div className="branch-sidebar__form">
          <div className="branch-sidebar__form-header">
            <span className="branch-sidebar__form-badge">
              {mode === "create" ? "Nueva sucursal" : "Editar sucursal"}
            </span>
            <button className="branch-sidebar__form-close" onClick={onCancel} type="button" aria-label="Cerrar formulario">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="branch-sidebar__fields">
            {/* Nombre */}
            <div className="branch-sidebar__field">
              <label className="branch-sidebar__label" htmlFor="bs-name">
                Nombre <span className="branch-sidebar__required">*</span>
              </label>
              <AppInput
                id="bs-name"
                value={form.name}
                onChange={(e) => onFormChange({ name: e.target.value })}
                placeholder="Ej. Sucursal CDMX Centro"
                autoFocus
              />
            </div>

            {/* Dirección */}
            <div className="branch-sidebar__field">
              <label className="branch-sidebar__label" htmlFor="bs-address">
                Dirección (calles)
              </label>
              <AppInput
                id="bs-address"
                value={form.address}
                onChange={(e) => onFormChange({ address: e.target.value })}
                placeholder="Ej. Av. Juárez 100"
              />
            </div>

            {/* Colonia */}
            <div className="branch-sidebar__field">
              <label className="branch-sidebar__label" htmlFor="bs-colonia">
                Colonia
              </label>
              <AppInput
                id="bs-colonia"
                value={form.colonia}
                onChange={(e) => onFormChange({ colonia: e.target.value })}
                placeholder="Ej. Centro Histórico"
              />
            </div>

            {/* Coordinates row */}
            <div className="branch-sidebar__coords-hint">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Haz clic en el mapa para capturar las coordenadas
            </div>

            <div className="branch-sidebar__coords-row">
              <div className="branch-sidebar__field">
                <label className="branch-sidebar__label" htmlFor="bs-lat">Latitud</label>
                <div className="branch-sidebar__readonly-input">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <AppInput
                    id="bs-lat"
                    value={form.latitude !== null ? String(form.latitude.toFixed(6)) : ""}
                    readOnly
                    placeholder="— clic en mapa —"
                    className="branch-sidebar__coord-input"
                  />
                </div>
              </div>
              <div className="branch-sidebar__field">
                <label className="branch-sidebar__label" htmlFor="bs-lng">Longitud</label>
                <div className="branch-sidebar__readonly-input">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <AppInput
                    id="bs-lng"
                    value={form.longitude !== null ? String(form.longitude.toFixed(6)) : ""}
                    readOnly
                    placeholder="— clic en mapa —"
                    className="branch-sidebar__coord-input"
                  />
                </div>
              </div>
            </div>

            {/* Tipo de sucursal */}
            <div className="branch-sidebar__field">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                <label className="branch-sidebar__label">Tipo de sucursal</label>
                {isPrincipalDisabled && (
                  <span style={{ fontSize: 11, color: "#d97706", fontWeight: 500 }} title={`Ya existe: ${existingPrincipalBranch?.name}`}>
                    Ya existe principal
                  </span>
                )}
              </div>
              <div className="branch-sidebar__status-toggle">
                <button
                  type="button"
                  className={`branch-sidebar__status-btn ${(form.type === "PRINCIPAL" || form.isPrincipal) ? "is-principal" : ""}${isPrincipalDisabled ? " is-disabled" : ""}`}
                  disabled={isPrincipalDisabled}
                  onClick={() => {
                    if (!isPrincipalDisabled) {
                      onFormChange({ type: "PRINCIPAL", isPrincipal: true });
                    }
                  }}
                  title={isPrincipalDisabled ? `Ya existe una sucursal principal (${existingPrincipalBranch?.name})` : "Principal"}
                >
                  Principal
                </button>
                <button
                  type="button"
                  className={`branch-sidebar__status-btn ${(form.type === "SECUNDARIA" || !form.isPrincipal) ? "is-secondary" : ""}`}
                  onClick={() => onFormChange({ type: "SECUNDARIA", isPrincipal: false })}
                >
                  Secundaria
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="branch-sidebar__field">
              <label className="branch-sidebar__label">Estado</label>
              <div className="branch-sidebar__status-toggle">
                <button
                  type="button"
                  className={`branch-sidebar__status-btn ${form.status === "ACTIVE" ? "is-active" : ""}`}
                  onClick={() => onFormChange({ status: "ACTIVE" as BranchStatus })}
                >
                  <span className="branch-sidebar__status-dot" />
                  Activo
                </button>
                <button
                  type="button"
                  className={`branch-sidebar__status-btn ${form.status === "INACTIVE" ? "is-inactive-sel" : ""}`}
                  onClick={() => onFormChange({ status: "INACTIVE" as BranchStatus })}
                >
                  <span className="branch-sidebar__status-dot branch-sidebar__status-dot--inactive" />
                  Inactivo
                </button>
              </div>
            </div>
          </div>

          {/* Form actions */}
          <div className="branch-sidebar__form-actions">
            {mode === "edit" && (
              <AppButton tone="neutral" onClick={onDelete} type="button" className="branch-sidebar__delete-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
                Eliminar
              </AppButton>
            )}
            <div className="branch-sidebar__form-actions-right">
              <AppButton tone="secondary" onClick={onCancel} type="button">
                Cancelar
              </AppButton>
              <AppButton tone="primary" onClick={onSave} type="button" disabled={saving || !form.name.trim()}>
                {saving ? "Guardando…" : mode === "create" ? "Guardar" : "Actualizar"}
              </AppButton>
            </div>
          </div>
        </div>
      )}

      {/* Branch list */}
      <div className="branch-sidebar__list">
        {branches.length === 0 ? (
          <div className="branch-sidebar__empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <p>Aún no hay sucursales registradas.<br/>Haz clic en el mapa para agregar la primera.</p>
          </div>
        ) : (
          branches.map((branch) => (
            <button
              key={branch.id}
              type="button"
              className={`branch-sidebar__item ${selectedBranch?.id === branch.id ? "is-selected" : ""}`}
              onClick={() => onSelectBranch(branch)}
            >
              <div className="branch-sidebar__item-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <div className="branch-sidebar__item-body">
                <span className="branch-sidebar__item-name">{branch.name}</span>
                {(branch.address || branch.colonia) && (
                  <span className="branch-sidebar__item-addr">
                    {[branch.address, branch.colonia].filter(Boolean).join(", ")}
                  </span>
                )}
                {branch.latitude != null && branch.longitude != null && (
                  <span className="branch-sidebar__item-coords">
                    {branch.latitude.toFixed(4)}, {branch.longitude.toFixed(4)}
                  </span>
                )}
              </div>
              <div className="branch-sidebar__item-end">
                {branch.type === "PRINCIPAL" || branch.isPrincipal ? (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 7px",
                      borderRadius: 4,
                      background: "rgba(91, 62, 245, 0.12)",
                      color: "#5b3ef5",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    Principal
                  </span>
                ) : (
                  <AppBadge tone="neutral" size="sm">Secundaria</AppBadge>
                )}
                <AppBadge tone={branch.status === "ACTIVE" ? "success" : "neutral"} size="sm">
                  {branch.status === "ACTIVE" ? "Activo" : "Inactivo"}
                </AppBadge>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
