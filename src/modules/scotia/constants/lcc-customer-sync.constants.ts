/** Clientes creados en Zelify a partir de esta fecha se publican en LCC con crédito demo. */
export const LCC_CUSTOMER_ELIGIBLE_FROM = "2026-05-24";

export const LCC_DEFAULT_CREDIT_ROTATION = [
  {
    productId: "AUTO-EV-01",
    label: "Automotriz",
    amount: 680_000,
    termMonths: 48,
    preferEntityType: "PF" as const,
  },
  {
    productId: "PERS-LIB-01",
    label: "Personal",
    amount: 320_000,
    termMonths: 36,
    preferEntityType: "PF" as const,
  },
] as const;
