"use client";

import type { ReactNode } from "react";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";

import "./general-setup-shell.css";

type ProductsSettingsShellProps = {
  children: ReactNode;
};

export function ProductsSettingsShell({ children }: ProductsSettingsShellProps) {
  return (
    <div className="zelify-general-setup-shell">
      <ZelifyTopNavbar />
      <div className="zelify-general-setup-shell__body">{children}</div>
      <SandboxBanner />
    </div>
  );
}
