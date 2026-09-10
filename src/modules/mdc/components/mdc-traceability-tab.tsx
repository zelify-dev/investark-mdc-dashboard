"use client";

import { useState, useEffect } from "react";
import { fetchTraceabilityLogs, type TraceabilityLogDTO } from "@/modules/mdc/services/mdc-traceability.service";
import { getStoredOrganization } from "@/lib/auth-api";

function ActionBadge({ action }: { action: string }) {
  const styles: Record<string, string> = {
    "LCC_SYNC": "text-blue-600 bg-blue-50 border border-blue-100",
    "RULE_UPDATE": "text-emerald-600 bg-emerald-50 border border-emerald-100",
    "RISK_UPDATE": "text-orange-600 bg-orange-50 border border-orange-100",
    "STATUS_UPDATE": "text-purple-600 bg-purple-50 border border-purple-100",
    "CROSS_SELL": "text-indigo-600 bg-indigo-50 border border-indigo-100",
    "AI_VERIFY": "text-cyan-600 bg-cyan-50 border border-cyan-100",
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${styles[action] || ""}`}>{action}</span>;
}

export function MdcTraceabilityTab() {
  const [page, setPage] = useState(0);
  const [logs, setLogs] = useState<TraceabilityLogDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const currentOrg = getStoredOrganization();
        const orgId = currentOrg?.id || "ORG-001";

        if (orgId === "demo-bypass-org") {
          return;
        }

        const data = await fetchTraceabilityLogs(orgId);
        setLogs(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  const itemsPerPage = 8;
  const totalItems = logs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  
  const currentLogs = logs.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  return (
    <section className="mdc-section p-6 bg-white min-h-[80vh]">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1 text-[#1c2b4c]">Trazabilidad</h2>
        <p className="text-sm text-gray-500 font-medium">Reglas, IA, cross-sell y fijaciones.</p>
      </div>

      <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[10px] text-gray-500 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold">FECHA</th>
                <th className="px-6 py-4 font-bold">ACCIÓN</th>
                <th className="px-6 py-4 font-bold w-full">DETALLE</th>
                <th className="px-6 py-4 font-bold">CANAL</th>
                <th className="px-6 py-4 font-bold">USUARIO</th>
                <th className="px-6 py-4 font-bold">CORRELACIÓN</th>
                <th className="px-4 py-4 font-bold text-center">VALORES ANTERIORES</th>
                <th className="px-4 py-4 font-bold text-center">VALORES POSTERIORES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400 font-medium">Cargando trazabilidad...</td></tr>
              ) : currentLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400 font-medium">
                    No hay registros de trazabilidad.
                  </td>
                </tr>
              ) : currentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-gray-500 font-medium">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString('es-MX', {
                      day: 'numeric', month: 'numeric', year: 'numeric', 
                      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
                    }).replace(',', '') : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <ActionBadge action={log.action} />
                  </td>
                  <td className="px-6 py-4 text-gray-600 whitespace-normal min-w-[300px] text-[13px]">{log.detail}</td>
                  <td className="px-6 py-4 text-gray-700 font-medium">{log.channel}</td>
                  <td className="px-6 py-4 text-gray-700 font-medium">{log.userName}</td>
                  <td className="px-6 py-4">
                    <span className="text-[#8b9fc0] font-mono text-[11px]">{log.correlationId || "—"}</span>
                  </td>
                  <td className="px-4 py-4 text-center font-semibold text-gray-800">
                    {log.rateBefore !== null && log.rateBefore !== undefined ? `${Number(log.rateBefore).toFixed(2)}%` : "—"}
                  </td>
                  <td className="px-4 py-4 text-center font-semibold text-gray-800">
                    {log.rateAfter !== null && log.rateAfter !== undefined ? `${Number(log.rateAfter).toFixed(2)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/30">
          <div className="text-[11px] text-gray-500 font-medium tracking-wide">
            Mostrando {page * itemsPerPage + 1} - {Math.min((page + 1) * itemsPerPage, totalItems)} de {totalItems}
          </div>
          <div className="flex gap-2">
            <button 
              className="px-4 py-2 text-[11px] font-bold text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Anterior
            </button>
            <button 
              className="px-4 py-2 text-[11px] font-bold text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
