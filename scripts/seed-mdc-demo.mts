import {
  APPLICATIONS_BY_MODE,
  type Application,
  type MdcApplicantMode,
} from "../src/modules/mdc/data/mdc-credit-mock";
import { MDC_PRODUCTS_BY_MODE } from "../src/modules/mdc/data/mdc-products-mock";
import { CREDIT_RULES_BY_MODE } from "../src/modules/mdc/data/mdc-rules-mock";

const BASE_URL = process.env.MDC_API_URL ?? "http://127.0.0.1:3000";
const DEFAULT_ORG_IDS = ["demo-bypass-org"];
const ORG_IDS = (
  process.env.MDC_DEMO_ORG_IDS?.split(",").map((s) => s.trim()).filter(Boolean) ??
  DEFAULT_ORG_IDS
);
const DEMO_ORG = ORG_IDS[0] ?? "demo-bypass-org";

const STATUS_TO_BACKEND: Record<Application["status"], string> = {
  approved: "Aprobada",
  declined: "Rechazada",
  pending: "Pendiente",
  manualReview: "Revision manual",
  overridden: "Override",
};

const STATUS_ACTIVO = "ACTIVE";
const STATUS_INACTIVO = "INACTIVE";

type Args = {
  requests: boolean;
  products: boolean;
  rules: boolean;
  collections: boolean;
  dryRun: boolean;
};

function parseArgs(argv: string[]): Args {
  const flags = new Set(argv.slice(2));
  const hasOnly = Array.from(flags).some((f) =>
    ["--requests", "--products", "--rules", "--collections"].includes(f),
  );
  return {
    requests: hasOnly ? flags.has("--requests") : true,
    products: hasOnly ? flags.has("--products") : true,
    rules: hasOnly ? flags.has("--rules") : true,
    collections: hasOnly ? flags.has("--collections") : true,
    dryRun: flags.has("--dry-run"),
  };
}

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 300)}`);
  }
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

async function runConcurrently<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      await fn(current);
    }
  });
  await Promise.all(workers);
}

function splitPersonName(fullName: string): { firstName: string; lastName?: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0] ?? "" };
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

function requestPayload(mode: MdcApplicantMode, app: Application, orgId: string) {
  const base = {
    orgId,
    personType: mode,
    email: app.applicantEmail,
    product: app.product,
    amount: app.requestedAmount,
    status: STATUS_TO_BACKEND[app.status],
  };
  if (mode === "natural") {
    const { firstName, lastName } = splitPersonName(app.applicantName);
    return { ...base, firstName, ...(lastName ? { lastName } : {}) };
  }
  return { ...base, businessName: app.applicantName };
}

async function clearRequests(orgId: string, dryRun: boolean): Promise<number> {
  const existing = await api<{ id: string }[]>(
    "GET",
    `/finance-requests?orgId=${encodeURIComponent(orgId)}`,
  );
  if (dryRun) return existing.length;
  await runConcurrently(existing, 8, (r) => api("DELETE", `/finance-requests/${r.id}`));
  return existing.length;
}

async function seedRequests(orgId: string, dryRun: boolean): Promise<{ removed: number; created: number }> {
  const removed = await clearRequests(orgId, dryRun);
  const payloads = (["natural", "moral"] as const).flatMap((mode) =>
    APPLICATIONS_BY_MODE[mode].map((app) => requestPayload(mode, app, orgId)),
  );
  if (dryRun) return { removed, created: payloads.length };
  const created: { id: string }[] = [];
  await runConcurrently(payloads, 8, async (payload) => {
    created.push(await api<{ id: string }>("POST", "/finance-requests", payload));
  });
  return { removed, created: created.length };
}

async function clearProducts(orgId: string, dryRun: boolean): Promise<number> {
  const existing = await api<{ id: string }[]>(
    "GET",
    `/finance-products?orgId=${encodeURIComponent(orgId)}`,
  );
  if (dryRun) return existing.length;
  await runConcurrently(existing, 8, (p) => api("DELETE", `/finance-products/${p.id}`));
  return existing.length;
}

function productPayload(mode: MdcApplicantMode, product: (typeof MDC_PRODUCTS_BY_MODE)[MdcApplicantMode][number], orgId: string) {
  const frequency = (product.configuration.term.frequency ?? "mensual").toUpperCase();
  return {
    orgId,
    financialProduct: product.name,
    creditRate: product.configuration.interestRate.max,
    defaultInterestRate: product.configuration.interestRate.max,
    ivaType: "GENERAL",
    paymentScheme: "AMORTIZADO",
    dueDatesCount: product.configuration.term.max,
    creditPoints: "0.00000 x 0.00000",
    defaultPoints: "0.0000",
    ivaZone: "FRONTERA",
    paymentPeriod: frequency,
    scheme: "FIJO",
    gracePeriod: 0,
    contractType: "APERTURA_CREDITO",
    paymentFrequency: frequency,
    operationalClassification: "COMERCIAL",
    minimumAmount: product.configuration.amount.min,
    maximumAmount: product.configuration.amount.max,
    individualPerson: mode === "natural",
    legalEntity: mode === "moral",
    businessActivityIndividual: true,
    indistinct: false,
    guaranteedWithFega: false,
    guaranteedWithFonaga: false,
    contractDestination: "CAPITAL_TRABAJO",
    status: product.status === "ACTIVO" ? STATUS_ACTIVO : STATUS_INACTIVO,
  };
}

async function seedProducts(orgId: string, dryRun: boolean): Promise<{ removed: number; created: number }> {
  const removed = await clearProducts(orgId, dryRun);
  const payloads = (["natural", "moral"] as const).flatMap((mode) =>
    MDC_PRODUCTS_BY_MODE[mode].map((product) => productPayload(mode, product, orgId)),
  );
  if (dryRun) return { removed, created: payloads.length };
  const res = await api<{ ids: string[] }>("POST", "/finance-products/bulk", payloads);
  return { removed, created: res.ids.length };
}

async function clearDemoRules(dryRun: boolean): Promise<number> {
  const demoRuleNames = new Set(
    [...CREDIT_RULES_BY_MODE.natural, ...CREDIT_RULES_BY_MODE.moral].map((r) => r.name),
  );
  const existing = await api<{ id: string; name: string }[]>(
    "GET",
    `/decision-rules?orgId=${encodeURIComponent(DEMO_ORG)}`,
  );
  const toDelete = existing.filter((rule) => demoRuleNames.has(rule.name));
  if (dryRun) return toDelete.length;
  await runConcurrently(toDelete, 8, (rule) => api("DELETE", `/decision-rules/${rule.id}`));
  return toDelete.length;
}

async function seedRules(dryRun: boolean): Promise<{ removed: number; created: number }> {
  const removed = await clearDemoRules(dryRun);
  const payloads = (["natural", "moral"] as const).flatMap((mode) =>
    CREDIT_RULES_BY_MODE[mode].map((rule) => ({
      orgId: DEMO_ORG,
      name: rule.name,
      products: rule.products as string[],
      field: rule.field,
      operator: rule.operator,
      value: rule.value,
      dataType: rule.dataType,
      status: rule.status,
      description: rule.description,
      severity: rule.severity,
      decisionBands: rule.decisionBands ?? null,
      individualPerson: mode === "natural",
      legalEntity: mode === "moral",
    })),
  );
  if (dryRun) return { removed, created: payloads.length };
  let created = 0;
  await runConcurrently(payloads, 8, async (payload) => {
    await api("POST", "/decision-rules", payload);
    created += 1;
  });
  return { removed, created };
}

type CollectionSeed = {
  applicationNo: string;
  customerName: string;
  email: string;
  phone: string;
  identification: string;
  birthDate: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  amountDue: number;
  dpd: number;
  status: "active" | "escalated";
  assignedAgent: string;
  lastActivity: string;
};

const NATURAL_COLLECTIONS: CollectionSeed[] = [
  {
    applicationNo: "APP-001284",
    customerName: "Roberto Méndez García",
    email: "roberto.mendez@gmail.com",
    phone: "+52 55 1234 5678",
    identification: "MEGR850315HDFRNB02",
    birthDate: "1985-03-15",
    address: "Av. Vasco de Quiroga 3000, Col. Santa Fe",
    city: "Ciudad de México",
    state: "CDMX",
    zipCode: "01210",
    amountDue: 48250,
    dpd: 32,
    status: "active",
    assignedAgent: "Lucía Fernández",
    lastActivity: "2026-05-06",
  },
  {
    applicationNo: "APP-001283",
    customerName: "María González Ruiz",
    email: "maria.gonzalez@gmail.com",
    phone: "+52 55 2345 6789",
    identification: "GORM860912MDFNLR05",
    birthDate: "1986-09-12",
    address: "Calle Emilio Castelar 45, Polanco",
    city: "Ciudad de México",
    state: "CDMX",
    zipCode: "11560",
    amountDue: 91500,
    dpd: 61,
    status: "escalated",
    assignedAgent: "Miguel Torres",
    lastActivity: "2026-05-07",
  },
  {
    applicationNo: "APP-001282",
    customerName: "Jorge Lima Herrera",
    email: "jorge.lima@gmail.com",
    phone: "+52 81 3456 7890",
    identification: "LIHJ780527HNLMTR04",
    birthDate: "1978-05-27",
    address: "Av. Constitución 1200, Monterrey",
    city: "Monterrey",
    state: "Nuevo León",
    zipCode: "64000",
    amountDue: 34600,
    dpd: 45,
    status: "active",
    assignedAgent: "Karla Reyes",
    lastActivity: "2026-05-05",
  },
  {
    applicationNo: "APP-001281",
    customerName: "Carlos Ruiz Mendoza",
    email: "carlos.ruiz@gmail.com",
    phone: "+52 33 4567 8901",
    identification: "RUMC900214HJCMNR07",
    birthDate: "1990-02-14",
    address: "Av. Américas 1600, Providencia",
    city: "Guadalajara",
    state: "Jalisco",
    zipCode: "44630",
    amountDue: 12950,
    dpd: 22,
    status: "active",
    assignedAgent: "Lucía Fernández",
    lastActivity: "2026-05-04",
  },
];

const MORAL_COLLECTIONS: CollectionSeed[] = [
  {
    applicationNo: "APP-PM-100284",
    customerName: "TechStart Solutions SA de CV",
    email: "tesoreria@techstart.mx",
    phone: "+52 55 1111 2233",
    identification: "TSS200515H45",
    birthDate: "2020-05-15",
    address: "Av. Insurgentes Sur 1400, Col. Juárez",
    city: "Ciudad de México",
    state: "CDMX",
    zipCode: "06600",
    amountDue: 228000,
    dpd: 28,
    status: "active",
    assignedAgent: "Alejandra Núñez",
    lastActivity: "2026-05-06",
  },
  {
    applicationNo: "APP-PM-100283",
    customerName: "Grupo Delta Industrial SA de CV",
    email: "finanzas@grupodelta.mx",
    phone: "+52 81 2222 3344",
    identification: "GDI2008185T1",
    birthDate: "2018-08-18",
    address: "Blvd. Díaz Ordaz 200, San Pedro Garza García",
    city: "Monterrey",
    state: "Nuevo León",
    zipCode: "66220",
    amountDue: 415000,
    dpd: 55,
    status: "escalated",
    assignedAgent: "Fernando Ortega",
    lastActivity: "2026-05-07",
  },
  {
    applicationNo: "APP-PM-100279",
    customerName: "Agroinsumos del Pacifico SA de CV",
    email: "tesoreria@agropacifico.mx",
    phone: "+52 33 3333 4455",
    identification: "ADP2007048A1",
    birthDate: "2004-07-04",
    address: "Calz. Lázaro Cárdenas 800, Zapopan",
    city: "Zapopan",
    state: "Jalisco",
    zipCode: "45010",
    amountDue: 187500,
    dpd: 74,
    status: "escalated",
    assignedAgent: "Daniela Vega",
    lastActivity: "2026-05-05",
  },
  {
    applicationNo: "APP-PM-100281",
    customerName: "Comercializadora Bajio Norte SA de CV",
    email: "direccion.financiera@bajionorte.mx",
    phone: "+52 477 444 5566",
    identification: "CBN1903126K4",
    birthDate: "2019-03-12",
    address: "Av. Puente del Trabajo 500, León",
    city: "León",
    state: "Guanajuato",
    zipCode: "37480",
    amountDue: 96300,
    dpd: 19,
    status: "active",
    assignedAgent: "Alejandra Núñez",
    lastActivity: "2026-05-04",
  },
];

async function clearCollections(mode: MdcApplicantMode, dryRun: boolean): Promise<number> {
  const existing = await api<{ id: string }[]>(
    "GET",
    `/collections?mode=${mode}&orgId=${encodeURIComponent(DEMO_ORG)}`,
  );
  if (dryRun) return existing.length;
  await runConcurrently(existing, 8, (c) => api("DELETE", `/collections/${c.id}`));
  return existing.length;
}

function collectionPayload(mode: MdcApplicantMode, seed: CollectionSeed) {
  return {
    ...seed,
    orgId: DEMO_ORG,
    individualPerson: mode === "natural",
    legalEntity: mode === "moral",
  };
}

async function seedCollections(dryRun: boolean): Promise<{ removed: number; created: number }> {
  let removed = 0;
  let created = 0;
  for (const mode of ["natural", "moral"] as const) {
    removed += await clearCollections(mode, dryRun);
    const seeds = mode === "natural" ? NATURAL_COLLECTIONS : MORAL_COLLECTIONS;
    if (dryRun) {
      created += seeds.length;
      continue;
    }
    await runConcurrently(seeds, 8, async (seed) => {
      await api("POST", "/collections", collectionPayload(mode, seed));
      created += 1;
    });
  }
  return { removed, created };
}

function log(label: string, counts: { removed: number; created: number }) {
  console.log(`  ${label}: ${counts.created} creados · ${counts.removed} eliminados`);
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`MDC demo seed · ${BASE_URL}`);
  console.log(`Org IDs: ${ORG_IDS.join(", ")}`);
  console.log(`Modo: ${args.dryRun ? "DRY-RUN (sin cambios)" : "ejecución real"}`);

  if (args.requests) {
    for (const orgId of ORG_IDS) {
      log(`finance-requests (${orgId})`, await seedRequests(orgId, args.dryRun));
    }
  }

  if (args.products) {
    for (const orgId of ORG_IDS) {
      log(`finance-products (${orgId})`, await seedProducts(orgId, args.dryRun));
    }
  }

  if (args.rules) {
    log("decision-rules", await seedRules(args.dryRun));
  }

  if (args.collections) {
    log("collections", await seedCollections(args.dryRun));
  }

  console.log("Seed completado.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});