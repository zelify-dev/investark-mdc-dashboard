export type EmailSettingsSubNavItem = {
  label: string;
  href: string;
};

export const emailSettingsSubNavItems: EmailSettingsSubNavItem[] = [
  { label: "Settings", href: "/settings/email" },
];

export function resolveEmailSettingsSubNavLabel(pathname: string): string | null {
  if (!pathname.startsWith("/settings/email")) return null;
  return "Settings";
}
