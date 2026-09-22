"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getStoredOrganization } from "@/lib/auth-api";
import { AmlBanner, AmlField } from "@/modules/pld-aml/components/pld-aml-ui";
import { PldAmlApiError, asList, triggerDownload } from "@/modules/pld-aml/services/pld-aml-api-client";
import {
  asInternalListEntries,
  downloadRegulatoryBatch,
  exportLogs,
  fetchInternalLists,
  fetchScreenings,
  generateRegulatoryBatch,
} from "@/modules/pld-aml/services/pld-aml.service";

function errorMessage(error: unknown) {
  if (error instanceof PldAmlApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "No fue posible completar la operación.";
}

function toCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const escape = (value: string | number | null | undefined) => {
    const text = value == null ? "" : String(value);
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };
  return [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n");
}

function downloadCsv(filename: string, csv: string) {
  triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8" }), filename);
}

export function PldAmlExportPanel() {
  const org = getStoredOrganization();
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [entityKey, setEntityKey] = useState("");
  const screeningsQuery = useQuery({
    queryKey: ["pld-aml", "screenings"],
    queryFn: () => fetchScreenings({ page: 1, limit: 100 }),
  });
  const internalsQuery = useQuery({
    queryKey: ["pld-aml", "internal-lists", 1],
    queryFn: () => fetchInternalLists({ page: 1, limit: 100 }),
    enabled: Boolean(org?.id),
  });

  const logsMutation = useMutation({
    mutationFn: async () => {
      const organizationId = getStoredOrganization()?.id || org?.id;
      const blob = await exportLogs(organizationId);
      triggerDownload(blob, `pld-bitacora-${org?.id || "org"}.txt`);
    },
  });
  const batchMutation = useMutation({
    mutationFn: async () => {
      const created = await generateRegulatoryBatch({
        report_type: "RELEVANTE",
        period,
        reporting_entity_key: entityKey.trim(),
      });
      const record = created && typeof created === "object" ? (created as Record<string, unknown>) : {};
      const id = String(record.id || record.batch_id || record.batchId || "");
      if (!id) throw new Error("El lote se generó pero no devolvió un identificador para descargar.");
      const blob = await downloadRegulatoryBatch(id, "CSV");
      triggerDownload(blob, `informe-pld-${period}.csv`);
    },
  });

  const exportScreenings = () => {
    const items = asList<{
      screening_id?: string;
      name?: string;
      data_source?: string;
      match_count?: number;
      risk_score?: number | null;
      created_at?: string;
    }>(screeningsQuery.data);
    downloadCsv(
      `pld-screenings-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(
        ["screening_id", "usuario", "fuente", "matches", "riesgo", "fecha"],
        items.map((item) => [item.screening_id, item.name, item.data_source, item.match_count, item.risk_score, item.created_at]),
      ),
    );
  };

  const exportInternal = () => {
    const items = asInternalListEntries(internalsQuery.data);
    downloadCsv(
      `pld-listas-internas-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(
        ["folio", "nombre", "riesgo", "reporta", "rfc", "curp", "vigencia", "adeudo"],
        items.map((item) => [item.folio, item.legal_name, item.risk_type, item.organization_reported, item.rfc, item.curp, item.validity_date, item.debt_amount]),
      ),
    );
  };

  return (
    <section className="mdc-section pld-stack">
      <header className="pld-head">
        <h2>Exportación</h2>
        <p>Descarga el informe de validaciones, las listas internas o el lote regulatorio.</p>
      </header>

      <section className="pld-card">
        <h3>Informe de screenings</h3>
        <p className="pld-muted">{asList(screeningsQuery.data).length} validaciones disponibles.</p>
        <div className="pld-form__actions">
          <button type="button" className="mdc-btn mdc-btn--primary" onClick={exportScreenings} disabled={!asList(screeningsQuery.data).length}>
            Descargar CSV
          </button>
        </div>
      </section>

      <section className="pld-card">
        <h3>Listas internas</h3>
        <div className="pld-form__actions">
          <button type="button" className="mdc-btn mdc-btn--ghost" onClick={exportInternal} disabled={!asInternalListEntries(internalsQuery.data).length}>
            Descargar CSV
          </button>
        </div>
      </section>

      <section className="pld-card">
        <h3>Bitácora PLD</h3>
        <div className="pld-form__actions">
          <button type="button" className="mdc-btn mdc-btn--ghost" onClick={() => logsMutation.mutate()} disabled={logsMutation.isPending}>
            {logsMutation.isPending ? "Exportando…" : "Exportar bitácora"}
          </button>
        </div>
        {logsMutation.isError ? <AmlBanner tone="error">{errorMessage(logsMutation.error)}</AmlBanner> : null}
      </section>

      <section className="pld-card">
        <h3>Informe regulatorio</h3>
        <div className="pld-form">
          <AmlField label="Periodo">
            <input value={period} onChange={(event) => setPeriod(event.target.value)} placeholder="2026-Q1 o 2026-09" />
          </AmlField>
          <AmlField label="Clave de la entidad">
            <input value={entityKey} onChange={(event) => setEntityKey(event.target.value)} placeholder="Clave SITI" />
          </AmlField>
          <div className="pld-form__actions">
            <button
              type="button"
              className="mdc-btn mdc-btn--primary"
              onClick={() => batchMutation.mutate()}
              disabled={batchMutation.isPending || !entityKey.trim()}
            >
              {batchMutation.isPending ? "Generando…" : "Generar y descargar"}
            </button>
          </div>
        </div>
        {batchMutation.isError ? <AmlBanner tone="error">{errorMessage(batchMutation.error)}</AmlBanner> : null}
      </section>
    </section>
  );
}
