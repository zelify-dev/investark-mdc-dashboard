"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  generalSetupSubNavItems,
  resolveGeneralSetupSubNavActiveHref,
} from "@/config/general-setup-nav";
import { useI18n } from "@/providers/i18n-provider";

import "./settings-general-subnav.css";

export function GeneralSetupSubNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const activeHref = resolveGeneralSetupSubNavActiveHref(pathname);

  return (
    <div className="zelify-general-setup-subnav" role="navigation" aria-label={t("nav.generalSetup.ariaLabel")}>
      <div className="zelify-general-setup-subnav__scroll">
        {generalSetupSubNavItems.map((item) => (
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
