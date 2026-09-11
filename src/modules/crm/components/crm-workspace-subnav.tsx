"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { crmWorkspaceSubNavItems, resolveCrmWorkspaceSubNavHref } from "@/config/crm-workspace-nav";
import { useI18n } from "@/providers/i18n-provider";

import "@/components/ui/organisms/settings-general-subnav/settings-general-subnav.css";

export function CrmWorkspaceSubNav() {
  const pathname = usePathname();
  const activeHref = resolveCrmWorkspaceSubNavHref(pathname);
  const { t } = useI18n();

  return (
    <div className="zelify-general-setup-subnav" role="navigation" aria-label={t("nav.top.crm")}>
      <div className="zelify-general-setup-subnav__scroll">
        {crmWorkspaceSubNavItems.map((item) => (
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
