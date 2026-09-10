/**
 * Menús contextuales al hover en la barra principal (referencia Figma 27:195).
 * Las claves `labelKey` se resuelven con el traductor activo (`t`).
 */

import type { Translate } from "@/i18n/translate";

export type TopNavDropdownSourceEntry =
  | { kind: "item"; labelKey: string; href: string }
  | { kind: "separator" };

export type TopNavDropdownEntry =
  | { kind: "item"; label: string; href: string }
  | { kind: "separator" };

const topNavDropdownsByNavId: Record<string, TopNavDropdownSourceEntry[]> = {
  accounting: [
    { kind: "item", labelKey: "nav.dropdowns.accounting.balanceSheet", href: "/accounting/balance-sheet" },
    {
      kind: "item",
      labelKey: "nav.dropdowns.accounting.interestAccrualBreakdown",
      href: "/accounting/interest-accrual-breakdown",
    },
  ],
};

export function getTopNavDropdown(navId: string): TopNavDropdownSourceEntry[] | null {
  const entries = topNavDropdownsByNavId[navId];
  return entries?.length ? entries : null;
}

export function resolveTopNavDropdown(entries: TopNavDropdownSourceEntry[], t: Translate): TopNavDropdownEntry[] {
  return entries.map((entry) =>
    entry.kind === "separator"
      ? entry
      : { kind: "item", label: t(entry.labelKey), href: entry.href }
  );
}
