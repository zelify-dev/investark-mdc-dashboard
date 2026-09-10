"use client";

import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import type { useLimDemoStore } from "../hooks/use-lim-demo-store";
import { formatMxn, formatPct } from "../services/deposit-pricing.engine";

type Store = ReturnType<typeof useLimDemoStore>;

export function LimDepositsSyncBar({
  store,
  activeModule,
  onGoPricing,
  onGoTreasury,
}: {
  store: Store;
  activeModule: "pricing" | "tesoreria";
  onGoPricing?: () => void;
  onGoTreasury?: () => void;
}) {
  const { state, treasury } = store;
  const creditLinkedCount = state.clients.filter((c) => c.creditClientId).length;
  const lastRecalc = Object.values(state.clientRates)
    .map((r) => r.calculatedAt)
    .sort()
    .pop();
  const lastLabel = lastRecalc
    ? new Date(lastRecalc).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—";

  return (
    <div className="lim-deposits-sync" data-tour="lim-deposits-sync">
      <div className="lim-deposits-sync__left">
        <AppBadge tone="neutral">Motor LIM · vinculado</AppBadge>
        <span className="lim-deposits-sync__hint">
          {activeModule === "pricing"
            ? `Pricing alimenta Tesorería · ${creditLinkedCount} clientes CORTEX vinculados`
            : `Tesorería refleja Pricing · ${creditLinkedCount} con crédito activo`}
        </span>
      </div>
      <div className="lim-deposits-sync__metrics">
        <div><span>TIIE 28d</span><strong>{formatPct(state.tiie.rate)}</strong></div>
        <div><span>Saldo cartera</span><strong>{formatMxn(treasury.totalBalance)}</strong></div>
        <div><span>Último recálculo</span><strong>{lastLabel}</strong></div>
      </div>
      <div className="lim-deposits-sync__nav">
        {activeModule !== "pricing" && onGoPricing && (
          <button type="button" className="lim-deposits-sync__link" onClick={onGoPricing}>
            Ir a Pricing
          </button>
        )}
        {activeModule !== "tesoreria" && onGoTreasury && (
          <button type="button" className="lim-deposits-sync__link" onClick={onGoTreasury}>
            Ir a Tesorería
          </button>
        )}
      </div>
    </div>
  );
}