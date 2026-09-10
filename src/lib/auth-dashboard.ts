/**
 * Auth API — dashboard members & roles catalog (ORG_ADMIN).
 * Base: NEXT_PUBLIC_AUTH_API_URL + /api
 */
import { AuthError, fetchWithAuth, getStoredOrganization } from "@/lib/auth-api";

export const DASHBOARD_ASSIGNABLE_ROLE_CODES = ["ORG_ADMIN", "BUSINESS", "DEVELOPER"] as const;
export type DashboardAssignableRoleCode = (typeof DASHBOARD_ASSIGNABLE_ROLE_CODES)[number];

export type AuthRole = {
  id: string;
  code: string;
  name: string;
  status?: string;
  active?: boolean;
};

export type DashboardMember = {
  id: string;
  organization_id: string;
  organization_name?: string;
  email: string;
  username?: string | null;
  full_name: string;
  phone?: string | null;
  photo?: string | null;
  status: "ACTIVE" | "DISABLED" | string;
  must_change_password?: boolean;
  dashboard_otp_enabled?: boolean;
  pending_first_login?: boolean;
  balance?: string;
  created_at?: string;
  updated_at?: string;
  identity_verified?: boolean;
  identity_verified_at?: string | null;
  roles: string[];
};

export type DashboardMembersPage = {
  members: DashboardMember[];
  page: number;
  limit: number;
  total: number;
};

export type CreateDashboardMemberPayload = {
  email: string;
  full_name: string;
  username?: string;
  roles?: DashboardAssignableRoleCode[];
  password?: string;
  must_change_password?: boolean;
};

export type CreateDashboardMemberResult = DashboardMember & {
  temporary_password?: string;
};

export type UpdateOrgUserPayload = {
  full_name?: string;
  username?: string;
  status?: "ACTIVE" | "DISABLED";
};

export function isAssignableRoleCode(code: string): code is DashboardAssignableRoleCode {
  return (DASHBOARD_ASSIGNABLE_ROLE_CODES as readonly string[]).includes(code);
}

export function filterAssignableRoles(roles: AuthRole[]): AuthRole[] {
  return roles.filter((r) => isAssignableRoleCode(String(r.code || "").toUpperCase()));
}

function requireOrgId(orgId?: string): string {
  const id = orgId || getStoredOrganization()?.id;
  if (!id) throw new AuthError("No hay organizationId en sesión", 400);
  return id;
}

async function readError(res: Response): Promise<never> {
  const data = await res.json().catch(() => ({}));
  throw new AuthError(
    (data as { message?: string }).message || `Error Auth (${res.status})`,
    res.status,
    data
  );
}

/** GET /api/roles — catálogo global (solo lectura en el dashboard). */
export async function listAuthRoles(): Promise<AuthRole[]> {
  const res = await fetchWithAuth("/api/roles");
  if (!res.ok) await readError(res);
  const data = await res.json().catch(() => ({}));
  const list = (data as { roles?: AuthRole[] }).roles;
  return Array.isArray(list) ? list : [];
}

/** GET /api/organizations/:id/users/search?q= — búsqueda email/nombre/tel */
export async function searchOrganizationUsers(
  q: string,
  orgId?: string
): Promise<DashboardMember[]> {
  const id = requireOrgId(orgId);
  const query = q.trim();
  if (!query) return [];

  try {
    const res = await fetchWithAuth(
      `/api/organizations/${encodeURIComponent(id)}/users/search?q=${encodeURIComponent(query)}`
    );
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const list = Array.isArray(data)
        ? data
        : (data as { users?: DashboardMember[]; members?: DashboardMember[] }).users ??
          (data as { members?: DashboardMember[] }).members ??
          [];
      return Array.isArray(list) ? (list as DashboardMember[]) : [];
    }
  } catch {
    // fallback abajo
  }

  const page = await listDashboardMembers({ orgId: id, search: query, limit: 10, page: 1 });
  return page.members;
}

/** GET /api/organizations/:id/dashboard/members */
export async function listDashboardMembers(
  params: {
    orgId?: string;
    search?: string;
    status?: "ACTIVE" | "DISABLED" | "";
    role_code?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<DashboardMembersPage> {
  const orgId = requireOrgId(params.orgId);
  const qs = new URLSearchParams();
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.status) qs.set("status", params.status);
  if (params.role_code) qs.set("role_code", params.role_code);
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(Math.min(params.limit ?? 20, 20)));

  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(orgId)}/dashboard/members?${qs.toString()}`
  );
  if (!res.ok) await readError(res);
  const data = await res.json().catch(() => ({}));
  return {
    members: Array.isArray((data as DashboardMembersPage).members)
      ? (data as DashboardMembersPage).members
      : [],
    page: Number((data as DashboardMembersPage).page) || 1,
    limit: Number((data as DashboardMembersPage).limit) || 20,
    total: Number((data as DashboardMembersPage).total) || 0,
  };
}

/** POST /api/organizations/:id/dashboard/members */
export async function createDashboardMember(
  payload: CreateDashboardMemberPayload,
  orgId?: string
): Promise<CreateDashboardMemberResult> {
  const id = requireOrgId(orgId);
  const body: CreateDashboardMemberPayload = {
    email: payload.email.trim(),
    full_name: payload.full_name.trim(),
    must_change_password: payload.must_change_password ?? true,
  };
  if (payload.username?.trim()) body.username = payload.username.trim();
  if (payload.password?.trim()) body.password = payload.password;
  if (payload.roles?.length) body.roles = payload.roles;

  const res = await fetchWithAuth(`/api/organizations/${encodeURIComponent(id)}/dashboard/members`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) await readError(res);
  return (await res.json()) as CreateDashboardMemberResult;
}

/** PATCH /api/organizations/:id/users/:userId */
export async function updateOrganizationUser(
  userId: string,
  payload: UpdateOrgUserPayload,
  orgId?: string
): Promise<DashboardMember> {
  const id = requireOrgId(orgId);
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(id)}/users/${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) await readError(res);
  return (await res.json()) as DashboardMember;
}

/** GET /api/organizations/:id/users/:userId */
export async function getOrganizationUser(
  userId: string,
  orgId?: string
): Promise<DashboardMember> {
  const id = requireOrgId(orgId);
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(id)}/users/${encodeURIComponent(userId)}`
  );
  if (!res.ok) await readError(res);
  const data = await res.json().catch(() => ({}));
  const user =
    (data as { user?: DashboardMember }).user ||
    (data as { member?: DashboardMember }).member ||
    (data as DashboardMember);
  return user as DashboardMember;
}

/** POST /api/organizations/:id/users/:userId/reset-password */
export async function resetOrganizationUserPassword(
  userId: string,
  orgId?: string
): Promise<{ ok?: boolean; temporary_password?: string }> {
  const id = requireOrgId(orgId);
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(id)}/users/${encodeURIComponent(userId)}/reset-password`,
    { method: "POST", body: JSON.stringify({}) }
  );
  if (!res.ok) await readError(res);
  return (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    temporary_password?: string;
  };
}

/** POST /api/organizations/:id/users/:userId/roles */
export async function assignOrganizationUserRoles(
  userId: string,
  roleCodes: string[],
  orgId?: string
): Promise<unknown> {
  const id = requireOrgId(orgId);
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(id)}/users/${encodeURIComponent(userId)}/roles`,
    {
      method: "POST",
      body: JSON.stringify({ role_codes: roleCodes }),
    }
  );
  if (!res.ok) await readError(res);
  return res.json().catch(() => ({}));
}

/** DELETE /api/organizations/:id/users/:userId/roles/:roleId */
export async function removeOrganizationUserRole(
  userId: string,
  roleId: string,
  orgId?: string
): Promise<void> {
  const id = requireOrgId(orgId);
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(id)}/users/${encodeURIComponent(userId)}/roles/${encodeURIComponent(roleId)}`,
    { method: "DELETE" }
  );
  if (!res.ok) await readError(res);
}

/**
 * V1: un rol primario en UI. Reemplaza roles assignables actuales por `nextCode`.
 */
export async function setOrganizationUserPrimaryRole(
  userId: string,
  currentRoleCodes: string[],
  nextCode: DashboardAssignableRoleCode,
  roleCatalog: AuthRole[],
  orgId?: string
): Promise<void> {
  const byCode = new Map(
    roleCatalog.map((r) => [String(r.code || "").toUpperCase(), r] as const)
  );
  const currentAssignable = currentRoleCodes
    .map((c) => String(c).toUpperCase())
    .filter(isAssignableRoleCode);

  for (const code of currentAssignable) {
    if (code === nextCode) continue;
    const role = byCode.get(code);
    if (role?.id) {
      await removeOrganizationUserRole(userId, role.id, orgId);
    }
  }

  if (!currentAssignable.includes(nextCode)) {
    await assignOrganizationUserRoles(userId, [nextCode], orgId);
  }
}

/** photo del API a veces es key S3; solo usamos URL pública. */
export function resolveProfilePhotoUrl(photo?: string | null): string | null {
  if (!photo || typeof photo !== "string") return null;
  const value = photo.trim();
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return null;
}
