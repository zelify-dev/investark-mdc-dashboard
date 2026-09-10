import type { AccountingRateRow } from "../types/financial-currency.types";

export const mockAccountingRates: AccountingRateRow[] = [
  { id: "usd", code: "USD", name: "United States dollar", rate: 1, dateSet: "01-07-2026" },
  { id: "mx", code: "MX", name: "Mexican peso", rate: 19.1, dateSet: "01-07-2026" },
];
