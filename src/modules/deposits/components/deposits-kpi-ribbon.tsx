"use client";

import type { LucideIcon } from "lucide-react";
import { Landmark, Lock, PiggyBank, Users } from "lucide-react";
import type { Locale } from "@/i18n/locales";
import type { DepositsKpiSnapshot } from "../types/deposit-account.types";
import { formatDepositCurrency } from "../utils/deposits-format";

import "./deposits-kpi-ribbon.css";

type DepositsKpiRibbonProps = {
  kpi: DepositsKpiSnapshot;
  locale: Locale;
  t: (key: string) => string;
};

type KpiDef = {
  id: string;
  icon: LucideIcon;
  labelKey: string;
  value: string;
  meta: string;
};

export function DepositsKpiRibbon({ kpi, locale, t }: DepositsKpiRibbonProps) {
  const items: KpiDef[] = [
    {
      id: "vol",
      icon: Landmark,
      labelKey: "deposits.kpi.totalVolume",
      value: formatDepositCurrency(kpi.totalVolume, locale),
      meta: t("deposits.kpi.totalVolumeTrend").replace("{pct}", kpi.totalVolumeTrendLabel),
    },
    {
      id: "active",
      icon: Users,
      labelKey: "deposits.kpi.activeAccounts",
      value: kpi.activeAccounts.toLocaleString(),
      meta: t("deposits.kpi.activeAccountsMeta").replace("{n}", kpi.activeAccountsMeta),
    },
    {
      id: "holds",
      icon: Lock,
      labelKey: "deposits.kpi.totalHolds",
      value: formatDepositCurrency(kpi.totalHolds, locale),
      meta: t("deposits.kpi.holdsMeta").replace("{n}", kpi.holdsMeta),
    },
    {
      id: "interest",
      icon: PiggyBank,
      labelKey: "deposits.kpi.interestAccrued",
      value: formatDepositCurrency(kpi.interestAccrued, locale),
      meta: t("deposits.kpi.interestCut").replace("{date}", kpi.interestCutDate),
    },
  ];

  return (
    <ul className="zelify-deposits-kpi" role="list">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.id} className="zelify-deposits-kpi__item">
            <div className="zelify-deposits-kpi__icon" aria-hidden>
              <Icon size={20} strokeWidth={2} />
            </div>
            <div className="zelify-deposits-kpi__body">
              <span className="zelify-deposits-kpi__label">{t(item.labelKey)}</span>
              <span className="zelify-deposits-kpi__value">{item.value}</span>
              <span className="zelify-deposits-kpi__meta">{item.meta}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
