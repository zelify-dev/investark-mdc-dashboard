import type { ChartOfAccountRow, CoaCategory } from "../types/chart-of-accounts.types";

/** Totales por categoría (referencia Figma). */
export const COA_CATEGORY_COUNTS: Record<Exclude<CoaCategory, "all">, number> = {
  assets: 17,
  liabilities: 9,
  equity: 2,
  income: 8,
  expenses: 5,
};

export const COA_TOTAL = 41;

const TYPE_FOR: Record<Exclude<CoaCategory, "all">, string> = {
  assets: "Asset",
  liabilities: "Liability",
  equity: "Equity",
  income: "Income",
  expenses: "Expense",
};

const NAMES: Record<Exclude<CoaCategory, "all">, string[]> = {
  assets: ["Loan Assets", "Transaction Loan", "Fee Receivable", "Cash at Bank", "Reserve"],
  liabilities: ["Client Deposits", "Accrued Interest Payable", "Term Deposits"],
  equity: ["Retained Earnings", "Share Capital"],
  income: ["Interest Income", "Fee Income", "Other Income"],
  expenses: ["Operating Expense", "Administrative Expense", "IT Costs"],
};

function categorySequence(): Exclude<CoaCategory, "all">[] {
  const out: Exclude<CoaCategory, "all">[] = [];
  (Object.keys(COA_CATEGORY_COUNTS) as Exclude<CoaCategory, "all">[]).forEach((cat) => {
    for (let i = 0; i < COA_CATEGORY_COUNTS[cat]; i++) {
      out.push(cat);
    }
  });
  return out;
}

export const MOCK_CHART_OF_ACCOUNTS_FULL: ChartOfAccountRow[] = (() => {
  const seq = categorySequence();
  return seq.map((category, index) => {
    const names = NAMES[category];
    const name = names[index % names.length];
    return {
      id: `coa-${index + 1}`,
      glCode: String(1100 + index),
      accountName: index > 0 && name === seq[0] ? `${name} (${index + 1})` : name,
      type: TYPE_FOR[category],
      usage: "Detail",
      currency: "USD",
      inUse: index % 7 !== 0,
      manualEntriesAllowed: index % 5 !== 0,
      category,
      showDeleteAction: index === 1,
    };
  });
})();

export function filterChartOfAccounts(
  rows: ChartOfAccountRow[],
  category: CoaCategory
): ChartOfAccountRow[] {
  if (category === "all") return rows;
  return rows.filter((r) => r.category === category);
}
