import { GeneralSetupShell } from "@/modules/settings/components/general-setup-shell";

export default function GeneralSetupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <GeneralSetupShell>{children}</GeneralSetupShell>;
}
