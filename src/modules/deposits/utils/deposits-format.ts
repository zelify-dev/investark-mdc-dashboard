import type { Locale } from "@/i18n/locales";

/** Montos en USD (convención del producto). */
export function formatDepositCurrency(amount: number, locale: Locale = "en"): string {
  const tag = locale === "es" ? "es-US" : "en-US";
  return new Intl.NumberFormat(tag, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Fecha relativa respecto a ahora (pasado/futuro) usando `Intl.RelativeTimeFormat`. */
export function formatRelativeMovement(iso: string, locale: Locale): string {
  const date = new Date(iso);
  const now = new Date();
  const diffSec = Math.round((date.getTime() - now.getTime()) / 1000);
  const loc = locale === "es" ? "es" : "en";
  const rtf = new Intl.RelativeTimeFormat(loc, { numeric: "auto" });

  if (Math.abs(diffSec) < 60) {
    return rtf.format(diffSec, "second");
  }

  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, "minute");
  }

  const diffHour = Math.round(diffSec / 3600);
  if (Math.abs(diffHour) < 48) {
    return rtf.format(diffHour, "hour");
  }

  const diffDay = Math.round(diffSec / 86400);
  if (Math.abs(diffDay) < 14) {
    return rtf.format(diffDay, "day");
  }

  return date.toLocaleString(loc === "es" ? "es-ES" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
