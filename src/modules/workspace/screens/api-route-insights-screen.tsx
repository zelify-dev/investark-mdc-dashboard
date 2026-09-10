"use client";

import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import "@/components/ui/templates/workspace-page.css";
import { useI18n } from "@/providers/i18n-provider";

import "./api-route-insights-screen.css";

type ScreenKey =
  | "loans"
  | "deposit-transactions"
  | "products"
  | "accounting-profit-loss"
  | "accounting-balance-sheet"
  | "accounting-interest-accrual-breakdown"
  | "accounting-closures"
  | "settings-forms"
  | "settings-templates"
  | "settings-data"
  | "settings-id-templates"
  | "settings-authorization-holds"
  | "customers-active-clients"
  | "customers-set-aside"
  | "groups-active-loans"
  | "groups-sin-miembros"
  | "loans-pending-approval"
  | "loans-close"
  | "reports-portfolio"
  | "reports-cashflow";

type SectionData = {
  title: string;
  subtitle: string;
  cards: { label: string; value: string }[];
  columns: string[];
  rows: string[][];
};

type LoanPortfolioSeed = {
  id: string;
  client: string;
  product: string;
  status: "active" | "arrears";
  balance: number;
};

function splitTotalAcrossParts(total: number, count: number): number[] {
  const weights = Array.from({ length: count }, (_, i) => 42 + (i % 19) * 11 + ((i * 5) % 29));
  const wsum = weights.reduce((a, b) => a + b, 0);
  const parts = weights.map((w) => Math.floor((total * w) / wsum));
  const diff = total - parts.reduce((a, b) => a + b, 0);
  parts[parts.length - 1] += diff;
  return parts;
}

function formatUsdBalance(amount: number): string {
  return `USD ${amount.toLocaleString("en-US")}`;
}

function buildLoanPortfolioSection(): SectionData {
  const productPool = [
    "Micro Loan / Microcrédito",
    "SME Capital / Capital PyME",
    "Education / Educación",
    "Vehicle Loan / Préstamo vehicular",
    "Working Capital / Capital de trabajo",
    "Housing / Vivienda",
    "Agricultural / Agrícola",
    "Consumer / Consumo",
    "Green Energy / Energía verde",
    "Payroll-Linked / Nómina",
    "Group Loan / Préstamo grupal",
    "Emergency Line / Línea emergencia",
  ] as const;

  const clients = [
    "Ana Mora",
    "David Ortiz",
    "Rosa Vega",
    "Carlos Mendoza",
    "Lucía Herrera",
    "Jorge Castillo",
    "María Fernández",
    "Pedro Salinas",
    "Gabriela Ríos",
    "Andrés Duarte",
    "Valentina Soto",
    "Ricardo Paredes",
    "Daniela Vargas",
    "Fernando Aguirre",
    "Camila Núñez",
    "Esteban Morales",
    "Paula Cortés",
    "Miguel Ángel Lara",
    "Isabel Campos",
    "Héctor Peña",
    "Natalia Ibáñez",
    "Óscar Delgado",
    "Adriana Fuentes",
    "Roberto Silva",
    "Claudia Mejía",
    "Javier Orozco",
    "Mónica Reyes",
    "Sergio Navarro",
    "Patricia León",
    "Diego Ramírez",
    "Laura Gutiérrez",
    "Martín Cabrera",
    "Carmen Espinoza",
    "Raúl Figueroa",
    "Elena Guzmán",
    "Francisco Torres",
    "Beatriz Molina",
    "Luis Enrique Sosa",
    "Teresa Rojas",
    "Alberto Cárdenas",
    "Silvia Ponce",
    "Enrique Valdés",
    "Ruth Zamora",
    "Manuel Contreras",
    "Pilar Escobar",
    "Víctor Maldonado",
    "Lucía Beltrán",
    "Gustavo Acosta",
    "Mariana Lozano",
  ] as const;

  const arrearsBalances = [98_000, 112_000, 87_500, 103_200, 99_000];
  const arrearsTotal = arrearsBalances.reduce((a, b) => a + b, 0);
  const portfolioTotal = 15_000_000;
  const activeTarget = portfolioTotal - arrearsTotal;
  const activeCount = 48;
  const activeBalances = splitTotalAcrossParts(activeTarget, activeCount);

  const seeds: LoanPortfolioSeed[] = [];

  for (let i = 0; i < activeCount; i += 1) {
    seeds.push({
      id: `LN-${10240 + i}`,
      client: clients[i % clients.length],
      product: productPool[i % productPool.length],
      status: "active",
      balance: activeBalances[i],
    });
  }

  arrearsBalances.forEach((balance, j) => {
    seeds.push({
      id: `LN-${10880 + j}`,
      client: clients[(activeCount + j) % clients.length],
      product: productPool[(j + 3) % productPool.length],
      status: "arrears",
      balance,
    });
  });

  const rows = seeds.map((row) => {
    const statusLabel = row.status === "active" ? "Active / Activo" : "In Arrears / En Mora";
    return [row.id, row.client, row.product, statusLabel, formatUsdBalance(row.balance)];
  });

  const totalBalance = seeds.reduce((s, r) => s + r.balance, 0);
  const activeLoans = seeds.filter((r) => r.status === "active").length;
  const arrearsBalanceSum = seeds.filter((r) => r.status === "arrears").reduce((s, r) => s + r.balance, 0);
  const parSharePct = totalBalance > 0 ? (arrearsBalanceSum / totalBalance) * 100 : 0;

  const outstandingDisplay =
    totalBalance >= 1_000_000
      ? `USD ${(totalBalance / 1_000_000).toFixed(1)}M`
      : `USD ${totalBalance.toLocaleString("en-US")}`;

  return {
    title: "Loan Portfolio / Cartera de Préstamos",
    subtitle:
      "Overview of loan accounts, balances, delinquency and disbursements. / Resumen de cuentas de préstamo, saldos, mora y desembolsos.",
    cards: [
      { label: "Active Loans / Préstamos Activos", value: activeLoans.toLocaleString("en-US") },
      { label: "Outstanding Balance / Saldo Pendiente", value: outstandingDisplay },
      { label: "PAR 30 / Mora 30+", value: `${parSharePct.toFixed(1)}%` },
    ],
    columns: [
      "Loan ID / ID Préstamo",
      "Client / Cliente",
      "Product / Producto",
      "Status / Estado",
      "Balance / Saldo",
    ],
    rows,
  };
}

const DATA_BY_KEY: Record<ScreenKey, SectionData> = {
  loans: buildLoanPortfolioSection(),
  "deposit-transactions": {
    title: "Deposit Transactions / Transacciones de Depósito",
    subtitle:
      "Recent movements by savings and checking accounts. / Movimientos recientes por cuentas de ahorro y corrientes.",
    cards: [
      { label: "Transactions Today / Transacciones Hoy", value: "347" },
      { label: "Inflow / Entradas", value: "USD 289,100" },
      { label: "Outflow / Salidas", value: "USD 214,900" },
    ],
    columns: [
      "Txn ID / ID Txn",
      "Account / Cuenta",
      "Type / Tipo",
      "Channel / Canal",
      "Amount / Monto",
    ],
    rows: [
      ["DT-4401", "SV-33201", "Deposit / Depósito", "Mobile / Móvil", "USD 1,200"],
      ["DT-4408", "CH-81720", "Withdrawal / Retiro", "Branch / Sucursal", "USD 480"],
      ["DT-4412", "SV-00218", "Transfer / Transferencia", "API / API", "USD 2,750"],
    ],
  },
  products: {
    title: "Products Catalog / Catálogo de Productos",
    subtitle:
      "Loan and deposit products with terms and pricing. / Productos de préstamo y depósito con condiciones y precios.",
    cards: [
      { label: "Loan Products / Productos de Préstamo", value: "14" },
      { label: "Deposit Products / Productos de Depósito", value: "9" },
      { label: "Draft Products / Borradores", value: "3" },
    ],
    columns: [
      "Code / Código",
      "Name / Nombre",
      "Type / Tipo",
      "Currency / Moneda",
      "Status / Estado",
    ],
    rows: [
      ["PR-ML-01", "Micro Loan Plus / Microcrédito Plus", "Loan / Préstamo", "USD", "Active / Activo"],
      ["PR-SV-04", "Smart Saver / Ahorro Inteligente", "Deposit / Depósito", "USD", "Active / Activo"],
      ["PR-GR-02", "Group Flex / Grupo Flexible", "Loan / Préstamo", "USD", "Draft / Borrador"],
    ],
  },
  "accounting-balance-sheet": {
    title: "Balance Sheet / Balance General",
    subtitle:
      "Assets, liabilities and equity snapshot by period. / Instantánea de activos, pasivos y patrimonio por período.",
    cards: [
      { label: "Total Assets / Activos Totales", value: "USD 18.2M" },
      { label: "Total Liabilities / Pasivos Totales", value: "USD 12.1M" },
      { label: "Equity / Patrimonio", value: "USD 6.1M" },
    ],
    columns: [
      "Line / Rubro",
      "Category / Categoría",
      "Current / Actual",
      "Prior / Anterior",
      "Variance / Variación",
    ],
    rows: [
      ["Cash and equivalents / Efectivo y equivalentes", "Asset / Activo", "USD 2.4M", "USD 2.1M", "+14.3% / +14.3%"],
      ["Loans receivable / Cartera por cobrar", "Asset / Activo", "USD 12.4M", "USD 11.9M", "+4.2% / +4.2%"],
      ["Deposits payable / Depósitos por pagar", "Liability / Pasivo", "USD 8.9M", "USD 8.4M", "+6.0% / +6.0%"],
    ],
  },
  "accounting-profit-loss": {
    title: "Profit and Loss / Ganancias y Pérdidas",
    subtitle:
      "Income and expense performance by period. / Rendimiento de ingresos y gastos por período.",
    cards: [
      { label: "Operating Income / Ingreso Operativo", value: "USD 522,300" },
      { label: "Operating Expense / Gasto Operativo", value: "USD 368,150" },
      { label: "Net Result / Resultado Neto", value: "USD 154,150" },
    ],
    columns: [
      "Account / Cuenta",
      "Category / Categoría",
      "Current / Actual",
      "Prior / Anterior",
      "Variance / Variación",
    ],
    rows: [
      ["Interest Income / Ingreso por Intereses", "Income / Ingreso", "USD 402,000", "USD 389,000", "+3.3% / +3.3%"],
      ["Fee Income / Ingreso por Comisiones", "Income / Ingreso", "USD 120,300", "USD 111,800", "+7.6% / +7.6%"],
      ["Personnel Expense / Gasto de Personal", "Expense / Gasto", "USD 187,100", "USD 181,400", "+3.1% / +3.1%"],
    ],
  },
  "accounting-interest-accrual-breakdown": {
    title: "Interest Accrual Breakdown / Desglose de Devengo de Intereses",
    subtitle:
      "Accrued interest by product, portfolio segment and GL mapping. / Intereses devengados por producto, segmento de cartera y mapeo contable.",
    cards: [
      { label: "Accrued MTD / Devengado MTD", value: "USD 284,200" },
      { label: "GL Postings Pending / Contabilizaciones pendientes", value: "12" },
      { label: "Reconciliation Delta / Delta conciliación", value: "USD 1,240" },
    ],
    columns: [
      "Account / Cuenta",
      "Product / Producto",
      "Accrued / Devengado",
      "Posted / Contabilizado",
      "Delta / Delta",
    ],
    rows: [
      ["INT-4100 / INT-4100", "Micro Loan / Microcrédito", "USD 98,400", "USD 97,100", "USD 1,300"],
      ["INT-4101 / INT-4101", "SME Loan / Préstamo PyME", "USD 112,800", "USD 112,800", "USD 0"],
      ["INT-4200 / INT-4200", "Deposits / Depósitos", "USD 73,000", "USD 71,860", "USD 1,140"],
    ],
  },
  "accounting-closures": {
    title: "Accounting Closures / Cierres Contables",
    subtitle:
      "Period close status, validations and posting jobs. / Estado de cierre de período, validaciones y procesos de contabilización.",
    cards: [
      { label: "Open Periods / Períodos Abiertos", value: "1" },
      { label: "Pending Tasks / Tareas Pendientes", value: "4" },
      { label: "Last Closed Date / Último Cierre", value: "2026-03-31" },
    ],
    columns: [
      "Period / Período",
      "Status / Estado",
      "Checks / Controles",
      "Owner / Responsable",
      "Updated / Actualizado",
    ],
    rows: [
      ["2026-04", "In Progress / En Progreso", "18/24", "Finance Ops / Operaciones Financieras", "2h ago / hace 2h"],
      ["2026-03", "Closed / Cerrado", "24/24", "Finance Ops / Operaciones Financieras", "Mar 31 / 31 Mar"],
      ["2026-02", "Closed / Cerrado", "24/24", "Finance Ops / Operaciones Financieras", "Feb 28 / 28 Feb"],
    ],
  },
  "settings-forms": {
    title: "Forms Configuration / Configuración de Formularios",
    subtitle:
      "Form templates, fields and validation rules. / Plantillas de formularios, campos y reglas de validación.",
    cards: [
      { label: "Published Forms / Formularios Publicados", value: "12" },
      { label: "Draft Forms / Formularios en Borrador", value: "5" },
      { label: "Custom Fields / Campos Personalizados", value: "84" },
    ],
    columns: [
      "Form / Formulario",
      "Entity / Entidad",
      "Version / Versión",
      "Fields / Campos",
      "Status / Estado",
    ],
    rows: [
      ["Individual Onboarding / Alta Individual", "Customer / Cliente", "v8 / v8", "26", "Published / Publicado"],
      ["Loan Review / Revisión de Préstamo", "Loan / Préstamo", "v3 / v3", "18", "Published / Publicado"],
      ["Group Profile / Perfil de Grupo", "Group / Grupo", "v2 / v2", "21", "Draft / Borrador"],
    ],
  },
  "settings-templates": {
    title: "Templates Center / Centro de Plantillas",
    subtitle:
      "Message and document templates used by the platform. / Plantillas de mensajes y documentos usadas por la plataforma.",
    cards: [
      { label: "Document Templates / Plantillas Documento", value: "17" },
      { label: "Notification Templates / Plantillas Notificación", value: "24" },
      { label: "Locales / Idiomas", value: "2 (EN/ES)" },
    ],
    columns: [
      "Template / Plantilla",
      "Channel / Canal",
      "Language / Idioma",
      "Last Version / Última Versión",
      "Status / Estado",
    ],
    rows: [
      ["Loan Agreement / Contrato de Préstamo", "PDF / PDF", "EN/ES / EN/ES", "v11 / v11", "Active / Activa"],
      ["Payment Reminder / Recordatorio de Pago", "SMS / SMS", "EN/ES / EN/ES", "v5 / v5", "Active / Activa"],
      ["Welcome Notice / Aviso de Bienvenida", "Email / Correo", "EN/ES / EN/ES", "v4 / v4", "In Review / En Revisión"],
    ],
  },
  "settings-data": {
    title: "Data Management / Gestión de Datos",
    subtitle:
      "Reference datasets, imports and quality controls. / Datos de referencia, importaciones y controles de calidad.",
    cards: [
      { label: "Reference Sets / Catálogos", value: "31" },
      { label: "Import Jobs / Cargas", value: "9" },
      { label: "Data Quality Alerts / Alertas Calidad", value: "2" },
    ],
    columns: [
      "Dataset / Conjunto",
      "Records / Registros",
      "Last Sync / Última Sincronización",
      "Source / Fuente",
      "Health / Estado",
    ],
    rows: [
      ["Country Codes / Códigos de País", "249", "Today 07:20 / Hoy 07:20", "Internal / Interno", "Healthy / Saludable"],
      ["Industry Catalog / Catálogo de Industrias", "584", "Today 06:10 / Hoy 06:10", "Internal / Interno", "Healthy / Saludable"],
      ["Postal Areas / Zonas Postales", "112,044", "Yesterday / Ayer", "Batch / Lote", "Warning / Alerta"],
    ],
  },
  "settings-id-templates": {
    title: "ID Templates / Plantillas de Identificación",
    subtitle:
      "Configuration of account and customer ID formats. / Configuración de formatos de identificación para cuentas y clientes.",
    cards: [
      { label: "Active Patterns / Patrones Activos", value: "6" },
      { label: "Prefix Rules / Reglas de Prefijo", value: "11" },
      { label: "Collisions Prevented / Colisiones Evitadas", value: "100%" },
    ],
    columns: [
      "Template / Plantilla",
      "Entity / Entidad",
      "Pattern / Patrón",
      "Next Value / Siguiente Valor",
      "Status / Estado",
    ],
    rows: [
      ["CLIENT-STD", "Customer / Cliente", "CL-{YYYY}-{000000}", "CL-2026-004218", "Active / Activa"],
      ["LOAN-STD", "Loan / Préstamo", "LN-{YYYY}-{000000}", "LN-2026-010254", "Active / Activa"],
      ["GROUP-ALT", "Group / Grupo", "GR-{000000}", "GR-000982", "Paused / Pausada"],
    ],
  },
  "settings-authorization-holds": {
    title: "Authorization Holds / Retenciones de Autorización",
    subtitle:
      "Rules and queue for card/payment authorization holds. / Reglas y cola de retenciones por autorizaciones de tarjeta/pago.",
    cards: [
      { label: "Active Rules / Reglas Activas", value: "8" },
      { label: "Pending Release / Liberación Pendiente", value: "57" },
      { label: "Avg Hold Duration / Duración Promedio", value: "36h" },
    ],
    columns: [
      "Rule / Regla",
      "Channel / Canal",
      "Threshold / Umbral",
      "Hold Time / Tiempo Retención",
      "Status / Estado",
    ],
    rows: [
      ["Card Purchase / Compra con Tarjeta", "Card / Tarjeta", ">= USD 700", "72h / 72h", "Active / Activa"],
      ["E-Commerce / Comercio Electrónico", "Online / En Línea", ">= USD 500", "48h / 48h", "Active / Activa"],
      ["Manual Review / Revisión Manual", "Backoffice / Backoffice", ">= USD 1,500", "24h / 24h", "Limited / Limitada"],
    ],
  },
  "customers-active-clients": {
    title: "Active Clients / Clientes Activos",
    subtitle:
      "Clients currently operating with at least one active product. / Clientes con al menos un producto activo.",
    cards: [
      { label: "Total Active / Total Activos", value: "5,640" },
      { label: "New This Month / Nuevos del Mes", value: "214" },
      { label: "Avg Products / Promedio Productos", value: "2.3" },
    ],
    columns: [
      "Client ID / ID Cliente",
      "Name / Nombre",
      "Segment / Segmento",
      "Products / Productos",
      "Risk / Riesgo",
    ],
    rows: [
      ["CU-8821", "Laura Ibarra", "Retail / Minorista", "3", "Low / Bajo"],
      ["CU-8894", "Mateo Paz", "SME / PyME", "2", "Medium / Medio"],
      ["CU-8912", "Elena Ruiz", "Retail / Minorista", "1", "Low / Bajo"],
    ],
  },
  "customers-set-aside": {
    title: "Set Aside Clients / Clientes Apartados",
    subtitle:
      "Clients with restrictions pending investigation or reactivation. / Clientes con restricciones pendientes de revisión o reactivación.",
    cards: [
      { label: "Set Aside / Apartados", value: "87" },
      { label: "Under Review / En Revisión", value: "29" },
      { label: "Awaiting Docs / Esperando Documentos", value: "41" },
    ],
    columns: [
      "Client ID / ID Cliente",
      "Name / Nombre",
      "Reason / Motivo",
      "Assigned Team / Equipo",
      "SLA / SLA",
    ],
    rows: [
      ["CU-7392", "Carlos León", "KYC Missing / KYC Incompleto", "Compliance / Cumplimiento", "2 days / 2 días"],
      ["CU-7428", "Marta Rey", "Fraud Alert / Alerta Fraude", "Risk / Riesgo", "6 hours / 6 horas"],
      ["CU-7481", "Iván Peña", "Address Check / Verificación Domicilio", "Operations / Operaciones", "1 day / 1 día"],
    ],
  },
  "groups-active-loans": {
    title: "Groups with Active Loans / Grupos con Préstamos Activos",
    subtitle:
      "Group lending units with current outstanding balances. / Unidades de crédito grupal con saldos vigentes.",
    cards: [
      { label: "Active Groups / Grupos Activos", value: "312" },
      { label: "Total Members / Miembros Totales", value: "4,986" },
      { label: "Group PAR 30 / Mora Grupal 30+", value: "2.4%" },
    ],
    columns: [
      "Group ID / ID Grupo",
      "Name / Nombre",
      "Members / Miembros",
      "Outstanding / Saldo",
      "Center / Centro",
    ],
    rows: [
      ["GR-0041", "Avanza Norte", "18", "USD 42,100", "Center A / Centro A"],
      ["GR-0048", "Mujeres Unión", "22", "USD 51,800", "Center C / Centro C"],
      ["GR-0051", "Crecimiento Sur", "15", "USD 31,240", "Center B / Centro B"],
    ],
  },
  "groups-sin-miembros": {
    title: "Groups without Members / Grupos sin Miembros",
    subtitle:
      "Empty groups pending assignment or cleanup. / Grupos vacíos pendientes de asignación o depuración.",
    cards: [
      { label: "Empty Groups / Grupos Vacíos", value: "19" },
      { label: "Created This Quarter / Creados Trimestre", value: "7" },
      { label: "Pending Deletion / Pendientes de Borrado", value: "4" },
    ],
    columns: [
      "Group ID / ID Grupo",
      "Name / Nombre",
      "Created / Creado",
      "Officer / Oficial",
      "Action / Acción",
    ],
    rows: [
      ["GR-0118", "Ruta 5", "2026-02-14", "N. Quispe", "Assign / Asignar"],
      ["GR-0122", "Pioneros", "2026-03-01", "A. Campos", "Review / Revisar"],
      ["GR-0126", "Nuevo Sol", "2026-03-09", "L. Díaz", "Archive / Archivar"],
    ],
  },
  "loans-pending-approval": {
    title: "Pending Approval Loans / Préstamos Pendientes de Aprobación",
    subtitle:
      "Loan applications waiting for credit decision. / Solicitudes de préstamo esperando decisión crediticia.",
    cards: [
      { label: "Pending Cases / Casos Pendientes", value: "74" },
      { label: "Avg Ticket / Ticket Promedio", value: "USD 2,940" },
      { label: "Oldest Case / Caso Más Antiguo", value: "5 days / 5 días" },
    ],
    columns: [
      "Application / Solicitud",
      "Client / Cliente",
      "Product / Producto",
      "Requested / Solicitado",
      "Queue / Cola",
    ],
    rows: [
      ["APP-2208", "María Solís", "Micro Loan / Microcrédito", "USD 1,500", "Analyst A / Analista A"],
      ["APP-2213", "Julio Cruz", "SME Capital / Capital PyME", "USD 9,800", "Analyst C / Analista C"],
      ["APP-2219", "Karla Vega", "Education / Educación", "USD 2,300", "Analyst B / Analista B"],
    ],
  },
  "loans-close": {
    title: "Closed Loans / Préstamos Cerrados",
    subtitle:
      "Recently settled loans and closure quality metrics. / Préstamos liquidados recientemente y métricas de cierre.",
    cards: [
      { label: "Closed This Month / Cerrados en el Mes", value: "129" },
      { label: "Prepaid / Prepago", value: "21" },
      { label: "Avg Closure Time / Tiempo Promedio Cierre", value: "14.2 months / 14.2 meses" },
    ],
    columns: [
      "Loan ID / ID Préstamo",
      "Client / Cliente",
      "Closure Type / Tipo Cierre",
      "Closed Date / Fecha Cierre",
      "Final Amount / Monto Final",
    ],
    rows: [
      ["LN-09811", "Andrea Poma", "Maturity / Vencimiento", "2026-04-12", "USD 0"],
      ["LN-09855", "Raúl Arias", "Prepayment / Prepago", "2026-04-14", "USD 0"],
      ["LN-09901", "Nidia Soto", "Write-off / Castigo", "2026-04-16", "USD 0"],
    ],
  },
  "reports-portfolio": {
    title: "Portfolio Reports / Reportes de Cartera",
    subtitle:
      "Portfolio composition, risk and concentration metrics. / Composición de cartera, riesgo y concentración.",
    cards: [
      { label: "Portfolio Size / Tamaño Cartera", value: "USD 22.7M" },
      { label: "Top Sector / Sector Principal", value: "Retail 28% / Minorista 28%" },
      { label: "Concentration 10 / Concentración 10", value: "19.4%" },
    ],
    columns: [
      "Dimension / Dimensión",
      "Metric / Métrica",
      "Current / Actual",
      "Target / Meta",
      "Trend / Tendencia",
    ],
    rows: [
      ["Risk / Riesgo", "PAR 30 / PAR 30", "3.1% / 3.1%", "<= 4.0% / <= 4.0%", "Stable / Estable"],
      ["Yield / Rendimiento", "Portfolio Yield / Rendimiento de Cartera", "24.8% / 24.8%", ">= 22.0% / >= 22.0%", "Up / Alza"],
      ["Scale / Escala", "Active Accounts / Cuentas Activas", "7,942", "8,000", "Near / Cerca"],
    ],
  },
  "reports-cashflow": {
    title: "Cashflow Reports / Reportes de Flujo de Caja",
    subtitle:
      "Liquidity projections, inflows and outflows by horizon. / Proyecciones de liquidez, entradas y salidas por horizonte.",
    cards: [
      { label: "Net Today / Neto Hoy", value: "USD 74,200" },
      { label: "7-Day Projection / Proyección 7 Días", value: "USD 401,000" },
      { label: "Liquidity Buffer / Colchón Liquidez", value: "18 days / 18 días" },
    ],
    columns: [
      "Date / Fecha",
      "Inflows / Entradas",
      "Outflows / Salidas",
      "Net / Neto",
      "Cumulative / Acumulado",
    ],
    rows: [
      ["2026-04-20", "USD 142,300", "USD 68,100", "USD 74,200", "USD 74,200"],
      ["2026-04-21", "USD 131,500", "USD 79,900", "USD 51,600", "USD 125,800"],
      ["2026-04-22", "USD 118,200", "USD 96,700", "USD 21,500", "USD 147,300"],
    ],
  },
};

function resolveViewKey(pathKey: "customers" | "groups" | "loans" | "reports", view?: string): ScreenKey {
  if (pathKey === "customers") {
    return view === "set-aside" ? "customers-set-aside" : "customers-active-clients";
  }

  if (pathKey === "groups") {
    return view === "sin-miembros" ? "groups-sin-miembros" : "groups-active-loans";
  }

  if (pathKey === "reports") {
    return view === "cashflow" ? "reports-cashflow" : "reports-portfolio";
  }

  if (pathKey === "loans") {
    if (view === "pending-approval") return "loans-pending-approval";
    if (view === "close") return "loans-close";
    return "loans";
  }

  return "loans";
}

type ApiRouteInsightsBase = { /** Dentro de un layout que ya renderiza el topbar (p. ej. General/Financial setup). */ omitTopNavbar?: boolean };

export type ApiRouteInsightsScreenProps =
  | ({ screenKey: Exclude<ScreenKey, "customers-active-clients" | "customers-set-aside" | "groups-active-loans" | "groups-sin-miembros" | "loans-pending-approval" | "loans-close" | "reports-portfolio" | "reports-cashflow"> } & ApiRouteInsightsBase)
  | ({ pathKey: "customers" | "groups" | "loans" | "reports"; view?: string } & ApiRouteInsightsBase);

function getRowActions(key: ScreenKey): string[] {
  switch (key) {
    case "products":
      return ["View / Ver", "Edit / Editar", "Clone / Clonar", "Archive / Archivar"];
    case "settings-forms":
    case "settings-templates":
    case "settings-data":
    case "settings-id-templates":
    case "settings-authorization-holds":
      return ["View / Ver", "Edit / Editar", "Delete / Eliminar"];
    case "reports-portfolio":
    case "reports-cashflow":
      return ["Open / Abrir", "Export / Exportar", "Schedule / Programar"];
    case "accounting-profit-loss":
    case "accounting-balance-sheet":
    case "accounting-interest-accrual-breakdown":
    case "accounting-closures":
      return ["View / Ver", "Post / Contabilizar", "Export / Exportar"];
    case "loans-pending-approval":
      return ["Review / Revisar", "Approve / Aprobar", "Reject / Rechazar"];
    case "loans-close":
      return ["View / Ver", "Reopen / Reabrir", "Report / Reporte"];
    case "deposit-transactions":
      return ["View / Ver", "Reverse / Revertir", "Report / Reporte"];
    default:
      return ["View / Ver", "Edit / Editar", "Report / Reporte"];
  }
}

function localizeText(text: string, locale: "en" | "es"): string {
  const [en, es] = text.split(" / ");
  if (!es) return text;
  return locale === "es" ? es : en;
}

export function ApiRouteInsightsScreen(props: ApiRouteInsightsScreenProps) {
  const { locale } = useI18n();
  const omitTopNavbar = Boolean(props.omitTopNavbar);
  const key = "screenKey" in props ? props.screenKey : resolveViewKey(props.pathKey, props.view);
  const section = DATA_BY_KEY[key];
  const rowActions = getRowActions(key);
  const shouldRenderTopNav = !key.startsWith("accounting-") && !omitTopNavbar;
  const operationsHeader = localizeText("Operations / Operaciones", locale);
  const rootClassName = omitTopNavbar ? "api-insights-embedded" : "zelify-workspace-page";

  return (
    <div className={rootClassName}>
      {shouldRenderTopNav ? <ZelifyTopNavbar /> : null}
      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner">
          <h1 className="zelify-workspace-page__title">{localizeText(section.title, locale)}</h1>
          <p className="zelify-workspace-page__subtitle">{localizeText(section.subtitle, locale)}</p>

          <section className="api-insights__cards">
            {section.cards.map((card) => (
              <article key={card.label} className="api-insights__card">
                <span>{localizeText(card.label, locale)}</span>
                <strong>{localizeText(card.value, locale)}</strong>
              </article>
            ))}
          </section>

          <section className="api-insights__table-wrap">
            <table className="api-insights__table">
              <thead>
                <tr>
                  {section.columns.map((column) => (
                    <th key={column}>{localizeText(column, locale)}</th>
                  ))}
                  <th>{operationsHeader}</th>
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row, rowIndex) => (
                  <tr key={`${section.title}-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${section.title}-${rowIndex}-${cellIndex}`}>
                        {localizeText(cell, locale)}
                      </td>
                    ))}
                    <td>
                      <div className="api-insights__actions">
                        {rowActions.map((action) => (
                          <button
                            key={`${section.title}-${rowIndex}-${action}`}
                            type="button"
                            className="api-insights__action-btn"
                          >
                            {localizeText(action, locale)}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
}
