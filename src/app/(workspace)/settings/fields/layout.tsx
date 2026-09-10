import { ViewsSettingsShell } from "@/modules/settings/components/views-settings-shell";

export default function FieldsSettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ViewsSettingsShell>{children}</ViewsSettingsShell>;
}
