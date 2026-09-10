"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  financialSetupSubNavItems,
  resolveFinancialSetupSubNavLabel,
} from "@/config/financial-setup-nav";

import "../settings-general-subnav/settings-general-subnav.css";

export function FinancialSetupSubNav() {
  const pathname = usePathname();
  const activeLabel = resolveFinancialSetupSubNavLabel(pathname);

  return (
    <div className="zelify-general-setup-subnav" role="navigation" aria-label="Financial setup">
      <div className="zelify-general-setup-subnav__scroll">
        {financialSetupSubNavItems.map((item) => (
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
