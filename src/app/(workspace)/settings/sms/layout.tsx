import { AdminSectionSettingsShell } from "@/modules/settings/components/admin-section-settings-shell";

export default function SmsSettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminSectionSettingsShell integrationSection="sms">{children}</AdminSectionSettingsShell>;
}
