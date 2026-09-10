"use client";

import type { ReactNode } from "react";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";

import "./general-setup-shell.css";

type ViewsSettingsShellProps = {
  children: ReactNode;
};

export function ViewsSettingsShell({ children }: ViewsSettingsShellProps) {
  return (
    <div className="zelify-general-setup-shell">
      <ZelifyTopNavbar />
      <div className="zelify-general-setup-shell__body">{children}</div>
      <SandboxBanner />
    </div>
  );
}
