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
  "pld-aml": [
    { kind: "item", labelKey: "nav.dropdowns.pldAml.lists", href: "/pld-aml?tab=lists" },
    { kind: "item", labelKey: "nav.dropdowns.pldAml.selected", href: "/pld-aml?tab=selected" },
    { kind: "item", labelKey: "nav.dropdowns.pldAml.internal", href: "/pld-aml?tab=internal" },
    { kind: "item", labelKey: "nav.dropdowns.pldAml.screenings", href: "/pld-aml?tab=screenings" },
    { kind: "item", labelKey: "nav.dropdowns.pldAml.export", href: "/pld-aml?tab=export" },
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
