"use client";

import type { ReactNode } from "react";

import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";

import { AccountingWorkspaceSubNav } from "./accounting-workspace-subnav";

import "@/modules/settings/components/general-setup-shell.css";

type AccountingWorkspaceShellProps = {
  children: ReactNode;
};

export function AccountingWorkspaceShell({ children }: AccountingWorkspaceShellProps) {
  return (
    <div className="zelify-general-setup-shell">
      <ZelifyTopNavbar />
      <AccountingWorkspaceSubNav />
      <div className="zelify-general-setup-shell__body">{children}</div>
      <SandboxBanner />
    </div>
  );
}
