export type CrmWorkspaceSubNavItem = {
  labelKey: "nav.dropdowns.crm.whatsapp" | "nav.dropdowns.crm.settings" | "nav.dropdowns.crm.leads" | "nav.dropdowns.crm.alaiza";
  href: string;
};

export const crmWorkspaceSubNavItems: CrmWorkspaceSubNavItem[] = [
  { labelKey: "nav.dropdowns.crm.whatsapp", href: "/crm/whatsapp" },
  { labelKey: "nav.dropdowns.crm.settings", href: "/crm/configuracion" },
  { labelKey: "nav.dropdowns.crm.leads", href: "/crm/leads" },
  { labelKey: "nav.dropdowns.crm.alaiza", href: "/crm/alaiza" },
];

export function resolveCrmWorkspaceSubNavHref(
  pathname: string,
  items: CrmWorkspaceSubNavItem[] = crmWorkspaceSubNavItems,
): string | null {
  const prefix = "/crm";
  if (!pathname.startsWith(prefix)) return null;
  if (pathname === prefix) return "/crm/whatsapp";
  const sorted = [...items].sort((a, b) => b.href.length - a.href.length);
  for (const item of sorted) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return item.href;
    }
  }
  return "/crm/whatsapp";
}
