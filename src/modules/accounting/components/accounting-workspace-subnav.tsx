"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  accountingWorkspaceSubNavItems,
  resolveAccountingWorkspaceSubNavHref,
} from "@/config/accounting-workspace-nav";
import { useI18n } from "@/providers/i18n-provider";

import "@/components/ui/organisms/settings-general-subnav/settings-general-subnav.css";

export function AccountingWorkspaceSubNav() {
  const pathname = usePathname();
  const activeHref = resolveAccountingWorkspaceSubNavHref(pathname);
  const { t } = useI18n();

  return (
    <div className="zelify-general-setup-subnav" role="navigation" aria-label={t("nav.top.accounting")}>
      <div className="zelify-general-setup-subnav__scroll">
        {accountingWorkspaceSubNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`zelify-general-setup-subnav__tab ${item.href === activeHref ? "is-active" : ""}`}
          >
            {t(item.labelKey)}
          </Link>
        ))}
      </div>
    </div>
  );
}
