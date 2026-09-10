import { AdminSectionSettingsShell } from "@/modules/settings/components/admin-section-settings-shell";

export default function EmailSettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminSectionSettingsShell integrationSection="email">{children}</AdminSectionSettingsShell>;
}
