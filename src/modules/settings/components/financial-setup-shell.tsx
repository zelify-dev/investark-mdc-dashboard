"use client";

import type { ReactNode } from "react";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { FinancialSetupSubNav } from "@/components/ui/organisms/financial-setup-subnav/financial-setup-subnav";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";

import "./general-setup-shell.css";

type FinancialSetupShellProps = {
  children: ReactNode;
};

export function FinancialSetupShell({ children }: FinancialSetupShellProps) {
  return (
    <div className="zelify-general-setup-shell">
      <ZelifyTopNavbar />
      <FinancialSetupSubNav />
      <div className="zelify-general-setup-shell__body">{children}</div>
      <SandboxBanner />
    </div>
  );
}
