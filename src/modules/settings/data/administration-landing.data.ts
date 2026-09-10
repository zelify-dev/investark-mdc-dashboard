/** Hub Administration (/settings): solo estructura; textos en `i18n/messages` (`administrationHub.*`, títulos vía `nav.admin.*`). */

export type AdminHubCardIcon =
  | "general"
  | "financial"
  | "organization"
  | "access"
  | "fields"
  | "forms"
  | "sms"
  | "email"
  | "webhooks"
  | "templates"
  | "apps"
  | "tasks"
  | "data";

/** Alineado con claves de `nav.admin` y `administrationHub.descriptions` en i18n. */
export type AdminHubNavId =
  | "generalSetup"
  | "financialSetup"
  | "organization"
  | "access"
  | "fields"
  | "forms"
  | "sms"
  | "email"
  | "webhooks"
  | "templates"
  | "apps"
  | "tasks"
  | "data";

export type AdminHubCardDef = {
  navAdminId: AdminHubNavId;
  href: string;
  featured: boolean;
  icon: AdminHubCardIcon;
};

export const ADMIN_HUB_CARD_DEFS: readonly AdminHubCardDef[] = [
  { navAdminId: "generalSetup", href: "/settings/general", featured: true, icon: "general" },
  { navAdminId: "financialSetup", href: "/settings/financial", featured: false, icon: "financial" },
  { navAdminId: "organization", href: "/settings/organization", featured: false, icon: "organization" },
  { navAdminId: "access", href: "/settings/access", featured: false, icon: "access" },
  { navAdminId: "fields", href: "/settings/fields", featured: false, icon: "fields" },
  { navAdminId: "webhooks", href: "/settings/webhooks", featured: false, icon: "webhooks" },
];
