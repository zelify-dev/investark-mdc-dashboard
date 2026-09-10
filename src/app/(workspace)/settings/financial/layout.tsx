import { FinancialSetupShell } from "@/modules/settings/components/financial-setup-shell";

export default function FinancialSetupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <FinancialSetupShell>{children}</FinancialSetupShell>;
}
