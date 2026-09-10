"use client";

import { useCallback, useEffect, useState } from "react";
import { CircleHelp } from "lucide-react";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { formatMxnFull, formatMxnCompact } from "@/modules/scotia/utils/format-mxn";
import { exportCreditReportPdf } from "../services/credit-report-pdf";
import { exportLiveReportPdf } from "../services/live-report-pdf";
import { generateLiveReport, type DocumentReportModule, type KycReportModule, type LiveReportResult, type LiveReportSection, type RuleReportModule } from "../services/live-report-query.service";
import { KycCaptureCard } from "../components/kyc-capture-card";
import type { CreditReportPayload, CreditReportRuleRow } from "../types/credit-report.types";
import { formatBps } from "../services/credit-report-pdf-format";
import "@/components/ui/templates/workspace-page.css";
import "./reporting-screen.css";

const DEFAULT_PROMPT = "";
const LIVE_REPORT_CACHE_KEY = "reporting:live-report";
const MINIMUM_REPORT_LOADING_MS = 3000;
const MINIMUM_REPORT_ERROR_LOADING_MS = 4000;
const REPORT_ORB_EXIT_MS = 360;

const LIVE_SECTION_LABEL: Record<LiveReportSection, string> = {
  kyc: "KYC",
  rules: "Resumen de reglas",
  documents: "Documentación y extracción",
};

function readCachedLiveReport(): { prompt: string; report: LiveReportResult } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(LIVE_REPORT_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as { prompt?: unknown; report?: unknown };
    if (typeof cached.prompt !== "string" || !cached.report || typeof cached.report !== "object") return null;
    return { prompt: cached.prompt, report: cached.report as LiveReportResult };
  } catch {
    return null;
  }
}

function verdictTone(v: CreditReportRuleRow["verdict"]): "success" | "warning" | "danger" {
  if (v === "CUMPLE") return "success";
  if (v === "REVISAR") return "warning";
  return "danger";
}

function groupLabel(g: CreditReportRuleRow["group"]) {
  if (g === "aprobacion") return "Aprobación";
  if (g === "pricing") return "Pricing";
  return "Validación";
}

type ApiRecord = Record<string, unknown>;

function asRecord(value: unknown): ApiRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as ApiRecord : null;
}

function textValue(value: unknown, fallback = "Sin información"): string {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return String(value);
}

function flattenExtractionValues(value: unknown, prefix = ""): Array<{ label: string; value: string }> {
  const record = asRecord(value);
  if (record) {
    return Object.entries(record).flatMap(([key, child]) => flattenExtractionValues(child, prefix ? `${prefix} · ${key}` : key));
  }
  if (Array.isArray(value)) {
    return value.flatMap((child, index) => flattenExtractionValues(child, `${prefix} ${index + 1}`));
  }
  return prefix ? [{ label: prefix, value: textValue(value) }] : [];
}

function displayFieldLabel(label: string): string {
  return label
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_·]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function LiveDataModule({ title, data }: { title: string; data: unknown }) {
  const fields = flattenExtractionValues(data);
  if (!fields.length) return null;
  return (
    <section className="rpt-live-module">
      <h3>{title}</h3>
      <dl className="rpt-document-report__fields">
        {fields.map((field) => <div key={`${title}-${field.label}-${field.value}`}><dt>{displayFieldLabel(field.label)}</dt><dd>{field.value}</dd></div>)}
      </dl>
    </section>
  );
}

function ReferencesModule({ data }: { data: unknown }) {
  const references = Array.isArray(data) ? data.map(asRecord).filter((reference): reference is ApiRecord => Boolean(reference)) : [];
  if (!references.length) return <LiveDataModule title="Referencias" data={data} />;

  return (
    <section className="rpt-live-module">
      <h3>Referencias</h3>
      <div className="rpt-reference-list">
        {references.map((reference, index) => {
          const fields = flattenExtractionValues(reference);
          return (
            <article className="rpt-reference-card" key={`${reference.fullName ?? "referencia"}-${index}`}>
              <h4>Referencia {index + 1}</h4>
              <dl className="rpt-document-report__fields">
                {fields.map((field) => <div key={`${index}-${field.label}-${field.value}`}><dt>{displayFieldLabel(field.label)}</dt><dd>{field.value}</dd></div>)}
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ReportLoadingOrb({ exiting }: { exiting: boolean }) {
  return (
    <div className={`rpt-orb-loading${exiting ? " rpt-orb-loading--exit" : ""}`} role="status" aria-label="Generando informe">
      <div className="rpt-siri-container">
        <div className="rpt-siri-halo" />
        <div className="rpt-siri-sphere">
          <div className="rpt-siri-fluid rpt-siri-fluid--one" />
          <div className="rpt-siri-fluid rpt-siri-fluid--two" />
          <div className="rpt-siri-fluid rpt-siri-fluid--three" />
          <div className="rpt-siri-depth" />
          <div className="rpt-siri-glass" />
        </div>
      </div>
    </div>
  );
}

function LiveReportSectionContent({ section, data, kycModules, ruleModules, documentModules }: {
  section: LiveReportSection;
  data: unknown;
  kycModules?: KycReportModule[];
  ruleModules?: RuleReportModule[];
  documentModules?: DocumentReportModule[];
}) {
  const record = asRecord(data);
  if (!record) return <p className="rpt-muted">El servicio no devolvió información para esta persona.</p>;

  if (section === "kyc") {
    const session = asRecord(record.session) || record;
    const sessionByCurp = asRecord(record.sessionByCurp);
    const identity = asRecord(session.identity);
    const address = asRecord(session.address);
    const onboarding = asRecord(session.onboarding);
    const contact = asRecord(onboarding?.contact);
    const showModule = (module: KycReportModule) => !kycModules || kycModules.includes(module);
    return (
      <div className="rpt-live-modules">
        {showModule("session") ? <LiveDataModule title="Estado de la sesión" data={{ sessionId: session.sessionId, status: session.status, userId: session.userId, completedAt: session.completedAt, expiresAt: session.expiresAt }} /> : null}
        {showModule("identity") ? <LiveDataModule title="Identidad" data={identity} /> : null}
        {showModule("contact") ? <LiveDataModule title="Contacto" data={contact} /> : null}
        {showModule("personal") ? <LiveDataModule title="Datos personales" data={onboarding?.personal} /> : null}
        {showModule("address") ? <LiveDataModule title="Domicilio" data={{ verificacion: address, registro: onboarding?.address }} /> : null}
        {showModule("references") ? <ReferencesModule data={onboarding?.references} /> : null}
        {showModule("curp") ? <LiveDataModule title="Consulta por CURP" data={sessionByCurp ? { status: sessionByCurp.status, userId: sessionByCurp.userId, identity: sessionByCurp.identity, completedAt: sessionByCurp.completedAt } : { resultado: "Sin resultado" }} /> : null}
      </div>
    );
  }

  if (section === "rules") {
    const rules = asRecord(record.rule);
    const ruleNames = asRecord(record.ruleNames);
    const ruleDetails = asRecord(record.ruleDetails);
    const showModule = (module: RuleReportModule) => !ruleModules || ruleModules.includes(module);
    return (
      <>
        {showModule("summary") ? <div className="rpt-kpi-row rpt-kpi-row--4"><div><span>Decisión final</span><strong>{textValue(record.finalDecision, "Pendiente")}</strong></div><div><span>Reglas evaluadas</span><strong>{String(Object.keys(rules || {}).length)}</strong></div></div> : null}
        {showModule("rules") ? <table className="rpt-tbl">
          <thead><tr><th>Regla</th><th>Condiciones</th><th>Producto</th><th>Resultado</th></tr></thead>
          <tbody>
            {Object.entries(rules || {}).map(([id, status]) => {
              const detail = asRecord(ruleDetails?.[id]);
              const conditions = Array.isArray(detail?.conditions) ? detail.conditions : [];
              const products = Array.isArray(detail?.products) ? detail.products : [];
              return (
                <tr key={id}>
                  <td><strong>{textValue(ruleNames?.[id], "Regla sin nombre")}</strong><br /><span className="rpt-muted">{textValue(detail?.description, "")}</span></td>
                  <td>{conditions.length ? conditions.map((condition) => textValue(asRecord(condition)?.type)).join(", ") : "Sin condiciones"}</td>
                  <td>{products.length ? products.map((product) => textValue(product)).join(", ") : "Todos los productos"}</td>
                  <td>{textValue(status)}</td>
                </tr>
              );
            })}
          </tbody>
        </table> : null}
      </>
    );
  }

  return <DocumentReportContent record={record} modules={documentModules} />;
}

function DocumentReportContent({ record, modules }: { record: ApiRecord; modules?: DocumentReportModule[] }) {
  const progressByCategory = Array.isArray(record.progressByCategory) ? record.progressByCategory : [];
  const extractions = Array.isArray(record.extractions) ? record.extractions.map(asRecord).filter((item): item is ApiRecord => Boolean(item)) : [];
  const files = Array.isArray(record.files) ? record.files.map(asRecord).filter((item): item is ApiRecord => Boolean(item)) : [];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const categoryByAnalysisId = new Map(
    progressByCategory.flatMap((entry) => {
      const item = asRecord(entry);
      const progress = asRecord(item?.progress);
      const documents = Array.isArray(progress?.documents) ? progress.documents : [];
      return documents.map((document) => [asRecord(document)?.analysisId, item?.category] as const).filter(([analysisId]) => typeof analysisId === "string");
    }),
  );
  const categoryAllowed = (category: unknown) => {
    if (!modules) return true;
    return (category === "nomina" && modules.includes("payroll"))
      || (category === "extracto" && modules.includes("bankStatement"))
      || (category === "comprobante_domicilio" && modules.includes("address"));
  };
  const visibleExtractions = extractions.filter((extraction) => categoryAllowed(extraction.category || categoryByAnalysisId.get(extraction.analysisId)));
  const selected = visibleExtractions[selectedIndex] || visibleExtractions[0] || null;
  const values = asRecord(selected?.extraction);
  const validation = asRecord(selected?.validation);
  const file = files.find((candidate) => candidate.documentId === selected?.documentId || candidate.fileName === selected?.fileName);
  const fileUrl = typeof file?.url === "string" ? file.url : null;
  const fields = flattenExtractionValues(values);

  return (
    <div className="rpt-document-report">
      {!modules || modules.includes("progress") ? <div className="rpt-document-report__progress">
        {progressByCategory.filter((entry) => !modules || modules.includes("progress") || categoryAllowed(asRecord(entry)?.category)).map((entry) => {
          const item = asRecord(entry);
          const progress = asRecord(item?.progress);
          return <div className="rpt-document-report__card" key={textValue(item?.category)}><span>{textValue(item?.category)}</span><strong>{textValue(progress?.uploaded, "0")}/{textValue(progress?.required, "0")} cargados</strong><small>{textValue(progress?.completed, "0")} procesados · {textValue(progress?.manualReview, "0")} en revisión</small></div>;
        })}
      </div> : null}
      {visibleExtractions.length === 0 ? <p className="rpt-muted">No hay extracciones disponibles para el submódulo solicitado.</p> : (
        <>
          <div className="rpt-document-report__table-wrap">
            <table className="rpt-tbl rpt-document-report__table">
              <thead><tr><th>Archivo</th><th>Tipo</th><th>Estado</th><th>Confianza</th><th /></tr></thead>
              <tbody>
                {visibleExtractions.map((extraction, index) => (
                  <tr key={textValue(extraction.analysisId, String(index))} className={selectedIndex === index ? "rpt-document-report__row--active" : ""}>
                    <td><strong>{textValue(extraction.fileName)}</strong></td>
                    <td>{textValue(extraction.documentType ?? asRecord(extraction.extraction)?.documentType)}</td>
                    <td>{textValue(extraction.status)}</td>
                    <td>{extraction.confidence == null ? "Sin información" : `${textValue(extraction.confidence)}%`}</td>
                    <td><button type="button" className="rpt-document-report__select" onClick={() => { setSelectedIndex(index); setIsViewerOpen(true); }}>Ver PDF</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selected && isViewerOpen ? (
            <div className="rpt-document-modal" role="presentation" onMouseDown={() => setIsViewerOpen(false)}>
              <section className="rpt-document-modal__dialog" role="dialog" aria-modal="true" aria-label={`Documento ${textValue(selected.fileName)}`} onMouseDown={(event) => event.stopPropagation()}>
                <header><div><h3>{textValue(selected.fileName)}</h3><p>{textValue(selected.documentType ?? values?.documentType)} · {textValue(selected.status)}</p></div><div><AppBadge tone={fileUrl ? "success" : "warning"}>{fileUrl ? "PDF disponible" : "PDF no disponible"}</AppBadge><button type="button" className="rpt-document-modal__close" onClick={() => setIsViewerOpen(false)} aria-label="Cerrar documento">×</button></div></header>
                <div className="rpt-document-report__file-body">
                  <div className="rpt-document-report__preview">{fileUrl ? <iframe src={fileUrl} title={`PDF ${textValue(selected.fileName)}`} /> : <p className="rpt-muted">No fue posible obtener el archivo.</p>}</div>
                  <div className="rpt-document-report__details">
                    <dl className="rpt-document-report__metadata"><div><dt>Confianza</dt><dd>{selected.confidence == null ? "Sin información" : `${textValue(selected.confidence)}%`}</dd></div><div><dt>Procesado</dt><dd>{textValue(selected.processed)}</dd></div><div><dt>Validación</dt><dd>{textValue(validation?.valid)}</dd></div><div><dt>Revisión manual</dt><dd>{textValue(validation?.requiresManualReview)}</dd></div></dl>
                    <h4>Datos extraídos</h4>
                    {fields.length ? <dl className="rpt-document-report__fields">{fields.map((field) => <div key={`${field.label}-${field.value}`}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl> : <p className="rpt-muted">No hay campos extraídos para este documento.</p>}
                  </div>
                </div>
              </section>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export function ReportingScreen() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [loading, setLoading] = useState(false);
  const [orbExiting, setOrbExiting] = useState(false);
  const [report, setReport] = useState<CreditReportPayload | null>(null);
  const [liveReport, setLiveReport] = useState<LiveReportResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  useEffect(() => {
    const cached = readCachedLiveReport();
    if (!cached) return;
    const frame = window.requestAnimationFrame(() => {
      setPrompt(cached.prompt);
      setLiveReport(cached.report);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const generate = useCallback(async () => {
    const startedAt = Date.now();
    setLoading(true);
    setOrbExiting(false);
    setReport(null);
    setLiveReport(null);
    setQueryError(null);
    try {
      const nextReport = await generateLiveReport(prompt);
      const remainingLoadingTime = MINIMUM_REPORT_LOADING_MS - (Date.now() - startedAt);
      if (remainingLoadingTime > 0) await new Promise((resolve) => window.setTimeout(resolve, remainingLoadingTime));
      setOrbExiting(true);
      await new Promise((resolve) => window.setTimeout(resolve, REPORT_ORB_EXIT_MS));
      setLiveReport(nextReport);
      window.sessionStorage.setItem(LIVE_REPORT_CACHE_KEY, JSON.stringify({ prompt, report: nextReport }));
    } catch (error) {
      const remainingLoadingTime = MINIMUM_REPORT_ERROR_LOADING_MS - (Date.now() - startedAt);
      if (remainingLoadingTime > 0) await new Promise((resolve) => window.setTimeout(resolve, remainingLoadingTime));
      setOrbExiting(true);
      await new Promise((resolve) => window.setTimeout(resolve, REPORT_ORB_EXIT_MS));
      setQueryError(error instanceof Error ? error.message : "No fue posible generar el informe.");
    } finally {
      setLoading(false);
      setOrbExiting(false);
    }
  }, [prompt]);

  const clear = () => {
    setPrompt(DEFAULT_PROMPT);
    setReport(null);
    setLiveReport(null);
    setQueryError(null);
    window.sessionStorage.removeItem(LIVE_REPORT_CACHE_KEY);
  };

  const exportPdf = () => {
    if (liveReport) {
      exportLiveReportPdf(liveReport);
      return;
    }
    if (!report) return;
    exportCreditReportPdf(report);
  };

  const s = report?.subject;
  const totalRateBps = report?.rateCascade.reduce((sum, step) => sum + (step.deltaBps ?? 0), 0) ?? 0;

  return (
    <div className="zelify-workspace-page rpt-root">
      <ZelifyTopNavbar activeNavId="reporting" />

      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner rpt-inner">
          <header className="rpt-head">
            <div>
              <AppBadge tone="neutral">CORTEX · Reporting</AppBadge>
              <h1 className="zelify-workspace-page__title">Informes crediticios</h1>
              <p className="rpt-head__sub">
                Análisis integral KYC · AML · Buró · Motor de decisión · Capacidad de pago
              </p>
            </div>
            {report && (
              <div className="rpt-head__folio">
                <span>Folio</span>
                <strong>{report.reportId}</strong>
                <span>{new Date(report.generatedAt).toLocaleString("es-MX")}</span>
              </div>
            )}
          </header>

          <section className="rpt-prompt-card">
            <div className="rpt-prompt-card__label">
              <label htmlFor="rpt-prompt">Consulta en lenguaje natural</label>
              <button className="rpt-prompt-card__info" type="button" aria-label="Información sobre las consultas disponibles">
                <CircleHelp size={16} strokeWidth={2} aria-hidden />
                <span className="rpt-prompt-card__tooltip" role="tooltip">
                  Consulta por el número de solicitud. Puedes solicitar KYC, identidad, contacto, referencias, reglas, decisiones, nóminas, extractos y comprobantes.
                </span>
              </button>
            </div>
            <AppInput
              id="rpt-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe el reporte crediticio que necesitas..."
            />
            <div className="rpt-prompt-card__actions">
              <AppButton tone="primary" onClick={() => void generate()} disabled={loading}>
                {loading ? "Procesando consulta…" : "Generar informe"}
              </AppButton>
              <AppButton tone="secondary" onClick={exportPdf} disabled={!report && !liveReport}>
                Descargar PDF
              </AppButton>
              <AppButton tone="secondary" onClick={clear} disabled={!prompt && !report && !liveReport}>
                Limpiar
              </AppButton>
            </div>
          </section>

          {loading && (
            <ReportLoadingOrb exiting={orbExiting} />
          )}

          {queryError && !loading ? <p className="rpt-query-error">{queryError}</p> : null}

          {liveReport && !loading && (
            <div className="rpt-preview">
              <section className="rpt-panel rpt-panel--hero">
                <div className="rpt-panel__head">
                  <h2>Informe de {liveReport.subjectName}</h2>
                  <AppBadge tone="neutral">Datos en tiempo real</AppBadge>
                </div>
                <div className="rpt-subject-grid">
                  <div><span>Usuario</span><strong>{liveReport.subjectName}</strong></div>
                  <div><span>UUID de usuario</span><strong>{liveReport.userId}</strong></div>
                  <div><span>UUID de solicitud</span><strong>{liveReport.financeRequestId}</strong></div>
                </div>
              </section>
              {liveReport.sections.map((section) => (
                <section className="rpt-panel" key={section.section}>
                  <div className="rpt-panel__head">
                    <h2>{LIVE_SECTION_LABEL[section.section]}</h2>
                    <AppBadge tone={section.error ? "warning" : "success"}>{section.error ? "Sin datos" : "Consultado"}</AppBadge>
                  </div>
                  {section.error ? <p className="rpt-query-error">{section.error}</p> : null}
                  {!section.error ? <LiveReportSectionContent section={section.section} data={section.data} kycModules={section.kycModules} ruleModules={section.ruleModules} documentModules={section.documentModules} /> : null}
                </section>
              ))}
            </div>
          )}

          {report && s && !loading && (
            <div className="rpt-preview">
              {/* Dictamen */}
              <section className="rpt-panel rpt-panel--hero">
                <div className="rpt-panel__head">
                  <h2>Dictamen crediticio</h2>
                  <AppBadge tone={s.decision === "APROBADO" ? "success" : "warning"}>{s.decision}</AppBadge>
                </div>
                <div className="rpt-hero-grid">
                  <div>
                    <h3>{s.fullName}</h3>
                    <p>{s.curp} · {s.rfc}</p>
                    <p className="rpt-muted">{s.address}</p>
                  </div>
                  <div className="rpt-kpi-row">
                    <div><span>Producto</span><strong>{s.productName}</strong></div>
                    <div><span>Monto</span><strong>{formatMxnFull(s.requestedAmount)}</strong></div>
                    <div><span>Plazo</span><strong>{s.termMonths} meses</strong></div>
                    <div><span>Tasa final</span><strong>{s.finalRate}%</strong></div>
                    <div><span>Cuota</span><strong>{formatMxnFull(s.monthlyPayment)}</strong></div>
                    <div><span>BC Score</span><strong className="rpt-val-up">{s.buroScore}</strong></div>
                  </div>
                </div>
                <p className="rpt-summary">{s.decisionSummary}</p>
              </section>

              {/* Resumen ejecutivo */}
              <section className="rpt-panel">
                <h2>Resumen ejecutivo</h2>
                <ul className="rpt-bullets">
                  {report.executiveSummary.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>

              {/* KYC */}
              <section className="rpt-panel">
                <div className="rpt-panel__head">
                  <h2>KYC · Verificación de identidad</h2>
                  <AppBadge tone="success">{s.kycStatus}</AppBadge>
                </div>
                <div className="rpt-subject-grid">
                  <div><span>Email</span><strong>{s.email}</strong></div>
                  <div><span>Celular</span><strong>{s.phone}</strong></div>
                  <div><span>Nacimiento</span><strong>{s.birthDate}</strong></div>
                  <div><span>Nacionalidad</span><strong>{s.nationality}</strong></div>
                  <div><span>INE</span><strong>{s.ine}</strong></div>
                  <div><span>Score IA identidad</span><strong>{s.aiScore}/100</strong></div>
                </div>
                <p className="rpt-section-hint">Capturas biométricas y documentales · sesión del 22 may 2026</p>
                <div className="rpt-kyc-grid">
                  {report.kycCaptures.map((c) => (
                    <KycCaptureCard key={c.id} capture={c} subjectName={s.fullName} curp={s.curp} />
                  ))}
                </div>
              </section>

              {/* AML */}
              <section className="rpt-panel">
                <div className="rpt-panel__head">
                  <h2>AML · Listas restrictivas</h2>
                  <AppBadge tone="success">{s.amlStatus}</AppBadge>
                </div>
                <p className="rpt-section-hint">
                  Screening simultáneo contra listas nacionales e internacionales · PEP: {s.pep ? "Identificado" : "No identificado"}
                </p>
                <table className="rpt-tbl">
                  <thead>
                    <tr>
                      <th>Lista</th>
                      <th>Proveedor</th>
                      <th>Resultado</th>
                      <th>Consulta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.amlChecks.map((a) => (
                      <tr key={a.listName}>
                        <td><strong>{a.listName}</strong></td>
                        <td>{a.provider}</td>
                        <td><span className="rpt-pill rpt-pill--ok">Sin coincidencias</span></td>
                        <td className="rpt-muted">{new Date(a.checkedAt).toLocaleString("es-MX")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {/* Buró */}
              <section className="rpt-panel">
                <div className="rpt-panel__head">
                  <h2>Buró de Crédito</h2>
                  <span className="rpt-buro-score">{s.buroScore}</span>
                </div>
                <div className="rpt-kpi-row rpt-kpi-row--4">
                  <div><span>Percentil nacional</span><strong>{s.buroPercentile}</strong></div>
                  <div><span>Antigüedad crediticia</span><strong>{Math.floor(s.creditAgeMonths / 12)}a {s.creditAgeMonths % 12}m</strong></div>
                  <div><span>Consultas 6 meses</span><strong>{s.inquiries6m}</strong></div>
                  <div><span>Deuda reportada</span><strong>{formatMxnCompact(s.totalDebt)}</strong></div>
                  <div><span>MOP máximo</span><strong>{s.maxMop}</strong></div>
                </div>
                <table className="rpt-tbl">
                  <thead>
                    <tr>
                      <th>Acreditante</th>
                      <th>Producto</th>
                      <th>Saldo</th>
                      <th>Límite</th>
                      <th>MOP</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.buroTradelines.map((t) => (
                      <tr key={t.creditor + t.product}>
                        <td><strong>{t.creditor}</strong></td>
                        <td>{t.product}</td>
                        <td className="rpt-n">{formatMxnFull(t.balance)}</td>
                        <td className="rpt-n">{formatMxnFull(t.limit)}</td>
                        <td><span className="rpt-pill rpt-pill--ok">{t.mop}</span></td>
                        <td>{t.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {/* Motor CORTEX */}
              <section className="rpt-panel">
                <div className="rpt-panel__head">
                  <h2>Motor CORTEX · Reglas de decisión</h2>
                  <span className="rpt-muted">{s.productId} · {s.productCategory}</span>
                </div>
                <div className="rpt-rules-groups">
                  {(["aprobacion", "validacion", "pricing"] as const).map((group) => (
                    <div key={group} className="rpt-rules-group">
                      <h3>{groupLabel(group)}</h3>
                      <ul>
                        {report.rules.filter((r) => r.group === group).map((r) => (
                          <li key={r.id} className={`rpt-rule rpt-rule--${verdictTone(r.verdict)}`}>
                            <div className="rpt-rule__top">
                              <strong>{r.label}</strong>
                              <span>{r.verdict}</span>
                            </div>
                            <p>{r.detail}</p>
                            {r.bpsDiscount ? (
                              <span className="rpt-rule__bps">{formatBps(-r.bpsDiscount)}</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="rpt-rate-cascade">
                  <span>Tasa base {s.baseRate}%</span>
                  <span>→</span>
                  <span>Bonificaciones comerciales ({formatBps(totalRateBps)})</span>
                  <span>→</span>
                  <strong>Tasa final {s.finalRate}%</strong>
                </div>
              </section>

              {/* Capacidad de pago */}
              <section className="rpt-panel">
                <h2>Capacidad de pago e ingresos</h2>
                <div className="rpt-capacity-grid">
                  <article className="rpt-capacity-card">
                    <span>Ingreso neto verificado</span>
                    <strong>{formatMxnFull(s.incomeNetMonthly)}</strong>
                    <p>{s.employer} · {s.employmentYears} años antigüedad</p>
                  </article>
                  <article className="rpt-capacity-card">
                    <span>Cuota mensual propuesta</span>
                    <strong>{formatMxnFull(s.monthlyPayment)}</strong>
                    <p>Relación cuota/ingreso {report.capacity.paymentToIncome}%</p>
                  </article>
                  <article className="rpt-capacity-card">
                    <span>Ingreso disponible</span>
                    <strong>{formatMxnFull(report.capacity.disposableIncome)}</strong>
                    <p>Post cuota y obligaciones fijas</p>
                  </article>
                  <article className="rpt-capacity-card">
                    <span>Endeudamiento (DTI)</span>
                    <strong>{report.capacity.debtToIncome}%</strong>
                    <p>Máx. exposición {formatMxnFull(report.capacity.maxLoanByIncome)}</p>
                  </article>
                </div>
                <div className="rpt-gauge">
                  <div className="rpt-gauge__bar">
                    <div
                      className="rpt-gauge__fill"
                      style={{ width: `${Math.min(report.capacity.paymentToIncome / report.capacity.maxAllowedPti * 100, 100)}%` }}
                    />
                  </div>
                  <span>
                    Capacidad de pago: {report.capacity.paymentToIncome}% de {report.capacity.maxAllowedPti}% permitido
                  </span>
                </div>
                <p className="rpt-ai-note">
                  <strong>CORTEX-Recommend:</strong> {s.aiRecommendation}
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
