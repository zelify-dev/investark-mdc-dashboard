"use client";

import type { ReactNode } from "react";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { GeneralSetupSubNav } from "@/components/ui/organisms/settings-general-subnav/settings-general-subnav";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";

import "./general-setup-shell.css";

type GeneralSetupShellProps = {
  children: ReactNode;
};

export function GeneralSetupShell({ children }: GeneralSetupShellProps) {
  return (
    <div className="zelify-general-setup-shell">
      <ZelifyTopNavbar />
      <GeneralSetupSubNav />
      <div className="zelify-general-setup-shell__body">{children}</div>
      <SandboxBanner />
    </div>
  );
}
