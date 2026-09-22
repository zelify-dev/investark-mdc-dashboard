"use client";

import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { AmlBanner, AmlTable, formatWhen } from "@/modules/pld-aml/components/pld-aml-ui";
import { PldAmlApiError, asList } from "@/modules/pld-aml/services/pld-aml-api-client";
import { fetchScreening, fetchScreenings } from "@/modules/pld-aml/services/pld-aml.service";
import type {
  AmlInternalListHit,
  AmlSanctionHit,
  AmlScreeningDetail,
  AmlScreeningListItem,
  AmlScreeningResultStatus,
} from "@/modules/pld-aml/types/pld-aml.types";

const PAGE_SIZE = 25;

function errorMessage(error: unknown) {
  if (error instanceof PldAmlApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "No fue posible completar la operación.";
}

function formatPassed(passed: boolean | null | undefined) {
  if (passed === true) return "Sí";
  if (passed === false) return "No";
  return "—";
}

function formatScore(value: number | null | undefined) {
  return value == null || Number.isNaN(Number(value)) ? "—" : String(value);
}

function statusLabel(status?: AmlScreeningResultStatus | null) {
  if (status === "CLEAN") return "Limpio";
  if (status === "MATCH") return "Coincidencia";
  if (status === "PROVIDER_ERROR") return "No completado";
  return status || "—";
}

function statusTone(status?: AmlScreeningResultStatus | null): "clean" | "match" | "error" | "pending" {
  if (status === "CLEAN") return "clean";
  if (status === "MATCH") return "match";
  if (status === "PROVIDER_ERROR") return "error";
  return "pending";
}

function hitName(hit: AmlSanctionHit) {
  const value = hit.name ?? hit.legal_name ?? hit.caption;
  return typeof value === "string" && value.trim() ? value : "—";
}

function hitSource(hit: AmlSanctionHit) {
  const value = hit.data_source ?? hit.source ?? hit.list;
  return typeof value === "string" && value.trim() ? value : "—";
}

function ScreeningStatusBadge({ status }: { status?: AmlScreeningResultStatus | null }) {
  return <span className={`pld-status pld-status--${statusTone(status)}`}>{statusLabel(status)}</span>;
}

function DetailStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="pld-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ScreeningDetailPanel({
  detail,
  loading,
  error,
  onClose,
}: {
  detail?: AmlScreeningDetail;
  loading: boolean;
  error: unknown;
  onClose: () => void;
}) {
  if (error) {
    return (
      <section className="pld-card">
        <div className="pld-form__actions">
          <h3>Detalle</h3>
          <button type="button" className="mdc-btn mdc-btn--ghost mdc-btn--sm" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <AmlBanner tone="error">{errorMessage(error)}</AmlBanner>
      </section>
    );
  }

  if (loading || !detail) {
    return (
      <section className="pld-card">
        <h3>Detalle</h3>
        <p className="pld-muted">Cargando validación…</p>
      </section>
    );
  }

  const request = detail.request ?? {};
  const response = detail.response ?? {};
  const sanctions = Array.isArray(response.results) ? response.results : [];
  const internals = Array.isArray(response.internal_list_matches) ? response.internal_list_matches : [];
  const clientMessage = detail.message || response.message || "—";

  return (
    <section className="pld-card pld-detail">
      <div className="pld-detail__head">
        <div>
          <h3>Detalle de screening</h3>
          <p className="pld-muted">Consulta {detail.screening_id}</p>
        </div>
        <button type="button" className="mdc-btn mdc-btn--ghost mdc-btn--sm" onClick={onClose}>
          Cerrar
        </button>
      </div>

      <div className="pld-detail__block">
        <h4>Encabezado</h4>
        <div className="pld-kpis">
          <DetailStat label="Nombre" value={request.name || detail.user_id || "—"} />
          <DetailStat label="Fuente" value={request.data_source || "—"} />
          <DetailStat label="Fecha" value={formatWhen(detail.created_at)} />
        </div>
      </div>

      <div className="pld-detail__block">
        <h4>Estado</h4>
        <div className="pld-kpis">
          <DetailStat label="Resultado" value={<ScreeningStatusBadge status={detail.result_status} />} />
          <DetailStat label="Pasó" value={formatPassed(detail.passed)} />
          <DetailStat label="Mensaje" value={<span className="pld-detail__message">{clientMessage}</span>} />
        </div>
      </div>

      <div className="pld-detail__block">
        <h4>Scores</h4>
        <div className="pld-kpis">
          <DetailStat label="Riesgo" value={formatScore(detail.risk_score)} />
          <DetailStat label="Confianza" value={formatScore(detail.confidence_score)} />
          <DetailStat
            label="Conteos"
            value={`${response.count ?? sanctions.length} sanciones · ${
              response.internal_list_matches_count ?? internals.length
            } internas`}
          />
        </div>
      </div>

      <div className="pld-detail__block">
        <h4>Hits de listas de sanciones</h4>
        <AmlTable
          columns={["Nombre", "Fuente", "Score", "Tipo", "País"]}
          rows={sanctions.map((hit: AmlSanctionHit) => [
            hitName(hit),
            hitSource(hit),
            formatScore(typeof hit.score === "number" ? hit.score : null),
            typeof hit.entity_type === "string" ? hit.entity_type : "—",
            typeof hit.country === "string" ? hit.country : "—",
          ])}
          empty="Sin coincidencias en listas de sanciones."
        />
      </div>

      <div className="pld-detail__block">
        <h4>Hits de lista interna</h4>
        <p className="pld-muted">
          {response.has_internal_list_matches
            ? `${response.internal_list_matches_count ?? internals.length} coincidencia(s) en la watchlist de la organización.`
            : "Sin coincidencias en la lista interna."}
        </p>
        <AmlTable
          columns={["Nombre", "Folio", "CURP", "RFC", "Riesgo", "Reporta", "Notas"]}
          rows={internals.map((hit: AmlInternalListHit) => [
            hit.legal_name || "—",
            hit.folio || "—",
            hit.curp || "—",
            hit.rfc || "—",
            hit.risk_type || "—",
            hit.organization_reported || "—",
            hit.notes || "—",
          ])}
          empty="Sin registros internos asociados."
        />
      </div>
    </section>
  );
}

export function PldAmlScreeningsHistoryPanel() {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ["pld-aml", "screenings", page],
    queryFn: () => fetchScreenings({ page, limit: PAGE_SIZE }),
  });
  const detailQuery = useQuery({
    queryKey: ["pld-aml", "screening", selectedId],
    queryFn: () => fetchScreening(selectedId!),
    enabled: Boolean(selectedId),
  });

  const items = asList<AmlScreeningListItem>(listQuery.data);
  const total = listQuery.data?.total ?? items.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="mdc-section pld-stack">
      <header className="pld-head">
        <h2>Screenings</h2>
        <p>Validaciones de la organización. Solo lectura. Cada fila es un screening_id distinto.</p>
      </header>

      {listQuery.isError ? <AmlBanner tone="error">{errorMessage(listQuery.error)}</AmlBanner> : null}

      {!listQuery.isLoading && !items.length ? (
        <p className="pld-muted">Todavía no hay validaciones. Se listan aquí cuando el screening corre de forma automática.</p>
      ) : (
        <section className="pld-card">
          <AmlTable
            columns={["Usuario", "Fuente", "Matches", "Riesgo", "Estado", "Pasó", "Fecha", ""]}
            rows={items.map((item) => [
              item.name || item.user_id || item.screening_id,
              item.data_source || "—",
              String(item.match_count ?? 0),
              formatScore(item.risk_score),
              <ScreeningStatusBadge key={`${item.screening_id}-status`} status={item.result_status} />,
              formatPassed(item.passed),
              formatWhen(item.created_at),
              <button
                key={item.screening_id}
                type="button"
                className="mdc-btn mdc-btn--ghost mdc-btn--sm"
                onClick={() => setSelectedId(item.screening_id)}
              >
                Ver
              </button>,
            ])}
            empty={listQuery.isLoading ? "Cargando validaciones…" : "Sin validaciones."}
          />
          <div className="pld-form__actions">
            <button type="button" className="mdc-btn mdc-btn--ghost" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              Anterior
            </button>
            <span className="pld-muted">
              Página {page} de {pageCount} · {total} validaciones
            </span>
            <button
              type="button"
              className="mdc-btn mdc-btn--ghost"
              disabled={page >= pageCount}
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente
            </button>
          </div>
        </section>
      )}

      {selectedId ? (
        <ScreeningDetailPanel
          detail={detailQuery.data}
          loading={detailQuery.isLoading}
          error={detailQuery.error}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </section>
  );
}
