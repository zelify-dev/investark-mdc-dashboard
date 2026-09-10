"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import type { DepositAccountRow, DepositAccountState } from "../types/deposit-account.types";
import { formatDepositCurrency, formatRelativeMovement } from "../utils/deposits-format";
import type { Locale } from "@/i18n/locales";
import type { Translate } from "@/i18n/translate";

import "./deposit-detail-drawer.css";

type DepositDetailDrawerProps = {
  open: boolean;
  row: DepositAccountRow | null;
  onClose: () => void;
  locale: Locale;
  t: Translate;
};

export function DepositDetailDrawer({ open, row, onClose, locale, t }: DepositDetailDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !row) return null;

  const stateLabel = (s: DepositAccountState) => t(`deposits.states.${s}`);

  return (
    <>
      <div className="zelify-deposit-drawer-backdrop" role="presentation" onMouseDown={onClose} aria-hidden />
      <aside className="zelify-deposit-drawer" aria-label={t("deposits.drawer.title")}>
        <header className="zelify-deposit-drawer__header">
          <div>
            <p className="zelify-deposit-drawer__eyebrow">Depósitos</p>
            <h2 className="zelify-deposit-drawer__title">{t("deposits.drawer.title")}</h2>
          </div>
          <AppButton type="button" tone="neutral" onClick={onClose} aria-label={t("deposits.drawer.close")}>
            <X size={18} strokeWidth={2} aria-hidden />
          </AppButton>
        </header>
        <div className="zelify-deposit-drawer__body">
          <div className="zelify-deposit-drawer__row">
            <span className="zelify-deposit-drawer__label">{t("deposits.drawer.accountId")}</span>
            <span className="zelify-deposit-drawer__value zelify-deposit-drawer__mono">{row.id}</span>
          </div>
          <div className="zelify-deposit-drawer__row">
            <span className="zelify-deposit-drawer__label">{t("deposits.drawer.holder")}</span>
            <span className="zelify-deposit-drawer__value">{row.holder.name}</span>
          </div>
          <div className="zelify-deposit-drawer__row">
            <span className="zelify-deposit-drawer__label">{t("deposits.drawer.product")}</span>
            <span className="zelify-deposit-drawer__value">{t(`deposits.products.${row.productKey}`)}</span>
          </div>
          <div className="zelify-deposit-drawer__row">
            <span className="zelify-deposit-drawer__label">{t("deposits.drawer.branch")}</span>
            <span className="zelify-deposit-drawer__value">{t(`deposits.branches.${row.branchKey}`)}</span>
          </div>
          <div className="zelify-deposit-drawer__row">
            <span className="zelify-deposit-drawer__label">{t("deposits.drawer.total")}</span>
            <span className="zelify-deposit-drawer__value">{formatDepositCurrency(row.balances.total, locale)}</span>
          </div>
          <div className="zelify-deposit-drawer__row">
            <span className="zelify-deposit-drawer__label">{t("deposits.drawer.available")}</span>
            <span className="zelify-deposit-drawer__value">{formatDepositCurrency(row.balances.available, locale)}</span>
          </div>
          <div className="zelify-deposit-drawer__row">
            <span className="zelify-deposit-drawer__label">{t("deposits.drawer.hold")}</span>
            <span className="zelify-deposit-drawer__value">{formatDepositCurrency(row.balances.hold, locale)}</span>
          </div>
          <div className="zelify-deposit-drawer__row">
            <span className="zelify-deposit-drawer__label">{t("deposits.drawer.rate")}</span>
            <span className="zelify-deposit-drawer__value">{row.interestRate}</span>
          </div>
          <div className="zelify-deposit-drawer__row">
            <span className="zelify-deposit-drawer__label">{t("deposits.drawer.state")}</span>
            <span className="zelify-deposit-drawer__value">{stateLabel(row.state)}</span>
          </div>
          <div className="zelify-deposit-drawer__row">
            <span className="zelify-deposit-drawer__label">{t("deposits.drawer.lastMovement")}</span>
            <span className="zelify-deposit-drawer__value">{formatRelativeMovement(row.lastMovement, locale)}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
