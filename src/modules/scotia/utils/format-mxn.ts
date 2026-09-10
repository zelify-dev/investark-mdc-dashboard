/** Formato monetario unificado · pesos mexicanos (MXN) en toda la demo LCC. */

const mxnFull = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

const mxnCompact = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 2,
});

/** Tablas y detalle: $1,234,567 MXN */
export function formatMxnFull(value: number): string {
  return mxnFull.format(value);
}

/** KPIs, gráficas y tarjetas: $208.32 M */
export function formatMxnCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs < 1_000) return mxnFull.format(value);
  return mxnCompact.format(value);
}

/** Alias CORTEX · mismo estándar que depósitos. */
export const formatMxnCredit = formatMxnFull;

/** Informes PDF / ciudadano: monto completo + moneda explícita (sin abreviar K/M). */
export function formatMxnReport(value: number): string {
  return `${mxnFull.format(value)} MXN`;
}

/** Porcentaje con formato mexicano (coma decimal). */
export function formatPctMx(value: number, decimals = 1): string {
  return `${value.toLocaleString("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}
