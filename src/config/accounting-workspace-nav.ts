export type AccountingWorkspaceSubNavItem = {
  labelKey:
    | "nav.dropdowns.accounting.balanceSheet"
    | "nav.dropdowns.accounting.profitLoss"
    | "nav.dropdowns.accounting.trialBalance"
    | "nav.dropdowns.accounting.journalEntries"
    | "nav.dropdowns.accounting.interestAccrualBreakdown"
    | "nav.dropdowns.accounting.chartOfAccounts"
    | "nav.dropdowns.accounting.closures";
  href: string;
};

/** Pestañas del workspace Accounting (referencia Figma 3:70). */
export const accountingWorkspaceSubNavItems: AccountingWorkspaceSubNavItem[] = [
  { labelKey: "nav.dropdowns.accounting.balanceSheet", href: "/accounting/balance-sheet" },
  { labelKey: "nav.dropdowns.accounting.profitLoss", href: "/accounting/profit-loss" },
  { labelKey: "nav.dropdowns.accounting.trialBalance", href: "/accounting/trial-balance" },
  { labelKey: "nav.dropdowns.accounting.journalEntries", href: "/accounting/journal-entries" },
  { labelKey: "nav.dropdowns.accounting.interestAccrualBreakdown", href: "/accounting/interest-accrual-breakdown" },
  { labelKey: "nav.dropdowns.accounting.chartOfAccounts", href: "/accounting/chart-of-accounts" },
  { labelKey: "nav.dropdowns.accounting.closures", href: "/accounting/closures" },
];

export function resolveAccountingWorkspaceSubNavHref(
  pathname: string,
  items: AccountingWorkspaceSubNavItem[] = accountingWorkspaceSubNavItems
): string | null {
  const prefix = "/accounting";
  if (!pathname.startsWith(prefix)) return null;
  if (pathname === prefix) return "/accounting/journal-entries";
  const sorted = [...items].sort((a, b) => b.href.length - a.href.length);
  for (const item of sorted) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return item.href;
    }
  }
  return "/accounting/journal-entries";
}
