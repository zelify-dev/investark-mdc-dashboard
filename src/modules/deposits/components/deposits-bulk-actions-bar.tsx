"use client";

import { AppButton } from "@/components/ui/atoms/button/app-button";

import "./deposits-bulk-actions-bar.css";

type DepositsBulkActionsBarProps = {
  count: number;
  t: (key: string) => string;
  onBlock: () => void;
  onChangeBranch: () => void;
  onExport: () => void;
};

export function DepositsBulkActionsBar({ count, t, onBlock, onChangeBranch, onExport }: DepositsBulkActionsBarProps) {
  if (count < 2) return null;

  return (
    <div className="zelify-deposits-bulk" role="status" aria-live="polite">
      <span className="zelify-deposits-bulk__text">{t("deposits.bulk.selected").replace("{count}", String(count))}</span>
      <div className="zelify-deposits-bulk__actions">
        <AppButton type="button" tone="neutral" onClick={onBlock}>
          {t("deposits.bulk.block")}
        </AppButton>
        <AppButton type="button" tone="neutral" onClick={onChangeBranch}>
          {t("deposits.bulk.changeBranch")}
        </AppButton>
        <AppButton type="button" tone="primary" onClick={onExport}>
          {t("deposits.bulk.export")}
        </AppButton>
      </div>
    </div>
  );
}
