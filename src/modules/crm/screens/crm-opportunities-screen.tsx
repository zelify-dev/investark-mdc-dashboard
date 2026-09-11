"use client";

import { useMemo, useState } from "react";

import { CrmPageHeader } from "@/modules/crm/components/crm-page-header";
import { CRM_OPPORTUNITIES, OPP_STAGE_LABEL, moneyMxn, type CrmOpportunityStage } from "@/modules/crm/data/crm.seed";

import "./crm-workspace.css";

function stageTone(stage: CrmOpportunityStage) {
  if (stage === "ganada") return "crm-badge crm-badge--ok";
  if (stage === "perdida") return "crm-badge crm-badge--bad";
  if (stage === "negociacion") return "crm-badge crm-badge--info";
  return "crm-badge crm-badge--warn";
}

export function CrmOpportunitiesScreen() {
  const [stage, setStage] = useState<CrmOpportunityStage | "all">("all");
  const rows = useMemo(
    () => CRM_OPPORTUNITIES.filter((item) => stage === "all" || item.stage === stage),
    [stage],
  );
  const weighted = rows.reduce((sum, item) => sum + item.amount * (item.probability / 100), 0);

  return (
    <div className="crm-page">
      <CrmPageHeader
        title="Líneas y ofertas"
        subtitle="Solicitudes de crédito con score, tasa, plazo y probabilidad de formalización."
      />

      <div className="crm-kpis">
        <article className="crm-kpi">
          <span>Líneas</span>
          <strong>{rows.length}</strong>
        </article>
        <article className="crm-kpi">
          <span>Monto solicitado</span>
          <strong>{moneyMxn(rows.reduce((sum, item) => sum + item.amount, 0))}</strong>
        </article>
        <article className="crm-kpi">
          <span>Valor ponderado</span>
          <strong>{moneyMxn(weighted)}</strong>
        </article>
        <article className="crm-kpi">
          <span>Formalizadas</span>
          <strong>{CRM_OPPORTUNITIES.filter((item) => item.stage === "ganada").length}</strong>
        </article>
      </div>

      <section className="crm-card">
        <div className="crm-card__head">
          <div>
            <h2>Libro de crédito</h2>
            <p>Filtra por etapa de originación.</p>
          </div>
          <div className="crm-filters">
            <label>
              Etapa
              <select value={stage} onChange={(event) => setStage(event.target.value as CrmOpportunityStage | "all")}>
                <option value="all">Todas</option>
                {Object.entries(OPP_STAGE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Línea</th>
                <th>Acreditado</th>
                <th>Producto</th>
                <th>Etapa</th>
                <th>Monto</th>
                <th>Plazo / tasa</th>
                <th>Score</th>
                <th>Prob.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.title}
                    <div style={{ color: "#64748b", fontSize: 12 }}>{item.id}</div>
                  </td>
                  <td>{item.client}</td>
                  <td>{item.product}</td>
                  <td>
                    <span className={stageTone(item.stage)}>{OPP_STAGE_LABEL[item.stage]}</span>
                  </td>
                  <td>{moneyMxn(item.amount)}</td>
                  <td>
                    {item.termMonths}m · {item.rate}%
                  </td>
                  <td>{item.score}</td>
                  <td>{item.probability}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
