export type LocalOrganization = {
  id: string;
  legalName: string;
  rfc: string;
  status: string;
};

export type LocalAdminUser = {
  id: string;
  email: string;
  role: string;
  organization_id: string | null;
};

const LOCAL_ORGS_KEY = "zelify_local_admin_organizations";
const LOCAL_USERS_KEY = "zelify_local_admin_users";

export const demoOrganizations: LocalOrganization[] = [
  {
    id: "org-manufacturas-orion-demo",
    legalName: "GRUPO DELTA INDUSTRIAL SA DE CV",
    rfc: "MOR220518KJ4",
    status: "under_review",
  },
  {
    id: "org-zwippe-demo",
    legalName: "Zwippe Labs México S.A. de C.V.",
    rfc: "ZWI2401159K3",
    status: "in_progress",
  },
];

export const demoAdminUsers: LocalAdminUser[] = [
  {
    id: "user-juan-proano",
    email: "juan.proano@zwippe.com",
    role: "admin_zelify",
    organization_id: null,
  },
  {
    id: "user-orion-admin",
    email: "planeacion@orionmanufactura.mx",
    role: "business_admin",
    organization_id: "org-manufacturas-orion-demo",
  },
];

function parseStoredList<T>(rawValue: string | null, fallback: T[]): T[] {
  if (!rawValue) return fallback;

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function createLocalId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

export function readLocalOrganizations(): LocalOrganization[] {
  if (typeof window === "undefined") return demoOrganizations;

  return parseStoredList(
    localStorage.getItem(LOCAL_ORGS_KEY),
    demoOrganizations,
  );
}

export function writeLocalOrganizations(organizations: LocalOrganization[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_ORGS_KEY, JSON.stringify(organizations));
}

export function readLocalAdminUsers(): LocalAdminUser[] {
  if (typeof window === "undefined") return demoAdminUsers;

  return parseStoredList(localStorage.getItem(LOCAL_USERS_KEY), demoAdminUsers);
}

export function writeLocalAdminUsers(users: LocalAdminUser[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

export function createLocalOrganization(orgData: {
  legalName: string;
  rfc: string;
  status: string;
}): LocalOrganization[] {
  const organizations = readLocalOrganizations();
  const nextOrganizations = [
    ...organizations,
    {
      id: createLocalId("org"),
      legalName: orgData.legalName,
      rfc: orgData.rfc,
      status: orgData.status,
    },
  ];

  writeLocalOrganizations(nextOrganizations);
  return nextOrganizations;
}

export function updateLocalOrganization(
  orgId: string,
  orgData: Partial<{ legalName: string; status: string }>,
): LocalOrganization[] {
  const nextOrganizations = readLocalOrganizations().map((org) =>
    org.id === orgId
      ? {
          ...org,
          ...(orgData.legalName !== undefined ? { legalName: orgData.legalName } : {}),
          ...(orgData.status !== undefined ? { status: orgData.status } : {}),
        }
      : org,
  );

  writeLocalOrganizations(nextOrganizations);
  return nextOrganizations;
}

export function deleteLocalOrganization(orgId: string): LocalOrganization[] {
  const nextOrganizations = readLocalOrganizations().filter((org) => org.id !== orgId);
  writeLocalOrganizations(nextOrganizations);

  const nextUsers = readLocalAdminUsers().filter(
    (adminUser) => adminUser.organization_id !== orgId,
  );
  writeLocalAdminUsers(nextUsers);

  return nextOrganizations;
}

export function createLocalAdminUser(userData: {
  email: string;
  role: string;
  organizationId: string | null;
}): LocalAdminUser[] {
  const users = readLocalAdminUsers();
  const nextUsers = [
    ...users,
    {
      id: createLocalId("user"),
      email: userData.email,
      role: userData.role,
      organization_id: userData.organizationId,
    },
  ];

  writeLocalAdminUsers(nextUsers);
  return nextUsers;
}

export function updateLocalAdminUser(
  userId: string,
  userData: Partial<{ email: string; role: string; organizationId: string | null }>,
): LocalAdminUser[] {
  const nextUsers = readLocalAdminUsers().map((adminUser) =>
    adminUser.id === userId
      ? {
          ...adminUser,
          ...(userData.email !== undefined ? { email: userData.email } : {}),
          ...(userData.role !== undefined ? { role: userData.role } : {}),
          ...(userData.organizationId !== undefined
            ? { organization_id: userData.organizationId }
            : {}),
        }
      : adminUser,
  );

  writeLocalAdminUsers(nextUsers);
  return nextUsers;
}

export function deleteLocalAdminUser(userId: string): LocalAdminUser[] {
  const nextUsers = readLocalAdminUsers().filter((adminUser) => adminUser.id !== userId);
  writeLocalAdminUsers(nextUsers);
  return nextUsers;
}

export function filterLocalAdminUsers(orgId?: string): LocalAdminUser[] {
  const users = readLocalAdminUsers();
  if (!orgId) return users;
  return users.filter((adminUser) => adminUser.organization_id === orgId);
}
