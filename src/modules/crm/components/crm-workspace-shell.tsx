"use client";

import type { ReactNode } from "react";

import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";

import { CrmSessionProvider } from "@/modules/crm/lib/crm-session";

import { CrmWorkspaceSubNav } from "./crm-workspace-subnav";

import "@/modules/settings/components/general-setup-shell.css";

type CrmWorkspaceShellProps = {
  children: ReactNode;
};

export function CrmWorkspaceShell({ children }: CrmWorkspaceShellProps) {
  return (
    <CrmSessionProvider>
      <div className="zelify-general-setup-shell">
        <ZelifyTopNavbar />
        <CrmWorkspaceSubNav />
        <div className="zelify-general-setup-shell__body">{children}</div>
        <SandboxBanner />
      </div>
    </CrmSessionProvider>
  );
}
