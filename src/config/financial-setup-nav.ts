export type FinancialSetupSubNavItem = {
  label: string;
  href: string;
};

/** Pestañas de Administración → Financial Setup (referencia Figma). */
export const financialSetupSubNavItems: FinancialSetupSubNavItem[] = [
  { label: "Currency", href: "/settings/financial/currency" },
  { label: "Transaction Channels", href: "/settings/financial/transaction-channels" },
  { label: "Accounting", href: "/settings/financial/accounting" },
];

export function resolveFinancialSetupSubNavLabel(
  pathname: string,
  items: FinancialSetupSubNavItem[] = financialSetupSubNavItems
): string | null {
  const prefix = "/settings/financial";
  if (pathname === prefix) return items[0]?.label ?? null;
  if (!pathname.startsWith(`${prefix}/`)) return null;
  const sorted = [...items].sort((a, b) => b.href.length - a.href.length);
  for (const item of sorted) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return item.label;
    }
  }
  return null;
}
