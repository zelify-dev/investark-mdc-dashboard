export type GeneralSetupSubNavItem = {
  labelKey: string;
  href: string;
};

/** Pestañas internas de Administración → General Setup (textos vía `nav.generalSetup.*`). */
export const generalSetupSubNavItems: GeneralSetupSubNavItem[] = [
  { labelKey: "nav.generalSetup.branchDetails", href: "/settings/general/organization-details" },
  { labelKey: "nav.generalSetup.holidays", href: "/settings/general/holidays" },
  { labelKey: "nav.generalSetup.clientTypes", href: "/settings/general/client-types" },
  { labelKey: "nav.generalSetup.groupRoles", href: "/settings/general/group-roles" },
  { labelKey: "nav.generalSetup.branding", href: "/settings/general/branding" },
];

/** `href` de la pestaña activa según la ruta (para marcar estado sin depender del idioma). */
export function resolveGeneralSetupSubNavActiveHref(
  pathname: string,
  items: GeneralSetupSubNavItem[] = generalSetupSubNavItems
): string | null {
  const prefix = "/settings/general";
  if (pathname === prefix) return items[0]?.href ?? null;
  if (!pathname.startsWith(`${prefix}/`)) return null;
  const sorted = [...items].sort((a, b) => b.href.length - a.href.length);
  for (const item of sorted) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return item.href;
    }
  }
  return null;
}
