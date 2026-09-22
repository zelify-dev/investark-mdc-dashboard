export type ZelifyTopNavItem = {
  /** Stable id for routing logic and dropdown maps — not shown to the user. */
  id: string;
  labelKey: string;
  href: string;
  hasDropdown?: boolean;
};

export type ZelifyAccountingSubNavItem = {
  id: string;
  labelKey: string;
  href: string;
};

export const zelifyTopNavItems: ZelifyTopNavItem[] = [
  { id: "dashboard", labelKey: "nav.top.dashboard", href: "/" },
  { id: "clients", labelKey: "nav.top.clients", href: "/customers" },
  { id: "reporting", labelKey: "nav.top.reporting", href: "/reporting" },
  { id: "administration", labelKey: "nav.top.administration", href: "/settings" },
  { id: "mdc", labelKey: "nav.top.mdc", href: "/mdc" },
  { id: "crm", labelKey: "nav.top.crm", href: "/crm" },
  { id: "pld-aml", labelKey: "nav.top.pldAml", href: "/pld-aml", hasDropdown: true },
];

const ADMIN_PREFIX = "/settings";
const ACCOUNTING_PREFIX = "/accounting";

export const zelifyAccountingSubNavItems: ZelifyAccountingSubNavItem[] = [
  {
    id: "balanceSheet",
    labelKey: "nav.dropdowns.accounting.balanceSheet",
    href: "/accounting/balance-sheet",
  },
  {
    id: "interestAccrualBreakdown",
    labelKey: "nav.dropdowns.accounting.interestAccrualBreakdown",
    href: "/accounting/interest-accrual-breakdown",
  },
];

export function isAdministrationPath(pathname: string): boolean {
  return pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
}

export function isAccountingPath(pathname: string): boolean {
  return pathname === ACCOUNTING_PREFIX || pathname.startsWith(`${ACCOUNTING_PREFIX}/`);
}

/**
 * Resuelve el id del ítem principal activo. Rutas más específicas primero.
 */
export function resolveActiveTopNavId(
  pathname: string,
  items: ZelifyTopNavItem[] = zelifyTopNavItems
): string {
  const sorted = [...items].sort((a, b) => b.href.length - a.href.length);
  for (const item of sorted) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return item.id;
    }
  }
  if (pathname === "/") {
    return "dashboard";
  }
  return "dashboard";
}

export function resolveActiveAccountingSubNavId(
  pathname: string,
  items: ZelifyAccountingSubNavItem[] = zelifyAccountingSubNavItems
): string | null {
  if (!isAccountingPath(pathname)) return null;
  const sorted = [...items].sort((a, b) => b.href.length - a.href.length);
  for (const item of sorted) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return item.id;
    }
  }
  return "balanceSheet";
}
