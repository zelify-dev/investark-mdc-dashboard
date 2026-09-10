"use client";

import { useCallback, useMemo, useState } from "react";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { formatMxnFull, formatMxnCompact } from "@/modules/scotia/utils/format-mxn";
import { APPLICATIONS_BY_MODE, type Application } from "@/modules/mdc/data/mdc-credit-mock";
import { resolveMoralCreditReportFromPrompt } from "@/modules/mdc/data/mdc-moral-credit-report";
import { exportMoralCreditReportPdf } from "@/modules/mdc/services/moral-credit-report-pdf";
import type { MoralCreditReportPayload, MoralCreditReportRuleRow } from "@/modules/mdc/types/moral-credit-report.types";
import { formatBps } from "@/modules/reporting/services/credit-report-pdf-format";
import "./mdc-reports-tab.css";

type ReportSection = "resumen" | "perfil" | "cumplimiento" | "finanzas" | "decision";
export type ReportKind = "full" | "kyb" | "mdc" | "shareholders";

const SECTIONS: { id: ReportSection; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "perfil", label: "Perfil" },
  { id: "cumplimiento", label: "Cumplimiento" },
  { id: "finanzas", label: "Finanzas" },
  { id: "decision", label: "Decision" },
];

const SECTIONS_BY_KIND: Record<ReportKind, { id: ReportSection; label: string }[]> = {
  full: SECTIONS,
  kyb: [{ id: "cumplimiento", label: "KYB" }],
  mdc: [{ id: "decision", label: "MDC" }],
  shareholders: [{ id: "perfil", label: "Estructura accionaria" }],
};

const MORAL_APPLICATIONS_STORAGE_KEY = "mdc:moral:applications";
const STATUS_LABEL_BY_APP_STATUS: Record<Application["status"], string> = {
  approved: "Aprobada",
  declined: "Rechazada",
  pending: "Pendiente",
  manualReview: "Revision manual",
  overridden: "Override",
};

function normalizeSearchValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function readStoredMoralApplications(): Application[] {
  if (typeof window === "undefined") return APPLICATIONS_BY_MODE.moral;
  try {
    const raw = window.localStorage.getItem(MORAL_APPLICATIONS_STORAGE_KEY);
    if (!raw) return APPLICATIONS_BY_MODE.moral;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return APPLICATIONS_BY_MODE.moral;
    return parsed as Application[];
  } catch {
    return APPLICATIONS_BY_MODE.moral;
  }
}

function findApplicationMention(prompt: string, applications: Application[]): Application | null {
  const normalizedPrompt = normalizeSearchValue(prompt);
  if (!normalizedPrompt) return null;

  const ranked = applications
    .map((application) => ({
      application,
      candidate: normalizeSearchValue(application.applicantName),
    }))
    .filter(({ candidate }) => candidate && normalizedPrompt.includes(candidate))
    .sort((a, b) => b.candidate.length - a.candidate.length);

  return ranked[0]?.application ?? null;
}

function estimateMonthlyPayment(principal: number, annualRate: number, months: number): number {
  if (!principal || months <= 0) return 0;
  const r = annualRate / 100 / 12;
  if (r === 0) return Math.round(principal / months);
  return Math.round((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}

function replaceCompanyMentions(lines: string[], previousName: string, nextName: string): string[] {
  if (!previousName || previousName === nextName) return lines;
  const prevUpper = previousName.toUpperCase();
  const nextUpper = nextName.toUpperCase();
  return lines.map((line) => line.replaceAll(prevUpper, nextUpper).replaceAll(previousName, nextName));
}

function applyApplicationToReport(report: MoralCreditReportPayload, application: Application): MoralCreditReportPayload {
  const previousName = report.company.legalName;
  const nextName = application.applicantName;
  const nextRequestedAmount = application.requestedAmount || report.company.requestedAmount;
  const nextMonthlyPayment = estimateMonthlyPayment(nextRequestedAmount, report.company.finalRate, report.company.termMonths);

  return {
    ...report,
    reportId: `RPT-PM-2026-${application.appNo.replace("APP-PM-", "").replace("PM-APP-", "")}`,
    application: {
      ...report.application,
      appNo: application.appNo,
      appId: application.id,
      submittedAt: application.submittedAt,
      status: application.status,
      statusLabel: STATUS_LABEL_BY_APP_STATUS[application.status],
      riskLevel: application.risk,
      riskScore: application.riskScore,
    },
    company: {
      ...report.company,
      legalName: nextName,
      tradeName: nextName,
      email: application.applicantEmail,
      productName: application.product,
      requestedAmount: nextRequestedAmount,
      monthlyPayment: nextMonthlyPayment,
      totalInterest: Math.max(nextMonthlyPayment * report.company.termMonths - nextRequestedAmount, 0),
      decisionSummary: report.company.decisionSummary.replaceAll(previousName.toUpperCase(), nextName.toUpperCase()).replaceAll(previousName, nextName),
    },
    executiveSummary: replaceCompanyMentions(report.executiveSummary, previousName, nextName),
    integratedAnalysis: replaceCompanyMentions(report.integratedAnalysis, previousName, nextName),
    riskFactors: replaceCompanyMentions(report.riskFactors, previousName, nextName),
    strengths: replaceCompanyMentions(report.strengths, previousName, nextName),
  };
}

function resolveReportKind(prompt: string): ReportKind {
  const normalized = prompt.trim().toUpperCase();
  if (normalized.includes("ESTRUCTURA ACCIONARIA")) return "shareholders";
  if (normalized.includes("KYB") || normalized.includes("KBY")) return "kyb";
  if (normalized.includes("MDC")) return "mdc";
  return "full";
}

function verdictTone(v: MoralCreditReportRuleRow["verdict"]): "success" | "warning" | "error" {
  if (v === "CUMPLE") return "success";
  if (v === "REVISAR") return "warning";
  return "error";
}

function decisionTone(d: MoralCreditReportPayload["company"]["decision"]): "success" | "warning" | "error" {
  if (d === "APROBADO") return "success";
  if (d === "REVISION") return "warning";
  return "error";
}

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" | "bad" }) {
  return (
    <div className={`mdc-rpt-metric${tone ? ` mdc-rpt-metric--${tone}` : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Block({ title, badge, children }: { title: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <article className="mdc-rpt-block">
      <header className="mdc-rpt-block__head">
        <h3>{title}</h3>
        {badge}
      </header>
      {children}
    </article>
  );
}

export function MdcReportsTab() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<MoralCreditReportPayload | null>(null);
  const [reportKind, setReportKind] = useState<ReportKind>("full");
  const [section, setSection] = useState<ReportSection>("resumen");

  const generate = useCallback(async () => {
    const nextKind = resolveReportKind(prompt);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    const baseReport = resolveMoralCreditReportFromPrompt(prompt);
    const matchedApplication = findApplicationMention(prompt, readStoredMoralApplications());
    setReport(matchedApplication ? applyApplicationToReport(baseReport, matchedApplication) : baseReport);
    setReportKind(nextKind);
    setSection(
      nextKind === "kyb"
        ? "cumplimiento"
        : nextKind === "mdc"
          ? "decision"
          : nextKind === "shareholders"
            ? "perfil"
            : "resumen",
    );
    setLoading(false);
  }, [prompt]);

  const exportPdf = () => {
    if (!report) return;
    exportMoralCreditReportPdf(report, reportKind);
  };

  const c = report?.company;
  const f = report?.financials;
  const cap = report?.capacity;
  const ruleStats = useMemo(() => {
    if (!report) return { ok: 0, review: 0, fail: 0 };
    return {
      ok: report.rules.filter((r) => r.verdict === "CUMPLE").length,
      review: report.rules.filter((r) => r.verdict === "REVISAR").length,
      fail: report.rules.filter((r) => r.verdict === "NO_CUMPLE").length,
    };
  }, [report]);
  const totalRateBps = report?.rateCascade.reduce((sum, step) => sum + (step.deltaBps ?? 0), 0) ?? 0;
  const visibleSections = SECTIONS_BY_KIND[reportKind];
  const showAllSections = reportKind === "full";

  return (
    <section className="mdc-reports">
      <header className="mdc-reports__head">
        <div>
          <AppBadge tone="neutral">MDC · Informes empresariales</AppBadge>
          <h2 className="mdc-reports__title">Informes crediticios</h2>
        </div>
        {report && (
          <div className="mdc-reports__folio">
            <span>Folio</span>
            <strong>{report.reportId}</strong>
            <span>{new Date(report.generatedAt).toLocaleString("es-MX")}</span>
          </div>
        )}
      </header>

      <section className="mdc-reports__prompt">
        <label htmlFor="mdc-rpt-prompt">Consulta en lenguaje natural</label>
        <AppInput
          id="mdc-rpt-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="¿Que informe quieres generar?"
        />
        <div className="mdc-reports__prompt-actions">
          <AppButton tone="primary" onClick={() => void generate()} disabled={loading}>
            {loading ? "Procesando consulta…" : "Generar informe"}
          </AppButton>
          <AppButton tone="secondary" onClick={exportPdf} disabled={!report}>
            Descargar PDF
          </AppButton>
        </div>
      </section>

      {loading && (
        <div className="mdc-reports__loading">
          <div className="mdc-reports__spinner" />
          <p>Generando informe…</p>
        </div>
      )}

      {report && c && f && cap && !loading && (
        <div className="mdc-rpt-doc">
          {/* Cabecera consolidada */}
          <header className="mdc-rpt-doc__hero">
            <div className="mdc-rpt-doc__hero-main">
              <div className="mdc-rpt-doc__hero-top">
                <div>
                  <p className="mdc-rpt-doc__eyebrow">{report.application.appNo} · {c.segment}</p>
                  <h2>{c.legalName}</h2>
                  <p className="mdc-rpt-doc__meta">{c.rfc} · {c.productName}</p>
                </div>
                <AppBadge tone={decisionTone(c.decision)}>{c.decision}</AppBadge>
              </div>
              <p className="mdc-rpt-doc__verdict">{c.decisionSummary}</p>
            </div>
            <div className="mdc-rpt-doc__ribbon">
              <Metric label="Monto" value={formatMxnCompact(c.requestedAmount)} />
              <Metric label="Plazo" value={`${c.termMonths}m`} />
              <Metric label="Tasa / CAT" value={`${c.finalRate}% / ${c.cat}%`} />
              <Metric label="Cuota" value={formatMxnCompact(c.monthlyPayment)} />
              <Metric label="BC Score" value={String(c.bureauScore)} tone="warn" />
              <Metric label="DSCR" value={`${f.dscr.toFixed(2)}x`} tone="warn" />
              <Metric label="Apalanc." value={`${f.leverageRatio.toFixed(2)}x`} tone="warn" />
              <Metric label="Reglas MDC" value={`${ruleStats.ok}/${report.rules.length}`} tone={ruleStats.review > 0 ? "warn" : "ok"} />
            </div>
          </header>

          {/* Navegacion por secciones */}
          {!showAllSections && (
            <nav className="mdc-rpt-doc__nav" aria-label="Secciones del informe">
              {visibleSections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`mdc-rpt-doc__nav-btn${section === s.id ? " mdc-rpt-doc__nav-btn--active" : ""}`}
                  onClick={() => setSection(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </nav>
          )}

          <div className="mdc-rpt-doc__body">
            {(showAllSections || section === "resumen") && (
              <div className="mdc-rpt-layout">
                <Block title="Resumen ejecutivo">
                  <ol className="mdc-rpt-list mdc-rpt-list--numbered">
                    {report.executiveSummary.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ol>
                </Block>
                {reportKind === "full" && (
                  <Block title="Lectura consolidada KYB + MDC">
                    <ol className="mdc-rpt-list mdc-rpt-list--numbered">
                      {report.integratedAnalysis.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ol>
                  </Block>
                )}
                <div className="mdc-rpt-cols">
                  <Block title="Fortalezas">
                    <ul className="mdc-rpt-list mdc-rpt-list--ok">
                      {report.strengths.map((s) => <li key={s}>{s}</li>)}
                    </ul>
                  </Block>
                  <Block title="Factores de riesgo">
                    <ul className="mdc-rpt-list mdc-rpt-list--risk">
                      {report.riskFactors.map((r) => <li key={r}>{r}</li>)}
                    </ul>
                  </Block>
                </div>
                <Block title="Recomendacion MDC">
                  <p className="mdc-rpt-note">{c.aiRecommendation}</p>
                </Block>
                <div className="mdc-rpt-cols">
                  <Block title="Condiciones para desembolso">
                    <ol className="mdc-rpt-list mdc-rpt-list--numbered">
                      {c.conditions.map((cond) => <li key={cond}>{cond}</li>)}
                    </ol>
                  </Block>
                  <Block title="Monitoreo post-originacion">
                    <ul className="mdc-rpt-list">
                      {report.monitoringPlan.map((m) => <li key={m}>{m}</li>)}
                    </ul>
                  </Block>
                </div>
              </div>
            )}

            {(showAllSections || section === "perfil") && (
              <div className="mdc-rpt-layout">
                <Block title="Expediente y operacion" badge={<AppBadge tone="neutral">{report.application.statusLabel}</AppBadge>}>
                  <div className="mdc-rpt-kv">
                    <div><span>Solicitud</span><strong>{report.application.appNo}</strong></div>
                    <div><span>Riesgo</span><strong>{report.application.riskLevel} ({report.application.riskScore})</strong></div>
                    <div><span>Ingreso</span><strong>{new Date(report.application.submittedAt).toLocaleDateString("es-MX")}</strong></div>
                    <div><span>Ejecutivo</span><strong>{report.application.executive}</strong></div>
                    <div><span>Canal</span><strong>{report.application.channel}</strong></div>
                    <div><span>Pre-aprobado pool</span><strong>{formatMxnCompact(c.preApprovedAmount)}</strong></div>
                  </div>
                  <p className="mdc-rpt-note"><strong>Destino:</strong> {c.creditPurpose}</p>
                </Block>
                <div className="mdc-rpt-cols">
                  <Block title="Datos corporativos">
                    <div className="mdc-rpt-kv mdc-rpt-kv--2">
                      <div><span>Constitucion</span><strong>{c.incorporationDate}</strong></div>
                      <div><span>Antiguedad</span><strong>{c.antiquityYears} anos</strong></div>
                      <div><span>Representante</span><strong>{c.legalRep}</strong></div>
                      <div><span>Empleados</span><strong>{c.employees}</strong></div>
                      <div><span>Regiones</span><strong>{c.operatingRegions}</strong></div>
                      <div><span>NAICS</span><strong>{c.naicsCode}</strong></div>
                    </div>
                    <p className="mdc-rpt-note">{c.industrySummary}</p>
                  </Block>
                  <Block title="Sector y mercado" badge={<AppBadge tone="neutral">Indice {report.sector.naicsRiskIndex}</AppBadge>}>
                    <p className="mdc-rpt-note">{report.sector.sectorOutlook}</p>
                    <p className="mdc-rpt-note"><strong>Posicion:</strong> {report.sector.competitivePosition}</p>
                    <ul className="mdc-rpt-list mdc-rpt-list--compact">
                      {report.sector.industryTrends.map((t) => <li key={t}>{t}</li>)}
                    </ul>
                  </Block>
                </div>
                <Block title="Estructura accionaria">
                  <table className="mdc-rpt-table">
                    <thead>
                      <tr>
                        <th>Accionista</th>
                        <th>Part.</th>
                        <th>Rol</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.shareholders.map((s) => (
                        <tr key={s.rfc}>
                          <td><strong>{s.name}</strong><span className="mdc-rpt-table__sub">{s.rfc}</span></td>
                          <td>{s.ownershipPct}%</td>
                          <td>{s.role}</td>
                          <td>{s.bureauScore ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Block>
              </div>
            )}

            {(showAllSections || section === "cumplimiento") && (
              <div className="mdc-rpt-layout">
                <div className="mdc-rpt-cols">
                  <Block title="KYB" badge={<AppBadge tone="warning">{pct(c.kybCompleteness)}</AppBadge>}>
                    <div className="mdc-rpt-checklist">
                      {report.kybDocuments.map((doc) => (
                        <div key={doc.id} className={`mdc-rpt-check mdc-rpt-check--${doc.status === "VALIDADO" ? "ok" : doc.status === "OBSERVACION" ? "warn" : "neutral"}`}>
                          <strong>{doc.label}</strong>
                          <span>{doc.status}</span>
                          <p>{doc.detail}</p>
                        </div>
                      ))}
                    </div>
                  </Block>
                  <Block title="AML" badge={<AppBadge tone={c.amlAlerts === 0 ? "success" : "warning"}>{c.amlAlerts} alerta(s)</AppBadge>}>
                    <div className="mdc-rpt-checklist">
                      {report.amlChecks.map((a) => (
                        <div key={a.listName} className={`mdc-rpt-check mdc-rpt-check--${a.result === "SIN_COINCIDENCIAS" ? "ok" : "warn"}`}>
                          <strong>{a.listName}</strong>
                          <span>{a.result === "SIN_COINCIDENCIAS" ? "Limpio" : "Alerta"}</span>
                          <p>{a.provider} · {a.riskLevel}</p>
                        </div>
                      ))}
                    </div>
                  </Block>
                </div>
                <Block
                  title="Buro de credito empresarial"
                  badge={<span className="mdc-rpt-score">{c.bureauScore}</span>}
                >
                  <div className="mdc-rpt-kv mdc-rpt-kv--6">
                    <div><span>Percentil</span><strong>{c.bureauPercentile}</strong></div>
                    <div><span>Calificacion</span><strong>{c.bureauRating}</strong></div>
                    <div><span>Score socios</span><strong>{c.shareholderScore}</strong></div>
                    <div><span>Max. atraso</span><strong>{c.maxDaysPastDue}d</strong></div>
                    <div><span>Consultas 6m</span><strong>{c.inquiries6m}</strong></div>
                    <div><span>Deuda total</span><strong>{formatMxnCompact(c.totalCorporateDebt)}</strong></div>
                  </div>
                  <div className="mdc-rpt-trend">
                    {report.buroScoreHistory.map((h) => (
                      <div key={h.period} className="mdc-rpt-trend__item">
                        <span>{h.period}</span>
                        <strong>{h.score}</strong>
                      </div>
                    ))}
                  </div>
                  <table className="mdc-rpt-table">
                    <thead>
                      <tr>
                        <th>Acreditante</th>
                        <th>Saldo</th>
                        <th>Limite</th>
                        <th>Util.</th>
                        <th>MOP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.buroTradelines.map((t) => (
                        <tr key={t.creditor + t.product}>
                          <td><strong>{t.creditor}</strong><span className="mdc-rpt-table__sub">{t.product}</span></td>
                          <td>{formatMxnCompact(t.balance)}</td>
                          <td>{formatMxnCompact(t.limit)}</td>
                          <td>{t.utilizationPct}%</td>
                          <td>{t.mop}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Block>
              </div>
            )}

            {(showAllSections || section === "finanzas") && (
              <div className="mdc-rpt-layout">
                <div className="mdc-rpt-kpi-grid">
                  <Metric label="Facturacion / mes" value={formatMxnCompact(f.monthlyRevenue)} />
                  <Metric label="EBITDA anual" value={formatMxnCompact(f.ebitda)} />
                  <Metric label="Margen EBITDA" value={pct(f.ebitdaMargin)} />
                  <Metric label="ROE / ROA" value={`${pct(f.roe)} / ${pct(f.roa)}`} />
                  <Metric label="Razon corriente" value={`${f.currentRatio.toFixed(2)}x`} />
                  <Metric label="Cobertura int." value={`${f.interestCoverage.toFixed(1)}x`} />
                  <Metric label="Cap. trabajo" value={formatMxnCompact(f.workingCapital)} />
                  <Metric label="Flujo libre" value={formatMxnCompact(f.freeCashFlow)} />
                </div>

                <Block title="Estados financieros">
                  <div className="mdc-rpt-fin-tabs">
                    <div className="mdc-rpt-fin-panel">
                      <h4>Balance general</h4>
                      <table className="mdc-rpt-table mdc-rpt-table--compact">
                        <thead>
                          <tr><th>Periodo</th><th>Activos</th><th>Pasivos</th><th>Capital</th><th>Efectivo</th></tr>
                        </thead>
                        <tbody>
                          {report.balanceSheet.map((b) => (
                            <tr key={b.period}>
                              <td><strong>{b.period}</strong></td>
                              <td>{formatMxnCompact(b.totalAssets)}</td>
                              <td>{formatMxnCompact(b.totalLiabilities)}</td>
                              <td>{formatMxnCompact(b.equity)}</td>
                              <td>{formatMxnCompact(b.cash)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mdc-rpt-fin-panel">
                      <h4>Estado de resultados</h4>
                      <table className="mdc-rpt-table mdc-rpt-table--compact">
                        <thead>
                          <tr><th>Periodo</th><th>Ingresos</th><th>EBITDA</th><th>Util. neta</th></tr>
                        </thead>
                        <tbody>
                          {report.incomeStatement.map((i) => (
                            <tr key={i.period}>
                              <td><strong>{i.period}</strong></td>
                              <td>{formatMxnCompact(i.revenue)}</td>
                              <td>{formatMxnCompact(i.ebitda)}</td>
                              <td>{formatMxnCompact(i.netIncome)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mdc-rpt-fin-panel">
                      <h4>Flujo de efectivo</h4>
                      <table className="mdc-rpt-table mdc-rpt-table--compact">
                        <thead>
                          <tr><th>Periodo</th><th>Operacion</th><th>CAPEX</th><th>Variacion</th></tr>
                        </thead>
                        <tbody>
                          {report.cashFlow.map((cf) => (
                            <tr key={cf.period}>
                              <td><strong>{cf.period}</strong></td>
                              <td>{formatMxnCompact(cf.operatingCashFlow)}</td>
                              <td>{formatMxnCompact(cf.capex)}</td>
                              <td>{formatMxnCompact(cf.netCashChange)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Block>

                <div className="mdc-rpt-cols">
                  <Block title="Ingresos verificados">
                    <table className="mdc-rpt-table mdc-rpt-table--compact">
                      <thead><tr><th>Concepto</th><th>Monto</th><th>%</th></tr></thead>
                      <tbody>
                        {report.revenueBreakdown.filter((r) => r.verified).map((r) => (
                          <tr key={r.concept}>
                            <td>{r.concept}</td>
                            <td>{formatMxnCompact(r.amount)}</td>
                            <td>{r.pctOfTotal}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Block>
                  <Block title="Concentracion de clientes">
                    <table className="mdc-rpt-table mdc-rpt-table--compact">
                      <thead><tr><th>Cliente</th><th>%</th><th>Plazo</th></tr></thead>
                      <tbody>
                        {report.clientConcentration.slice(0, 4).map((cl) => (
                          <tr key={cl.client}>
                            <td><strong>{cl.client}</strong><span className="mdc-rpt-table__sub">{cl.sector}</span></td>
                            <td>{pct(cl.revenuePct)}</td>
                            <td>{cl.paymentTerms}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Block>
                </div>

                <Block title="Capacidad de pago">
                  <div className="mdc-rpt-capacity">
                    <div className="mdc-rpt-capacity__metrics">
                      <Metric label="EBITDA mensual" value={formatMxnCompact(cap.ebitdaMonthly)} />
                      <Metric label="Servicio deuda" value={formatMxnCompact(cap.debtServiceMonthly)} />
                      <Metric label="DSCR" value={`${cap.dscr.toFixed(2)}x`} tone="warn" />
                      <Metric label="DSCR estres" value={`${cap.stressDscr.toFixed(2)}x`} tone="bad" />
                      <Metric label="Cuota / ingresos" value={pct(cap.quotaToRevenueRatio)} />
                      <Metric label="Colchon" value={`${cap.cushionMonths.toFixed(1)} meses`} />
                    </div>
                    <div className="mdc-rpt-gauge">
                      <div className="mdc-rpt-gauge__bar">
                        <div
                          className="mdc-rpt-gauge__fill"
                          style={{ width: `${Math.min((cap.quotaToRevenueRatio / cap.maxAllowedQuotaRatio) * 100, 100)}%` }}
                        />
                      </div>
                      <span>Uso de capacidad: {pct(cap.quotaToRevenueRatio)} de {pct(cap.maxAllowedQuotaRatio)} permitido</span>
                    </div>
                  </div>
                </Block>
              </div>
            )}

            {(showAllSections || section === "decision") && (
              <div className="mdc-rpt-layout">
                <Block
                  title="Motor MDC · Reglas"
                  badge={
                    <div className="mdc-rpt-rule-badges">
                      <span className="mdc-rpt-rule-badge mdc-rpt-rule-badge--ok">{ruleStats.ok} cumple</span>
                      <span className="mdc-rpt-rule-badge mdc-rpt-rule-badge--warn">{ruleStats.review} revision</span>
                      {ruleStats.fail > 0 && <span className="mdc-rpt-rule-badge mdc-rpt-rule-badge--bad">{ruleStats.fail} no cumple</span>}
                    </div>
                  }
                >
                  <div className="mdc-rpt-rules">
                    {report.rules.map((r) => (
                      <div key={r.id} className={`mdc-rpt-rule mdc-rpt-rule--${verdictTone(r.verdict)}`}>
                        <div className="mdc-rpt-rule__head">
                          <strong>{r.label}</strong>
                          <AppBadge tone={verdictTone(r.verdict)}>{r.verdict}</AppBadge>
                        </div>
                        <p>{r.detail}</p>
                        {r.threshold && r.observedValue && (
                          <span className="mdc-rpt-rule__meta">Umbral: {r.threshold} · Observado: {r.observedValue}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mdc-rpt-rate">
                    <span>Tasa base {c.baseRate}%</span>
                    <span>→</span>
                    <span>Bonificaciones {formatBps(totalRateBps)}</span>
                    <span>→</span>
                    <strong>Tasa final {c.finalRate}% · CAT {c.cat}%</strong>
                  </div>
                </Block>

                <div className="mdc-rpt-cols">
                  <Block title="Garantias">
                    <div className="mdc-rpt-checklist">
                      {report.collateral.map((col) => (
                        <div key={col.id} className="mdc-rpt-check mdc-rpt-check--ok">
                          <strong>{col.type}</strong>
                          <span>{formatMxnCompact(col.appraisedValue)} · {col.coveragePct}%</span>
                          <p>{col.description}</p>
                        </div>
                      ))}
                    </div>
                  </Block>
                  <Block title="Operacion y trazabilidad">
                    <div className="mdc-rpt-timeline">
                      {report.traceability.map((t) => (
                        <div key={t.id} className="mdc-rpt-timeline__item">
                          <time>{new Date(t.timestamp).toLocaleDateString("es-MX")}</time>
                          <strong>{t.action}</strong>
                          <p>{t.details}</p>
                        </div>
                      ))}
                      {report.paymentHistory.map((p) => (
                        <div key={p.sessionId} className="mdc-rpt-timeline__item">
                          <time>{p.date}</time>
                          <strong>Pago {p.method} · {p.status}</strong>
                          <p>{formatMxnFull(p.amount)} · Ref. {p.reference}</p>
                        </div>
                      ))}
                    </div>
                  </Block>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
