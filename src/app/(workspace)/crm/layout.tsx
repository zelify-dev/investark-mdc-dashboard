import { CrmWorkspaceShell } from "@/modules/crm/components/crm-workspace-shell";

export default function CrmLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <CrmWorkspaceShell>{children}</CrmWorkspaceShell>;
}
