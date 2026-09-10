export type ProductStatus = "ACTIVO" | "INACTIVO" | "BORRADOR" | "SUSPENDIDO";
export type MdcApplicantMode = "natural" | "moral";

export type MdcProduct = {
  id: string;
  name: string;
  description: string;
  status: ProductStatus;
  metrics: {
    activeClients: number;
    totalPortfolio: number;
  };
  configuration: {
    interestRate: { min: number; max: number };
    amount: { min: number; max: number };
    residualAmount: number;
    term: { min: number; max: number; frequency: string };
  };
};

export const NATURAL_MDC_PRODUCTS: MdcProduct[] = [
  {
    id: "product_001",
    name: "Credito automotriz",
    description: "Financiamiento para compra de vehiculos.",
    status: "ACTIVO",
    metrics: {
      activeClients: 10,
      totalPortfolio: 5_460_000,
    },
    configuration: {
      interestRate: { min: 13, max: 15 },
      amount: { min: 100_000, max: 2_500_000 },
      residualAmount: 20,
      term: { min: 12, max: 60, frequency: "mensual" },
    },
  },
  {
    id: "product_002",
    name: "Credito personal",
    description: "Financiamiento para consumo y necesidades personales.",
    status: "ACTIVO",
    metrics: {
      activeClients: 8,
      totalPortfolio: 1_880_000,
    },
    configuration: {
      interestRate: { min: 19, max: 22 },
      amount: { min: 25_000, max: 800_000 },
      residualAmount: 0,
      term: { min: 6, max: 48, frequency: "mensual" },
    },
  },
  {
    id: "product_003",
    name: "Credito hipotecario",
    description: "Financiamiento para adquisicion o construccion de vivienda.",
    status: "ACTIVO",
    metrics: {
      activeClients: 5,
      totalPortfolio: 12_350_000,
    },
    configuration: {
      interestRate: { min: 9.5, max: 12.5 },
      amount: { min: 500_000, max: 8_000_000 },
      residualAmount: 0,
      term: { min: 60, max: 240, frequency: "mensual" },
    },
  },
  {
    id: "product_004",
    name: "Credito nomina",
    description: "Prestamo con descuento automatico via nomina del empleado.",
    status: "ACTIVO",
    metrics: {
      activeClients: 22,
      totalPortfolio: 3_120_000,
    },
    configuration: {
      interestRate: { min: 15, max: 18 },
      amount: { min: 10_000, max: 300_000 },
      residualAmount: 0,
      term: { min: 6, max: 36, frequency: "mensual" },
    },
  },
  {
    id: "product_005",
    name: "Credito educativo",
    description: "Financiamiento para gastos escolares, posgrados y certificaciones.",
    status: "ACTIVO",
    metrics: {
      activeClients: 4,
      totalPortfolio: 820_000,
    },
    configuration: {
      interestRate: { min: 10, max: 14 },
      amount: { min: 15_000, max: 500_000 },
      residualAmount: 0,
      term: { min: 6, max: 60, frequency: "mensual" },
    },
  },
  {
    id: "product_006",
    name: "Microprestamo",
    description: "Credito de liquidez rapida para necesidades urgentes de corto plazo.",
    status: "ACTIVO",
    metrics: {
      activeClients: 31,
      totalPortfolio: 620_000,
    },
    configuration: {
      interestRate: { min: 24, max: 36 },
      amount: { min: 2_000, max: 20_000 },
      residualAmount: 0,
      term: { min: 1, max: 12, frequency: "mensual" },
    },
  },
];

export const MORAL_MDC_PRODUCTS: MdcProduct[] = [
  {
    id: "pm_product_001",
    name: "Credito simple empresarial",
    description: "Financiamiento para expansion, equipo y necesidades de capital de empresas constituidas en Mexico.",
    status: "ACTIVO",
    metrics: {
      activeClients: 14,
      totalPortfolio: 42_800_000,
    },
    configuration: {
      interestRate: { min: 14.5, max: 18.5 },
      amount: { min: 1_000_000, max: 25_000_000 },
      residualAmount: 0,
      term: { min: 12, max: 60, frequency: "mensual" },
    },
  },
  {
    id: "pm_product_002",
    name: "Credito revolvente",
    description: "Linea revolvente para necesidades operativas, inventario y tesoreria de empresas medianas.",
    status: "ACTIVO",
    metrics: {
      activeClients: 11,
      totalPortfolio: 28_600_000,
    },
    configuration: {
      interestRate: { min: 13.8, max: 17.2 },
      amount: { min: 750_000, max: 18_000_000 },
      residualAmount: 0,
      term: { min: 6, max: 36, frequency: "mensual" },
    },
  },
  {
    id: "pm_product_003",
    name: "Arrendamiento financiero",
    description: "Estructura para adquisicion de equipo, flotilla o activo productivo con garantia sobre el bien.",
    status: "ACTIVO",
    metrics: {
      activeClients: 9,
      totalPortfolio: 36_100_000,
    },
    configuration: {
      interestRate: { min: 12.9, max: 16.4 },
      amount: { min: 1_500_000, max: 30_000_000 },
      residualAmount: 10,
      term: { min: 24, max: 72, frequency: "mensual" },
    },
  },
];

export const MDC_PRODUCTS_BY_MODE: Record<MdcApplicantMode, MdcProduct[]> = {
  natural: NATURAL_MDC_PRODUCTS,
  moral: MORAL_MDC_PRODUCTS,
};

export const MDC_PRODUCTS = NATURAL_MDC_PRODUCTS;

export function formatMdcNumber(value: number) {
  return new Intl.NumberFormat("es-MX").format(value);
}
