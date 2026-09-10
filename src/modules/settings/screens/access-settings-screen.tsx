"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppCheckbox } from "@/components/ui/atoms/checkbox/app-checkbox";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { AppSelect } from "@/components/ui/atoms/select/app-select";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import {
  DEMO_BYPASS_ORG_ID,
  fetchConfigurationUsers,
  getConfigOrgId,
  type ConfigurationUserDTO,
} from "@/modules/settings/services/configuration-users.service";

import "@/components/ui/templates/workspace-page.css";
import "./settings-workspace-shared.css";
import "./access-settings-screen.css";

type UserRow = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  userType: "Administrador" | "Cajero" | "Oficial de crédito";
  accessType: string;
  branches: string;
  mfa: boolean;
  status: "active" | "invited" | "locked";
};

type MambuPermission = "CREATE_USER" | "EDIT_USER" | "VIEW_USER_DETAILS" | "DELETE_USER";
type TransactionLimitType =
  | "Aprobación de préstamo"
  | "Desembolso de préstamo"
  | "Aplicación de comisión"
  | "Depósito"
  | "Retiro"
  | "Pago de préstamo";

type RoleTemplate = {
  name: string;
  userType: UserRow["userType"];
  permissions: MambuPermission[];
  hasMambuAccess: boolean;
  hasApiAccess: boolean;
};

const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    name: "Administrador global",
    userType: "Administrador",
    permissions: ["CREATE_USER", "EDIT_USER", "VIEW_USER_DETAILS", "DELETE_USER"],
    hasMambuAccess: true,
    hasApiAccess: true,
  },
  {
    name: "Oficial de cartera",
    userType: "Oficial de crédito",
    permissions: ["VIEW_USER_DETAILS"],
    hasMambuAccess: true,
    hasApiAccess: false,
  },
  {
    name: "Cajero de ventanilla",
    userType: "Cajero",
    permissions: ["VIEW_USER_DETAILS"],
    hasMambuAccess: true,
    hasApiAccess: false,
  },
];

type UserProfile = {
  row: UserRow;
  firstName: string;
  lastName: string;
  title: string;
  roleAssigned: string;
  username: string;
  email: string;
  hasMambuAccess: boolean;
  hasApiAccess: boolean;
  twoFactorEnabled: boolean;
  mobilePhone: string;
  homePhone: string;
  assignedBranch: string;
  allBranchesAccess: boolean;
  branchAccess: string[];
  canAccessOtherCreditOfficerClients: boolean;
  permissions: MambuPermission[];
  limits: Array<{ type: TransactionLimitType; amount: number }>;
};

const INITIAL_USERS: UserProfile[] = [
  {
    row: {
      id: "u1",
      name: "Camila Rojas",
      email: "camila.rojas@zelify.demo",
      username: "crojas.admin",
      role: "Administrador global",
      userType: "Administrador",
      accessType: "Mambu + API",
      branches: "Todas",
      mfa: true,
      status: "active",
    },
    firstName: "Camila",
    lastName: "Rojas",
    title: "Lider de Operaciones",
    roleAssigned: "Administrador global",
    username: "crojas.admin",
    email: "camila.rojas@zelify.demo",
    hasMambuAccess: true,
    hasApiAccess: true,
    twoFactorEnabled: true,
    mobilePhone: "+593991112233",
    homePhone: "",
    assignedBranch: "Matriz Quito",
    allBranchesAccess: true,
    branchAccess: ["Matriz Quito", "Guayaquil Centro", "Cuenca Sur"],
    canAccessOtherCreditOfficerClients: true,
    permissions: ["CREATE_USER", "EDIT_USER", "VIEW_USER_DETAILS", "DELETE_USER"],
    limits: [],
  },
  {
    row: {
      id: "u2",
      name: "Jose M Herrera",
      email: "jose.herrera@zelify.demo",
      username: "jherrera.co",
      role: "Oficial de cartera",
      userType: "Oficial de crédito",
      accessType: "Mambu",
      branches: "Matriz Quito, Cuenca Sur",
      mfa: true,
      status: "active",
    },
    firstName: "Jose",
    lastName: "Herrera",
    title: "Analista de cartera",
    roleAssigned: "Oficial de cartera",
    username: "jherrera.co",
    email: "jose.herrera@zelify.demo",
    hasMambuAccess: true,
    hasApiAccess: false,
    twoFactorEnabled: true,
    mobilePhone: "+593984445566",
    homePhone: "",
    assignedBranch: "Matriz Quito",
    allBranchesAccess: false,
    branchAccess: ["Matriz Quito", "Cuenca Sur"],
    canAccessOtherCreditOfficerClients: true,
    permissions: ["VIEW_USER_DETAILS"],
    limits: [
      { type: "Aprobación de préstamo", amount: 25000 },
      { type: "Desembolso de préstamo", amount: 18000 },
    ],
  },
];

function statusTone(s: UserRow["status"]) {
  if (s === "active") return "success";
  if (s === "invited") return "warning";
  return "error";
}

function statusLabel(s: UserRow["status"]) {
  if (s === "active") return "Activo";
  if (s === "invited") return "Invitado";
  return "Bloqueado";
}

/** Maps an API DTO to the internal UserProfile shape used by this screen. */
function dtoToUserProfile(dto: ConfigurationUserDTO): UserProfile {
  const userType = (dto.userType as UserRow["userType"]) ?? "Oficial de crédito";
  const status = (dto.status as UserRow["status"]) ?? "active";
  return {
    row: {
      id: dto.id,
      name: dto.name,
      email: dto.email,
      username: dto.username,
      role: dto.role,
      userType,
      accessType: dto.accessType,
      branches: dto.branches,
      mfa: dto.mfa,
      status,
    },
    firstName: dto.name.split(" ")[0] ?? dto.name,
    lastName: dto.name.split(" ").slice(1).join(" "),
    title: "",
    roleAssigned: dto.role,
    username: dto.username,
    email: dto.email,
    hasMambuAccess: dto.accessType?.toLowerCase().includes("mambu") ?? false,
    hasApiAccess: dto.accessType?.toLowerCase().includes("api") ?? false,
    twoFactorEnabled: dto.mfa,
    mobilePhone: "",
    homePhone: "",
    assignedBranch: dto.branches?.split(",")[0]?.trim() ?? "",
    allBranchesAccess: dto.branches?.toLowerCase() === "todas",
    branchAccess: dto.branches?.toLowerCase() === "todas"
      ? AVAILABLE_BRANCHES
      : dto.branches?.split(",").map((b) => b.trim()) ?? [],
    canAccessOtherCreditOfficerClients: false,
    permissions: ["VIEW_USER_DETAILS"],
    limits: [],
  };
}

export function AccessSettingsScreen() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const orgId = getConfigOrgId();

    if (orgId === DEMO_BYPASS_ORG_ID) {
      // Organización demo → usar datos quemados, sin llamada al API
      setUsers(INITIAL_USERS);
      setIsLoading(false);
      return;
    }

    // Organización real → consumir GET /configuration/users?orgId=...
    let cancelled = false;
    setIsLoading(true);
    setFetchError(null);

    fetchConfigurationUsers(orgId)
      .then((dtos) => {
        if (!cancelled) {
          setUsers(dtos.map(dtoToUserProfile));
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setFetchError(
            err instanceof Error ? err.message : "Error al cargar usuarios."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const rows = users.map((user) => user.row);
    if (!s) return rows;
    return rows.filter((u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.username.toLowerCase().includes(s));
  }, [q, users]);

  const handleCreateUser = (profile: UserProfile) => {
    setUsers((prev) => [profile, ...prev]);
    setIsCreateOpen(false);
  };

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />
      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner zelify-access-settings">
          <header className="zelify-access-settings__head">
            <div>
              <h1 className="zelify-workspace-page__title">Acceso y usuarios</h1>
              <p className="zelify-access-settings__sub">Gestión de cuentas internas, permisos y límites operativos.</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href="/settings/access/credit-officers">
                <AppButton type="button" tone="secondary">Gestionar oficiales de crédito</AppButton>
              </Link>
              <AppButton type="button" tone="primary" onClick={() => setIsCreateOpen(true)}>
                Crear nuevo usuario
              </AppButton>
            </div>
          </header>

          <div className="zelify-access-settings__toolbar">
            <AppInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o correo…" />
          </div>

          {fetchError ? (
            <p style={{ color: "var(--color-error, #e53e3e)", padding: "12px 0" }}>
              {fetchError}
            </p>
          ) : null}

          <SettingsDataTable variant="clients">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Username</th>
                <th>Rol</th>
                <th>Tipo</th>
                <th>Acceso</th>
                <th>Sucursales</th>
                <th>MFA</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "24px", opacity: 0.6 }}>
                    Cargando usuarios…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "24px", opacity: 0.6 }}>
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.email}</td>
                    <td className="zelify-mono">{row.username}</td>
                    <td>{row.role}</td>
                    <td>
                      {row.userType === "Oficial de crédito" ? (
                        <Link href="/settings/access/credit-officers" className="zelify-access-settings__link">
                          {row.userType}
                        </Link>
                      ) : (
                        row.userType
                      )}
                    </td>
                    <td>{row.accessType}</td>
                    <td>{row.branches}</td>
                    <td>{row.mfa ? "Sí" : "No"}</td>
                    <td>
                      <AppBadge tone={statusTone(row.status)} size="sm">
                        {statusLabel(row.status)}
                      </AppBadge>
                    </td>
                    <td className="is-actions">
                      <button type="button" className="zelify-access-settings__link">
                        Editar
                      </button>
                      <button type="button" className="zelify-access-settings__link">
                        Permisos
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </SettingsDataTable>
        </div>
      </div>
      <CreateUserModal
        open={isCreateOpen}
        existingUsernames={users.map((user) => user.row.username)}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateUser}
      />
    </div>
  );
}

type CreateUserModalProps = {
  open: boolean;
  existingUsernames: string[];
  onClose: () => void;
  onCreate: (profile: UserProfile) => void;
};

type CreateUserForm = {
  firstName: string;
  lastName: string;
  title: string;
  roleAssigned: string;
  userType: UserRow["userType"];
  hasMambuAccess: boolean;
  hasApiAccess: boolean;
  username: string;
  email: string;
  password: string;
  twoFactorEnabled: boolean;
  displayLanguage: "Español" | "English";
  mobilePhone: string;
  homePhone: string;
  assignedBranch: string;
  allBranchesAccess: boolean;
  branchAccess: string[];
  canAccessOtherCreditOfficerClients: boolean;
  permissions: MambuPermission[];
  loanApprovalLimit: string;
  loanDisbursementLimit: string;
  feeLimit: string;
  depositLimit: string;
  withdrawLimit: string;
  repaymentLimit: string;
};

const AVAILABLE_BRANCHES = ["Matriz Quito", "Guayaquil Centro", "Cuenca Sur", "Lima San Isidro", "Bogota Norte"];

const INITIAL_FORM: CreateUserForm = {
  firstName: "",
  lastName: "",
  title: "",
  roleAssigned: "",
  userType: "Oficial de crédito",
  hasMambuAccess: true,
  hasApiAccess: false,
  username: "",
  email: "",
  password: "",
  twoFactorEnabled: false,
  displayLanguage: "Español",
  mobilePhone: "",
  homePhone: "",
  assignedBranch: "Matriz Quito",
  allBranchesAccess: false,
  branchAccess: ["Matriz Quito"],
  canAccessOtherCreditOfficerClients: false,
  permissions: ["VIEW_USER_DETAILS"],
  loanApprovalLimit: "",
  loanDisbursementLimit: "",
  feeLimit: "",
  depositLimit: "",
  withdrawLimit: "",
  repaymentLimit: "",
};

const ASCII_SAFE_PATTERN = /^[A-Za-z0-9 .,@_+\-:/()#]*$/;

function parseLimit(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function CreateUserModal({ open, existingUsernames, onClose, onCreate }: CreateUserModalProps) {
  const [form, setForm] = useState<CreateUserForm>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);

  const selectedRoleTemplate = useMemo(
    () => ROLE_TEMPLATES.find((template) => template.name === form.roleAssigned.trim()) ?? null,
    [form.roleAssigned]
  );
  const effectiveUserType = selectedRoleTemplate?.userType ?? form.userType;
  const isAdminUser = effectiveUserType === "Administrador";

  if (!open) return null;

  const update = <K extends keyof CreateUserForm>(key: K, value: CreateUserForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const togglePermission = (permission: MambuPermission, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      permissions: checked ? [...new Set([...prev.permissions, permission])] : prev.permissions.filter((p) => p !== permission),
    }));
  };

  const toggleBranch = (branch: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      branchAccess: checked ? [...new Set([...prev.branchAccess, branch])] : prev.branchAccess.filter((b) => b !== branch),
    }));
  };

  const handleSave = () => {
    setError(null);

    const textFields = [form.firstName, form.lastName, form.title, form.roleAssigned, form.username, form.email];
    const hasUnsupportedChars = textFields.some((field) => field && !ASCII_SAFE_PATTERN.test(field));
    if (hasUnsupportedChars) {
      setError("Solo se permiten caracteres alfanuméricos y símbolos básicos permitidos.");
      return;
    }

    if (!form.firstName.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    const tooLongField = textFields.find((field) => field.length > 255);
    if (tooLongField) {
      setError("Nombre, apellido, título, rol, username y email tienen máximo de 255 caracteres.");
      return;
    }
    if (!form.username.trim()) {
      setError("El username es obligatorio.");
      return;
    }
    if (existingUsernames.includes(form.username.trim())) {
      setError("El username ya existe. Debe ser único.");
      return;
    }
    if (!form.password.trim() || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      setError("La contraseña debe incluir al menos una letra y un número.");
      return;
    }
    if (form.twoFactorEnabled && !form.mobilePhone.trim()) {
      setError("Para activar 2FA debes ingresar teléfono móvil.");
      return;
    }
    if ((effectiveUserType === "Cajero" || effectiveUserType === "Oficial de crédito") && !form.assignedBranch) {
      setError("La sucursal asignada es obligatoria para cajero u oficial de crédito.");
      return;
    }
    if (!form.allBranchesAccess && form.branchAccess.length === 0) {
      setError("Selecciona al menos una sucursal con acceso.");
      return;
    }

    const limits: UserProfile["limits"] = [];
    const parsed = [
      ["Aprobación de préstamo", parseLimit(form.loanApprovalLimit)],
      ["Desembolso de préstamo", parseLimit(form.loanDisbursementLimit)],
      ["Aplicación de comisión", parseLimit(form.feeLimit)],
      ["Depósito", parseLimit(form.depositLimit)],
      ["Retiro", parseLimit(form.withdrawLimit)],
      ["Pago de préstamo", parseLimit(form.repaymentLimit)],
    ] as const;
    for (const [type, amount] of parsed) {
      if (amount !== null) limits.push({ type, amount });
    }

    const fullName = [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(" ");
    const hasMambuAccess = selectedRoleTemplate?.hasMambuAccess ?? form.hasMambuAccess;
    const hasApiAccess = selectedRoleTemplate?.hasApiAccess ?? form.hasApiAccess;
    const accessType = [hasMambuAccess ? "Mambu" : "", hasApiAccess ? "API" : ""].filter(Boolean).join(" + ") || "Sin acceso";
    const effectivePermissions = isAdminUser
      ? ["CREATE_USER", "EDIT_USER", "VIEW_USER_DETAILS", "DELETE_USER"] as MambuPermission[]
      : selectedRoleTemplate?.permissions ?? form.permissions;
    const branchLabel = form.allBranchesAccess ? "Todas" : form.branchAccess.join(", ");
    const roleLabel = form.roleAssigned.trim() || "Sin rol";
    const profile: UserProfile = {
      row: {
        id: `u-${Date.now()}`,
        name: fullName,
        email: form.email.trim(),
        username: form.username.trim(),
        role: roleLabel,
        userType: effectiveUserType,
        accessType,
        branches: branchLabel,
        mfa: form.twoFactorEnabled,
        status: "invited",
      },
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      title: form.title.trim(),
      roleAssigned: roleLabel,
      username: form.username.trim(),
      email: form.email.trim(),
      hasMambuAccess,
      hasApiAccess,
      twoFactorEnabled: form.twoFactorEnabled,
      mobilePhone: form.mobilePhone.trim(),
      homePhone: form.homePhone.trim(),
      assignedBranch: form.assignedBranch,
      allBranchesAccess: form.allBranchesAccess,
      branchAccess: form.allBranchesAccess ? AVAILABLE_BRANCHES : form.branchAccess,
      canAccessOtherCreditOfficerClients: effectiveUserType === "Oficial de crédito" ? form.canAccessOtherCreditOfficerClients : false,
      permissions: effectivePermissions,
      limits: isAdminUser ? [] : limits,
    };
    onCreate(profile);
    setForm(INITIAL_FORM);
  };

  return (
    <div className="zelify-access-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="zelify-access-modal" role="dialog" aria-modal="true" aria-label="Crear nuevo usuario">
        <header className="zelify-access-modal__header">
          <p>Acceso</p>
          <h2>Crear nuevo usuario</h2>
          <span>General, derechos, acceso, permisos y límites.</span>
        </header>

        <div className="zelify-access-modal__body">
          <section className="zelify-access-modal__section">
            <h3>General</h3>
            <div className="zelify-access-modal__grid">
              <AppInput placeholder="Nombre (requerido)" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
              <AppInput placeholder="Apellido" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
              <AppInput placeholder="Título" value={form.title} onChange={(e) => update("title", e.target.value)} />
              <AppSelect value={form.roleAssigned} onChange={(e) => update("roleAssigned", e.target.value)}>
                <option value="">Sin rol (permisos manuales)</option>
                {ROLE_TEMPLATES.map((template) => (
                  <option key={template.name} value={template.name}>
                    {template.name}
                  </option>
                ))}
              </AppSelect>
            </div>
          </section>

          <section className="zelify-access-modal__section">
            <h3>Derechos de usuario</h3>
            <div className="zelify-access-modal__grid">
              <AppSelect value={effectiveUserType} onChange={(e) => update("userType", e.target.value as UserRow["userType"])} disabled={Boolean(selectedRoleTemplate)}>
                <option>Administrador</option>
                <option>Cajero</option>
                <option>Oficial de crédito</option>
              </AppSelect>
              <AppSelect value={form.displayLanguage} onChange={(e) => update("displayLanguage", e.target.value as "Español" | "English")}>
                <option>Español</option>
                <option>English</option>
              </AppSelect>
            </div>
            <div className="zelify-access-modal__checkbox-row">
              <AppCheckbox id="user-rights-mambu" label="Acceso Mambu UI" checked={selectedRoleTemplate?.hasMambuAccess ?? form.hasMambuAccess} onChange={(e) => update("hasMambuAccess", e.target.checked)} disabled={Boolean(selectedRoleTemplate)} />
              <AppCheckbox id="user-rights-api" label="Acceso API" checked={selectedRoleTemplate?.hasApiAccess ?? form.hasApiAccess} onChange={(e) => update("hasApiAccess", e.target.checked)} disabled={Boolean(selectedRoleTemplate)} />
            </div>
          </section>

          {!isAdminUser ? (
            <section className="zelify-access-modal__section">
              <h3>Permisos</h3>
              <div className="zelify-access-modal__checkbox-row">
                <AppCheckbox id="perm-view" label="VIEW_USER_DETAILS" checked={(selectedRoleTemplate?.permissions ?? form.permissions).includes("VIEW_USER_DETAILS")} onChange={(e) => togglePermission("VIEW_USER_DETAILS", e.target.checked)} disabled={Boolean(selectedRoleTemplate)} />
                <AppCheckbox id="perm-create" label="CREATE_USER" checked={(selectedRoleTemplate?.permissions ?? form.permissions).includes("CREATE_USER")} onChange={(e) => togglePermission("CREATE_USER", e.target.checked)} disabled={Boolean(selectedRoleTemplate)} />
                <AppCheckbox id="perm-edit" label="EDIT_USER" checked={(selectedRoleTemplate?.permissions ?? form.permissions).includes("EDIT_USER")} onChange={(e) => togglePermission("EDIT_USER", e.target.checked)} disabled={Boolean(selectedRoleTemplate)} />
                <AppCheckbox id="perm-delete" label="DELETE_USER" checked={(selectedRoleTemplate?.permissions ?? form.permissions).includes("DELETE_USER")} onChange={(e) => togglePermission("DELETE_USER", e.target.checked)} disabled={Boolean(selectedRoleTemplate)} />
              </div>
            </section>
          ) : null}

          <section className="zelify-access-modal__section">
            <h3>Acceso del usuario</h3>
            <div className="zelify-access-modal__grid">
              <AppInput placeholder="Username (único, requerido)" value={form.username} onChange={(e) => update("username", e.target.value)} />
              <AppInput placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} />
              <AppInput placeholder="Password (letra + número)" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} />
              <AppInput placeholder="Teléfono móvil" value={form.mobilePhone} onChange={(e) => update("mobilePhone", e.target.value)} />
            </div>
            <div className="zelify-access-modal__checkbox-row">
              <AppCheckbox id="two-fa" label="Two Factor Authentication (SMS)" checked={form.twoFactorEnabled} onChange={(e) => update("twoFactorEnabled", e.target.checked)} />
            </div>
          </section>

          <section className="zelify-access-modal__section">
            <h3>Asignación y acceso a sucursales</h3>
            <div className="zelify-access-modal__grid">
              <AppSelect value={form.assignedBranch} onChange={(e) => update("assignedBranch", e.target.value)}>
                {AVAILABLE_BRANCHES.map((branch) => (
                  <option key={branch}>{branch}</option>
                ))}
              </AppSelect>
              <AppInput placeholder="Teléfono casa (opcional)" value={form.homePhone} onChange={(e) => update("homePhone", e.target.value)} />
            </div>
            <div className="zelify-access-modal__checkbox-row">
              <AppCheckbox id="all-branches" label="Puede acceder a todas las sucursales" checked={form.allBranchesAccess} onChange={(e) => update("allBranchesAccess", e.target.checked)} />
              {effectiveUserType === "Oficial de crédito" ? (
                <AppCheckbox
                  id="co-access"
                  label="Puede acceder a clientes de otros oficiales de crédito"
                  checked={form.canAccessOtherCreditOfficerClients}
                  onChange={(e) => update("canAccessOtherCreditOfficerClients", e.target.checked)}
                />
              ) : null}
            </div>
            {!form.allBranchesAccess ? (
              <div className="zelify-access-modal__checkbox-row">
                {AVAILABLE_BRANCHES.map((branch) => (
                  <AppCheckbox
                    key={branch}
                    id={`branch-${branch}`}
                    label={branch}
                    checked={form.branchAccess.includes(branch)}
                    onChange={(e) => toggleBranch(branch, e.target.checked)}
                  />
                ))}
              </div>
            ) : null}
          </section>

          {!isAdminUser ? (
            <section className="zelify-access-modal__section">
              <h3>Límites transaccionales (USD)</h3>
              <div className="zelify-access-modal__grid">
                <AppInput placeholder="Aprobación préstamo" value={form.loanApprovalLimit} onChange={(e) => update("loanApprovalLimit", e.target.value)} />
                <AppInput placeholder="Desembolso préstamo" value={form.loanDisbursementLimit} onChange={(e) => update("loanDisbursementLimit", e.target.value)} />
                <AppInput placeholder="Aplicación comisión" value={form.feeLimit} onChange={(e) => update("feeLimit", e.target.value)} />
                <AppInput placeholder="Depósito" value={form.depositLimit} onChange={(e) => update("depositLimit", e.target.value)} />
                <AppInput placeholder="Retiro" value={form.withdrawLimit} onChange={(e) => update("withdrawLimit", e.target.value)} />
                <AppInput placeholder="Pago préstamo" value={form.repaymentLimit} onChange={(e) => update("repaymentLimit", e.target.value)} />
              </div>
            </section>
          ) : null}

          {error ? <p className="zelify-access-modal__error">{error}</p> : null}
        </div>

        <footer className="zelify-access-modal__footer">
          <AppButton type="button" tone="secondary" onClick={onClose}>
            Cancelar
          </AppButton>
          <AppButton type="button" tone="primary" onClick={handleSave}>
            Guardar usuario
          </AppButton>
        </footer>
      </div>
    </div>
  );
}
