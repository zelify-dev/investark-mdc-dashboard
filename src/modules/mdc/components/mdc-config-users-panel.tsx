"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";

import { AuthError, getStoredOrganization, getStoredRoles } from "@/lib/auth-api";
import {
  createDashboardMember,
  DASHBOARD_ASSIGNABLE_ROLE_CODES,
  filterAssignableRoles,
  getOrganizationUser,
  listAuthRoles,
  listDashboardMembers,
  resetOrganizationUserPassword,
  setOrganizationUserPrimaryRole,
  updateOrganizationUser,
  type AuthRole,
  type DashboardAssignableRoleCode,
  type DashboardMember,
} from "@/lib/auth-dashboard";

import "./mdc-config-users-panel.css";

type CreateForm = {
  email: string;
  full_name: string;
  username: string;
  role: DashboardAssignableRoleCode;
  password: string;
};

type ModalKind = "create" | "view" | "edit" | "role" | "temp" | null;

const EMPTY_CREATE: CreateForm = {
  email: "",
  full_name: "",
  username: "",
  role: "BUSINESS",
  password: "",
};

const ROLE_LABELS: Record<DashboardAssignableRoleCode, string> = {
  ORG_ADMIN: "Administrador",
  BUSINESS: "Negocio",
  DEVELOPER: "Desarrollador",
};

function roleLabel(code: string): string {
  const key = code.toUpperCase() as DashboardAssignableRoleCode;
  return ROLE_LABELS[key] || code;
}

function statusLabel(status?: string): string {
  const key = String(status || "").toUpperCase();
  if (key === "ACTIVE") return "Activo";
  if (key === "DISABLED") return "Deshabilitado";
  return status || "—";
}

function primaryAssignableRole(m: DashboardMember): DashboardAssignableRoleCode | null {
  const codes = (m.roles || []).map((r) => String(r).toUpperCase());
  const hit = codes.find((c) =>
    (DASHBOARD_ASSIGNABLE_ROLE_CODES as readonly string[]).includes(c)
  );
  return (hit as DashboardAssignableRoleCode) || null;
}

function displayRoles(m: DashboardMember): string[] {
  return (m.roles || [])
    .map((r) => String(r).toUpperCase())
    .filter((c) => (DASHBOARD_ASSIGNABLE_ROLE_CODES as readonly string[]).includes(c));
}

/** Menú ⋮ en portal — evita recorte por overflow de tablas/cards en primeras/últimas filas. */
function PortalRowMenu({
  open,
  onToggle,
  onClose,
  disabled,
  ariaLabel,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  disabled?: boolean;
  ariaLabel: string;
  children: ReactNode;
}) {
  const [triggerEl, setTriggerEl] = useState<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !triggerEl) {
      setPos(null);
      return;
    }

    const place = () => {
      const rect = triggerEl.getBoundingClientRect();
      const menuWidth = 200;
      const menuHeight = 220;
      const gap = 6;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUp = spaceBelow < menuHeight + 16 && spaceAbove > spaceBelow;
      const top = openUp
        ? Math.max(8, rect.top - menuHeight - gap)
        : Math.min(rect.bottom + gap, window.innerHeight - 8);
      const left = Math.min(
        Math.max(8, rect.right - menuWidth),
        window.innerWidth - menuWidth - 8
      );
      setPos({ top, left });
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, triggerEl]);

  return (
    <div className="mdc-users-row-menu">
      <button
        ref={setTriggerEl}
        type="button"
        className="mdc-users-row-menu__trigger mdc-btn mdc-btn--xs"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && pos && typeof document !== "undefined"
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Cerrar menú"
                className="mdc-users-row-menu__backdrop"
                onClick={onClose}
              />
              <div
                role="menu"
                className="mdc-users-row-menu__panel"
                style={{ top: pos.top, left: pos.left }}
                onClick={(e) => e.stopPropagation()}
              >
                {children}
              </div>
            </>,
            document.body
          )
        : null}
    </div>
  );
}

function UsersModal({
  title,
  description,
  onClose,
  footer,
  children,
  wide,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="mdc-users-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className={`mdc-users-modal${wide ? " mdc-users-modal--wide" : ""}`}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mdc-users-modal__head">
          <div>
            <h3>{title}</h3>
            {description ? <p>{description}</p> : null}
          </div>
          <button type="button" className="mdc-btn mdc-btn--xs" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="mdc-users-modal__body">{children}</div>
        {footer ? <div className="mdc-users-modal__footer">{footer}</div> : null}
      </div>
    </div>
  );
}

export function MdcConfigUsersPanel() {
  const orgId = getStoredOrganization()?.id;
  const isOrgAdmin = getStoredRoles().includes("ORG_ADMIN") || getStoredRoles().includes("OWNER");

  const [members, setMembers] = useState<DashboardMember[]>([]);
  const [catalog, setCatalog] = useState<AuthRole[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "ACTIVE" | "DISABLED">("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<ModalKind>(null);
  const [activeMember, setActiveMember] = useState<DashboardMember | null>(null);
  const [viewDetail, setViewDetail] = useState<DashboardMember | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", username: "" });
  const [roleDraft, setRoleDraft] = useState<DashboardAssignableRoleCode>("BUSINESS");
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);
  const [creating, setCreating] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const assignable = useMemo(() => filterAssignableRoles(catalog), [catalog]);
  const limit = 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const activeAdminCount = useMemo(
    () =>
      members.filter(
        (m) => m.status === "ACTIVE" && primaryAssignableRole(m) === "ORG_ADMIN"
      ).length,
    [members]
  );

  const canDeactivate = (m: DashboardMember) => {
    if (m.status !== "ACTIVE") return true;
    if (primaryAssignableRole(m) !== "ORG_ADMIN") return true;
    return activeAdminCount > 1;
  };

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    if (!orgId || orgId === "demo-bypass-org") {
      setMembers([]);
      setTotal(0);
      setLoading(false);
      setError(
        orgId === "demo-bypass-org"
          ? "Demo: conecta una org real para gestionar miembros."
          : "Sin organización."
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [roles, pageData] = await Promise.all([
        listAuthRoles(),
        listDashboardMembers({
          orgId,
          search,
          status: statusFilter,
          page,
          limit,
        }),
      ]);
      setCatalog(filterAssignableRoles(roles));
      setMembers(pageData.members);
      setTotal(pageData.total);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "No se pudieron cargar los miembros.");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [orgId, page, search, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const closeModal = () => {
    if (creating || busyId) return;
    setModal(null);
    setActiveMember(null);
    setViewDetail(null);
    setCopied(false);
  };

  const openView = async (m: DashboardMember) => {
    setOpenMenuId(null);
    setActiveMember(m);
    setViewDetail(m);
    setModal("view");
    setBusyId(m.id);
    try {
      const detail = await getOrganizationUser(m.id, orgId);
      setViewDetail(detail);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "No se pudo cargar el detalle.");
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (m: DashboardMember) => {
    setOpenMenuId(null);
    setActiveMember(m);
    setEditForm({
      full_name: m.full_name || "",
      username: (m.username || "").replace(/^@/, ""),
    });
    setModal("edit");
  };

  const openRole = (m: DashboardMember) => {
    setOpenMenuId(null);
    setActiveMember(m);
    setRoleDraft(primaryAssignableRole(m) || "BUSINESS");
    setModal("role");
  };

  const onSaveEdit = async () => {
    if (!activeMember) return;
    if (!editForm.full_name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setBusyId(activeMember.id);
    setError(null);
    try {
      await updateOrganizationUser(
        activeMember.id,
        {
          full_name: editForm.full_name.trim(),
          username: editForm.username.trim() || undefined,
        },
        orgId
      );
      setModal(null);
      setActiveMember(null);
      await load();
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "No se pudo actualizar.");
    } finally {
      setBusyId(null);
    }
  };

  const onSaveRole = async () => {
    if (!activeMember) return;
    setBusyId(activeMember.id);
    setError(null);
    try {
      await setOrganizationUserPrimaryRole(
        activeMember.id,
        activeMember.roles || [],
        roleDraft,
        catalog.length ? catalog : assignable,
        orgId
      );
      setModal(null);
      setActiveMember(null);
      await load();
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "No se pudo cambiar el rol.");
    } finally {
      setBusyId(null);
    }
  };

  const onToggleStatus = async (member: DashboardMember) => {
    setOpenMenuId(null);
    if (member.status === "ACTIVE" && !canDeactivate(member)) {
      setError("No puedes desactivar al último administrador activo.");
      return;
    }
    const next = member.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    setBusyId(member.id);
    setError(null);
    try {
      await updateOrganizationUser(member.id, { status: next }, orgId);
      await load();
    } catch (err) {
      setError(
        err instanceof AuthError
          ? err.message
          : "No se pudo actualizar el estado (¿último admin?)."
      );
    } finally {
      setBusyId(null);
    }
  };

  const onResetPassword = async (member: DashboardMember) => {
    setOpenMenuId(null);
    setBusyId(member.id);
    setError(null);
    try {
      const result = await resetOrganizationUserPassword(member.id, orgId);
      const temp = result.temporary_password;
      if (!temp) {
        setError("Auth no devolvió contraseña temporal.");
        return;
      }
      setActiveMember(member);
      setTempPassword(temp);
      setCopied(false);
      setModal("temp");
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "No se pudo resetear la contraseña.");
    } finally {
      setBusyId(null);
    }
  };

  const onCreate = async () => {
    if (!createForm.email.trim() || !createForm.full_name.trim()) {
      setError("Email y nombre son obligatorios.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const created = await createDashboardMember(
        {
          email: createForm.email.trim(),
          full_name: createForm.full_name.trim(),
          username: createForm.username.trim() || undefined,
          roles: [createForm.role],
          password: createForm.password.trim() || undefined,
          must_change_password: true,
        },
        orgId
      );
      setShowCreateClosed();
      if (created.temporary_password) {
        setTempPassword(created.temporary_password);
        setActiveMember(created);
        setModal("temp");
      } else {
        setModal(null);
      }
      setPage(1);
      await load();
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "No se pudo crear el miembro.");
    } finally {
      setCreating(false);
    }
  };

  const setShowCreateClosed = () => {
    setCreateForm(EMPTY_CREATE);
  };

  const copyTemp = async () => {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const roleOptions = assignable.length
    ? assignable
    : DASHBOARD_ASSIGNABLE_ROLE_CODES.map((code) => ({
        id: code,
        code,
        name: roleLabel(code),
      }));

  return (
    <article className="mdc-card mdc-users-panel">
      <div className="mdc-cfg-title-row">
        <div>
          <h3>Usuarios</h3>
          <p>Miembros del dashboard (Administrador, Negocio, Desarrollador).</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="mdc-btn mdc-btn--xs" onClick={() => void load()} disabled={loading}>
            Actualizar
          </button>
          {isOrgAdmin && (
            <button
              type="button"
              className="mdc-btn mdc-btn--primary"
              onClick={() => {
                setCreateForm(EMPTY_CREATE);
                setModal("create");
              }}
            >
              Agregar usuario
            </button>
          )}
        </div>
      </div>

      {!isOrgAdmin && (
        <p className="mdc-users-panel__hint">
          Solo un administrador puede crear o editar miembros.
        </p>
      )}

      {error && <p className="mdc-users-panel__error">{error}</p>}

      <div className="mdc-users-panel__filters">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por nombre, email…"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value as "" | "ACTIVE" | "DISABLED");
          }}
        >
          <option value="">Todos</option>
          <option value="ACTIVE">Activos</option>
          <option value="DISABLED">Deshabilitados</option>
        </select>
      </div>

      <div className="mdc-table-wrap">
        <table className="mdc-table mdc-cfg-table mdc-users-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th style={{ width: 56 }} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="mdc-users-panel__empty">
                  Cargando miembros…
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={6} className="mdc-users-panel__empty">
                  Sin miembros.
                </td>
              </tr>
            ) : (
              members.map((member) => {
                const role = primaryAssignableRole(member);
                const busy = busyId === member.id;
                const showDeactivate = member.status === "ACTIVE" ? canDeactivate(member) : true;
                return (
                  <tr key={member.id}>
                    <td>
                      <strong>{member.full_name || "—"}</strong>
                    </td>
                    <td>{member.email}</td>
                    <td>
                      {member.username ? `@${String(member.username).replace(/^@/, "")}` : "—"}
                    </td>
                    <td>
                      <span className="mdc-badge mdc-badge--info">
                        {role ? roleLabel(role) : "—"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          member.status === "ACTIVE"
                            ? "mdc-badge mdc-badge--ok"
                            : "mdc-badge mdc-badge--neutral"
                        }
                      >
                        {statusLabel(member.status)}
                      </span>
                      {member.pending_first_login ? (
                        <span className="mdc-badge mdc-badge--neutral" style={{ marginLeft: 6 }}>
                          1er login
                        </span>
                      ) : null}
                    </td>
                    <td>
                      {isOrgAdmin ? (
                        <PortalRowMenu
                          open={openMenuId === member.id}
                          disabled={busy}
                          ariaLabel={`Acciones de ${member.full_name}`}
                          onToggle={() =>
                            setOpenMenuId((cur) => (cur === member.id ? null : member.id))
                          }
                          onClose={() => setOpenMenuId(null)}
                        >
                          <button type="button" onClick={() => void openView(member)}>
                            Ver
                          </button>
                          <button type="button" onClick={() => openEdit(member)}>
                            Editar nombre
                          </button>
                          <button type="button" onClick={() => openRole(member)}>
                            Cambiar rol
                          </button>
                          <button type="button" onClick={() => void onResetPassword(member)}>
                            Resetear contraseña
                          </button>
                          {showDeactivate || member.status !== "ACTIVE" ? (
                            <button
                              type="button"
                              className={
                                member.status === "ACTIVE" ? "mdc-users-row-menu__danger" : undefined
                              }
                              onClick={() => void onToggleStatus(member)}
                            >
                              {member.status === "ACTIVE" ? "Desactivar" : "Activar"}
                            </button>
                          ) : null}
                        </PortalRowMenu>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mdc-users-panel__pager">
        <span>
          Página {page} / {totalPages} · {total} total
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="mdc-btn mdc-btn--xs"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </button>
          <button
            type="button"
            className="mdc-btn mdc-btn--xs"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>

      {modal === "create" ? (
        <UsersModal
          title="Agregar usuario"
          description="Si no defines contraseña, Auth genera una temporal (una sola vez)."
          onClose={() => {
            if (!creating) {
              setModal(null);
              setShowCreateClosed();
            }
          }}
          wide
          footer={
            <>
              <button
                type="button"
                className="mdc-btn"
                disabled={creating}
                onClick={() => {
                  setModal(null);
                  setShowCreateClosed();
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="mdc-btn mdc-btn--primary"
                disabled={creating}
                onClick={() => void onCreate()}
              >
                {creating ? "Creando…" : "Crear miembro"}
              </button>
            </>
          }
        >
          <div className="mdc-users-form-grid">
            <label>
              Nombre completo *
              <input
                value={createForm.full_name}
                onChange={(e) => setCreateForm((f) => ({ ...f, full_name: e.target.value }))}
              />
            </label>
            <label>
              Email *
              <input
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              />
            </label>
            <label>
              Usuario
              <input
                value={createForm.username}
                onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="ana"
              />
            </label>
            <label>
              Rol
              <select
                value={createForm.role}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    role: e.target.value as DashboardAssignableRoleCode,
                  }))
                }
              >
                {roleOptions.map((r) => (
                  <option key={r.code} value={String(r.code).toUpperCase()}>
                    {roleLabel(String(r.code))}
                  </option>
                ))}
              </select>
            </label>
            <label className="mdc-users-form-grid__full">
              Contraseña (opcional)
              <input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
              />
            </label>
          </div>
        </UsersModal>
      ) : null}

      {modal === "view" && (viewDetail || activeMember) ? (
        <UsersModal
          title="Detalle del miembro"
          onClose={closeModal}
          footer={
            <button type="button" className="mdc-btn mdc-btn--primary" onClick={closeModal}>
              Cerrar
            </button>
          }
        >
          {(() => {
            const u = viewDetail || activeMember!;
            const roles = displayRoles(u);
            return (
              <dl className="mdc-users-detail">
                <div>
                  <dt>Nombre</dt>
                  <dd>{u.full_name || "—"}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{u.email || "—"}</dd>
                </div>
                <div>
                  <dt>Usuario</dt>
                  <dd>{u.username ? `@${String(u.username).replace(/^@/, "")}` : "—"}</dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd>{statusLabel(u.status)}</dd>
                </div>
                <div>
                  <dt>Roles</dt>
                  <dd>{roles.length ? roles.map(roleLabel).join(", ") : "—"}</dd>
                </div>
              </dl>
            );
          })()}
        </UsersModal>
      ) : null}

      {modal === "edit" && activeMember ? (
        <UsersModal
          title="Editar nombre"
          description={activeMember.email}
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="mdc-btn" disabled={!!busyId} onClick={closeModal}>
                Cancelar
              </button>
              <button
                type="button"
                className="mdc-btn mdc-btn--primary"
                disabled={!!busyId}
                onClick={() => void onSaveEdit()}
              >
                {busyId ? "Guardando…" : "Guardar"}
              </button>
            </>
          }
        >
          <div className="mdc-users-form-grid mdc-users-form-grid--single">
            <label>
              Nombre completo
              <input
                value={editForm.full_name}
                onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
              />
            </label>
            <label>
              Usuario
              <input
                value={editForm.username}
                onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
              />
            </label>
          </div>
        </UsersModal>
      ) : null}

      {modal === "role" && activeMember ? (
        <UsersModal
          title="Cambiar rol"
          description={`${activeMember.full_name} · ${activeMember.email}`}
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="mdc-btn" disabled={!!busyId} onClick={closeModal}>
                Cancelar
              </button>
              <button
                type="button"
                className="mdc-btn mdc-btn--primary"
                disabled={!!busyId}
                onClick={() => void onSaveRole()}
              >
                {busyId ? "Guardando…" : "Guardar rol"}
              </button>
            </>
          }
        >
          <label className="mdc-users-role-pick">
            Nuevo rol
            <div className="mdc-users-role-cards">
              {roleOptions.map((r) => {
                const code = String(r.code).toUpperCase() as DashboardAssignableRoleCode;
                const selected = roleDraft === code;
                return (
                  <button
                    key={code}
                    type="button"
                    className={`mdc-users-role-card${selected ? " is-selected" : ""}`}
                    onClick={() => setRoleDraft(code)}
                  >
                    <strong>{roleLabel(code)}</strong>
                    <span>{code}</span>
                  </button>
                );
              })}
            </div>
          </label>
        </UsersModal>
      ) : null}

      {modal === "temp" && tempPassword ? (
        <UsersModal
          title="Contraseña temporal"
          description="Cópiala ahora. No se volverá a mostrar."
          onClose={() => {
            setTempPassword(null);
            setModal(null);
            setActiveMember(null);
            setCopied(false);
          }}
          footer={
            <>
              <button type="button" className="mdc-btn" onClick={() => void copyTemp()}>
                {copied ? "Copiado" : "Copiar"}
              </button>
              <button
                type="button"
                className="mdc-btn mdc-btn--primary"
                onClick={() => {
                  setTempPassword(null);
                  setModal(null);
                  setActiveMember(null);
                  setCopied(false);
                }}
              >
                Entendido
              </button>
            </>
          }
        >
          {activeMember ? (
            <p className="mdc-users-panel__hint" style={{ marginTop: 0 }}>
              Usuario: <strong>{activeMember.email || activeMember.full_name}</strong>
            </p>
          ) : null}
          <code className="mdc-users-temp">{tempPassword}</code>
        </UsersModal>
      ) : null}
    </article>
  );
}
