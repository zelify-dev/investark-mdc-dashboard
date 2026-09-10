export type SmsSettingsSubNavItem = {
  label: string;
  href: string;
};

export const smsSettingsSubNavItems: SmsSettingsSubNavItem[] = [
  { label: "Settings", href: "/settings/sms" },
];

export function resolveSmsSettingsSubNavLabel(pathname: string): string | null {
  if (!pathname.startsWith("/settings/sms")) return null;
  return "Settings";
}
