import { ViewsSettingsShell } from "@/modules/settings/components/views-settings-shell";

export default function TemplatesSettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ViewsSettingsShell>{children}</ViewsSettingsShell>;
}
