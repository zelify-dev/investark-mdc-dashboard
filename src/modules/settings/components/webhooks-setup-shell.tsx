"use client";

import type { ReactNode } from "react";

import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";

import { WebhooksSetupSubNav } from "./webhooks-setup-subnav";

import "./general-setup-shell.css";

type WebhooksSetupShellProps = {
  children: ReactNode;
};

export function WebhooksSetupShell({ children }: WebhooksSetupShellProps) {
  return (
    <div className="zelify-general-setup-shell">
      <ZelifyTopNavbar />
      <WebhooksSetupSubNav />
      <div className="zelify-general-setup-shell__body">{children}</div>
      <SandboxBanner />
    </div>
  );
}
