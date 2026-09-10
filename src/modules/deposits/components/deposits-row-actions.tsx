"use client";

import { useRef } from "react";
import { ChevronDown } from "lucide-react";

import "@/modules/customers/components/customer-table-row-actions.css";

type ActionItem = {
  id: string;
  label: string;
  onSelect: () => void;
};

type DepositsRowActionsProps = {
  items: ActionItem[];
  summaryLabel: string;
  ariaLabel: string;
};

export function DepositsRowActions({ items, summaryLabel, ariaLabel }: DepositsRowActionsProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const close = () => {
    if (detailsRef.current) detailsRef.current.open = false;
  };

  return (
    <details ref={detailsRef} className="zelify-customer-table-row-actions">
      <summary className="zelify-customer-table-row-actions__summary" aria-label={ariaLabel}>
        {summaryLabel}
        <ChevronDown size={14} strokeWidth={2} aria-hidden />
      </summary>
      <div className="zelify-customer-table-row-actions__menu">
        <div className="zelify-dropdown-menu" role="menu">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className="zelify-dropdown-menu__item"
              onClick={() => {
                item.onSelect();
                close();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </details>
  );
}
