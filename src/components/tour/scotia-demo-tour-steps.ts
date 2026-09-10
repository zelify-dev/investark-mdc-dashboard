export type ScotiaDemoTab =
  | "credito-admin"
  | "credito-cotizacion"
  | "credito-trazabilidad"
  | "pricing"
  | "tesoreria"
  | "trazabilidad";

export type ScotiaTourAction =
  | "select-client-pm002"
  | "select-client-pm003"
  | "select-client-pm004"
  | "simulate-tiie-drop"
  | "reset-tiie"
  | "enable-cross-sell-seguro"
  | "enable-cross-sell"
  | "fix-credit-quote"
  | "load-client-cl-demo-001";

export interface ScotiaTourStep {
  id: string;
  module: "A" | "B";
  stepInModule: number;
  totalInModule: number;
  tab: ScotiaDemoTab;
  target: string;
  title: string;
  hint: string;
  action?: ScotiaTourAction;
}

const MODULE_A_TOTAL = 10;
const MODULE_B_TOTAL = 6;

export const SCOTIA_DEMO_TOUR_STEPS: ScotiaTourStep[] = [
  {
    id: "a1-admin",
    module: "A",
    stepInModule: 1,
    totalInModule: MODULE_A_TOTAL,
    tab: "credito-admin",
    target: "credit-product-admin",
    title: "Plantilla de producto",
    hint: "AUTO-EV-01 · reglas de pricing sin tocar el Core.",
  },
  {
    id: "a2-data",
    module: "A",
    stepInModule: 2,
    totalInModule: MODULE_A_TOTAL,
    tab: "credito-cotizacion",
    target: "credit-data-layer",
    title: "Origen de datos",
    hint: "Core → Data Layer → CORTEX · contexto en tiempo real.",
  },
  {
    id: "a3-client",
    module: "A",
    stepInModule: 3,
    totalInModule: MODULE_A_TOTAL,
    tab: "credito-cotizacion",
    target: "credit-quote-client",
    title: "Cliente desde el Core",
    hint: "CL-001 · nómina y TDC activas · $850K / 60 meses.",
    action: "load-client-cl-demo-001",
  },
  {
    id: "a4-ai",
    module: "A",
    stepInModule: 4,
    totalInModule: MODULE_A_TOTAL,
    tab: "credito-cotizacion",
    target: "credit-ai-recommend",
    title: "Recomendación IA",
    hint: "CORTEX-Recommend v2 · sugiere seguro + inversión (−100 pbs).",
  },
  {
    id: "a5-rules",
    module: "A",
    stepInModule: 5,
    totalInModule: MODULE_A_TOTAL,
    tab: "credito-cotizacion",
    target: "credit-quote-result",
    title: "Motor de reglas",
    hint: "Cascada: 15% − 100 pbs = 14.00%.",
  },
  {
    id: "a6-potential",
    module: "A",
    stepInModule: 6,
    totalInModule: MODULE_A_TOTAL,
    tab: "credito-cotizacion",
    target: "credit-quote-potential",
    title: "Oportunidades",
    hint: "Descuentos pendientes · piso posible 13.75%.",
  },
  {
    id: "a7-seguro",
    module: "A",
    stepInModule: 7,
    totalInModule: MODULE_A_TOTAL,
    tab: "credito-cotizacion",
    target: "credit-cross-sell-seguro",
    title: "Paso 1 · Seguro auto",
    hint: "Activa checkbox 1 → la tasa baja hasta el piso de 13.75%.",
    action: "enable-cross-sell-seguro",
  },
  {
    id: "a8-inversion",
    module: "A",
    stepInModule: 8,
    totalInModule: MODULE_A_TOTAL,
    tab: "credito-cotizacion",
    target: "credit-cross-sell-inversion",
    title: "Paso 2 · Inversión",
    hint: "Activa checkbox 2 → se mantiene el piso de 13.75%.",
    action: "enable-cross-sell",
  },
  {
    id: "a9-fix",
    module: "A",
    stepInModule: 9,
    totalInModule: MODULE_A_TOTAL,
    tab: "credito-cotizacion",
    target: "credit-fix-quote",
    title: "Fijar cotización",
    hint: "Tasa 13.75% fija · envío REST al Core.",
    action: "fix-credit-quote",
  },
  {
    id: "a10-audit",
    module: "A",
    stepInModule: 10,
    totalInModule: MODULE_A_TOTAL,
    tab: "credito-trazabilidad",
    target: "credit-audit-log",
    title: "Auditoría",
    hint: "Datos, IA, reglas y cross-sell trazados.",
  },
  {
    id: "b1-config",
    module: "B",
    stepInModule: 1,
    totalInModule: MODULE_B_TOTAL,
    tab: "pricing",
    target: "lim-tiers-config",
    title: "Tablas tier",
    hint: "PM/PF · TIIE 6.50% vigente.",
    action: "reset-tiie",
  },
  {
    id: "b2-pm002",
    module: "B",
    stepInModule: 2,
    totalInModule: MODULE_B_TOTAL,
    tab: "pricing",
    target: "lim-client-pm002",
    title: "Caso 1 · Estándar",
    hint: "Tier 2 · 6.50% × 30% = 1.95%.",
    action: "select-client-pm002",
  },
  {
    id: "b3-tiie-drop",
    module: "B",
    stepInModule: 3,
    totalInModule: MODULE_B_TOTAL,
    tab: "pricing",
    target: "lim-tiie-recalc",
    title: "Recálculo TIIE",
    hint: "6.50% → corporativo pasa a 1.95%.",
    action: "simulate-tiie-drop",
  },
  {
    id: "b4-override",
    module: "B",
    stepInModule: 4,
    totalInModule: MODULE_B_TOTAL,
    tab: "pricing",
    target: "lim-override-pm003",
    title: "Caso 2 · VIP",
    hint: "Override 3.50% sobre tabla estándar.",
    action: "select-client-pm003",
  },
  {
    id: "b5-bonus",
    module: "B",
    stepInModule: 5,
    totalInModule: MODULE_B_TOTAL,
    tab: "pricing",
    target: "lim-bonus-pm004",
    title: "Caso 3 · Bonificación",
    hint: "+5% factor por saldo incremental.",
    action: "select-client-pm004",
  },
  {
    id: "b6-treasury",
    module: "B",
    stepInModule: 6,
    totalInModule: MODULE_B_TOTAL,
    tab: "tesoreria",
    target: "lim-treasury",
    title: "Tesorería",
    hint: "Cartera, NII y cobertura MXN/USD.",
  },
];
