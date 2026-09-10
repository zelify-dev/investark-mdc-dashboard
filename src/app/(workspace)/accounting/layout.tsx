import { AccountingWorkspaceShell } from "@/modules/accounting/components/accounting-workspace-shell";

export default function AccountingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AccountingWorkspaceShell>{children}</AccountingWorkspaceShell>;
}
