import { SCOTIA_CREDIT_SEED } from "@/modules/cortex/data/scotiabank-credit.seed";

export type ApplicationStatus = "approved" | "declined" | "pending" | "manualReview" | "overridden";
export type RiskLevel = "low" | "medium" | "high";
export type MdcApplicantMode = "natural" | "moral";

export type Application = {
  id: string;
  appNo: string;
  userId?: string | null;
  applicantId?: string;
  applicantName: string;
  applicantEmail: string;
  product: string;
  requestedAmount: number;
  currency: string;
  status: ApplicationStatus;
  risk: RiskLevel;
  riskScore: number;
  submittedAt: string;
  updatedAt?: string;
  /** Link KYC Zelify (natural + CURP). Válido ~24h. El link operable es el de MDC. */
  kycSessionId?: string | null;
  kycWebviewUrl?: string | null;
  zelifyUserId?: string | null;
  rawPayload?: any;
  analysis?: any;
  rulesBreakdown?: Array<{
    id?: string;
    name: string;
    severity?: string;
    status: string;
    passed?: boolean;
    matched?: boolean;
    reason?: string;
    conditions?: any[];
  }>;
  rulesBreakdownStatus?: string;
};

/**
 * Nombre para tabla/detalle. Alta natural ya no manda firstName/lastName
 * (los saca Zelify/INE), así que no usar "Desconocido" si hay email o CURP/RFC.
 */
export function resolveApplicantDisplayName(item: {
  personType?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  businessName?: string | null;
  fullName?: string | null;
  name?: string | null;
  email?: string | null;
  identificationNumber?: string | null;
}): string {
  const fullFromParts = `${item.firstName || ""} ${item.lastName || ""}`.trim();
  if (fullFromParts) return fullFromParts;
  if (item.fullName?.trim()) return item.fullName.trim();
  if (item.name?.trim()) return item.name.trim();
  if (item.personType === "moral" && item.businessName?.trim()) return item.businessName.trim();
  if (item.businessName?.trim()) return item.businessName.trim();
  const email = (item.email || "").trim();
  if (email && email.toLowerCase() !== "n/a") {
    const local = email.split("@")[0]?.trim();
    return local || email;
  }
  const id = (item.identificationNumber || "").trim();
  if (id) return id;
  return "Sin nombre";
}

export const NATURAL_CREDIT_PRODUCTS = ["Credito automotriz", "Credito personal"] as const;
export const MORAL_CREDIT_PRODUCTS = [
  "Credito simple empresarial",
  "Credito revolvente",
  "Arrendamiento financiero",
] as const;
export const CREDIT_PRODUCTS = NATURAL_CREDIT_PRODUCTS;

export type NaturalCreditProduct = (typeof NATURAL_CREDIT_PRODUCTS)[number];
export type MoralCreditProduct = (typeof MORAL_CREDIT_PRODUCTS)[number];
export type MdcCreditProduct = NaturalCreditProduct | MoralCreditProduct;

export type MdcClientPoolItem = {
  id: string;
  name: string;
  email: string;
  amount: number;
  creditScore: number;
  product: MdcCreditProduct;
};

function mapProductIdToMdcProduct(productId: string): NaturalCreditProduct {
  if (productId.startsWith("AUTO")) return "Credito automotriz";
  return "Credito personal";
}

export const LCC_MDC_CLIENTS: MdcClientPoolItem[] = SCOTIA_CREDIT_SEED.clients.map((client) => ({
  id: client.id,
  name: client.name,
  email: client.kyc.email,
  amount: client.amount,
  creditScore: client.creditScore,
  product: mapProductIdToMdcProduct(client.productId),
}));

export const LCC_AUTO_CLIENTS = LCC_MDC_CLIENTS.filter((client) => client.product === "Credito automotriz");
export const LCC_PERSONAL_CLIENTS = LCC_MDC_CLIENTS.filter((client) => client.product === "Credito personal");

export const PM_MDC_CLIENTS: MdcClientPoolItem[] = [
  {
    id: "PM-CU-500201",
    name: "TechStart Solutions SA de CV",
    email: "tesoreria@techstart.mx",
    amount: 4_800_000,
    creditScore: 710,
    product: "Credito revolvente",
  },
  {
    id: "PM-CU-500202",
    name: "Grupo Delta Industrial SA de CV",
    email: "finanzas@grupodelta.mx",
    amount: 7_600_000,
    creditScore: 692,
    product: "Credito simple empresarial",
  },
  {
    id: "PM-CU-500203",
    name: "Inversiones del Norte SA de CV",
    email: "tesoreria@inversionesnorte.mx",
    amount: 12_500_000,
    creditScore: 734,
    product: "Arrendamiento financiero",
  },
  {
    id: "PM-CU-500204",
    name: "Comercializadora Bajio Norte SA de CV",
    email: "direccion.financiera@bajionorte.mx",
    amount: 3_200_000,
    creditScore: 648,
    product: "Credito revolvente",
  },
  {
    id: "PM-CU-500205",
    name: "Logistica Maya Integral SA de CV",
    email: "control@logisticamaya.mx",
    amount: 9_400_000,
    creditScore: 721,
    product: "Credito simple empresarial",
  },
  {
    id: "PM-CU-500206",
    name: "Agroinsumos del Pacifico SA de CV",
    email: "tesoreria@agropacifico.mx",
    amount: 5_650_000,
    creditScore: 666,
    product: "Credito revolvente",
  },
  {
    id: "PM-CU-500207",
    name: "Servicios Hospitalarios Reforma SA de CV",
    email: "contraloria@shreforma.mx",
    amount: 8_900_000,
    creditScore: 705,
    product: "Credito simple empresarial",
  },
  {
    id: "PM-CU-500208",
    name: "Manufacturas Orion SA de CV",
    email: "planeacion@orionmanufactura.mx",
    amount: 11_100_000,
    creditScore: 752,
    product: "Arrendamiento financiero",
  },
  {
    id: "PM-CU-500209",
    name: "Distribuidora Electrica Metropoli SA de CV",
    email: "tesoreria@demetropoli.mx",
    amount: 6_700_000,
    creditScore: 681,
    product: "Credito revolvente",
  },
];

function hashSeed(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function riskFromRiskIndex(score: number): RiskLevel {
  const bureauScore = Math.round(850 - (Math.max(0, Math.min(100, score)) / 100) * 450);
  if (bureauScore <= 549) return "high";
  if (bureauScore <= 649) return "medium";
  return "low";
}

function amountBoundsByProduct(product: MdcCreditProduct) {
  if (product === "Credito personal") return { min: 25_000, max: 800_000, variance: 220_000 };
  if (product === "Credito automotriz") return { min: 100_000, max: 2_500_000, variance: 360_000 };
  if (product === "Credito revolvente") return { min: 750_000, max: 18_000_000, variance: 2_400_000 };
  if (product === "Arrendamiento financiero") return { min: 1_500_000, max: 30_000_000, variance: 4_200_000 };
  return { min: 1_000_000, max: 25_000_000, variance: 3_800_000 };
}

export const applicationsPerDay = [
  { label: "May 01", value: 4 },
  { label: "May 02", value: 5 },
  { label: "May 03", value: 4 },
  { label: "May 04", value: 5 },
  { label: "May 05", value: 5 },
  { label: "May 06", value: 7 },
  { label: "May 07", value: 6 },
];

export const overviewKpis = {
  totalApplications: { value: 36, deltaPct: 12.5, positive: true },
  approvedPct: { value: 25, deltaPct: 4.2, positive: true },
  declinedPct: { value: 16.7, deltaPct: -2.8, positive: true },
  avgAmount: { value: 412000, deltaPct: 5.1, positive: true },
};

export const recentApplicationsSeed: Application[] = [
  {
    id: "uuid-001",
    appNo: "APP-001284",
    applicantName: "Roberto Méndez García",
    applicantEmail: "roberto.mendez@gmail.com",
    product: "Credito automotriz",
    requestedAmount: 850000,
    currency: "MXN",
    status: "approved",
    risk: "low",
    riskScore: 28,
    submittedAt: "2026-05-07T10:24:00Z",
  },
  {
    id: "uuid-002",
    appNo: "APP-001283",
    applicantName: "María González Ruiz",
    applicantEmail: "maria.gonzalez@gmail.com",
    product: "Credito personal",
    requestedAmount: 180000,
    currency: "MXN",
    status: "manualReview",
    risk: "medium",
    riskScore: 54,
    submittedAt: "2026-05-07T09:12:00Z",
  },
  {
    id: "uuid-003",
    appNo: "APP-001282",
    applicantName: "Jorge Lima Herrera",
    applicantEmail: "jorge.lima@gmail.com",
    product: "Credito personal",
    requestedAmount: 95000,
    currency: "MXN",
    status: "declined",
    risk: "high",
    riskScore: 82,
    submittedAt: "2026-05-06T22:15:00Z",
  },
  {
    id: "uuid-004",
    appNo: "APP-001281",
    applicantName: "Carlos Ruiz Mendoza",
    applicantEmail: "carlos.ruiz@gmail.com",
    product: "Credito automotriz",
    requestedAmount: 450000,
    currency: "MXN",
    status: "overridden",
    risk: "medium",
    riskScore: 51,
    submittedAt: "2026-05-06T18:02:00Z",
  },
  {
    id: "uuid-005",
    appNo: "APP-001280",
    applicantName: "Ana Lucía Méndez Torres",
    applicantEmail: "ana.mendez@gmail.com",
    product: "Credito personal",
    requestedAmount: 320000,
    currency: "MXN",
    status: "approved",
    risk: "low",
    riskScore: 33,
    submittedAt: "2026-05-06T16:41:00Z",
  },
  {
    id: "uuid-006",
    appNo: "APP-001279",
    applicantName: "Juan Hernandez",
    applicantEmail: "juan.hernandez@gmail.com",
    product: "Credito automotriz",
    requestedAmount: 680000,
    currency: "MXN",
    status: "approved",
    risk: "low",
    riskScore: 24,
    submittedAt: "2026-05-06T15:09:00Z",
  },
];

const recentMoralApplicationsSeed: Application[] = [
  {
    id: "pm-uuid-001",
    appNo: "APP-PM-100284",
    applicantName: "TechStart Solutions SA de CV",
    applicantEmail: "tesoreria@techstart.mx",
    product: "Credito revolvente",
    requestedAmount: 4_200_000,
    currency: "MXN",
    status: "approved",
    risk: "low",
    riskScore: 35,
    submittedAt: "2026-05-07T11:18:00Z",
  },
  {
    id: "pm-uuid-002",
    appNo: "APP-PM-100283",
    applicantName: "Grupo Delta Industrial SA de CV",
    applicantEmail: "finanzas@grupodelta.mx",
    product: "Credito simple empresarial",
    requestedAmount: 8_800_000,
    currency: "MXN",
    status: "manualReview",
    risk: "medium",
    riskScore: 56,
    submittedAt: "2026-05-07T09:42:00Z",
  },
  {
    id: "pm-uuid-003",
    appNo: "APP-PM-100282",
    applicantName: "Inversiones del Norte SA de CV",
    applicantEmail: "tesoreria@inversionesnorte.mx",
    product: "Arrendamiento financiero",
    requestedAmount: 12_600_000,
    currency: "MXN",
    status: "approved",
    risk: "low",
    riskScore: 29,
    submittedAt: "2026-05-07T08:51:00Z",
  },
  {
    id: "pm-uuid-004",
    appNo: "APP-PM-100281",
    applicantName: "Comercializadora Bajio Norte SA de CV",
    applicantEmail: "direccion.financiera@bajionorte.mx",
    product: "Credito revolvente",
    requestedAmount: 2_150_000,
    currency: "MXN",
    status: "declined",
    risk: "high",
    riskScore: 79,
    submittedAt: "2026-05-06T20:05:00Z",
  },
  {
    id: "pm-uuid-005",
    appNo: "APP-PM-100280",
    applicantName: "Logistica Maya Integral SA de CV",
    applicantEmail: "control@logisticamaya.mx",
    product: "Credito simple empresarial",
    requestedAmount: 6_900_000,
    currency: "MXN",
    status: "overridden",
    risk: "medium",
    riskScore: 52,
    submittedAt: "2026-05-06T18:24:00Z",
  },
  {
    id: "pm-uuid-006",
    appNo: "APP-PM-100279",
    applicantName: "Agroinsumos del Pacifico SA de CV",
    applicantEmail: "tesoreria@agropacifico.mx",
    product: "Credito revolvente",
    requestedAmount: 3_400_000,
    currency: "MXN",
    status: "pending",
    risk: "medium",
    riskScore: 61,
    submittedAt: "2026-05-06T15:31:00Z",
  },
];

function buildApplications(seed: Application[], products: readonly MdcCreditProduct[], clientPoolByProduct: Record<string, MdcClientPoolItem[]>, totalGenerated: number, prefix: string) {
  const rows: Application[] = seed.map((row) => ({ ...row }));
  const statuses: ApplicationStatus[] = ["approved", "declined", "pending", "manualReview", "overridden"];

  for (let i = 0; i < totalGenerated; i++) {
    const id = `${prefix}-${i}`;
    const product = products[hashSeed(id + "p") % products.length]!;
    const productPool = clientPoolByProduct[product] ?? [];
    const sourceClient = productPool[hashSeed(id + "pool") % Math.max(productPool.length, 1)] ?? productPool[0];
    if (!sourceClient) continue;
    const status = statuses[hashSeed(id + "s") % statuses.length]!;
    const day = 1 + (hashSeed(id + "d") % 28);
    const hour = hashSeed(id + "h") % 24;
    const bounds = amountBoundsByProduct(product);
    const requestedAmount = Math.min(
      bounds.max,
      Math.max(
        bounds.min,
        sourceClient.amount + ((hashSeed(id + "adj") % (bounds.variance * 2)) - bounds.variance),
      ),
    );
    const riskScore = Math.max(15, Math.min(89, Math.round(100 - sourceClient.creditScore / 10) + ((hashSeed(id + "risk") % 9) - 4)));

    rows.push({
      id: `${prefix}-uuid-${1000 + i}`,
      appNo: `${prefix.toUpperCase()}-${String(1276 - i).padStart(6, "0")}`,
      applicantName: sourceClient.name,
      applicantEmail: sourceClient.email,
      product,
      requestedAmount,
      currency: "MXN",
      status,
      risk: riskFromRiskIndex(riskScore),
      riskScore,
      submittedAt: new Date(Date.UTC(2026, 4, day, hour, (hashSeed(id + "m") % 59) + 1, 0)).toISOString(),
    });
  }

  return rows
    .map((row) => ({
      ...row,
      risk: riskFromRiskIndex(row.riskScore),
    }))
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

const naturalPoolByProduct: Record<string, MdcClientPoolItem[]> = {
  "Credito automotriz": LCC_AUTO_CLIENTS.length > 0 ? LCC_AUTO_CLIENTS : LCC_MDC_CLIENTS,
  "Credito personal": LCC_PERSONAL_CLIENTS.length > 0 ? LCC_PERSONAL_CLIENTS : LCC_MDC_CLIENTS,
};

const moralPoolByProduct: Record<string, MdcClientPoolItem[]> = {
  "Credito simple empresarial": PM_MDC_CLIENTS.filter((client) => client.product === "Credito simple empresarial"),
  "Credito revolvente": PM_MDC_CLIENTS.filter((client) => client.product === "Credito revolvente"),
  "Arrendamiento financiero": PM_MDC_CLIENTS.filter((client) => client.product === "Arrendamiento financiero"),
};

export const applicationsListMock: Application[] = buildApplications(
  recentApplicationsSeed,
  NATURAL_CREDIT_PRODUCTS,
  naturalPoolByProduct,
  28,
  "app",
);

export const applicationsListMockMoral: Application[] = buildApplications(
  recentMoralApplicationsSeed,
  MORAL_CREDIT_PRODUCTS,
  moralPoolByProduct,
  24,
  "pm-app",
);

export const CREDIT_PRODUCTS_BY_MODE: Record<MdcApplicantMode, readonly MdcCreditProduct[]> = {
  natural: NATURAL_CREDIT_PRODUCTS,
  moral: MORAL_CREDIT_PRODUCTS,
};

export const APPLICATIONS_BY_MODE: Record<MdcApplicantMode, Application[]> = {
  natural: applicationsListMock,
  moral: applicationsListMockMoral,
};

export const CLIENT_POOL_BY_MODE: Record<MdcApplicantMode, MdcClientPoolItem[]> = {
  natural: LCC_MDC_CLIENTS,
  moral: PM_MDC_CLIENTS,
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  approved: "Aprobada",
  declined: "Rechazada",
  pending: "Pendiente",
  manualReview: "Revision manual",
  overridden: "Override",
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
};
