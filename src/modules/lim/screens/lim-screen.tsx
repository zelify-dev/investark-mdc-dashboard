"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import {
  ScotiaDemoSection,
  ScotiaDemoTourHost,
  isScotiaDemoTab,
  useScotiaDemoMode,
  type CreditProductCategory,
  type ScotiaDemoTab,
} from "@/modules/lim/components/lim-scotiabank-demo";
import { CATEGORY_SHORT_LABELS } from "@/modules/cortex/data/credit-catalog";
import {
  LCC_EXPECTED_30D_BASE,
  LCC_FLOW_30D_BASE,
  LCC_INVEST_BASE,
  LCC_LEGACY_BASE_CASH_MXN,
  LCC_LIQUIDITY_RESERVE_BASE_MXN,
  LCC_MONTHLY_INFLOW_BASE_MXN,
  LCC_MONTHLY_OUTFLOW_BASE_MXN,
  scaleToPortfolio,
} from "@/modules/scotia/constants/lcc-demo.constants";
import { readMdcLccSnapshot, type MdcLccSnapshot } from "@/modules/mdc/data/mdc-lcc-bridge";
import { formatMxnCompact, formatMxnFull } from "@/modules/scotia/utils/format-mxn";
import "@/components/ui/templates/workspace-page.css";
import "./lim-screen.css";

type MainTab = ScotiaDemoTab | "cashflow" | "expected" | "financing" | "dashboard";
type ScenarioId = "real" | "optimista" | "pesimista";
type ScenarioOverlayId = "optimista" | "pesimista";
type ViewMode = "mensual" | "trimestral" | "semestral" | "anual";

const MONTHS = ["May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic", "Ene", "Feb", "Mar", "Abr"];

type MonthRow = {
  label: string;
  balanceStart: number;
  inflow: number;
  inflowAR: number;
  inflowServices: number;
  inflowOther: number;
  outflow: number;
  outflowSuppliers: number;
  outflowPayroll: number;
  balanceEnd: number;
};

function buildRows(
  scenario: ScenarioId,
  portfolioBalanceMxn: number,
  inflowBaseMxn: number,
  outflowBaseMxn: number,
): MonthRow[] {
  const annualGrowth =
    scenario === "optimista" ? 0.25 : scenario === "pesimista" ? -0.4 : 0.03;
  const growth = Math.pow(1 + annualGrowth, 1 / 12) - 1;

  const base = portfolioBalanceMxn > 0 ? portfolioBalanceMxn : LCC_LEGACY_BASE_CASH_MXN;
  let inflow = inflowBaseMxn > 0 ? inflowBaseMxn : scaleToPortfolio(LCC_MONTHLY_INFLOW_BASE_MXN, base);
  let outflow = outflowBaseMxn > 0 ? outflowBaseMxn : scaleToPortfolio(LCC_MONTHLY_OUTFLOW_BASE_MXN, base);
  let bal = base;
  const rows: MonthRow[] = [];

  for (let i = 0; i < MONTHS.length; i++) {
    if (i > 0) {
      inflow *= 1 + growth;
      outflow *= 1 + growth * 0.65;
    }
    const inf = Math.round(inflow);
    const out = Math.round(outflow);
    const end = bal + inf - out;
    rows.push({
      label: MONTHS[i],
      balanceStart: Math.round(bal),
      inflow: inf,
      inflowAR: Math.round(inf * 0.63),
      inflowServices: Math.round(inf * 0.25),
      inflowOther: Math.round(inf * 0.12),
      outflow: out,
      outflowSuppliers: Math.round(out * 0.71),
      outflowPayroll: Math.round(out * 0.29),
      balanceEnd: Math.round(end),
    });
    bal = end;
  }
  return rows;
}

function aggregateRows(rows: MonthRow[], viewMode: ViewMode): MonthRow[] {
  if (viewMode === "mensual") return rows;

  const size = viewMode === "trimestral" ? 3 : viewMode === "semestral" ? 6 : rows.length;
  const out: MonthRow[] = [];

  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    if (chunk.length === 0) continue;
    const first = chunk[0];
    const last = chunk[chunk.length - 1];

    out.push({
      label: viewMode === "anual" ? "Anual" : `${first.label}-${last.label}`,
      balanceStart: first.balanceStart,
      inflow: chunk.reduce((s, r) => s + r.inflow, 0),
      inflowAR: chunk.reduce((s, r) => s + r.inflowAR, 0),
      inflowServices: chunk.reduce((s, r) => s + r.inflowServices, 0),
      inflowOther: chunk.reduce((s, r) => s + r.inflowOther, 0),
      outflow: chunk.reduce((s, r) => s + r.outflow, 0),
      outflowSuppliers: chunk.reduce((s, r) => s + r.outflowSuppliers, 0),
      outflowPayroll: chunk.reduce((s, r) => s + r.outflowPayroll, 0),
      balanceEnd: last.balanceEnd,
    });
  }

  return out;
}

/* ─── SVG Cashflow Chart — siempre muestra Real + escenarios seleccionados ─── */
function CashflowChart({
  realRows,
  optimistaRows,
  pessimistaRows,
  activeMonth,
  scenario,
  showOptimista,
  showPesimista,
}: {
  realRows: MonthRow[];
  optimistaRows: MonthRow[];
  pessimistaRows: MonthRow[];
  activeMonth: number;
  scenario: ScenarioId;
  showOptimista: boolean;
  showPesimista: boolean;
}) {
  const W = 860, H = 500, PL = 62, PR = 12, PT = 40, PB = 46;
  const cW = W - PL - PR;
  const cH = H - PT - PB;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Barras siempre animadas hacia el escenario activo
  const targetRows =
    scenario === "optimista" ? optimistaRows
      : scenario === "pesimista" ? pessimistaRows
        : realRows;

  const [animRows, setAnimRows] = useState<MonthRow[]>(realRows);
  const fromRef = useRef<MonthRow[]>(realRows);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = targetRows;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const START = performance.now();
    const DUR = 620;
    const LAG = 36; // ms por barra (ola izq→der)
    const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const tick = (now: number) => {
      const el = now - START;
      setAnimRows(from.map((f, i) => {
        const t = ease(Math.min(Math.max(el - i * LAG, 0) / DUR, 1));
        return {
          ...to[i],
          inflow: Math.round(f.inflow + (to[i].inflow - f.inflow) * t),
          outflow: Math.round(f.outflow + (to[i].outflow - f.outflow) * t),
          balanceEnd: Math.round(f.balanceEnd + (to[i].balanceEnd - f.balanceEnd) * t),
          balanceStart: Math.round(f.balanceStart + (to[i].balanceStart - f.balanceStart) * t),
        };
      }));
      if (el < DUR + (from.length - 1) * LAG) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setAnimRows(to);
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [targetRows]);

  // Escala Y: máximo global entre los 3 escenarios para que las líneas sean comparables
  const max = Math.max(
    ...optimistaRows.map((r) => r.balanceEnd),
    ...pessimistaRows.map((r) => r.balanceEnd),
    ...realRows.map((r) => Math.max(r.inflow, r.balanceEnd)),
    1,
  );
  const ys = (v: number) => PT + cH - (Math.max(v, 0) / max) * cH;
  const slotW = cW / realRows.length;
  const bW = slotW * 0.30;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => max * f);

  const pts = (rows: MonthRow[]) =>
    rows.map((r, i) => `${PL + i * slotW + slotW / 2},${ys(r.balanceEnd)}`).join(" ");

  const realPts = pts(realRows);
  const optPts = pts(optimistaRows);
  const pesPts = pts(pessimistaRows);
  const tooltipIndex = hoveredIndex;
  const tooltipRow = tooltipIndex !== null ? realRows[tooltipIndex] : null;
  const tooltipReal = tooltipIndex !== null ? realRows[tooltipIndex].balanceEnd : 0;
  const tooltipOpt = tooltipIndex !== null ? optimistaRows[tooltipIndex].balanceEnd : 0;
  const tooltipPes = tooltipIndex !== null ? pessimistaRows[tooltipIndex].balanceEnd : 0;
  const tooltipXBase = tooltipIndex !== null ? PL + tooltipIndex * slotW + slotW / 2 : 0;
  const tooltipRows = [
    { label: "Real", value: tooltipReal, color: "#1d4ed8" },
    ...(showOptimista ? [{ label: "Optimista", value: tooltipOpt, color: "#059669" }] : []),
    ...(showPesimista ? [{ label: "Pesimista", value: tooltipPes, color: "#dc2626" }] : []),
  ];
  const tooltipW = 246;
  const tooltipH = 46 + tooltipRows.length * 22;
  const tooltipX = Math.max(PL, Math.min(tooltipXBase - tooltipW / 2, W - PR - tooltipW));
  const tooltipY = PT + 8;

  // Colores de barras del escenario activo
  const iColor = scenario === "optimista" ? "#10b981" : scenario === "pesimista" ? "#f59e0b" : "#3b82f6";
  const oColor = scenario === "optimista" ? "#34d399" : scenario === "pesimista" ? "#ef4444" : "#6366f1";
  const activeBg = scenario === "optimista" ? "#f0fdf4" : scenario === "pesimista" ? "#fef2f2" : "#eff6ff";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="lim-chart-svg" aria-hidden onMouseLeave={() => setHoveredIndex(null)}>
      <defs>
        <filter id="lim-cashflow-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0f172a" floodOpacity="0.14" />
        </filter>
        <linearGradient id="lim-tooltip-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f9fafb" />
        </linearGradient>
        <filter id="lim-tooltip-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#020617" floodOpacity="0.35" />
        </filter>
      </defs>
      {/* Leyenda en la parte superior */}
      <g transform={`translate(${PL}, 10)`}>
        <rect width={9} height={9} fill="#86efac" rx={1} />
        <text x={12} y={9} fontSize={9} fill="#6b7280">Entradas</text>
        <rect x={65} width={9} height={9} fill="#fca5a5" rx={1} />
        <text x={77} y={9} fontSize={9} fill="#6b7280">Salidas</text>
        {/* Línea Real */}
        <line x1={135} y1={4} x2={155} y2={4} stroke="#1d4ed8" strokeWidth={scenario === "real" ? 2.5 : 1.5} strokeDasharray="5 3" />
        <circle cx={145} cy={4} r={2.5} fill="#1d4ed8" />
        <text x={158} y={8} fontSize={9} fill="#1d4ed8" fontWeight={scenario === "real" ? "700" : "400"}>Real</text>
        {/* Línea Optimista */}
        <line x1={190} y1={4} x2={210} y2={4} stroke="#059669" strokeWidth={scenario === "optimista" ? 2.5 : 1.5} strokeDasharray="5 3" opacity={showOptimista ? 1 : 0.25} />
        <circle cx={200} cy={4} r={2.5} fill="#059669" />
        <text x={213} y={8} fontSize={9} fill="#059669" fontWeight={scenario === "optimista" ? "700" : "400"} opacity={showOptimista ? 1 : 0.35}>Optimista</text>
        {/* Línea Pesimista */}
        <line x1={268} y1={4} x2={288} y2={4} stroke="#dc2626" strokeWidth={scenario === "pesimista" ? 2.5 : 1.5} strokeDasharray="5 3" opacity={showPesimista ? 1 : 0.25} />
        <circle cx={278} cy={4} r={2.5} fill="#dc2626" />
        <text x={291} y={8} fontSize={9} fill="#dc2626" fontWeight={scenario === "pesimista" ? "700" : "400"} opacity={showPesimista ? 1 : 0.35}>Pesimista</text>
      </g>

      {/* Grid Y */}
      {yTicks.map((v) => (
        <g key={v}>
          <line x1={PL} y1={ys(v)} x2={W - PR} y2={ys(v)} stroke="#f3f4f6" strokeWidth={1} />
          <text x={PL - 6} y={ys(v) + 4} textAnchor="end" className="lim-chart-lbl">
            {v === 0 ? "0" : formatMxnCompact(v)}
          </text>
        </g>
      ))}

      {/* Fondo mes activo */}
      <rect x={PL + activeMonth * slotW} y={PT} width={slotW} height={cH} fill={activeBg} opacity={0.9} />

      {/* Barras — siempre el escenario seleccionado con animación ola */}
      {animRows.map((r, i) => {
        const cx = PL + i * slotW + slotW / 2;
        const iH = Math.max((r.inflow / max) * cH, 0);
        const oH = Math.max((r.outflow / max) * cH, 0);
        return (
          <g key={r.label}>
            <rect x={cx - bW - 1} y={PT + cH - iH} width={bW} height={iH} fill={iColor} rx={3} opacity={0.92} filter="url(#lim-cashflow-shadow)" />
            <rect x={cx + 1} y={PT + cH - oH} width={bW} height={oH} fill={oColor} rx={3} opacity={0.92} filter="url(#lim-cashflow-shadow)" />
          </g>
        );
      })}

      {/* ── Las 3 líneas de saldo siempre visibles ── */}

      {/* Pesimista — rojo */}
      {showPesimista && (
        <>
          <polyline
            points={pesPts}
            fill="none"
            stroke="#dc2626"
            strokeWidth={scenario === "pesimista" ? 2.5 : 1.2}
            strokeDasharray="5 3"
            strokeLinecap="round"
            opacity={scenario === "pesimista" ? 1 : 0.45}
          />
          {pessimistaRows.map((r, i) => (
            <g key={i}>
              <circle
                cx={PL + i * slotW + slotW / 2}
                cy={ys(r.balanceEnd)}
                r={scenario === "pesimista" ? 3.5 : 2}
                fill="#dc2626"
                opacity={scenario === "pesimista" ? 1 : 0.4}
              />
              <circle
                cx={PL + i * slotW + slotW / 2}
                cy={ys(r.balanceEnd)}
                r={10}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <title>{`Pesimista · ${r.label}: ${formatMxnFull(r.balanceEnd)}`}</title>
              </circle>
            </g>
          ))}
        </>
      )}

      {/* Real — azul (siempre visible, siempre en primer plano si está activo) */}
      <polyline
        points={realPts}
        fill="none"
        stroke="#1d4ed8"
        strokeWidth={scenario === "real" ? 2.5 : 1.5}
        strokeDasharray="5 3"
        strokeLinecap="round"
        opacity={scenario === "real" ? 1 : 0.55}
      />
      {realRows.map((r, i) => (
        <g key={i}>
          <circle
            cx={PL + i * slotW + slotW / 2}
            cy={ys(r.balanceEnd)}
            r={scenario === "real" ? 3.5 : 2.5}
            fill="#1d4ed8"
            opacity={scenario === "real" ? 1 : 0.55}
          />
          <circle
            cx={PL + i * slotW + slotW / 2}
            cy={ys(r.balanceEnd)}
            r={10}
            fill="transparent"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        </g>
      ))}

      {/* Optimista — verde */}
      {showOptimista && (
        <>
          <polyline
            points={optPts}
            fill="none"
            stroke="#059669"
            strokeWidth={scenario === "optimista" ? 2.5 : 1.2}
            strokeDasharray="5 3"
            strokeLinecap="round"
            opacity={scenario === "optimista" ? 1 : 0.45}
          />
          {optimistaRows.map((r, i) => (
            <g key={i}>
              <circle
                cx={PL + i * slotW + slotW / 2}
                cy={ys(r.balanceEnd)}
                r={scenario === "optimista" ? 3.5 : 2}
                fill="#059669"
                opacity={scenario === "optimista" ? 1 : 0.4}
              />
              <circle
                cx={PL + i * slotW + slotW / 2}
                cy={ys(r.balanceEnd)}
                r={10}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <title>{`Optimista · ${r.label}: ${formatMxnFull(r.balanceEnd)}`}</title>
              </circle>
            </g>
          ))}
        </>
      )}

      {/* Etiquetas X */}
      {realRows.map((r, i) => (
        <text
          key={i}
          x={PL + i * slotW + slotW / 2}
          y={H - 6}
          textAnchor="middle"
          className={`lim-chart-lbl${i === activeMonth ? " lim-chart-lbl--active" : ""}`}
        >
          {r.label.toUpperCase()}
        </text>
      ))}

      {/* Tooltip saldo por mes */}
      {tooltipRow && (
        <g pointerEvents="none">
          <rect
            x={tooltipX}
            y={tooltipY}
            width={tooltipW}
            height={tooltipH}
            rx={12}
            fill="url(#lim-tooltip-bg)"
            stroke="#e5e2d8"
            strokeWidth={1}
            filter="url(#lim-tooltip-shadow)"
          />
          <text x={tooltipX + 14} y={tooltipY + 18} fontSize={10} fill="#475569" fontWeight="700">
            {tooltipRow.label.toUpperCase()} · SALDO
          </text>
          <line x1={tooltipX + 12} y1={tooltipY + 24} x2={tooltipX + tooltipW - 12} y2={tooltipY + 24} stroke="#e7e5dd" />
          {tooltipRows.map((row, i) => {
            const y = tooltipY + 40 + i * 22;
            return (
              <g key={row.label}>
                <circle cx={tooltipX + 16} cy={y - 4} r={4} fill={row.color} />
                <text x={tooltipX + 26} y={y} fontSize={11} fill={row.color} fontWeight="600">{row.label}</text>
                <text x={tooltipX + tooltipW - 12} y={y} fontSize={11} fill="#1f2937" textAnchor="end" fontWeight="700">
                  {formatMxnFull(row.value)}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}

function IncomeUseChart({
  suppliers,
  payroll,
  net,
  centerLabel = "Uso del ingreso",
  centerSubLabel = "Mes activo",
}: {
  suppliers: number;
  payroll: number;
  net: number;
  centerLabel?: string;
  centerSubLabel?: string;
}) {
  const W = 980, H = 320;
  const cx = 260, cy = 160, ro = 112, ri = 62;
  const positiveNet = Math.max(net, 0);
  const data = [
    { label: "Proveedores", value: Math.max(suppliers, 0), color: "#3b82f6" },
    { label: "Nómina", value: Math.max(payroll, 0), color: "#6366f1" },
    { label: "Flujo neto", value: positiveNet, color: "#10b981" },
  ];
  const total = Math.max(data.reduce((s, d) => s + d.value, 0), 1);
  const rad = (deg: number) => (deg * Math.PI) / 180;

  let angle = -90;
  const arcs = data.map((d) => {
    const start = angle;
    angle += (d.value / total) * 360;
    return { ...d, start, end: angle, pct: (d.value / total) * 100 };
  });

  const path = (start: number, end: number) => {
    const gap = 1.2;
    const s = start + gap;
    const e = end - gap;
    if (e <= s) return "";
    const large = e - s > 180 ? 1 : 0;
    const x1 = cx + ro * Math.cos(rad(s));
    const y1 = cy + ro * Math.sin(rad(s));
    const x2 = cx + ro * Math.cos(rad(e));
    const y2 = cy + ro * Math.sin(rad(e));
    const xi1 = cx + ri * Math.cos(rad(e));
    const yi1 = cy + ri * Math.sin(rad(e));
    const xi2 = cx + ri * Math.cos(rad(s));
    const yi2 = cy + ri * Math.sin(rad(s));
    return `M${x1},${y1} A${ro},${ro} 0 ${large} 1 ${x2},${y2} L${xi1},${yi1} A${ri},${ri} 0 ${large} 0 ${xi2},${yi2} Z`;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="lim-income-use-svg" aria-hidden>
      <defs>
        <filter id="lim-donut-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#111827" floodOpacity="0.18" />
        </filter>
      </defs>

      <circle cx={cx} cy={cy} r={ro + 8} fill="#f8fafc" />
      {arcs.map((a) => (
        <path key={a.label} d={path(a.start, a.end)} fill={a.color} filter="url(#lim-donut-shadow)" />
      ))}
      <circle cx={cx} cy={cy} r={ri - 3} fill="#ffffff" />

      <text x={cx} y={146} textAnchor="middle" fontSize={11} fill="#6b7280">{centerLabel}</text>
      <text x={cx} y={166} textAnchor="middle" fontSize={18} fill="#0f172a" fontWeight="700">{formatMxnFull(total)}</text>
      <text x={cx} y={184} textAnchor="middle" fontSize={10} fill="#94a3b8">{centerSubLabel}</text>

      <g transform="translate(520,78)">
        {arcs.map((a, i) => (
          <g key={a.label} transform={`translate(0, ${i * 46})`}>
            <rect width={300} height={34} rx={8} fill="#f8fafc" stroke="#e5e7eb" />
            <rect x={10} y={10} width={12} height={12} rx={3} fill={a.color} />
            <text x={30} y={22} fontSize={13} fill="#334155" fontWeight="600">{a.label}</text>
            <text x={232} y={22} fontSize={13} fill="#0f172a" textAnchor="end" fontWeight="700">{formatMxnFull(a.value)}</text>
            <text x={288} y={22} fontSize={12} fill="#64748b" textAnchor="end">{a.pct.toFixed(1)}%</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ─── Main Screen ─── */
export function LimScreen() {
  const scotia = useScotiaDemoMode();
  const [activeTab, setActiveTab] = useState<MainTab>("dashboard");
  const [legacyTab, setLegacyTab] = useState<Extract<MainTab, "cashflow" | "expected" | "financing" | "dashboard">>("dashboard");
  const isScotiaTab = isScotiaDemoTab(activeTab);
  const isCreditTab = false;
  const effectiveLegacyTab = isScotiaTab ? legacyTab : activeTab;
  const [scenarioFilters, setScenarioFilters] = useState<Set<ScenarioOverlayId>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("mensual");
  const [activeMonth, setActiveMonth] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["inflow", "outflow"]));
  const [mdcSnapshot, setMdcSnapshot] = useState<MdcLccSnapshot>(() => readMdcLccSnapshot());

  useEffect(() => {
    const refresh = () => setMdcSnapshot(readMdcLccSnapshot());
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  // Saldo cartera LIM · base del Cashflow y módulos legacy
  const limPortfolioBalanceMxn = scotia.limStore.hydrated
    ? scotia.limStore.treasury.totalBalance
    : LCC_LEGACY_BASE_CASH_MXN;
  const portfolioBalanceMxn =
    !isScotiaTab && mdcSnapshot.portfolioBalanceMxn > 0 ? mdcSnapshot.portfolioBalanceMxn : limPortfolioBalanceMxn;
  const baseMonthlyInflowMxn =
    !isScotiaTab && mdcSnapshot.monthlyInflowBaseMxn > 0
      ? mdcSnapshot.monthlyInflowBaseMxn
      : scaleToPortfolio(LCC_MONTHLY_INFLOW_BASE_MXN, portfolioBalanceMxn);
  const baseMonthlyOutflowMxn =
    !isScotiaTab && mdcSnapshot.monthlyOutflowBaseMxn > 0
      ? mdcSnapshot.monthlyOutflowBaseMxn
      : scaleToPortfolio(LCC_MONTHLY_OUTFLOW_BASE_MXN, portfolioBalanceMxn);

  const liquidityReserveRatio =
    portfolioBalanceMxn > 0
      ? Math.max(
          !isScotiaTab && mdcSnapshot.liquidityReserveBaseMxn > 0
            ? mdcSnapshot.liquidityReserveBaseMxn / portfolioBalanceMxn
            : scaleToPortfolio(LCC_LIQUIDITY_RESERVE_BASE_MXN, portfolioBalanceMxn) / portfolioBalanceMxn,
          0.05,
        )
      : LCC_LIQUIDITY_RESERVE_BASE_MXN / LCC_LEGACY_BASE_CASH_MXN;

  // Los 3 escenarios siempre calculados para el chart multi-línea
  const realRowsBase = useMemo(
    () => buildRows("real", portfolioBalanceMxn, baseMonthlyInflowMxn, baseMonthlyOutflowMxn),
    [portfolioBalanceMxn, baseMonthlyInflowMxn, baseMonthlyOutflowMxn],
  );
  const optimistaRowsBase = useMemo(
    () => buildRows("optimista", portfolioBalanceMxn, baseMonthlyInflowMxn, baseMonthlyOutflowMxn),
    [portfolioBalanceMxn, baseMonthlyInflowMxn, baseMonthlyOutflowMxn],
  );
  const pessimistaRowsBase = useMemo(
    () => buildRows("pesimista", portfolioBalanceMxn, baseMonthlyInflowMxn, baseMonthlyOutflowMxn),
    [portfolioBalanceMxn, baseMonthlyInflowMxn, baseMonthlyOutflowMxn],
  );

  const realRows = useMemo(() => aggregateRows(realRowsBase, viewMode), [realRowsBase, viewMode]);
  const optimistaRows = useMemo(() => aggregateRows(optimistaRowsBase, viewMode), [optimistaRowsBase, viewMode]);
  const pessimistaRows = useMemo(() => aggregateRows(pessimistaRowsBase, viewMode), [pessimistaRowsBase, viewMode]);

  // Para la tabla, el escenario seleccionado
  const showOptimista = scenarioFilters.has("optimista");
  const showPesimista = scenarioFilters.has("pesimista");
  const scenario: ScenarioId =
    showOptimista && !showPesimista ? "optimista"
      : showPesimista && !showOptimista ? "pesimista"
        : "real";

  const rows = scenario === "optimista" ? optimistaRows
    : scenario === "pesimista" ? pessimistaRows
      : realRows;
  const safeActiveMonth = Math.min(activeMonth, Math.max(rows.length - 1, 0));

  const totals = useMemo(() => {
    const totalInflow = rows.reduce((s, r) => s + r.inflow, 0);
    const totalOutflow = rows.reduce((s, r) => s + r.outflow, 0);
    return {
      totalInflow,
      totalOutflow,
      balance: rows[rows.length - 1].balanceEnd,
    };
  }, [rows]);

  const liquidityImmediate = Math.round((rows[0]?.balanceStart ?? portfolioBalanceMxn) * liquidityReserveRatio);
  const investmentScenarioFactor =
    scenario === "optimista" ? 1.1
      : scenario === "pesimista" ? 0.72
        : 1;
  const investMoneyMarket6m = Math.round(
    scaleToPortfolio(LCC_INVEST_BASE.moneyMarket6m, portfolioBalanceMxn) * investmentScenarioFactor,
  );
  const investFondo3m = Math.round(
    scaleToPortfolio(LCC_INVEST_BASE.fondo3m, portfolioBalanceMxn) * investmentScenarioFactor,
  );
  const investCete90d = Math.round(
    scaleToPortfolio(LCC_INVEST_BASE.cete90d, portfolioBalanceMxn) * investmentScenarioFactor,
  );
  const investCete28d = Math.round(
    scaleToPortfolio(LCC_INVEST_BASE.cete28d, portfolioBalanceMxn) * investmentScenarioFactor,
  );
  const investRepo1d = Math.round(
    scaleToPortfolio(LCC_INVEST_BASE.repo1d, portfolioBalanceMxn) * investmentScenarioFactor,
  );
  const investedTotalBase = investMoneyMarket6m + investFondo3m + investCete90d + investCete28d + investRepo1d;
  const investmentMonthlyDrift =
    scenario === "optimista" ? 0.005
      : scenario === "pesimista" ? -0.015
        : 0.002;
  const investedTotalSeries = rows.map((_, i) =>
    Math.max(Math.round(investedTotalBase * Math.pow(1 + investmentMonthlyDrift, i)), 0)
  );
  const investedTotalCurrent = investedTotalSeries[safeActiveMonth] ?? investedTotalBase;

  const bucket1d = Math.round(investRepo1d * (investedTotalCurrent / Math.max(investedTotalBase, 1)));
  const bucket30d = Math.round(investCete28d * (investedTotalCurrent / Math.max(investedTotalBase, 1)));
  const bucket90d = Math.round(investCete90d * (investedTotalCurrent / Math.max(investedTotalBase, 1)));

  const projectedOutflows30d = scaleToPortfolio(LCC_FLOW_30D_BASE.projectedOutflows, portfolioBalanceMxn);
  const recognizedInflows30d = scaleToPortfolio(LCC_FLOW_30D_BASE.recognizedInflows, portfolioBalanceMxn);
  const currentLiabilities = scaleToPortfolio(LCC_FLOW_30D_BASE.currentLiabilities, portfolioBalanceMxn);

  const avgMonthlyInflow = Math.round(totals.totalInflow / rows.length);
  const avgMonthlyOutflow = Math.round(totals.totalOutflow / rows.length);
  const monthlyNetCashflow = avgMonthlyInflow - avgMonthlyOutflow;
  const activeRow = rows[safeActiveMonth] ?? rows[0];
  const activeMonthSuppliers = activeRow?.outflowSuppliers ?? 0;
  const activeMonthPayroll = activeRow?.outflowPayroll ?? 0;
  const activeMonthNetCashflow = activeRow ? activeRow.inflow - activeRow.outflow : 0;
  const scenarioLiquidityImmediate = Math.max(
    liquidityImmediate + Math.round(monthlyNetCashflow * 0.3),
    scaleToPortfolio(100_000, portfolioBalanceMxn),
  );
  const totalLiquidAssetsCurrent = scenarioLiquidityImmediate + investedTotalCurrent;

  const expectedInflows30d =
    !isScotiaTab && mdcSnapshot.expectedInflows30dMxn > 0
      ? mdcSnapshot.expectedInflows30dMxn
      : scaleToPortfolio(LCC_EXPECTED_30D_BASE.inflows, portfolioBalanceMxn);
  const expectedOutflows30d =
    !isScotiaTab && mdcSnapshot.expectedOutflows30dMxn > 0
      ? mdcSnapshot.expectedOutflows30dMxn
      : scaleToPortfolio(LCC_EXPECTED_30D_BASE.outflows, portfolioBalanceMxn);
  const expectedNetGap30d = expectedInflows30d - expectedOutflows30d;

  const expectedFlowItems = useMemo(
    () =>
      [
        { c: "Cobros clientes A/R", t: "Entrada", m: scaleToPortfolio(890_000, portfolioBalanceMxn), e: "Confirmado" },
        { c: "Nómina quincenal", t: "Salida", m: scaleToPortfolio(240_000, portfolioBalanceMxn), e: "Pendiente" },
        { c: "Pago proveedores", t: "Salida", m: scaleToPortfolio(610_000, portfolioBalanceMxn), e: "Estimado" },
        { c: "Vencimiento CDT", t: "Entrada", m: scaleToPortfolio(450_000, portfolioBalanceMxn), e: "Confirmado" },
        { c: "Impuestos ISR", t: "Salida", m: scaleToPortfolio(180_000, portfolioBalanceMxn), e: "Pendiente" },
      ] as const,
    [portfolioBalanceMxn],
  );

  const repoRenewalHint = formatMxnFull(scaleToPortfolio(190_000, portfolioBalanceMxn));
  const creditLineHint = formatMxnFull(scaleToPortfolio(2_000_000, portfolioBalanceMxn));
  const eomFloorHint = formatMxnFull(scaleToPortfolio(1_200_000, portfolioBalanceMxn));

  const outflowStress =
    scenario === "optimista" ? 0.94
      : scenario === "pesimista" ? 1.18
        : 1;
  const inflowRecognitionStress =
    scenario === "optimista" ? 1.1
      : scenario === "pesimista" ? 0.82
        : 1;
  const hqlaStress =
    scenario === "optimista" ? 1.08
      : scenario === "pesimista" ? 0.82
        : 1;

  const scenarioOutflows30d = Math.round(projectedOutflows30d * outflowStress);
  const scenarioRecognizedInflows30d = Math.round(recognizedInflows30d * inflowRecognitionStress);
  const scenarioNetOutflows30d = Math.max(scenarioOutflows30d - scenarioRecognizedInflows30d, 1);
  const scenarioHqlaBase = scenarioLiquidityImmediate + investCete90d + investCete28d;
  const scenarioHqla = Math.round(scenarioHqlaBase * hqlaStress);
  const scenarioLcr = scenarioHqla / scenarioNetOutflows30d;
  const scenarioCurrentLiabilities =
    scenario === "optimista" ? Math.round(currentLiabilities * 0.95)
      : scenario === "pesimista" ? Math.round(currentLiabilities * 1.12)
        : currentLiabilities;
  const scenarioCashEquivalents = scenarioLiquidityImmediate + bucket1d + bucket30d;
  const scenarioCashRatio = scenarioCashEquivalents / scenarioCurrentLiabilities;

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  const chartAnimKey = `${viewMode}-${showOptimista ? "1" : "0"}-${showPesimista ? "1" : "0"}`;

  const scenarioLabel =
    showOptimista && showPesimista ? "Escenarios activos: Optimista +25% anual y Pesimista -40% anual"
      : scenario === "optimista" ? "Escenario optimista +25% anual"
        : scenario === "pesimista" ? "Escenario pesimista -40% anual"
          : "Escenario real";

  const scenarioSelectLabel =
    showOptimista && showPesimista ? "Real + Optimista + Pesimista"
      : showOptimista ? "Real + Optimista"
        : showPesimista ? "Real + Pesimista"
          : "Real";

  const kpiValCls =
    scenario === "optimista" ? "lim-kpi-val--opt"
      : scenario === "pesimista" ? "lim-kpi-val--pes"
        : "lim-kpi-val--blue";

  const TABS: { id: MainTab; label: string; badge?: string }[] = [
    { id: "dashboard", label: "LCC Dashboard" },
    { id: "cashflow", label: "Cashflow" },
    { id: "expected", label: "Flujo Esperado" },
    { id: "financing", label: "Financiamiento" },
  ];

  const handleTabClick = (tab: MainTab) => {
    if (tab === "pricing" || tab === "tesoreria" || tab === "trazabilidad" || tab === "credito-trazabilidad" || tab === "credito-cotizacion") {
      scotia.setActiveTab("credito-cotizacion");
      setLegacyTab("dashboard");
      setActiveTab("dashboard");
      return;
    }
    if (isScotiaDemoTab(tab)) {
      scotia.setActiveTab(tab);
    } else {
      setLegacyTab(tab);
    }
    setActiveTab(tab);
  };

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <div className="zelify-workspace-page__scroll">
        <div className="lim-root zelify-workspace-page__inner">

          {/* ── Top tab bar ── */}
          <div className="lim-topbar">
            <nav className="lim-tabs" role="tablist">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === t.id}
                  className={`lim-tab${activeTab === t.id ? " lim-tab--active" : ""}${t.badge === "A" || t.badge === "B" ? " lim-tab--scotia" : ""}`}
                  onClick={() => handleTabClick(t.id)}
                >
                  {t.label}
                  {t.badge && (
                    <span className={`lim-tab-badge${t.badge === "A" || t.badge === "B" ? " lim-tab-badge--scotia" : ""}`}>{t.badge}</span>
                  )}
                </button>
              ))}
            </nav>
            <div className="lim-topbar-right">
              {isScotiaTab && (
                <>
                  <button type="button" className="lim-btn-tour" onClick={() => scotia.setTourActive(true)}>
                    Guía de exposición
                  </button>
                  <button type="button" className="lim-btn-ghost lim-btn-sm" onClick={() => scotia.resetAll()}>
                    Reiniciar
                  </button>
                </>
              )}
              <span className={`lim-system-pill${isScotiaTab ? " lim-system-pill--scotia" : ""}`}>
                {isScotiaTab ? "Motor LIM" : "Sistema activo"}
              </span>
            </div>
          </div>

          {isCreditTab && (
            <nav className="lim-credit-subtabs" role="tablist" aria-label="Líneas de crédito">
              {(Object.keys(CATEGORY_SHORT_LABELS) as CreditProductCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={scotia.creditCategory === cat}
                  className={`lim-credit-subtab${scotia.creditCategory === cat ? " lim-credit-subtab--active" : ""}`}
                  onClick={() => scotia.setCreditCategory(cat)}
                >
                  {CATEGORY_SHORT_LABELS[cat]}
                </button>
              ))}
            </nav>
          )}

          {isScotiaTab && (
            <ScotiaDemoSection
              activeTab={activeTab as ScotiaDemoTab}
              creditCategory={scotia.creditCategory}
              selectedClient={scotia.selectedClient}
              onSelectedClientChange={scotia.setSelectedClient}
              limStore={scotia.limStore}
              creditStore={scotia.creditStore}
              onTabChange={(tab) => handleTabClick(tab)}
              enablePricingNavigation={false}
            />
          )}

          <ScotiaDemoTourHost
            active={scotia.tourActive && isScotiaTab}
            onClose={() => scotia.setTourActive(false)}
            onTabChange={(tab) => handleTabClick(tab)}
            onSelectedClientChange={scotia.setSelectedClient}
            limStore={scotia.limStore}
            creditStore={scotia.creditStore}
          />

          {!isScotiaTab && (
            <>
          {/* ── Sub-controls bar (cashflow & expected tabs) ── */}
          {(effectiveLegacyTab === "cashflow" || effectiveLegacyTab === "expected") && (
            <div className="lim-subbar">
              <div className="lim-subbar-left">
                <select className="lim-sel">
                  <option>Todos los proyectos</option>
                </select>
                <select className="lim-sel">
                  <option>Abr → May</option>
                  <option>Ene → Dic</option>
                </select>
                <details className={`lim-scenario-select${scenario === "optimista" ? " lim-scenario-select--opt" : scenario === "pesimista" ? " lim-scenario-select--pes" : ""}`}>
                  <summary className="lim-scenario-select__summary">{scenarioSelectLabel}</summary>
                  <div className="lim-scenario-select__menu">
                    <label className="lim-scenario-select__item">
                      <input type="checkbox" checked readOnly />
                      <span>Real</span>
                    </label>
                    <label className="lim-scenario-select__item">
                      <input
                        type="checkbox"
                        checked={showOptimista}
                        onChange={(e) =>
                          setScenarioFilters((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add("optimista");
                            else next.delete("optimista");
                            return next;
                          })}
                      />
                      <span>Optimista</span>
                    </label>
                    <label className="lim-scenario-select__item">
                      <input
                        type="checkbox"
                        checked={showPesimista}
                        onChange={(e) =>
                          setScenarioFilters((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add("pesimista");
                            else next.delete("pesimista");
                            return next;
                          })}
                      />
                      <span>Pesimista</span>
                    </label>
                  </div>
                </details>
                <select className="lim-sel" value={viewMode} onChange={(e) => setViewMode(e.target.value as ViewMode)}>
                  <option value="mensual">Vista consolidada</option>
                  <option value="trimestral">Vista trimestral</option>
                  <option value="semestral">Vista semestral</option>
                  <option value="anual">Vista anual</option>
                </select>
              </div>
              <div className="lim-subbar-right">
                {effectiveLegacyTab === "cashflow" && (
                  <button className="lim-btn-ghost" type="button">Actualizar cálculo</button>
                )}
              </div>
            </div>
          )}

          {/* ══════════════ CASHFLOW TAB ══════════════ */}
          {effectiveLegacyTab === "cashflow" && (
            <div className="lim-cf-layout">
              {/* KPI sidebar */}
              <aside className="lim-kpi-side">
                <div className="lim-kpi-primary">
                  <span className={`lim-kpi-val ${kpiValCls}`}>{formatMxnCompact(portfolioBalanceMxn)}</span>
                  <span className={`lim-kpi-pill${scenario === "optimista" ? " lim-kpi-pill--opt" : scenario === "pesimista" ? " lim-kpi-pill--pes" : " lim-kpi-pill--blue"}`}>● Saldo cartera (LIM)</span>
                </div>
                <div className="lim-kpi-item">
                  <span className="lim-kpi-val lim-kpi-val--sm">{formatMxnCompact(rows[0]?.balanceStart ?? portfolioBalanceMxn)}</span>
                  <span className="lim-kpi-sub">Saldo inicial Cashflow ⓘ</span>
                </div>
                <div className="lim-kpi-item">
                  <span className="lim-kpi-val lim-kpi-val--sm">{formatMxnCompact(totals.balance)}</span>
                  <span className="lim-kpi-sub">Saldo proyectado (horizonte) ⓘ</span>
                </div>
                <div className="lim-kpi-item">
                  <span className="lim-kpi-val lim-kpi-val--sm">{formatMxnCompact(scenarioLiquidityImmediate)}</span>
                  <span className="lim-kpi-sub">Liquidez inmediata ⓘ</span>
                </div>
                <div className="lim-kpi-item">
                  <span className={`lim-kpi-val lim-kpi-val--sm ${monthlyNetCashflow >= 0 ? "lim-kpi-val--opt" : "lim-kpi-val--pes"}`}>
                    {monthlyNetCashflow >= 0 ? "+" : ""}{formatMxnCompact(monthlyNetCashflow)}
                  </span>
                  <span className="lim-kpi-sub">Flujo neto mensual ⓘ</span>
                </div>
                <div className="lim-kpi-sep" />
                <div className="lim-kpi-item">
                  <span className="lim-kpi-pill lim-kpi-pill--purple">● LCR</span>
                  <span className="lim-kpi-val lim-kpi-val--sm">{(scenarioLcr * 100).toFixed(1)}%</span>
                </div>
                <div className="lim-kpi-item">
                  <span className="lim-kpi-pill lim-kpi-pill--purple">● Cash Ratio</span>
                  <span className="lim-kpi-val lim-kpi-val--sm">{scenarioCashRatio.toFixed(2)}x</span>
                </div>
              </aside>

              {/* chart + table */}
              <div className="lim-cf-main">
                <p className="lim-section-subhead lim-cf-cartera-note">
                  Todos los montos en pesos mexicanos (MXN). El saldo inicial del flujo coincide con la cartera de{" "}
                  <strong>{isScotiaTab ? "Depósitos · Tesorería" : "MDC · Productos"}</strong> ({formatMxnFull(portfolioBalanceMxn)}).
                </p>
                <div key={chartAnimKey} className="lim-chart-wrap lim-chart-wrap--scenario-swap">
                  <CashflowChart
                    realRows={realRows}
                    optimistaRows={optimistaRows}
                    pessimistaRows={pessimistaRows}
                    activeMonth={safeActiveMonth}
                    scenario={scenario}
                    showOptimista={showOptimista}
                    showPesimista={showPesimista}
                  />
                </div>

                {/* Scenario banner */}
                {(showOptimista || showPesimista) && (
                  <div className={`lim-scenario-banner${scenario === "pesimista" && !showOptimista ? " lim-scenario-banner--pes" : " lim-scenario-banner--opt"}`}>
                    <span className="lim-scenario-banner__dot" />
                    <strong>{scenarioLabel}</strong>
                    <span>— Los valores proyectados se muestran en {showOptimista && showPesimista ? "verde y rojo" : scenario === "optimista" ? "verde" : "rojo"}</span>
                  </div>
                )}

                <div className="lim-tbl-scroll">
                  <table className="lim-tbl" data-scenario={scenario}>
                    <thead>
                      <tr>
                        <th className="lim-th-label">
                          <input className="lim-search" placeholder="Buscar…" type="search" />
                        </th>
                        {rows.map((r, i) => (
                          <th
                            key={r.label}
                            className={`lim-th-month${i === safeActiveMonth ? " lim-th-month--active" : ""}`}
                            onClick={() => setActiveMonth(i)}
                          >
                            {r.label.toUpperCase()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Saldo inicial */}
                      <tr className="lim-tr-section">
                        <td className="lim-td-lbl"><span className="lim-dot lim-dot--blue" />Saldo inicial de caja</td>
                        {rows.map((r, i) => (
                          <td key={r.label} className={`lim-td-n${i === safeActiveMonth ? " lim-td-n--active" : ""}`}>{formatMxnFull(r.balanceStart)}</td>
                        ))}
                      </tr>

                      {/* Entradas */}
                      <tr className="lim-tr-group" onClick={() => toggle("inflow")}>
                        <td className="lim-td-lbl lim-td-lbl--group">
                          <span className={`lim-arrow${expanded.has("inflow") ? " lim-arrow--open" : ""}`}>▶</span>
                          <span className="lim-dot lim-dot--green" />Entradas de efectivo
                        </td>
                        {rows.map((r, i) => (
                          <td key={r.label} className={`lim-td-n lim-td-n--bold${i === safeActiveMonth ? " lim-td-n--active lim-td-n--green" : ""}`}>
                            {formatMxnFull(r.inflow)}
                          </td>
                        ))}
                      </tr>
                      {expanded.has("inflow") && (
                        <>
                          {[
                            { key: "inflowAR", label: "Cobros clientes A/R" },
                            { key: "inflowServices", label: "Ingresos por servicios" },
                            { key: "inflowOther", label: "Otros ingresos" },
                          ].map(({ key, label }) => (
                            <tr key={key} className="lim-tr-sub">
                              <td className="lim-td-lbl lim-td-lbl--sub">{label}</td>
                              {rows.map((r, i) => (
                                <td key={r.label} className={`lim-td-n lim-td-n--sub${i === safeActiveMonth ? " lim-td-n--active" : ""}`}>
                                  {formatMxnFull(r[key as keyof MonthRow] as number)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </>
                      )}

                      {/* Salidas */}
                      <tr className="lim-tr-group" onClick={() => toggle("outflow")}>
                        <td className="lim-td-lbl lim-td-lbl--group">
                          <span className={`lim-arrow${expanded.has("outflow") ? " lim-arrow--open" : ""}`}>▶</span>
                          <span className="lim-dot lim-dot--red" />Salidas de efectivo
                        </td>
                        {rows.map((r, i) => (
                          <td key={r.label} className={`lim-td-n lim-td-n--bold${i === safeActiveMonth ? " lim-td-n--active lim-td-n--red" : ""}`}>
                            {formatMxnFull(r.outflow)}
                          </td>
                        ))}
                      </tr>
                      {expanded.has("outflow") && (
                        <>
                          {[
                            { key: "outflowSuppliers", label: "Pago proveedores" },
                            { key: "outflowPayroll", label: "Nómina" },
                          ].map(({ key, label }) => (
                            <tr key={key} className="lim-tr-sub">
                              <td className="lim-td-lbl lim-td-lbl--sub">{label}</td>
                              {rows.map((r, i) => (
                                <td key={r.label} className={`lim-td-n lim-td-n--sub${i === safeActiveMonth ? " lim-td-n--active" : ""}`}>
                                  {formatMxnFull(r[key as keyof MonthRow] as number)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </>
                      )}

                      {/* Saldo final */}
                      <tr className="lim-tr-section">
                        <td className="lim-td-lbl"><span className="lim-dot lim-dot--blue" />Saldo final del mes</td>
                        {rows.map((r, i) => (
                          <td key={r.label} className={`lim-td-n lim-td-n--bold${i === safeActiveMonth ? " lim-td-n--active" : ""}`}>{formatMxnFull(r.balanceEnd)}</td>
                        ))}
                      </tr>

                      {/* Activos líquidos */}
                      <tr className="lim-tr-section">
                        <td className="lim-td-lbl"><span className="lim-dot lim-dot--blue" />Activos líquidos</td>
                        {rows.map((r, i) => (
                          <td key={r.label} className={`lim-td-n lim-td-n--bold${i === safeActiveMonth ? " lim-td-n--active" : ""}`}>
                            {formatMxnFull(investedTotalSeries[i] ?? investedTotalCurrent)}
                          </td>
                        ))}
                      </tr>

                      {/* KPIs */}
                      <tr className="lim-tr-group" onClick={() => toggle("kpi")}>
                        <td className="lim-td-lbl lim-td-lbl--group">
                          <span className={`lim-arrow${expanded.has("kpi") ? " lim-arrow--open" : ""}`}>▶</span>
                          <span className="lim-dot lim-dot--orange" />Indicadores clave
                        </td>
                        {rows.map((r, i) => {
                          const net = r.inflow - r.outflow;
                          return (
                            <td key={r.label} className={`lim-td-n lim-td-n--bold${net >= 0 ? " lim-td-n--green" : " lim-td-n--red"}${i === safeActiveMonth ? " lim-td-n--active" : ""}`}>
                              {net >= 0 ? "+" : ""}{formatMxnFull(net)}
                            </td>
                          );
                        })}
                      </tr>
                      {expanded.has("kpi") && (
                        <>
                          <tr className="lim-tr-sub">
                            <td className="lim-td-lbl lim-td-lbl--sub">Saldo EOM <span className="lim-kpi-acronym">End of Month</span></td>
                            {rows.map((r, i) => (
                              <td key={r.label} className={`lim-td-n lim-td-n--sub lim-td-n--blue${i === safeActiveMonth ? " lim-td-n--active" : ""}`}>
                                {formatMxnFull(r.balanceEnd)}
                              </td>
                            ))}
                          </tr>
                          <tr className="lim-tr-sub">
                            <td className="lim-td-lbl lim-td-lbl--sub">Burn rate mensual</td>
                            {rows.map((r, i) => (
                              <td key={r.label} className={`lim-td-n lim-td-n--sub${i === safeActiveMonth ? " lim-td-n--active" : ""}`}>
                                {formatMxnFull(r.outflow)}
                              </td>
                            ))}
                          </tr>
                          <tr className="lim-tr-sub">
                            <td className="lim-td-lbl lim-td-lbl--sub">Caja neta acumulada</td>
                            {(() => {
                              let acc = 0;
                              return rows.map((r, i) => {
                                acc += r.inflow - r.outflow;
                                return (
                                  <td key={r.label} className={`lim-td-n lim-td-n--sub${acc >= 0 ? " lim-td-n--green" : " lim-td-n--red"}${i === safeActiveMonth ? " lim-td-n--active" : ""}`}>
                                    {acc >= 0 ? "+" : ""}{formatMxnFull(acc)}
                                  </td>
                                );
                              });
                            })()}
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ ESPERADO TAB ══════════════ */}
          {effectiveLegacyTab === "expected" && (
            <div className="lim-panel">
              <div className="lim-section-head">Flujos esperados — Próximos 30 días</div>
              <p className="lim-section-subhead">
                Montos en MXN · alineados al saldo cartera LIM ({formatMxnCompact(portfolioBalanceMxn)})
              </p>
              <div className="lim-kpi-row-3">
                <article className="lim-kpi-card"><span>Entradas proyectadas 30d</span><strong className="lim-val-up">{formatMxnCompact(expectedInflows30d)}</strong></article>
                <article className="lim-kpi-card"><span>Salidas proyectadas 30d</span><strong>{formatMxnCompact(expectedOutflows30d)}</strong></article>
                <article className="lim-kpi-card"><span>Gap neto</span><strong className="lim-val-up">+{formatMxnCompact(expectedNetGap30d)}</strong></article>
              </div>
              <table className="lim-tbl lim-tbl--list lim-financing-instruments-table">
                <thead>
                  <tr>{["Concepto", "Tipo", "Monto est.", "Estado"].map((h) => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {expectedFlowItems.map((item) => (
                    <tr key={item.c}>
                      <td>{item.c}</td>
                      <td className={item.t === "Entrada" ? "lim-val-up" : "lim-val-down"}>{item.t}</td>
                      <td className="lim-td-n">{formatMxnFull(item.m)}</td>
                      <td><span className={`lim-pill${item.e === "Confirmado" ? " lim-pill--green" : item.e === "Pendiente" ? " lim-pill--red" : " lim-pill--yellow"}`}>{item.e}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ══════════════ FINANCIAMIENTO TAB ══════════════ */}
          {effectiveLegacyTab === "financing" && (
            <div className="lim-panel">
              <div className="lim-section-head">Gestión de inversiones y crédito</div>
              <div className="lim-section-subhead">
                Montos en MXN · cartera LIM {formatMxnCompact(portfolioBalanceMxn)} · efectivo invertible escalado al saldo total.
              </div>

              <table className="lim-tbl lim-tbl--list">
                <thead><tr>{["Instrumento", "Plazo", "Monto", "Rendimiento", "Vencimiento"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {[
                    { i: "Pagaré bancario", p: "30 días", m: investMoneyMarket6m, r: "5.1% TNA", v: "07 Jun 2026" },
                    { i: "CETE 90 días", p: "90 días", m: investCete90d, r: "6.67% TNA", v: "12 Ago 2026" },
                    { i: "CETE 28 días", p: "28 días", m: investCete28d, r: "6.54% TNA", v: "11 Jun 2026" },
                    { i: "Repo Overnight", p: "1 día", m: investRepo1d, r: "3.8% TNA", v: "15 May 2026" },
                   
                  ].map((item) => (
                    <tr key={item.i}>
                      <td><strong>{item.i}</strong></td>
                      <td>{item.p}</td>
                      <td className="lim-td-n">{formatMxnFull(item.m)}</td>
                      <td className="lim-val-up">{item.r}</td>
                      <td className="lim-td-muted">{item.v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ── Panel IA ── */}
              <div className="lim-ai-panel">
                <div className="lim-ai-header">
                  <span className="lim-ai-badge">IA</span>
                  <span className="lim-ai-header-title">Análisis y recomendaciones · <span className="lim-ai-header-ts">Actualizado hace 2 min</span></span>
                  <button className="lim-btn-ghost lim-ai-regen" type="button">↺ Regenerar</button>
                </div>
                <div className="lim-section-head" style={{ marginTop: 8 }}>Oportunidad de inversión recomendada</div>
                <div className="lim-section-subhead">
                  Total disponible: <strong style={{ color: "#111827" }}>{formatMxnFull(portfolioBalanceMxn)}</strong> ·
                  Reserva de liquidez inmediata: <strong style={{ color: "#111827" }}>{formatMxnFull(scenarioLiquidityImmediate)}</strong> ·
                  Monto sugerido a invertir: <strong style={{ color: "#111827" }}>{formatMxnFull(investedTotalCurrent)}</strong>
                </div>
                <table className="lim-tbl lim-tbl--list">
                  <thead><tr>{["Instrumento", "Plazo recomendado", "Monto sugerido", "Tasa estimada", "Retorno potencial"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {[
                      {
                        i: "Pagaré bancario",
                        p: "30 días",
                        e: formatMxnFull(investMoneyMarket6m),
                        t: "2.9% TNA",
                        ip: formatMxnFull(scaleToPortfolio(10_150, portfolioBalanceMxn)),
                      },
                      {
                        i: "CETE",
                        p: "90 días",
                        e: formatMxnFull(investCete90d),
                        t: "6.67% TNA",
                        ip: formatMxnFull(scaleToPortfolio(3_003, portfolioBalanceMxn)),
                      },
                      {
                        i: "CETE",
                        p: "28 días",
                        e: formatMxnFull(investCete28d),
                        t: "6.54% TNA",
                        ip: formatMxnFull(scaleToPortfolio(544, portfolioBalanceMxn)),
                      },
                      {
                        i: "Repo Overnight",
                        p: "1 día",
                        e: formatMxnFull(investRepo1d),
                        t: "2.2% TNA",
                        ip: formatMxnFull(scaleToPortfolio(220, portfolioBalanceMxn)),
                      },
                    ].map((item) => (
                      <tr key={item.p}>
                        <td><strong>{item.i}</strong></td>
                        <td>{item.p}</td>
                        <td className="lim-td-n">{item.e}</td>
                        <td>{item.t}</td>
                        <td className="lim-td-n lim-val-up">{item.ip}</td>
                      </tr>
                    ))}

                  </tbody>
                </table>
                <div className="lim-ai-cards">
                  <div className="lim-ai-card lim-ai-card--green">
                    <span className="lim-ai-tag lim-ai-tag--green">Oportunidad</span>
                    <div className="lim-ai-card-title">Optimizar distribución de liquidez</div>
                    <div className="lim-ai-card-body">Con {formatMxnCompact(portfolioBalanceMxn)} disponibles en caja y depósitos, la IA sugiere asignar {formatMxnCompact(investedTotalCurrent)} a inversiones líquidas y mantener {formatMxnCompact(scenarioLiquidityImmediate)} como liquidez inmediata para cubrir operación diaria.</div>
                    <button className="lim-ai-action" type="button">Aplicar →</button>
                  </div>
                  <div className="lim-ai-card lim-ai-card--yellow">
                    <span className="lim-ai-tag lim-ai-tag--yellow">Alerta</span>
                    <div className="lim-ai-card-title">Vencimiento en 24 h</div>
                    <div className="lim-ai-card-body">El <strong>Repo Overnight {repoRenewalHint}</strong> vence el 09 May 2026. Se recomienda renovar o redirigir al CETE para mantener liquidez operativa sin corte de cobertura.</div>
                    <button className="lim-ai-action" type="button">Revisar →</button>
                  </div>
                  <div className="lim-ai-card lim-ai-card--blue">
                    <span className="lim-ai-tag lim-ai-tag--blue">Estrategia</span>
                    <div className="lim-ai-card-title">Línea Revolving sin utilizar</div>
                    <div className="lim-ai-card-body">La línea de crédito Pichincha ({creditLineHint}, 8.5%) tiene margen completo disponible. Mantenerla sin utilizar mejora el índice de cobertura. Activar solo si <strong>DSO supera 45 días</strong> o el saldo EOM cae bajo {eomFloorHint}.</div>
                    <button className="lim-ai-action" type="button">Configurar alerta →</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ DASHBOARD TAB ══════════════ */}
          {effectiveLegacyTab === "dashboard" && (
            <div className="lim-dashboard">
              <div className="lim-dash-head">
                <h2>Liquidity Control Center Dashboard</h2>
              </div>

              <div className="lim-dash-kpis">
                <article className="lim-dash-kpi">
                  <div className="lim-dash-kpi-title">Liquidez inmediata (Caja disponible)</div>
                  <div className="lim-dash-kpi-val">{formatMxnFull(scenarioLiquidityImmediate)}</div>
                </article>

                <article className="lim-dash-kpi">
                  <div className="lim-dash-kpi-title">Flujo neto mensual de efectivo</div>
                  <div className="lim-dash-kpi-val">
                    {activeMonthNetCashflow >= 0 ? "+" : ""}{formatMxnFull(activeMonthNetCashflow)}
                  </div>
                </article>

                <article className="lim-dash-kpi">
                  <div className="lim-dash-kpi-title">LCR (Liquidity Coverage Ratio)</div>
                  <div className="lim-dash-kpi-val">{(scenarioLcr * 100).toFixed(1)}%</div>
                </article>

                <article className="lim-dash-kpi">
                  <div className="lim-dash-kpi-title">Cash Ratio (Razón de efectivo)</div>
                  <div className="lim-dash-kpi-val">{scenarioCashRatio.toFixed(2)}x</div>
                </article>
              </div>

              <div className="lim-section-head" style={{ marginTop: 14 }}>Ingresos vs uso del ingreso mensual</div>
              <div className="lim-section-subhead">
                Muestra el uso del ingreso del mes activo del cashflow: proveedores, nómina y flujo neto.
              </div>
              <IncomeUseChart
                suppliers={activeMonthSuppliers}
                payroll={activeMonthPayroll}
                net={activeMonthNetCashflow}
                centerSubLabel={activeRow?.label ? activeRow.label.toUpperCase() : "Mes activo"}
              />

              <div className="lim-section-head">Activos líquidos por bucket de vencimiento</div>
              <div className="lim-section-subhead">
                Monto total invertido recomendado: <strong style={{ color: "#111827" }}>{formatMxnFull(investedTotalCurrent)}</strong>
              </div>
              <table className="lim-tbl lim-tbl--list">
                <thead><tr>{["Bucket", "Monto invertido", "Instrumentos incluidos"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  <tr>
                    <td>1 día</td>
                    <td className="lim-td-n">{formatMxnFull(bucket1d)}</td>
                    <td>Repo Overnight</td>
                  </tr>
                  <tr>
                    <td>30 días</td>
                    <td className="lim-td-n">{formatMxnFull(bucket30d)}</td>
                    <td>CETE</td>
                  </tr>
                  <tr>
                    <td>90 días</td>
                    <td className="lim-td-n">{formatMxnFull(bucket90d)}</td>
                    <td>CETE</td>
                  </tr>
                  <tr>
                    <td>Activos líquidos</td>
                    <td className="lim-td-n">{formatMxnFull(totalLiquidAssetsCurrent)}</td>
                    <td>Caja disponible + total invertido del escenario activo</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          </>
          )}

        </div>
      </div>
    </div>
  );
}
