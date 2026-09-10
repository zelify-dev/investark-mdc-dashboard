export type CurrencyKind = "FIAT" | "CRYPTO" | "NON_TRADITIONAL";

export type CurrencyInUseRow = {
  id: string;
  code: string;
  numericalCode: string | null;
  name: string;
  symbol: string;
  kind: CurrencyKind;
  isBase: boolean;
};

/** DD-MM-YYYY o null si no hay fecha (UI: “Not Set”). */
export type OptionalDateSet = string | null;

export type AccountingRateRow = {
  id: string;
  code: string;
  name: string;
  rate: number | null;
  dateSet: OptionalDateSet;
};

export type ExchangeRateRow = {
  id: string;
  code: string;
  name: string;
  buyRate: number | null;
  sellRate: number | null;
  dateSet: OptionalDateSet;
};

export type ConversionTableRow = {
  id: string;
  fromCode: string;
  toCode: string;
  rate: number | null;
  dateSet: OptionalDateSet;
};
