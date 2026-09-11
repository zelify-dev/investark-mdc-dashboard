"use client";

import { useI18n } from "@/providers/i18n-provider";

import "@/modules/accounting/components/accounting-page-header.css";

type CrmPageHeaderProps = {
  title: string;
  subtitle: string;
};

export function CrmPageHeader({ title, subtitle }: CrmPageHeaderProps) {
  const { t } = useI18n();

  return (
    <div className="zelify-accounting-page-header">
      <div>
        <p className="zelify-accounting-page-header__meta">{t("nav.top.crm")}</p>
        <h1 className="zelify-accounting-page-header__title">{title}</h1>
      </div>
      <p className="zelify-accounting-page-header__meta">{subtitle}</p>
    </div>
  );
}
