"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  resolveWebhooksSetupSubNavLabel,
  webhooksSetupSubNavItems,
} from "@/config/webhooks-setup-nav";

import "@/components/ui/organisms/settings-general-subnav/settings-general-subnav.css";

export function WebhooksSetupSubNav() {
  const pathname = usePathname();
  const activeLabel = resolveWebhooksSetupSubNavLabel(pathname);

  return (
    <div className="zelify-general-setup-subnav" role="navigation" aria-label="Webhooks">
      <div className="zelify-general-setup-subnav__scroll">
        {webhooksSetupSubNavItems.map((item) => (
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
  );
}
