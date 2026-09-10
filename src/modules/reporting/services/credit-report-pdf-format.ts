import { formatMxnReport, formatPctMx } from "@/modules/scotia/utils/format-mxn";

/** Monto en pesos mexicanos, siempre cifra completa (sin $780K ni $1.2M). */
export function mxn(value: number): string {
  return formatMxnReport(value);
}

export function mxnPerMonth(value: number): string {
  return `${mxn(value)} al mes`;
}

export function formatBps(value: number): string {
  const abs = Math.abs(Math.round(value));
  if (abs === 0) return "0 pb";
  return `${value < 0 ? "−" : ""}${abs.toLocaleString("es-MX")} pb`;
}

export function formatCreditAgeMonths(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} ${m === 1 ? "mes" : "meses"} con historial en Buró`;
  if (m === 0) return `${y} ${y === 1 ? "año" : "años"} con historial en Buró`;
  return `${y} ${y === 1 ? "año" : "años"} y ${m} ${m === 1 ? "mes" : "meses"} con historial en Buró`;
}

export function explainTermMonths(months: number): string {
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) {
    return `${years} ${years === 1 ? "año" : "años"} (${months} pagos mensuales)`;
  }
  return `${years} ${years === 1 ? "año" : "años"} y ${rem} ${rem === 1 ? "mes" : "meses"} (${months} pagos mensuales)`;
}

export function explainMonthlyPayment(
  payment: number,
  income: number,
  pti: number,
  maxPti: number
): string {
  const deCada100 = Math.round(pti);
  return (
    `Pagaría ${mxnPerMonth(payment)}. Con un sueldo neto de ${mxnPerMonth(income)}, ` +
    `la mensualidad representa ${deCada100} de cada $100 pesos que recibe (${formatPctMx(pti)}). ` +
    `La institución permite hasta ${formatPctMx(maxPti)}; esta solicitud está dentro del límite.`
  );
}

export function explainDti(dti: number, fixedObligations: number, income: number): string {
  return (
    `${formatPctMx(dti)} del ingreso mensual ya se usa en otras deudas ` +
    `(aprox. ${mxnPerMonth(fixedObligations)} de ${mxnPerMonth(income)}). ` +
    `Después de la nueva mensualidad aún quedaría dinero para gastos del hogar.`
  );
}

export function explainBuroScore(score: number, percentile: number, rating: string): string {
  return (
    `Puntaje Buró: ${score} (${rating}). Mejor historial que aproximadamente el ${percentile}% ` +
    `de personas con reporte en México.`
  );
}

export function explainMop(mop: string): string {
  if (mop === "01") return "Al corriente (paga a tiempo)";
  return `Código de pago ${mop}`;
}

export function explainCat(cat: number): string {
  return (
    `CAT ${formatPctMx(cat, 1)}: porcentaje que resume el costo total anual del crédito ` +
    `(intereses y comisiones). Referencia para comparar ofertas (CONDUSEF).`
  );
}

export function explainDownPayment(
  pctDown: number,
  amount: number,
  vehicleValue?: number
): string {
  let text = `Enganche ${formatPctMx(pctDown, 0)}: ${mxn(amount)} que usted aporta de su dinero.`;
  if (vehicleValue) {
    text += ` Precio del vehículo: ${mxn(vehicleValue)}; el crédito cubre ${mxn(vehicleValue - amount)}.`;
  }
  return text;
}

export function explainRate(base: number, final: number): string {
  const savedBps = Math.round((base - final) * 100);
  return (
    `Tasa de interés anual: ${formatPctMx(final)} (antes de descuentos era ${formatPctMx(base)}). ` +
    `Descuento acumulado de ${formatBps(savedBps)} por bonificaciones comerciales aplicables.`
  );
}

export function explainTotalInterest(total: number, termMonths: number): string {
  return (
    `En ${termMonths} pagos pagaría de más por intereses aproximadamente ${mxn(total)} ` +
    `(además del capital del préstamo).`
  );
}

export function humanizeVerdict(v: string): string {
  if (v === "CUMPLE") return "Cumple";
  if (v === "REVISAR") return "Revisar";
  if (v === "NO_CUMPLE") return "No cumple";
  return v;
}

export function humanizeAmlResult(r: string): string {
  if (r === "SIN_COINCIDENCIAS") return "Sin coincidencias";
  if (r === "ALERTA") return "Requiere revisión";
  if (r === "BLOQUEADO") return "Bloqueado";
  return r.replace(/_/g, " ");
}
