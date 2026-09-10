"use client";

import { ChevronDown } from "lucide-react";
import { DropdownMenu } from "@/components/ui/molecules/dropdown-menu/dropdown-menu";
import { useI18n } from "@/providers/i18n-provider";

import "./customer-table-row-actions.css";

type CustomerTableRowActionsProps = {
  rowLabel: string;
  items: string[];
};

export function CustomerTableRowActions({ rowLabel, items }: CustomerTableRowActionsProps) {
  const { t } = useI18n();
  const aria = t("customers.common.actionsAria").replace("{name}", rowLabel);

  return (
    <details className="zelify-customer-table-row-actions">
      <summary className="zelify-customer-table-row-actions__summary" aria-label={aria}>
        {t("customers.common.actions")}
        <ChevronDown size={14} strokeWidth={2} aria-hidden />
      </summary>
      <div className="zelify-customer-table-row-actions__menu">
        <DropdownMenu items={items} />
      </div>
    </details>
  );
}
