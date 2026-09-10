"use client";

import type { useLimDemoStore } from "../hooks/use-lim-demo-store";
import { ScotiaSectionHeader, displayClientId } from "@/modules/scotia/components/scotia-section-header";
import { formatPct } from "../services/deposit-pricing.engine";

type Store = ReturnType<typeof useLimDemoStore>;

export function LimPricingAuditPanel({ store }: { store: Store }) {
  const { state } = store;

  return (
    <div className="lim-panel scotia-workspace" data-tour="lim-audit">
      <ScotiaSectionHeader badge="LCC · Auditoría" title="Registro de cambios" subtitle="Recálculos, overrides y modificaciones de parámetros." />
      <section className="scotia-card">
        <table className="lim-tbl lim-tbl--list scotia-table-compact">
          <thead>
            <tr>{["Fecha", "Acción", "Cliente", "Detalle", "TIIE", "Factor", "Item antes", "Item después"].map((h) => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {state.auditLog.map((entry) => (
              <tr key={entry.id}>
                <td className="lim-td-muted">{new Date(entry.timestamp).toLocaleString("es-MX")}</td>
                <td><span className="lim-pill lim-pill--blue">{entry.action}</span></td>
                <td>
                  {entry.clientId
                    ? `${displayClientId(entry.clientId)}${entry.clientName ? ` · ${entry.clientName}` : ""}`
                    : "—"}
                </td>
                <td className="lim-td-muted">{entry.details ?? "—"}</td>
                <td className="lim-td-n">{entry.tiieInput !== undefined ? formatPct(entry.tiieInput) : "—"}</td>
                <td className="lim-td-n">{entry.factorApplied !== undefined ? entry.factorApplied.toFixed(2) : "—"}</td>
                <td className="lim-td-n">{entry.rateBefore !== undefined ? formatPct(entry.rateBefore) : "—"}</td>
                <td className="lim-td-n">{entry.rateAfter !== undefined ? formatPct(entry.rateAfter) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
