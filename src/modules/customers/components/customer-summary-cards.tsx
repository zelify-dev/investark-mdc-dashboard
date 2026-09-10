"use client";

import "./customer-summary-cards.css";

export type SummaryCardItem = {
  id: string;
  label: string;
  value: string | number;
};

type CustomerSummaryCardsProps = {
  items: SummaryCardItem[];
};

export function CustomerSummaryCards({ items }: CustomerSummaryCardsProps) {
  return (
    <ul className="zelify-customer-summary-cards" role="list">
      {items.map((item) => (
        <li key={item.id} className="zelify-customer-summary-cards__item">
          <span className="zelify-customer-summary-cards__label">{item.label}</span>
          <span className="zelify-customer-summary-cards__value">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}
