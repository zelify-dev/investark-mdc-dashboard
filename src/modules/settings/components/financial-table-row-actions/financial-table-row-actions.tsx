"use client";

import { ChevronDown } from "lucide-react";
import { DropdownMenu } from "@/components/ui/molecules/dropdown-menu/dropdown-menu";

import "./financial-table-row-actions.css";

const DEFAULT_ITEMS = ["View details", "Edit", "Deactivate"];

type FinancialTableRowActionsProps = {
  /** Identificador para `aria-label` (ej. código de fila). */
  rowLabel: string;
  menuItems?: string[];
};

export function FinancialTableRowActions({
  rowLabel,
  menuItems = DEFAULT_ITEMS,
}: FinancialTableRowActionsProps) {
  return (
    <details className="zelify-financial-table-row-actions">
      <summary
        className="zelify-financial-table-row-actions__summary"
        aria-label={`Actions for ${rowLabel}`}
      >
        Actions
        <ChevronDown size={14} strokeWidth={2} aria-hidden />
      </summary>
      <div className="zelify-financial-table-row-actions__menu">
        <DropdownMenu items={menuItems} />
      </div>
    </details>
  );
}
