"use client";

import { demoSatFiscalData } from "@/modules/kyb/lib/demo-prefill";

export type KybCompanyContext = {
  source: "mdc";
  applicationId: string;
  applicationNo: string;
  legalName: string;
  email: string;
  rfc: string;
  product: string;
  requestedAmount: number;
  riskScore: number;
  status: string;
  website: string;
  phone: string;
  address: string;
  state: string;
  registrationDate: string;
  industrySummary: string;
  targetMarket: string;
  revenueModel: string;
  competitiveEdge: string;
  estimatedAnnualRevenue: string;
  averageTicket: string;
  operatingRegions: string;
  apiFootprint: string;
  credentialFootprint: string;
};

type KybCompanyProfile = Omit<
  KybCompanyContext,
  "source" | "applicationId" | "applicationNo" | "email" | "product" | "requestedAmount" | "riskScore" | "status" | "legalName"
>;

type ApplicationLike = {
  id: string;
  appNo: string;
  applicantName: string;
  applicantEmail: string;
  product: string;
  requestedAmount: number;
  riskScore: number;
  status: string;
};

function isLocalApplication(applicationId: string) {
  return applicationId.startsWith("local-");
}

const ACTIVE_KYB_COMPANY_KEY = "zelify:kyb:active-company";
const KYB_COMPANY_REGISTRY_KEY = "zelify:kyb:company-registry";

const COMPANY_PROFILES: Record<string, KybCompanyProfile> = {
  "GRUPO DELTA INDUSTRIAL SA DE CV": {
    rfc: "MOR220518KJ4",
    website: "https://www.orionmanufactura.mx",
    phone: "+52 81 8624 1180",
    address: "Parque Industrial Mitras Norte, Nave 14, Av. Industria Metalúrgica 480, García, C.P. 66023, Nuevo León, México",
    state: "Nuevo León",
    registrationDate: "2022-05-18",
    industrySummary:
      "Fabricación B2B de piezas y subconjuntos metálicos para clientes industriales, con contratos de suministro recurrentes y producción bajo especificación.",
    targetMarket:
      "OEMs, constructoras industriales y distribuidores nacionales con operación en manufactura, infraestructura eléctrica y autopartes.",
    revenueModel:
      "Ingresos por órdenes de producción, contratos marco de suministro y servicios de corte, doblado y ensamble especializados.",
    competitiveEdge:
      "Integración vertical, entregas just-in-time y trazabilidad por lote para clientes industriales de alta demanda.",
    estimatedAnnualRevenue: "$126,000,000 MXN",
    averageTicket: "$148,000 MXN",
    operatingRegions: "México (nacional) con envíos recurrentes a Nuevo León, Coahuila, Querétaro y Jalisco.",
    apiFootprint:
      "https://erp.orionmanufactura.mx/api/zelify, https://portal.orionmanufactura.mx/webhooks/credito, https://sandbox.orionmanufactura.mx/api",
    credentialFootprint: "sk_dev_orion_72LmQp911, pk_dev_orion_18QaZp440",
  },
  "Agroinsumos del Pacifico SA de CV": {
    rfc: "ADP170911QW2",
    website: "https://www.agropacifico.mx",
    phone: "+52 667 182 4400",
    address: "Blvd. Agricultores 1180, Parque Logístico Culiacán Norte, Culiacán, C.P. 80020, Sinaloa, México",
    state: "Sinaloa",
    registrationDate: "2017-09-11",
    industrySummary:
      "Distribución B2B de agroquímicos, semillas y nutrición vegetal para productores medianos y grandes del noroeste.",
    targetMarket:
      "Campos agrícolas tecnificados, distribuidores regionales y asociaciones de productores con ciclos de compra estacionales.",
    revenueModel:
      "Ventas mayoristas por campaña, líneas de crédito comercial para agricultores y contratos de suministro programado.",
    competitiveEdge:
      "Cobertura regional, inventario de temporada y servicio técnico agronómico en campo.",
    estimatedAnnualRevenue: "$94,000,000 MXN",
    averageTicket: "$212,000 MXN",
    operatingRegions: "Sinaloa, Sonora, Nayarit y Baja California Sur.",
    apiFootprint:
      "https://erp.agropacifico.mx/api/clientes, https://portal.agropacifico.mx/webhooks/pagos",
    credentialFootprint: "sk_dev_agropacifico_114, pk_dev_agropacifico_882",
  },
  "Servicios Hospitalarios Reforma SA de CV": {
    rfc: "SHR140327NE8",
    website: "https://www.shreforma.mx",
    phone: "+52 55 6247 9100",
    address: "Av. Paseo de la Reforma 1640, Piso 9, Miguel Hidalgo, C.P. 11000, Ciudad de México, México",
    state: "Ciudad de México",
    registrationDate: "2014-03-27",
    industrySummary:
      "Prestación de servicios hospitalarios, laboratorio y cirugía ambulatoria para cuentas corporativas y aseguradoras.",
    targetMarket:
      "Aseguradoras, empresas con planes colectivos de salud y pacientes particulares de ticket alto.",
    revenueModel:
      "Ingresos por procedimientos, hospitalización, convenios corporativos y facturación a aseguradoras.",
    competitiveEdge:
      "Alta ocupación, especialidades críticas y convenios estables con aseguradoras nacionales.",
    estimatedAnnualRevenue: "$186,000,000 MXN",
    averageTicket: "$36,500 MXN",
    operatingRegions: "Ciudad de México, Estado de México y atención referida nacional.",
    apiFootprint:
      "https://integraciones.shreforma.mx/api/facturacion, https://portal.shreforma.mx/webhooks/expedientes",
    credentialFootprint: "sk_dev_shr_447, pk_dev_shr_225",
  },
  "TechStart Solutions SA de CV": {
    rfc: "TSS190614AB7",
    website: "https://www.techstart.mx",
    phone: "+52 33 3652 7140",
    address: "Av. Américas 1450, Piso 6, Guadalajara, C.P. 44630, Jalisco, México",
    state: "Jalisco",
    registrationDate: "2019-06-14",
    industrySummary:
      "Desarrollo de software B2B y automatización para tesorería, conciliación y operación financiera corporativa.",
    targetMarket:
      "Empresas medianas, fintechs y áreas de tesorería que requieren integraciones API y operación multibanco.",
    revenueModel:
      "Suscripciones SaaS, implementación inicial, soporte premium y servicios de integración.",
    competitiveEdge:
      "Despliegue rápido, conectividad con ERPs y capacidades de conciliación transaccional empresarial.",
    estimatedAnnualRevenue: "$72,000,000 MXN",
    averageTicket: "$94,000 MXN",
    operatingRegions: "México con cartera principal en Jalisco, CDMX, Nuevo León y Querétaro.",
    apiFootprint:
      "https://api.techstart.mx/v1/clients, https://hooks.techstart.mx/credit-originations",
    credentialFootprint: "sk_dev_techstart_774, pk_dev_techstart_412",
  },
  "Distribuidora Electrica Metropoli SA de CV": {
    rfc: "DEM160822UF3",
    website: "https://www.demetropoli.mx",
    phone: "+52 55 5862 0030",
    address: "Calz. Ignacio Zaragoza 3021, Iztapalapa, C.P. 09230, Ciudad de México, México",
    state: "Ciudad de México",
    registrationDate: "2016-08-22",
    industrySummary:
      "Comercialización y distribución de material eléctrico para proyectos de construcción, mantenimiento e infraestructura.",
    targetMarket:
      "Contratistas eléctricos, constructoras, mantenimiento industrial y distribuidores secundarios.",
    revenueModel:
      "Venta mayorista con crédito comercial, surtido por proyecto y contratos de suministro programado.",
    competitiveEdge:
      "Cobertura metropolitana, entregas de última milla y amplio catálogo de inventario crítico.",
    estimatedAnnualRevenue: "$118,000,000 MXN",
    averageTicket: "$164,000 MXN",
    operatingRegions: "CDMX, Estado de México, Puebla, Hidalgo y Querétaro.",
    apiFootprint:
      "https://erp.demetropoli.mx/api/orders, https://portal.demetropoli.mx/webhooks/inventory",
    credentialFootprint: "sk_dev_dem_541, pk_dev_dem_123",
  },
  "Grupo Delta Industrial SA de CV": {
    rfc: "GDI150403PX6",
    website: "https://www.grupodeltaindustrial.mx",
    phone: "+52 81 4441 2800",
    address: "Carretera a Colombia Km 18.5, Escobedo, C.P. 66052, Nuevo León, México",
    state: "Nuevo León",
    registrationDate: "2015-04-03",
    industrySummary:
      "Holding industrial con operación en manufactura pesada, mantenimiento industrial y servicios de ingeniería.",
    targetMarket:
      "Industria automotriz, acerera, energía e infraestructura con necesidades de mantenimiento especializado.",
    revenueModel:
      "Contratos anuales, proyectos EPC y órdenes de mantenimiento industrial recurrente.",
    competitiveEdge:
      "Capacidad instalada, certificaciones industriales y operación multi-planta en el norte del país.",
    estimatedAnnualRevenue: "$210,000,000 MXN",
    averageTicket: "$320,000 MXN",
    operatingRegions: "Nuevo León, Coahuila, Tamaulipas, San Luis Potosí y Bajío.",
    apiFootprint:
      "https://integraciones.grupodeltaindustrial.mx/api/proyectos, https://hooks.grupodeltaindustrial.mx/facturacion",
    credentialFootprint: "sk_dev_gdi_991, pk_dev_gdi_208",
  },
  "Inversiones del Norte SA de CV": {
    rfc: "IDN110728LM5",
    website: "https://www.inversionesnorte.mx",
    phone: "+52 81 8201 6500",
    address: "Av. Gómez Morín 955 Sur, San Pedro Garza García, C.P. 66265, Nuevo León, México",
    state: "Nuevo León",
    registrationDate: "2011-07-28",
    industrySummary:
      "Vehículo corporativo de inversión y administración patrimonial con enfoque en activos productivos y arrendamiento.",
    targetMarket:
      "Empresas vinculadas del grupo, proyectos inmobiliarios y operaciones estructuradas con activos productivos.",
    revenueModel:
      "Rentas, rendimientos de inversión, honorarios de estructuración y arrendamiento financiero intragrupo.",
    competitiveEdge:
      "Flexibilidad patrimonial, liquidez para expansión y respaldo de activos estables.",
    estimatedAnnualRevenue: "$158,000,000 MXN",
    averageTicket: "$540,000 MXN",
    operatingRegions: "Nuevo León, Ciudad de México, Chihuahua y Coahuila.",
    apiFootprint:
      "https://core.inversionesnorte.mx/api/treasury, https://hooks.inversionesnorte.mx/leases",
    credentialFootprint: "sk_dev_idn_650, pk_dev_idn_104",
  },
  "Comercializadora Bajio Norte SA de CV": {
    rfc: "CBN180215RT4",
    website: "https://www.bajionorte.mx",
    phone: "+52 442 296 8800",
    address: "Av. 5 de Febrero 1730, Zona Industrial Benito Juárez, Querétaro, C.P. 76120, México",
    state: "Querétaro",
    registrationDate: "2018-02-15",
    industrySummary:
      "Comercialización mayorista de insumos industriales, refacciones y suministros para cadenas de manufactura y construcción.",
    targetMarket:
      "Parques industriales, contratistas y distribuidores del Bajío con alto consumo recurrente.",
    revenueModel:
      "Venta mayorista, contratos de abasto y atención a cuentas estratégicas por volumen.",
    competitiveEdge:
      "Ubicación logística en Bajío, surtido multimarcas y tiempos de respuesta rápidos.",
    estimatedAnnualRevenue: "$88,000,000 MXN",
    averageTicket: "$126,000 MXN",
    operatingRegions: "Querétaro, Guanajuato, Aguascalientes y San Luis Potosí.",
    apiFootprint:
      "https://erp.bajionorte.mx/api/sales, https://hooks.bajionorte.mx/collections",
    credentialFootprint: "sk_dev_cbn_901, pk_dev_cbn_551",
  },
  "GRUPO DELTA INDUSTRIAL SA DE CV": {
    rfc: "LMI130906CV9",
    website: "https://www.logisticamaya.mx",
    phone: "+52 999 942 7110",
    address: "Periférico Poniente 210, Bodega 8, Mérida, C.P. 97203, Yucatán, México",
    state: "Yucatán",
    registrationDate: "2013-09-06",
    industrySummary:
      "Operador logístico con servicios de almacenaje, distribución regional y transporte dedicado en el sureste.",
    targetMarket:
      "Retail, alimentos, farmacéutica y consumo masivo con rutas en la península y nodos nacionales.",
    revenueModel:
      "Contratos logísticos mensuales, servicios por viaje, almacenaje y distribución de última milla.",
    competitiveEdge:
      "Cobertura peninsular, capacidad de cross-dock y operación con control de temperatura cuando aplica.",
    estimatedAnnualRevenue: "$132,000,000 MXN",
    averageTicket: "$178,000 MXN",
    operatingRegions: "Yucatán, Quintana Roo, Campeche, Veracruz y centro del país.",
    apiFootprint:
      "https://ws.logisticamaya.mx/api/tracking, https://hooks.logisticamaya.mx/warehouse",
    credentialFootprint: "sk_dev_lmi_730, pk_dev_lmi_090",
  },
};

function parseStoredJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function slugifyCompanyName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fallbackRfcFromLegalName(legalName: string) {
  const cleaned = legalName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
  const parts = cleaned.split(" ").filter(Boolean);
  const letters = parts
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 4)
    .padEnd(4, "X");

  return `${letters}260624MO1`;
}

function fallbackProfile(legalName: string, applicantEmail: string, product: string, requestedAmount: number): KybCompanyProfile {
  const slug = slugifyCompanyName(legalName);
  return {
    rfc: fallbackRfcFromLegalName(legalName),
    website: `https://www.${slug || "empresa-demo"}.mx`,
    phone: demoSatFiscalData.rfc === "MOR220518KJ4" ? "+52 55 5555 0101" : "+52 55 5555 0101",
    address: "Av. Corporativa 100, Piso 6, Col. Centro Financiero, C.P. 11590, Ciudad de México, México",
    state: "Ciudad de México",
    registrationDate: "2021-01-15",
    industrySummary: `Operación empresarial B2B asociada al producto ${product}, con originación y atención corporativa dentro del flujo simulado de Zelify Core.`,
    targetMarket: "Clientes empresariales con necesidades de financiamiento, pagos y operación recurrente.",
    revenueModel: "Ingresos por ventas B2B, contratos corporativos y relaciones comerciales recurrentes.",
    competitiveEdge: "Atención especializada, operación centralizada y documentación integrada al flujo KYB.",
    estimatedAnnualRevenue: `$${Math.max(requestedAmount * 10, 24_000_000).toLocaleString("en-US")} MXN`,
    averageTicket: `$${Math.max(Math.round(requestedAmount / 12), 60_000).toLocaleString("en-US")} MXN`,
    operatingRegions: "Cobertura nacional con foco en cuentas corporativas y operación multirregional.",
    apiFootprint: `https://api.${slug || "empresa-demo"}.mx/zelify, https://hooks.${slug || "empresa-demo"}.mx/onboarding`,
    credentialFootprint: `${applicantEmail.split("@")[0] || "empresa"}_sandbox_key, ${applicantEmail.split("@")[0] || "empresa"}_public_key`,
  };
}

function emptyProfile(legalName: string): KybCompanyProfile {
  return {
    rfc: fallbackRfcFromLegalName(legalName),
    website: "",
    phone: "",
    address: "",
    state: "",
    registrationDate: "",
    industrySummary: "",
    targetMarket: "",
    revenueModel: "",
    competitiveEdge: "",
    estimatedAnnualRevenue: "",
    averageTicket: "",
    operatingRegions: "",
    apiFootprint: "",
    credentialFootprint: "",
  };
}

function getProfileForCompany(legalName: string, applicantEmail: string, product: string, requestedAmount: number) {
  return COMPANY_PROFILES[legalName] ?? fallbackProfile(legalName, applicantEmail, product, requestedAmount);
}

function readRegistry(): Record<string, KybCompanyContext> {
  if (typeof window === "undefined") return {};
  return parseStoredJson<Record<string, KybCompanyContext>>(window.localStorage.getItem(KYB_COMPANY_REGISTRY_KEY), {});
}

function writeRegistry(registry: Record<string, KybCompanyContext>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KYB_COMPANY_REGISTRY_KEY, JSON.stringify(registry));
}

export function readActiveKybCompanyContext(): KybCompanyContext | null {
  if (typeof window === "undefined") return null;
  return parseStoredJson<KybCompanyContext | null>(window.localStorage.getItem(ACTIVE_KYB_COMPANY_KEY), null);
}

export function writeActiveKybCompanyContext(context: KybCompanyContext) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_KYB_COMPANY_KEY, JSON.stringify(context));
}

export function upsertKybCompanyContext(context: KybCompanyContext) {
  const registry = readRegistry();
  registry[context.applicationId] = context;
  writeRegistry(registry);
}

export function readKybCompanyContextByApplicationId(applicationId: string): KybCompanyContext | null {
  const registry = readRegistry();
  return registry[applicationId] ?? null;
}

export function resolveKybCompanyContext(
  application: ApplicationLike,
  options?: { rfc?: string | null },
): KybCompanyContext {
  const stored = readKybCompanyContextByApplicationId(application.id);
  const profile =
    stored
      ? stored
      : isLocalApplication(application.id)
        ? emptyProfile(application.applicantName)
        : getProfileForCompany(
            application.applicantName,
            application.applicantEmail,
            application.product,
            application.requestedAmount,
          );

  const context: KybCompanyContext = {
    source: "mdc",
    applicationId: application.id,
    applicationNo: application.appNo,
    legalName: application.applicantName,
    email: application.applicantEmail,
    rfc: options?.rfc?.trim().toUpperCase() || stored?.rfc || profile.rfc,
    product: application.product,
    requestedAmount: application.requestedAmount,
    riskScore: application.riskScore,
    status: application.status,
    website: stored?.website || profile.website,
    phone: stored?.phone || profile.phone,
    address: stored?.address || profile.address,
    state: stored?.state || profile.state,
    registrationDate: stored?.registrationDate || profile.registrationDate,
    industrySummary: stored?.industrySummary || profile.industrySummary,
    targetMarket: stored?.targetMarket || profile.targetMarket,
    revenueModel: stored?.revenueModel || profile.revenueModel,
    competitiveEdge: stored?.competitiveEdge || profile.competitiveEdge,
    estimatedAnnualRevenue: stored?.estimatedAnnualRevenue || profile.estimatedAnnualRevenue,
    averageTicket: stored?.averageTicket || profile.averageTicket,
    operatingRegions: stored?.operatingRegions || profile.operatingRegions,
    apiFootprint: stored?.apiFootprint || profile.apiFootprint,
    credentialFootprint: stored?.credentialFootprint || profile.credentialFootprint,
  };

  upsertKybCompanyContext(context);
  return context;
}

export function activateKybCompanyContext(application: ApplicationLike, options?: { rfc?: string | null }) {
  const context = resolveKybCompanyContext(application, options);
  writeActiveKybCompanyContext(context);
  return context;
}

export function buildKybAnswersFromCompanyContext(context: KybCompanyContext) {
  return {
    "1.1.1": context.legalName,
    "1.1.5": context.state,
    "1.1.7": context.registrationDate,
    "1.1.8": context.rfc,
    "1.1.11": context.address,
    "1.1.12": context.phone,
    "1.1.13": context.email,
    "1.1.14": context.website,
    "3.1.1": context.apiFootprint,
    "3.1.2": context.credentialFootprint,
    "4.1.1": context.industrySummary,
    "4.1.2": context.targetMarket,
    "4.1.3": context.revenueModel,
    "4.1.4": context.competitiveEdge,
    "4.1.5": context.estimatedAnnualRevenue,
    "4.1.6": context.averageTicket,
    "4.1.7": context.operatingRegions,
    "5.4.2": context.industrySummary,
  } satisfies Record<string, string>;
}

export function buildKybSatFiscalDataFromCompanyContext(context: KybCompanyContext) {
  return {
    ...demoSatFiscalData,
    rfc: context.rfc,
    legalName: context.legalName,
    registrationDate: context.registrationDate,
  };
}
