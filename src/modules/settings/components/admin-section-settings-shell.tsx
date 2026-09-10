"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  emailSettingsSubNavItems,
  resolveEmailSettingsSubNavLabel,
} from "@/config/email-settings-nav";
import {
  resolveSmsSettingsSubNavLabel,
  smsSettingsSubNavItems,
} from "@/config/sms-settings-nav";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";

import "@/components/ui/organisms/settings-general-subnav/settings-general-subnav.css";
import "./general-setup-shell.css";

const SMS_EMAIL_CONFIG = {
  sms: {
    items: smsSettingsSubNavItems,
    resolve: resolveSmsSettingsSubNavLabel,
    ariaLabel: "SMS",
  },
  email: {
    items: emailSettingsSubNavItems,
    resolve: resolveEmailSettingsSubNavLabel,
    ariaLabel: "Email",
  },
} as const;

type AdminSectionSettingsShellProps = {
  children: ReactNode;
  /** Subnavegación tipo Figma (Settings) para integraciones SMS / Email. */
  integrationSection: keyof typeof SMS_EMAIL_CONFIG;
};

export function AdminSectionSettingsShell({
  children,
  integrationSection,
}: AdminSectionSettingsShellProps) {
  const pathname = usePathname();
  const { items, resolve, ariaLabel } = SMS_EMAIL_CONFIG[integrationSection];
  const activeLabel = resolve(pathname);

  return (
    <div className="zelify-general-setup-shell">
      <ZelifyTopNavbar />
      <div className="zelify-general-setup-subnav" role="navigation" aria-label={ariaLabel}>
        <div className="zelify-general-setup-subnav__scroll">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`zelify-general-setup-subnav__tab ${item.label === activeLabel ? "is-active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="zelify-general-setup-shell__body">{children}</div>
      <SandboxBanner />
    </div>
  );
}
