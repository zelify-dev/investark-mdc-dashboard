"use client";

import { AppButton } from "@/components/ui/atoms/button/app-button";
import { CrmPageHeader } from "@/modules/crm/components/crm-page-header";
import {
  CRM_ACTIVITIES,
  CRM_CAMPAIGNS,
  CRM_LEADS,
  CRM_OPPORTUNITIES,
  OPP_STAGE_LABEL,
  RISK_LABEL,
  formatWhen,
  moneyMxn,
  type CrmOpportunity,
  type CrmOpportunityStage,
  type CrmRisk,
} from "@/modules/crm/data/crm.seed";

import "./crm-workspace.css";

const OPEN_STAGES: CrmOpportunityStage[] = ["prospeccion", "calificacion", "propuesta", "negociacion"];
const FUNNEL_STAGES: CrmOpportunityStage[] = [...OPEN_STAGES, "ganada"];

function riskClass(risk: CrmRisk) {
  if (risk === "low") return "crm-badge crm-badge--ok";
  if (risk === "high") return "crm-badge crm-badge--bad";
  return "crm-badge crm-badge--warn";
}

function ScoreRing({ score }: { score: number }) {
  const max = 850;
  const pct = Math.max(0, Math.min(1, score / max));
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <svg className="crm-score" viewBox="0 0 44 44" aria-label={`Score ${score}`}>
      <circle cx="22" cy="22" r={r} className="crm-score__track" />
      <circle
        cx="22"
        cy="22"
        r={r}
        className="crm-score__value"
        strokeDasharray={`${c * pct} ${c}`}
        transform="rotate(-90 22 22)"
      />
      <text x="22" y="25" textAnchor="middle">
        {score}
      </text>
    </svg>
  );
}

function CreditCard({ deal }: { deal: CrmOpportunity }) {
  return (
    <article className="crm-deal">
      <div className="crm-deal__top">
        <ScoreRing score={deal.score} />
        <div>
          <strong>{deal.title}</strong>
          <span>{deal.client}</span>
        </div>
      </div>
      <div className="crm-deal__meta">
        <em>{deal.product}</em>
        <small>
          {moneyMxn(deal.amount)} · {deal.termMonths}m · {deal.rate}%
        </small>
      </div>
      <div className="crm-deal__foot">
        <span className={riskClass(deal.risk)}>{RISK_LABEL[deal.risk]}</span>
        <small>{deal.owner}</small>
      </div>
    </article>
  );
}

export function CrmPipelineScreen() {
  const openDeals = CRM_OPPORTUNITIES.filter((item) => OPEN_STAGES.includes(item.stage));
  const pipelineValue = openDeals.reduce((sum, item) => sum + item.amount, 0);
  const formalized = CRM_OPPORTUNITIES.filter((item) => item.stage === "ganada");
  const qualifiedLeads = CRM_LEADS.filter((item) => item.status === "calificado").length;
  const whatsappCampaigns = CRM_CAMPAIGNS.filter((item) => item.channel === "whatsapp" && item.status === "activa");
  const pendingActivities = CRM_ACTIVITIES.filter((item) => item.status === "pendiente");
  const maxFunnel = Math.max(
    ...FUNNEL_STAGES.map((stage) => CRM_OPPORTUNITIES.filter((item) => item.stage === stage).length),
    1,
  );

  return (
    <div className="crm-page">
      <div className="crm-hero">
        <div>
          <p>CRM de crédito · Kumaza</p>
          <CrmPageHeader
            title="Mesa de crédito"
            subtitle="Originación comercial: precalifica, arma expediente, manda a MDC y cierra la oferta."
          />
        </div>
        <AppButton tone="primary">Nueva solicitud de crédito</AppButton>
      </div>

      <div className="crm-kpis">
        <article className="crm-kpi">
          <span>En originación</span>
          <strong>{moneyMxn(pipelineValue)}</strong>
          <small>{openDeals.length} líneas abiertas</small>
        </article>
        <article className="crm-kpi">
          <span>Prospectos vivos</span>
          <strong>{CRM_LEADS.filter((item) => item.status !== "descartado").length}</strong>
          <small>{qualifiedLeads} precalificados</small>
        </article>
        <article className="crm-kpi">
          <span>Formalizado</span>
          <strong>{moneyMxn(formalized.reduce((sum, item) => sum + item.amount, 0))}</strong>
          <small>{formalized.length} líneas colocadas</small>
        </article>
        <article className="crm-kpi">
          <span>WhatsApp originación</span>
          <strong>{whatsappCampaigns.reduce((sum, item) => sum + item.replies, 0)}</strong>
          <small>{pendingActivities.length} seguimientos abiertos</small>
        </article>
      </div>

      <section className="crm-card crm-card--visual">
        <div className="crm-card__head">
          <div>
            <h2>Embudo de crédito</h2>
            <p>De prospecto a formalización. El ancho refleja el volumen en cada etapa.</p>
          </div>
        </div>
        <div className="crm-funnel" aria-hidden>
          {FUNNEL_STAGES.map((stage, index) => {
            const deals = CRM_OPPORTUNITIES.filter((item) => item.stage === stage);
            const amount = deals.reduce((sum, item) => sum + item.amount, 0);
            const width = 42 + (deals.length / maxFunnel) * 58;
            return (
              <div key={stage} className="crm-funnel__row">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div className="crm-funnel__bar" style={{ width: `${width}%` }}>
                  <strong>{OPP_STAGE_LABEL[stage]}</strong>
                  <em>
                    {deals.length} · {moneyMxn(amount)}
                  </em>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="crm-card">
        <div className="crm-card__head">
          <div>
            <h2>Tablero de originación</h2>
            <p>Score, producto, plazo y tasa por etapa. Formalizadas y declinadas salen del tablero activo.</p>
          </div>
        </div>
        <div className="crm-pipeline">
          {OPEN_STAGES.map((stage) => {
            const deals = CRM_OPPORTUNITIES.filter((item) => item.stage === stage);
            return (
              <div key={stage} className="crm-col">
                <h3>
                  {OPP_STAGE_LABEL[stage]} · {deals.length}
                </h3>
                {deals.map((deal) => (
                  <CreditCard key={deal.id} deal={deal} />
                ))}
              </div>
            );
          })}
        </div>
      </section>

      <section className="crm-card">
        <div className="crm-card__head">
          <div>
            <h2>Seguimiento crediticio</h2>
            <p>Expedientes, ofertas y validaciones pendientes del equipo comercial.</p>
          </div>
        </div>
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Actividad</th>
                <th>Acreditado</th>
                <th>Tipo</th>
                <th>Oficial</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {pendingActivities.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.relatedTo}</td>
                  <td>
                    <span className="crm-badge crm-badge--info">{item.type}</span>
                  </td>
                  <td>{item.owner}</td>
                  <td>{formatWhen(item.dueAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
