import type { SummaryCardItem } from "../components/customer-summary-cards";
import type { BlacklistCustomerRow } from "../types/customer-segment.types";
import type { InactiveCustomerRow } from "../types/customer-segment.types";

type TFn = (key: string) => string;

export function buildInactiveSummaryCards(rows: InactiveCustomerRow[], t: TFn): SummaryCardItem[] {
  const c = { INACTIVE: 0, SUSPENDED: 0, DORMANT: 0, CLOSED: 0 };
  for (const r of rows) {
    c[r.subStatus]++;
  }
  return [
    { id: "total", label: t("customers.inactive.summary.totalInactive"), value: rows.length },
    { id: "suspended", label: t("customers.inactive.summary.suspended"), value: c.SUSPENDED },
    { id: "dormant", label: t("customers.inactive.summary.dormant"), value: c.DORMANT },
    { id: "closed", label: t("customers.inactive.summary.closed"), value: c.CLOSED },
  ];
}

export function buildBlacklistSummaryCards(rows: BlacklistCustomerRow[], t: TFn): SummaryCardItem[] {
  const fraudCases = rows.filter((r) => /fraud/i.test(r.reason)).length;
  const amlReview = rows.filter((r) => /aml/i.test(r.reason)).length;
  const manualBlocks = rows.filter((r) => /manual/i.test(r.reason)).length;

  return [
    { id: "total", label: t("customers.blacklist.summary.totalBlacklisted"), value: rows.length },
    { id: "fraud", label: t("customers.blacklist.summary.fraudCases"), value: fraudCases },
    { id: "aml", label: t("customers.blacklist.summary.amlReview"), value: amlReview },
    { id: "manual", label: t("customers.blacklist.summary.manualBlocks"), value: manualBlocks },
  ];
}
