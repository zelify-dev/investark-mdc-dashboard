"use client";

import { useI18n } from "@/providers/i18n-provider";

import "./accounting-page-header.css";

type AccountingPageHeaderProps = {
  lastClosureLabel?: string;
};

export function AccountingPageHeader({ lastClosureLabel }: AccountingPageHeaderProps) {
  const { t } = useI18n();

  return (
    <div className="zelify-accounting-page-header">
      <h1 className="zelify-accounting-page-header__title">{t("nav.top.accounting")}</h1>
      <p className="zelify-accounting-page-header__meta">
        {lastClosureLabel ?? t("accounting.journalEntries.lastClosureDefault")}
      </p>
    </div>
  );
}
