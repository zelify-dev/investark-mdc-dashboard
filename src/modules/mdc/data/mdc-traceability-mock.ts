export interface TraceabilityLog {
  id: string;
  date: string;
  action: "LCC_SYNC" | "CROSS_SELL" | "AI_VERIFY";
  detail: string;
  channel: "Consola" | "Sucursal";
  user: "Sistema LCC" | "Ejecutivo Frontline";
  correlation: string;
  rateBefore: string | null;
  rateAfter: string | null;
}

export const MDC_TRACEABILITY_LOGS: TraceabilityLog[] = [];
