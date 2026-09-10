export type AdminApiIntegrationRow = {
  id: string;
  name: string;
  provider: string;
  purpose: string;
  authType: string;
  credentialMasked: string;
  environment: string;
  status: "Activa" | "En pruebas" | "Pausada";
  lastSync: string;
  baseUrl: string;
  allowedIps: string;
  timeoutSec: number;
  rateLimit: number;
};

export const mockAdminApiIntegrations: AdminApiIntegrationRow[] = [
  {
    id: "api-1",
    name: "Buró Empresarial",
    provider: "TransUnion / Buró de Crédito",
    purpose: "Consulta score empresarial, atrasos y líneas vigentes para originación MDC.",
    authType: "OAuth 2.0",
    credentialMasked: "cli_••••••91fe",
    environment: "Producción",
    status: "Activa",
    lastSync: "Hace 3 min",
    baseUrl: "https://api.buroempresarial.mx/v2/score",
    allowedIps: "201.10.2.4, 201.10.2.5",
    timeoutSec: 15,
    rateLimit: 180,
  },
  {
    id: "api-2",
    name: "Validación SAT",
    provider: "RFC + Opinión 32-D",
    purpose: "Valida situación fiscal, actividad económica y cumplimiento fiscal de la persona moral.",
    authType: "mTLS + API Key",
    credentialMasked: "sat_••••••c1af",
    environment: "Producción",
    status: "Activa",
    lastSync: "Hace 11 min",
    baseUrl: "https://api.sat-integraciones.mx/v1/fiscal-status",
    allowedIps: "201.10.2.4",
    timeoutSec: 20,
    rateLimit: 90,
  },
  {
    id: "api-3",
    name: "AML / Listas restrictivas",
    provider: "ComplyAdvantage",
    purpose: "Screening de PEPs, OFAC, medios adversos y coincidencias regulatorias.",
    authType: "Bearer Token",
    credentialMasked: "tok_••••••7a2f",
    environment: "Sandbox",
    status: "En pruebas",
    lastSync: "Hace 27 min",
    baseUrl: "https://sandbox.comply-demo.io/v1/checks",
    allowedIps: "No restringido",
    timeoutSec: 25,
    rateLimit: 60,
  },
  {
    id: "api-4",
    name: "Core bancario",
    provider: "Mambu / Originación",
    purpose: "Alta de créditos aprobados, actualización de estatus y conciliación de desembolsos.",
    authType: "Service Account",
    credentialMasked: "svc_••••••4b0d",
    environment: "Producción",
    status: "Activa",
    lastSync: "Hace 1 min",
    baseUrl: "https://core.zelifybank.mx/api/v1/loans",
    allowedIps: "10.14.20.8, 10.14.20.9",
    timeoutSec: 10,
    rateLimit: 300,
  },
];
