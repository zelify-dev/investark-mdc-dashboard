"use client";

import { useMemo, useState } from "react";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";

import "./settings-workspace-shared.css";
import "./group-roles-screen.css";

type WorkspaceTab =
  | "dashboard"
  | "customers"
  | "groups"
  | "deposits"
  | "lcc"
  | "mdc"
  | "reports"
  | "settings";

type GroupRole = {
  id: string;
  name: string;
  description: string;
  tabs: WorkspaceTab[];
};

const AVAILABLE_TABS: { id: WorkspaceTab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "customers", label: "Clientes" },
  { id: "groups", label: "Grupos" },
  { id: "deposits", label: "Depósitos" },
  { id: "lcc", label: "LCC" },
  { id: "mdc", label: "MDC" },
  { id: "reports", label: "Informes" },
  { id: "settings", label: "Settings" },
];

const INITIAL_ROLES: GroupRole[] = [
  {
    id: "role-1",
    name: "Administrador de grupo",
    description: "Gestiona la operación completa del grupo y administra accesos.",
    tabs: ["dashboard", "customers", "groups", "deposits", "lcc", "mdc", "reports", "settings"],
  },
  {
    id: "role-2",
    name: "Analista operativo",
    description: "Consulta clientes, depósitos y tableros operativos sin administrar configuración.",
    tabs: ["dashboard", "customers", "deposits", "lcc", "reports"],
  },
  {
    id: "role-3",
    name: "Oficial de cumplimiento",
    description: "Revisa información regulatoria, trazabilidad y módulos de control.",
    tabs: ["dashboard", "customers", "lcc", "mdc", "reports"],
  },
];

type DraftRole = {
  name: string;
  description: string;
  tabs: WorkspaceTab[];
};

const EMPTY_DRAFT: DraftRole = {
  name: "",
  description: "",
  tabs: [],
};

export function GroupRolesScreen() {
  const [roles, setRoles] = useState<GroupRole[]>(INITIAL_ROLES);
  const [draft, setDraft] = useState<DraftRole>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingRole = useMemo(
    () => roles.find((role) => role.id === editingId) ?? null,
    [roles, editingId]
  );

  function toggleDraftTab(tabId: WorkspaceTab) {
    setDraft((prev) => ({
      ...prev,
      tabs: prev.tabs.includes(tabId)
        ? prev.tabs.filter((tab) => tab !== tabId)
        : [...prev.tabs, tabId],
    }));
  }

  function toggleRoleTab(roleId: string, tabId: WorkspaceTab) {
    setRoles((prev) =>
      prev.map((role) =>
        role.id !== roleId
          ? role
          : {
              ...role,
              tabs: role.tabs.includes(tabId)
                ? role.tabs.filter((tab) => tab !== tabId)
                : [...role.tabs, tabId],
            }
      )
    );
  }

  function addRole() {
    if (!draft.name.trim()) return;
    setRoles((prev) => [
      {
        id: `role-${crypto.randomUUID()}`,
        name: draft.name.trim(),
        description: draft.description.trim(),
        tabs: draft.tabs,
      },
      ...prev,
    ]);
    setDraft(EMPTY_DRAFT);
  }

  function updateRoleField(roleId: string, field: "name" | "description", value: string) {
    setRoles((prev) =>
      prev.map((role) => (role.id === roleId ? { ...role, [field]: value } : role))
    );
  }

  function removeRole(roleId: string) {
    setRoles((prev) => prev.filter((role) => role.id !== roleId));
    if (editingId === roleId) setEditingId(null);
  }

  return (
    <div className="zelify-settings-workspace zelify-group-roles">
      <div className="zelify-group-roles__header">
        <div>
          <h1 className="zelify-settings-workspace__title">Roles de grupo</h1>
          <p className="zelify-group-roles__lead">
            Define roles reales del grupo y qué pestañas puede ver cada uno.
          </p>
        </div>
      </div>

      <section className="zelify-group-roles__creator">
        <div className="zelify-group-roles__creator-grid">
          <label className="zelify-group-roles__field">
            <span>Nombre del rol</span>
            <AppInput
              value={draft.name}
              onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ej. Supervisor de cartera"
            />
          </label>

          <label className="zelify-group-roles__field">
            <span>Descripción</span>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Responsabilidad principal del rol"
              rows={3}
            />
          </label>
        </div>

        <div className="zelify-group-roles__permissions">
          <span className="zelify-group-roles__permissions-title">Pestañas habilitadas</span>
          <div className="zelify-group-roles__checks">
            {AVAILABLE_TABS.map((tab) => (
              <label key={tab.id} className="zelify-group-roles__check">
                <input
                  type="checkbox"
                  checked={draft.tabs.includes(tab.id)}
                  onChange={() => toggleDraftTab(tab.id)}
                />
                <span>{tab.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="zelify-group-roles__creator-actions">
          <AppButton tone="primary" onClick={addRole} disabled={!draft.name.trim()}>
            Agregar rol
          </AppButton>
        </div>
      </section>

      <section className="zelify-group-roles__list">
        {roles.map((role) => {
          const isEditing = editingId === role.id;
          return (
            <article key={role.id} className={`zelify-group-roles__card ${isEditing ? "is-editing" : ""}`}>
              <div className="zelify-group-roles__card-top">
                <div className="zelify-group-roles__meta">
                  <AppInput
                    value={role.name}
                    onChange={(e) => updateRoleField(role.id, "name", e.target.value)}
                    disabled={!isEditing}
                  />
                  <textarea
                    value={role.description}
                    onChange={(e) => updateRoleField(role.id, "description", e.target.value)}
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>

                <div className="zelify-group-roles__card-actions">
                  <AppButton tone={isEditing ? "primary" : "secondary"} onClick={() => setEditingId(isEditing ? null : role.id)}>
                    {isEditing ? "Guardar" : "Editar"}
                  </AppButton>
                  <AppButton tone="secondary" onClick={() => removeRole(role.id)}>
                    Eliminar
                  </AppButton>
                </div>
              </div>

              <div className="zelify-group-roles__permissions">
                <span className="zelify-group-roles__permissions-title">Acceso por pestaña</span>
                <div className="zelify-group-roles__checks">
                  {AVAILABLE_TABS.map((tab) => (
                    <label key={`${role.id}-${tab.id}`} className="zelify-group-roles__check">
                      <input
                        type="checkbox"
                        checked={role.tabs.includes(tab.id)}
                        disabled={!isEditing}
                        onChange={() => toggleRoleTab(role.id, tab.id)}
                      />
                      <span>{tab.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {editingRole ? (
        <section className="zelify-group-roles__summary">
          <h2 className="zelify-settings-workspace__subtitle">Resumen del rol en edición</h2>
          <p>
            <strong>{editingRole.name}</strong> tiene acceso a {editingRole.tabs.length} pestaña(s):{" "}
            {editingRole.tabs.map((tab) => AVAILABLE_TABS.find((item) => item.id === tab)?.label ?? tab).join(", ")}.
          </p>
        </section>
      ) : null}
    </div>
  );
}
