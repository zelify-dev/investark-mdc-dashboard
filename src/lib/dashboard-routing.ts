export const DASHBOARD_ROLE = {
  OWNER: "OWNER",
  ZELIFY_TEAM: "ZELIFY_TEAM",
  MERCHANT_ADMIN: "MERCHANT_ADMIN",
  MERCHANT_OPERATOR: "MERCHANT_OPERATOR",
  ORG_ADMIN: "ORG_ADMIN",
  BUSINESS: "BUSINESS",
  DEVELOPER: "DEVELOPER",
} as const;

export type DashboardActor = "owner" | "merchant" | "organization" | "unknown";

function normalizeRoles(roles: string[] | undefined | null): string[] {
  return Array.isArray(roles)
    ? roles
        .map((role) => role?.toUpperCase?.().trim?.())
        .filter((role): role is string => Boolean(role))
    : [];
}

export function getDashboardActorFromRoles(
  roles: string[] | undefined | null
): DashboardActor {
  const codes = normalizeRoles(roles);

  if (
    codes.includes(DASHBOARD_ROLE.OWNER) ||
    codes.includes(DASHBOARD_ROLE.ZELIFY_TEAM)
  ) {
    return "owner";
  }

  if (
    codes.includes(DASHBOARD_ROLE.MERCHANT_ADMIN) ||
    codes.includes(DASHBOARD_ROLE.MERCHANT_OPERATOR)
  ) {
    return "merchant";
  }

  if (
    codes.includes(DASHBOARD_ROLE.ORG_ADMIN) ||
    codes.includes(DASHBOARD_ROLE.BUSINESS) ||
    codes.includes(DASHBOARD_ROLE.DEVELOPER)
  ) {
    return "organization";
  }

  return "unknown";
}

export function getDefaultDashboardPath(
  roles: string[] | undefined | null
): string {
  return "/";
}

export function isActorRoute(pathname: string, actor: DashboardActor): boolean {
  if (actor === "unknown") return false;
  return pathname === `/${actor}` || pathname.startsWith(`/${actor}/`);
}

export function hasDashboardRole(
  roles: string[] | undefined | null,
  role: (typeof DASHBOARD_ROLE)[keyof typeof DASHBOARD_ROLE]
): boolean {
  return normalizeRoles(roles).includes(role);
}

export function canManageMerchantActor(roles: string[] | undefined | null): boolean {
  const codes = normalizeRoles(roles);
  return codes.includes(DASHBOARD_ROLE.MERCHANT_ADMIN);
}

export function canOperateMerchantActor(roles: string[] | undefined | null): boolean {
  const codes = normalizeRoles(roles);
  return (
    codes.includes(DASHBOARD_ROLE.MERCHANT_ADMIN) ||
    codes.includes(DASHBOARD_ROLE.MERCHANT_OPERATOR)
  );
}

export function canManageOrganizationActor(roles: string[] | undefined | null): boolean {
  const codes = normalizeRoles(roles);
  return codes.includes(DASHBOARD_ROLE.ORG_ADMIN);
}
