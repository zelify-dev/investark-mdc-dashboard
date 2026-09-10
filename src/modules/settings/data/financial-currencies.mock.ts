import type { CurrencyInUseRow } from "../types/financial-currency.types";

export const mockCurrenciesInUse: CurrencyInUseRow[] = [
  {
    id: "usd",
    code: "USD",
    numericalCode: "840",
    name: "United States dollar",
    symbol: "$",
    kind: "FIAT",
    isBase: true,
  },
  {
    id: "mx",
    code: "MX",
    numericalCode: "484",
    name: "Mexican peso",
    symbol: "$",
    kind: "FIAT",
    isBase: false,
  },
];
