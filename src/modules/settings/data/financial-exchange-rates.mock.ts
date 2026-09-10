import type { ExchangeRateRow } from "../types/financial-currency.types";

/** Tasas de referencia respecto al dólar (USD) como divisa base. */
export const mockExchangeRatesFromUsd: ExchangeRateRow[] = [
  {
    id: "mx",
    code: "MX",
    name: "Mexican peso",
    buyRate: 18.95,
    sellRate: 19.25,
    dateSet: "01-07-2026",
  },
];
