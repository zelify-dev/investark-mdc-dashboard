"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { applicationsListMock, resolveApplicantDisplayName, type Application } from "@/modules/mdc/data/mdc-credit-mock";
import { SESSIONS } from "@/modules/mdc/components/mdc-payments-tab";
import {
  AuthError,
  getStoredOrganization,
  getOrganization,
  getOrganizationBranding,
  updateOrganizationBranding,
  uploadOrganizationLogos,
  type BrandingLogoType,
  type OrganizationBranding,
} from "@/lib/auth-api";
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchConfig,
  updateBranchConfig,
  getExportJobs,
  createExportJob,
  downloadExportDirectly,
  type BranchRow,
  type ExportJob,
} from "@/modules/mdc/services/mdc-configuration.service";
import { getMdcApiBaseUrl } from "@/modules/mdc/services/mdc-api-client";
import { useBranding } from "@/providers/branding-provider";
import { LogoUploadZone } from "@/modules/mdc/components/mdc-branding-logo-zone";
import { MdcConfigRolesPanel } from "@/modules/mdc/components/mdc-config-roles-panel";
import { MdcConfigUsersPanel } from "@/modules/mdc/components/mdc-config-users-panel";
import { MyAccountScreen } from "@/modules/settings/screens/my-account-screen";

const MdcSucursalMapPicker = dynamic(
  () => import("./mdc-sucursal-map-picker").then((m) => m.MdcSucursalMapPicker),
  {
    ssr: false,
    loading: () => (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 260, color: "#64748b", fontSize: 12 }}>
        Cargando mapa interactivo…
      </div>
    ),
  }
);


type ConfigSection = "profile" | "general" | "branding" | "roles" | "users" | "export" | "sucursales";

const CONFIG_SECTIONS: ConfigSection[] = [
  "profile",
  "general",
  "branding",
  "roles",
  "users",
  "export",
  "sucursales",
];

function isConfigSection(value: string | null): value is ConfigSection {
  return !!value && (CONFIG_SECTIONS as string[]).includes(value);
}

type SucursalRow = BranchRow;

const DEMO_SUCURSALES: SucursalRow[] = [
  { id: "SUC-001", name: "Sucursal CDMX Reforma", address: "Paseo de la Reforma 222", neighborhood: "Juárez", colonia: "Juárez", latitude: 19.4284, longitude: -99.1614, status: "ACTIVE", type: "PRINCIPAL", isPrincipal: true },
  { id: "SUC-002", name: "Sucursal Norte", address: "Av. Constitución 2000", neighborhood: "Centro", colonia: "Centro", latitude: 25.6866, longitude: -100.3161, status: "ACTIVE", type: "SECUNDARIA", isPrincipal: false },
];
const DEFAULT_SUCURSALES = DEMO_SUCURSALES;

function genSucursalId() {
  return `SUC-${String(Date.now()).slice(-4)}`;
}

const EMPTY_SUC: Omit<SucursalRow, "id"> = {
  name: "",
  address: "",
  neighborhood: "",
  colonia: "",
  latitude: null,
  longitude: null,
  status: "ACTIVE",
  type: "SECUNDARIA",
  isPrincipal: false,
};

type GeneralSettings = {
  name: string;
  companyLegalName: string;
  fiscalId: string;
  currency: string;
  country: string;
  website: string;
  industry: string;
  swift: string;
  organizationType: string;
  environment: string;
  status: string;
  zcoins: string;
  mdcAccess: boolean | null;
  createdAt: string;
  updatedAt: string;
};

type RoleRow = {
  name: string;
  description: string;
  permissions: string;
};

type UserRow = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: "active" | "inactive";
};


const STORAGE_KEYS = {
  general: "mdc:config:general:v7",
  roles: "mdc:config:roles:v3",
  users: "mdc:config:users:v3",
  exports: "mdc:config:exports:v2",
  branchRadius: "mdc:config:branchRadius:v1",
};

const MDC_STORAGE_KEYS = {
  applications: "mdc:applications",
};

const EMPTY_GENERAL: GeneralSettings = {
  name: "",
  companyLegalName: "",
  fiscalId: "",
  currency: "MXN",
  country: "MX",
  website: "",
  industry: "",
  swift: "",
  organizationType: "",
  environment: "",
  status: "",
  zcoins: "",
  mdcAccess: null,
  createdAt: "",
  updatedAt: "",
};

// Datos generales para la organizacion demo (demo-bypass-org) — solo para pruebas
const DEMO_GENERAL: GeneralSettings = {
  ...EMPTY_GENERAL,
  name: "Zelify Demo SA",
  companyLegalName: "Zelify Demo Financial Technologies SA de CV",
  fiscalId: "ZDF240101TST",
  currency: "MXN",
  country: "MX",
  website: "https://zelify.com",
  industry: "Servicios financieros",
  swift: "N/A",
  organizationType: "CLIENT",
  environment: "SANDBOX",
  status: "ACTIVE",
  zcoins: "0.00",
  mdcAccess: true,
};

const DEFAULT_GENERAL: GeneralSettings = { ...EMPTY_GENERAL };

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

type BrandingDraft = {
  color_a: string;
  color_b: string;
  url_log: string | null;
  url_log_dark: string | null;
  url_log_light: string | null;
  url_icon: string | null;
  branding_updated_at: string | null;
};

const EMPTY_BRANDING: BrandingDraft = {
  color_a: "#271a59",
  color_b: "#64748b",
  url_log: null,
  url_log_dark: null,
  url_log_light: null,
  url_icon: null,
  branding_updated_at: null,
};

function mapBrandingToDraft(data: OrganizationBranding): BrandingDraft {
  return {
    color_a: data.color_a && HEX_COLOR_RE.test(data.color_a) ? data.color_a : EMPTY_BRANDING.color_a,
    color_b: data.color_b && HEX_COLOR_RE.test(data.color_b) ? data.color_b : EMPTY_BRANDING.color_b,
    url_log: data.url_log ?? null,
    url_log_dark: data.url_log_dark ?? null,
    url_log_light: data.url_log_light ?? null,
    url_icon: data.url_icon ?? null,
    branding_updated_at: data.branding_updated_at ?? null,
  };
}

const DEFAULT_ROLES: RoleRow[] = [
  { name: "Super Admin", description: "Acceso total a configuraciones y datos.", permissions: "Todos" },
  { name: "Risk Analyst", description: "Gestion de solicitudes y reglas de riesgo.", permissions: "Evaluacion, Reglas, Productos" },
  { name: "Operations", description: "Monitoreo operativo y pagos.", permissions: "Solicitudes, Pagos, Cobranza" },
  { name: "Viewer", description: "Solo lectura de metricas y reportes.", permissions: "Lectura general" },
];

const DEFAULT_USERS: UserRow[] = [
  { id: "USR-001", fullName: "Andrea Molina", email: "andrea@zelify.com", role: "Super Admin", status: "active" },
  { id: "USR-002", fullName: "Diego Ramirez", email: "diego@zelify.com", role: "Risk Analyst", status: "active" },
  { id: "USR-003", fullName: "Paula Torres", email: "paula@zelify.com", role: "Operations", status: "inactive" },
];

const DEFAULT_EXPORTS: ExportJob[] = [];

const DEMO_EXPORTS: ExportJob[] = [
  { id: "EXP-001", name: "export_solicitudes_20260820_1000.csv", date: "20 Ago 2026, 10:00", status: "completed", type: "applications" },
  { id: "EXP-002", name: "export_pagos_20260819_1530.csv", date: "19 Ago 2026, 15:30", status: "completed", type: "payments" },
  { id: "EXP-003", name: "export_cobranza_20260818_0915.csv", date: "18 Ago 2026, 09:15", status: "failed", type: "collections" },
  { id: "EXP-004", name: "export_resultados_suscripcion_20260820_1145.csv", date: "20 Ago 2026, 11:45", status: "running", type: "underwritingResults" },
];

const EXPORT_OPTIONS: { value: string; label: string }[] = [
  { value: "Clientes", label: "Clientes" },
  { value: "Solicitudes", label: "Solicitudes" },
  { value: "Pagos", label: "Pagos de los clientes" },
  { value: "Resultados KYC", label: "Resultados KYC" },
];

const EXPORT_TYPE_LABELS: Record<string, string> = {
  clients: "Clientes",
  Clientes: "Clientes",
  applications: "Solicitudes",
  Solicitudes: "Solicitudes",
  payments: "Pagos de los clientes",
  "Pagos de los clientes": "Pagos de los clientes",
  kycResults: "Resultados KYC",
  "Resultados KYC": "Resultados KYC",
};

function formatExportDate(dateVal: string | Date | undefined): string {
  if (!dateVal) return "—";
  if (typeof dateVal === "string") {
    const parsed = new Date(dateVal);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleString("es-MX", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
      });
    }
    return dateVal;
  }
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    return dateVal.toLocaleString("es-MX");
  }
  return "—";
}

type CsvCell = string | number | boolean | null | undefined;
type CsvRow = Record<string, CsvCell>;

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStored<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // noop
  }
}

function normalizeProductName(name: string) {
  if (name === "BNPL") return "Credito personal";
  if (name === "Prestamo personal") return "Credito automotriz";
  if (name.toLowerCase().includes("plazo fijo")) return "Credito personal";
  return name;
}

function riskFromScore(score: number): "low" | "medium" | "high" {
  const bureauScore = Math.round(850 - (Math.max(0, Math.min(100, score)) / 100) * 450);
  if (bureauScore <= 549) return "high";
  if (bureauScore <= 649) return "medium";
  return "low";
}

function nowForExport() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 8).replaceAll(":", "-");
  return {
    date,
    dateTimeLabel: `${date} ${now.toTimeString().slice(0, 5)}`,
    stamp: `${date}_${time}`,
  };
}

function csvEscape(value: CsvCell) {
  const str = value === null || value === undefined ? "" : String(value);
  if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
    return `"${str.replaceAll("\"", "\"\"")}"`;
  }
  return str;
}

function rowsToCsv(rows: CsvRow[]) {
  if (rows.length === 0) return "sin_datos\n";
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
  );
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ];
  return lines.join("\n");
}

function downloadCsv(filename: string, csvText: string) {
  const blob = new Blob([`\uFEFF${csvText}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function readApplications() {
  return readStored<Application[]>(MDC_STORAGE_KEYS.applications, applicationsListMock).map((app) => ({
    ...app,
    product: normalizeProductName(app.product),
    risk: riskFromScore(app.riskScore),
  }));
}

function buildClientsRows(applications: Application[]): CsvRow[] {
  const map = new Map<string, {
    name: string;
    email: string;
    products: Set<string>;
    requests: number;
    requestedTotal: number;
    approved: number;
    declined: number;
    pending: number;
    riskScoreSum: number;
  }>();

  for (const app of applications) {
    const key = app.applicantEmail;
    const current = map.get(key) ?? {
      name: app.applicantName,
      email: app.applicantEmail,
      products: new Set<string>(),
      requests: 0,
      requestedTotal: 0,
      approved: 0,
      declined: 0,
      pending: 0,
      riskScoreSum: 0,
    };

    current.products.add(app.product);
    current.requests += 1;
    current.requestedTotal += app.requestedAmount;
    current.riskScoreSum += app.riskScore;
    if (app.status === "approved" || app.status === "overridden") current.approved += 1;
    if (app.status === "declined") current.declined += 1;
    if (app.status === "pending" || app.status === "manualReview") current.pending += 1;
    map.set(key, current);
  }

  return Array.from(map.values()).map((client, index) => ({
    cliente_id: `CLI-${String(index + 1).padStart(4, "0")}`,
    nombre: client.name,
    email: client.email,
    productos: Array.from(client.products).join(" / "),
    solicitudes: client.requests,
    monto_total_solicitado_mxn: client.requestedTotal,
    aprobadas: client.approved,
    rechazadas: client.declined,
    en_revision: client.pending,
    score_riesgo_promedio: Math.round(client.riskScoreSum / Math.max(client.requests, 1)),
  }));
}

function buildUnderwritingRows(applications: Application[]): CsvRow[] {
  return applications.map((app) => ({
    solicitud: app.appNo,
    cliente: app.applicantName,
    email: app.applicantEmail,
    producto: app.product,
    monto_solicitado_mxn: app.requestedAmount,
    score_riesgo: app.riskScore,
    nivel_riesgo: riskFromScore(app.riskScore),
    estado_motor: app.status,
    resultado_suscripcion:
      app.status === "approved" || app.status === "overridden"
        ? "Aprobada"
        : app.status === "declined"
          ? "Rechazada"
          : "Revision",
    fecha: app.submittedAt,
  }));
}

function buildKycRows(applications: Application[]): CsvRow[] {
  const byEmail = new Map<string, Application[]>();
  for (const app of applications) {
    byEmail.set(app.applicantEmail, [...(byEmail.get(app.applicantEmail) ?? []), app]);
  }

  return Array.from(byEmail.entries()).map(([email, rows], index) => {
    const customer = rows[0];
    const maxScore = Math.max(...rows.map((row) => row.riskScore));
    const kycStatus =
      maxScore >= 75 ? "Reforzado"
        : maxScore >= 50 ? "En revision"
          : "Aprobado";
    const pepCheck = maxScore >= 75 ? "Coincidencia parcial" : "Sin coincidencias";
    const docs = rows.some((row) => row.status === "pending") ? "Incompleta" : "Completa";

    return {
      kyc_id: `KYC-${String(index + 1).padStart(4, "0")}`,
      cliente: customer.applicantName,
      email,
      estado_kyc: kycStatus,
      validacion_documental: docs,
      validacion_pep: pepCheck,
      score_maximo: maxScore,
    };
  });
}

function buildCollectionsRows() {
  const mockCollections = [
    { caseId: "COL-1001", applicationNo: "APP-A1B2", customerName: "Carlos Ramirez", amountDue: 15400, dpd: 15, status: "Activo", assignedAgent: "agente_01", lastActivity: "2026-08-15T10:00:00Z" },
    { caseId: "COL-1002", applicationNo: "APP-C3D4", customerName: "Maria Fernandez", amountDue: 8200, dpd: 45, status: "En promesa de pago", assignedAgent: "agente_02", lastActivity: "2026-08-18T14:30:00Z" },
    { caseId: "COL-1003", applicationNo: "APP-E5F6", customerName: "Empresa XYZ SA", amountDue: 125000, dpd: 90, status: "Legal", assignedAgent: "externo_01", lastActivity: "2026-08-01T09:00:00Z" }
  ];

  return mockCollections.map((item) => ({
    caso_id: item.caseId,
    solicitud: item.applicationNo,
    cliente: item.customerName,
    monto_vencido_mxn: item.amountDue,
    dpd: item.dpd,
    estado: item.status,
    agente: item.assignedAgent,
    ultima_actividad: item.lastActivity,
  }));
}

function buildPaymentsRows() {
  return SESSIONS.map((payment) => ({
    pago_id: payment.id,
    solicitud: payment.applicantId,
    cliente: payment.userId,
    estado_pago: payment.status,
    metodo: payment.paymentMethod,
    monto_mxn: payment.amount,
    fecha: payment.createdAt,
    codigo_error: payment.errorCode ?? "",
    reintento: payment.retryable ? "si" : "no",
  }));
}

function buildExportRows(type: string, applications: Application[]) {
  const clientsRows = buildClientsRows(applications);
  const applicationsRows = applications.map((app) => ({
    solicitud: app.appNo,
    cliente: app.applicantName,
    email: app.applicantEmail,
    monto_solicitado_mxn: app.requestedAmount,
    estado: app.status,
    riesgo: riskFromScore(app.riskScore),
    score_riesgo: app.riskScore,
    fecha: app.submittedAt,
  }));
  const paymentsRows = buildPaymentsRows();
  const collectionsRows = buildCollectionsRows();
  const lostPaymentsRows = paymentsRows.filter((row) => row.estado_pago === "FALLIDO");
  const underwritingRows = buildUnderwritingRows(applications);
  const kycRows = buildKycRows(applications);

  if (type === "clients" || type === "Clientes") return { rows: clientsRows, fileBase: "clientes" };
  if (type === "applications" || type === "Solicitudes") return { rows: applicationsRows, fileBase: "solicitudes" };
  if (type === "payments" || type === "Pagos de los clientes") return { rows: paymentsRows, fileBase: "pagos" };
  if (type === "kycResults" || type === "Resultados KYC") return { rows: kycRows, fileBase: "resultados_kyc" };

  const fullRows: CsvRow[] = [
    ...clientsRows.map((row) => ({ seccion: "clientes", ...row })),
    ...applicationsRows.map((row) => ({ seccion: "solicitudes", ...row })),
    ...paymentsRows.map((row) => ({ seccion: "pagos", ...row })),
    ...collectionsRows.map((row: any) => ({ seccion: "cobranza", ...row })),
    ...lostPaymentsRows.map((row) => ({ seccion: "pagos_perdidos", ...row })),
    ...underwritingRows.map((row) => ({ seccion: "resultados_suscripcion", ...row })),
    ...kycRows.map((row) => ({ seccion: "resultados_kyc", ...row })),
  ];
  return { rows: fullRows, fileBase: "exportacion_completa" };
}

export function MdcConfigurationTab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialSection = searchParams.get("section");
  const [activeSection, setActiveSection] = useState<ConfigSection>(
    isConfigSection(initialSection) ? initialSection : "general"
  );
  const { branding, setBranding } = useBranding();
  const storedOrg = getStoredOrganization();
  const orgDisplayName = storedOrg?.name || branding.displayName || "Organización";
  const orgLogo = branding.logoUrl || "/mdc-navbar-logo.svg";

  const orgId = storedOrg?.id;
  const isDemo = orgId === "demo-bypass-org";
  const isSettingsRoute = pathname.startsWith("/settings");

  useEffect(() => {
    const section = searchParams.get("section");
    if (isConfigSection(section) && section !== activeSection) {
      setActiveSection(section);
    }
    // Solo reaccionar a cambios de URL (p. ej. menú de perfil).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const selectSection = (section: ConfigSection) => {
    setActiveSection(section);
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", section);
    // En /settings (nav Configuración) no saltar a /mdc (nav MDC).
    if (isSettingsRoute) {
      params.delete("tab");
      const qs = params.toString();
      router.replace(qs ? `/settings?${qs}` : "/settings", { scroll: false });
      return;
    }
    params.set("tab", "configuration");
    router.replace(`/mdc?${params.toString()}`, { scroll: false });
  };

  const [general, setGeneral] = useState<GeneralSettings>(() => {
    // demo-bypass-org siempre arranca con DEMO_GENERAL, ignorando el localStorage
    if (isDemo) return DEMO_GENERAL;
    return readStored(STORAGE_KEYS.general, DEFAULT_GENERAL);
  });
  const [generalLoading, setGeneralLoading] = useState(false);
  const [generalFeedback, setGeneralFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [brandingDraft, setBrandingDraft] = useState<BrandingDraft>(EMPTY_BRANDING);
  const [brandingLoading, setBrandingLoading] = useState(false);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingFeedback, setBrandingFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [pendingLogos, setPendingLogos] = useState<Partial<Record<BrandingLogoType, File>>>({});
  const [roles, setRoles] = useState<RoleRow[]>(() => readStored(STORAGE_KEYS.roles, DEFAULT_ROLES));
  const [users, setUsers] = useState<UserRow[]>(() => readStored(STORAGE_KEYS.users, DEFAULT_USERS));
  const [exportJobs, setExportJobs] = useState<ExportJob[]>(() => {
    if (isDemo) return DEMO_EXPORTS;
    return readStored(STORAGE_KEYS.exports, DEFAULT_EXPORTS);
  });
  const [selectedExportType, setSelectedExportType] = useState<string>("Clientes");
  const [isExporting, setIsExporting] = useState(false);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{ columns: string[]; rows: Record<string, unknown>[]; total: number; fileBase: string } | null>(null);
  const [isLoadingExports, setIsLoadingExports] = useState(false);
  const [sucursales, setSucursales] = useState<SucursalRow[]>(() => {
    if (isDemo) return DEMO_SUCURSALES;
    return [];
  });
  const [sucMode, setSucMode] = useState<"idle" | "create" | "edit">("idle");
  const [branchRadiusKm, setBranchRadiusKm] = useState<number | string>(() => {
    if (isDemo) return 5;
    return readStored(STORAGE_KEYS.branchRadius, 5) || 5;
  });
  const [isSavingBranchConfig, setIsSavingBranchConfig] = useState(false);
  const [isEditingRadius, setIsEditingRadius] = useState(false);
  const [showRadiusMenu, setShowRadiusMenu] = useState(false);
  const [sucForm, setSucForm] = useState<Omit<SucursalRow, "id">>(EMPTY_SUC);
  const [editingSucId, setEditingSucId] = useState<string | null>(null);
  const [sucMapPicking, setSucMapPicking] = useState(false);
  const [sucToDelete, setSucToDelete] = useState<SucursalRow | null>(null);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isSavingSucursal, setIsSavingSucursal] = useState(false);
  const [isDeletingSucursal, setIsDeletingSucursal] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [searchAddressFeedback, setSearchAddressFeedback] = useState<string | null>(null);
  const [sucFeedback, setSucFeedback] = useState<{ type: "success" | "error"; message: React.ReactNode } | null>(null);
  const skipForwardGeocodeRef = useRef(false);
  const sucFormRef = useRef<HTMLDivElement>(null);

  // Determinar si ya existe una sucursal principal registrada en la organización (excluyendo la que está en edición)
  const existingPrincipalBranch = useMemo(() => {
    return sucursales.find(
      (s) => (s.type === "PRINCIPAL" || s.isPrincipal) && (sucMode === "create" || s.id !== editingSucId)
    );
  }, [sucursales, sucMode, editingSucId]);

  const isPrincipalDisabled = Boolean(existingPrincipalBranch);

  const exportPreview = useMemo(() => {
    if (previewData) return previewData;
    // fallback empty
    const fileBases: Record<string, string> = {
      Clientes: "clientes",
      Solicitudes: "solicitudes",
      Pagos: "pagos",
      "Resultados KYC": "resultados_kyc",
    };
    return { columns: [], rows: [], total: 0, fileBase: fileBases[selectedExportType] ?? "export" };
  }, [previewData, selectedExportType]);

  async function fetchExportPreview(type: string) {
    const currentOrgId = storedOrg?.id;
    setIsLoadingPreview(true);
    setPreviewData(null);
    try {
      const baseUrl = getMdcApiBaseUrl("http://localhost:3000");
      const res = await fetch(`${baseUrl}/configuration/exports/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, organizationId: currentOrgId, orgId: currentOrgId }),
      });
      if (res.ok) {
        const data = await res.json() as { rows: Record<string, unknown>[]; total: number };
        const rows = data.rows ?? [];
        const columns = rows[0] ? Object.keys(rows[0]) : [];
        const fileBases: Record<string, string> = {
          Clientes: "clientes",
          Solicitudes: "solicitudes",
          Pagos: "pagos",
          "Resultados KYC": "resultados_kyc",
        };
        setPreviewData({
          columns,
          rows: rows.slice(0, 8),
          total: data.total ?? rows.length,
          fileBase: fileBases[type] ?? "export",
        });
      } else {
        setPreviewData({ columns: [], rows: [], total: 0, fileBase: "export" });
      }
    } catch {
      setPreviewData({ columns: [], rows: [], total: 0, fileBase: "export" });
    } finally {
      setIsLoadingPreview(false);
    }
  }

  async function confirmExportDownload() {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const currentOrgId = getStoredOrganization()?.id;
      if (currentOrgId && currentOrgId !== "demo-bypass-org") {
        try {
          const baseUrl = getMdcApiBaseUrl("http://localhost:3000");
          const res = await fetch(`${baseUrl}/finance-requests?orgId=${currentOrgId}`);
          if (res.ok) {
            await res.json();
          }
        } catch {
          // La descarga sigue con el endpoint de export aunque falle la consulta previa.
        }
      }

      await downloadExportDirectly(selectedExportType, storedOrg?.id);
      void fetchExports();
      setShowExportPreview(false);
    } catch (err: unknown) {
      console.error("Error al exportar:", err);
      alert(err instanceof Error ? err.message : "Ocurrió un error al generar la exportación.");
    } finally {
      setIsExporting(false);
    }
  }

  async function loadGeneralFromAuth() {
    if (!orgId || isDemo) return;
    setGeneralLoading(true);
    setGeneralFeedback(null);
    try {
      const org = await getOrganization(orgId);
      const next: GeneralSettings = {
        name: org.name || "",
        companyLegalName: org.company_legal_name || "",
        fiscalId: org.fiscal_id || "",
        currency: org.currency || "MXN",
        country: org.country || "MX",
        website: org.website || "",
        industry: org.industry || "",
        swift: org.swift || "",
        organizationType: org.organization_type || "",
        environment: org.environment || "",
        status: org.status || "",
        zcoins: org.zcoins || "",
        mdcAccess: typeof org.mdc_access === "boolean" ? org.mdc_access : null,
        createdAt: org.created_at || "",
        updatedAt: org.updated_at || "",
      };
      setGeneral(next);
      writeStored(STORAGE_KEYS.general, next);
    } catch (err) {
      const message = err instanceof AuthError ? err.message : "No fue posible cargar los datos de la organización.";
      setGeneralFeedback({ type: "error", message });
    } finally {
      setGeneralLoading(false);
    }
  }

  async function loadBrandingFromAuth() {
    if (!orgId || isDemo) {
      setBrandingDraft({
        ...EMPTY_BRANDING,
        color_a: branding.primaryHex || EMPTY_BRANDING.color_a,
        color_b: branding.accentHex || EMPTY_BRANDING.color_b,
        url_log: branding.logoUrl || null,
      });
      return;
    }
    setBrandingLoading(true);
    setBrandingFeedback(null);
    try {
      const data = await getOrganizationBranding(orgId);
      const draft = mapBrandingToDraft(data);
      setBrandingDraft(draft);
      setPendingLogos({});
      setBranding({
        ...branding,
        primaryHex: draft.color_a,
        accentHex: draft.color_b,
        logoUrl: draft.url_log || branding.logoUrl,
        displayName: storedOrg?.name || branding.displayName,
      });
    } catch (err) {
      const message = err instanceof AuthError ? err.message : "No fue posible cargar el branding.";
      setBrandingFeedback({ type: "error", message });
    } finally {
      setBrandingLoading(false);
    }
  }

  async function handleSaveBrandingColors() {
    if (!HEX_COLOR_RE.test(brandingDraft.color_a) || !HEX_COLOR_RE.test(brandingDraft.color_b)) {
      setBrandingFeedback({ type: "error", message: "Los colores deben ser hex #RRGGBB." });
      return;
    }
    if (isDemo) {
      setBranding({
        ...branding,
        primaryHex: brandingDraft.color_a,
        accentHex: brandingDraft.color_b,
        logoUrl: brandingDraft.url_log || branding.logoUrl,
      });
      setBrandingFeedback({ type: "success", message: "Colores guardados en modo demo (local)." });
      return;
    }
    if (!orgId) {
      setBrandingFeedback({ type: "error", message: "No hay organizationId en sesión." });
      return;
    }
    setBrandingSaving(true);
    setBrandingFeedback(null);
    try {
      const latest = await updateOrganizationBranding(orgId, {
        color_a: brandingDraft.color_a,
        color_b: brandingDraft.color_b,
      });
      const draft = mapBrandingToDraft(latest);
      setBrandingDraft((current) => ({
        ...current,
        color_a: draft.color_a,
        color_b: draft.color_b,
        branding_updated_at: draft.branding_updated_at,
      }));
      setBranding({
        ...branding,
        primaryHex: draft.color_a,
        accentHex: draft.color_b,
        displayName: storedOrg?.name || branding.displayName,
      });
      setBrandingFeedback({ type: "success", message: "Colores corporativos actualizados." });
    } catch (err) {
      const message = err instanceof AuthError ? err.message : "No fue posible guardar los colores.";
      setBrandingFeedback({ type: "error", message });
    } finally {
      setBrandingSaving(false);
    }
  }

  async function handleSaveBrandingLogos() {
    if (Object.keys(pendingLogos).length === 0) {
      setBrandingFeedback({ type: "error", message: "Selecciona al menos un PNG para subir." });
      return;
    }
    if (isDemo) {
      const preview = pendingLogos.logo ? URL.createObjectURL(pendingLogos.logo) : brandingDraft.url_log;
      setBrandingDraft((current) => ({ ...current, url_log: preview || current.url_log }));
      setBranding({
        ...branding,
        logoUrl: preview || branding.logoUrl,
      });
      setPendingLogos({});
      setBrandingFeedback({ type: "success", message: "Logos guardados en modo demo (local)." });
      return;
    }
    if (!orgId) {
      setBrandingFeedback({ type: "error", message: "No hay organizationId en sesión." });
      return;
    }
    setBrandingSaving(true);
    setBrandingFeedback(null);
    try {
      const latest = await uploadOrganizationLogos(orgId, pendingLogos);
      const draft = mapBrandingToDraft(latest);
      setBrandingDraft(draft);
      setPendingLogos({});
      setBranding({
        ...branding,
        primaryHex: draft.color_a,
        accentHex: draft.color_b,
        logoUrl: draft.url_log || branding.logoUrl,
        displayName: storedOrg?.name || branding.displayName,
      });
      setBrandingFeedback({ type: "success", message: "Logos actualizados." });
    } catch (err) {
      const message = err instanceof AuthError ? err.message : "No fue posible subir los logos.";
      setBrandingFeedback({ type: "error", message });
    } finally {
      setBrandingSaving(false);
    }
  }

  function queueLogo(type: BrandingLogoType, file: File | null) {
    if (!file) return;
    if (file.type !== "image/png" && !file.name.toLowerCase().endsWith(".png")) {
      setBrandingFeedback({ type: "error", message: "Solo se permiten archivos PNG." });
      return;
    }
    setPendingLogos((prev) => ({ ...prev, [type]: file }));
    setBrandingFeedback(null);
  }

  async function loadOrgBranches() {
    const orgId = getStoredOrganization()?.id || "demo-bypass-org";
    setIsLoadingBranches(true);
    try {
      const [list, config] = await Promise.all([
        getBranches(orgId),
        getBranchConfig(orgId).catch(() => ({ maxSearchDistanceKm: 5 })),
      ]);
      if (isDemo) {
        setSucursales(list.length > 0 ? list : DEMO_SUCURSALES);
      } else {
        setSucursales(list);
      }
      setBranchRadiusKm(config.maxSearchDistanceKm);
      writeStored(STORAGE_KEYS.branchRadius, config.maxSearchDistanceKm);
    } catch (err) {
      console.warn("No se pudieron cargar sucursales de la API:", err);
      if (isDemo) {
        setSucursales(DEMO_SUCURSALES);
      } else {
        setSucursales([]);
      }
    } finally {
      setIsLoadingBranches(false);
    }
  }

  const handleSaveBranchConfig = async () => {
    setIsSavingBranchConfig(true);
    try {
      const orgId = getStoredOrganization()?.id || "demo-bypass-org";
      const finalVal = Number(branchRadiusKm);
      const valToSave = isNaN(finalVal) ? 0 : finalVal;
      await updateBranchConfig({ maxSearchDistanceKm: valToSave }, orgId);
      setSucFeedback({ type: "success", message: "Configuración general guardada exitosamente." });
    } catch (err: any) {
      console.error("Error saving branch config", err);
      setSucFeedback({ type: "error", message: err.message || "Error al guardar configuración general" });
    } finally {
      setIsSavingBranchConfig(false);
    }
  };

  const handleSaveSucursal = async () => {
    if (!sucForm.name.trim()) return;
    setIsSavingSucursal(true);
    setSucFeedback(null);
    const orgId = getStoredOrganization()?.id || "demo-bypass-org";
    const isPrincipal = sucForm.type === "PRINCIPAL" || Boolean(sucForm.isPrincipal);
    const payload = {
      name: sucForm.name.trim(),
      address: sucForm.address.trim(),
      neighborhood: (sucForm.neighborhood || sucForm.colonia || "").trim(),
      latitude: sucForm.latitude,
      longitude: sucForm.longitude,
      status: sucForm.status,
      type: isPrincipal ? ("PRINCIPAL" as const) : ("SECUNDARIA" as const),
      isPrincipal,
    };

    try {
      if (sucMode === "create") {
        const created = await createBranch(payload, orgId);
        setSucursales((p) => [...p, created]);
        setSucFeedback({ type: "success", message: <>Sucursal <strong>{created.name}</strong> creada exitosamente.</> });
      } else if (sucMode === "edit" && editingSucId) {
        const updated = await updateBranch(editingSucId, payload);
        setSucursales((p) => p.map((s) => (s.id === editingSucId ? updated : s)));
        setSucFeedback({ type: "success", message: <>Sucursal <strong>{updated.name}</strong> actualizada exitosamente.</> });
      }
      setSucMode("idle");
      setEditingSucId(null);
    } catch (err: any) {
      const errorMsg = err?.message || "Error al persistir sucursal";
      console.error("Error al persistir sucursal en backend:", err);

      // Si el backend rechazó por validación de sucursal principal o 400, mostrar el error sin sobrescribir
      if (errorMsg.toLowerCase().includes("principal") || errorMsg.includes("400")) {
        setSucFeedback({ type: "error", message: errorMsg });
        setIsSavingSucursal(false);
        return;
      }

      if (sucMode === "create") {
        const fallback: SucursalRow = {
          id: genSucursalId(),
          ...sucForm,
          neighborhood: sucForm.neighborhood || sucForm.colonia,
          colonia: sucForm.colonia || sucForm.neighborhood || "",
          type: payload.type,
          isPrincipal: payload.isPrincipal,
        };
        setSucursales((p) => [...p, fallback]);
        setSucFeedback({ type: "success", message: <>Sucursal <strong>{fallback.name}</strong> guardada localmente.</> });
      } else if (sucMode === "edit" && editingSucId) {
        setSucursales((p) =>
          p.map((s) =>
            s.id === editingSucId
              ? { ...s, ...sucForm, neighborhood: sucForm.neighborhood || sucForm.colonia, type: payload.type, isPrincipal: payload.isPrincipal }
              : s
          )
        );
        setSucFeedback({ type: "success", message: <>Sucursal <strong>{sucForm.name}</strong> actualizada localmente.</> });
      }
      setSucMode("idle");
      setEditingSucId(null);
    } finally {
      setIsSavingSucursal(false);
    }
  };

  const handleDeleteSucursal = async (suc: SucursalRow) => {
    setIsDeletingSucursal(true);
    try {
      await deleteBranch(suc.id);
      setSucursales((p) => p.filter((s) => s.id !== suc.id));
    } catch (err) {
      console.error("Error al eliminar sucursal en backend, eliminando localmente:", err);
      setSucursales((p) => p.filter((s) => s.id !== suc.id));
    } finally {
      setIsDeletingSucursal(false);
      if (editingSucId === suc.id) {
        setSucMode("idle");
        setEditingSucId(null);
      }
      setSucToDelete(null);
    }
  };

  const handleLocateAddress = async (addrVal?: string, colVal?: string) => {
    const addressToSearch = (addrVal !== undefined ? addrVal : sucForm.address).trim();
    const coloniaToSearch = (colVal !== undefined ? colVal : sucForm.colonia).trim();
    if (!addressToSearch && !coloniaToSearch) return;

    setIsSearchingAddress(true);
    setSearchAddressFeedback("Buscando en mapa…");
    try {
      const query = [addressToSearch, coloniaToSearch, "México"].filter(Boolean).join(", ");
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=mx&limit=1`,
        { headers: { "Accept-Language": "es" } }
      );
      if (res.ok) {
        const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
        if (Array.isArray(data) && data.length > 0) {
          const first = data[0];
          const lat = parseFloat(first.lat);
          const lng = parseFloat(first.lon);
          setSucForm((p) => ({
            ...p,
            latitude: lat,
            longitude: lng,
          }));
          setSearchAddressFeedback("¡Ubicación encontrada en el mapa!");
        } else {
          setSearchAddressFeedback("No se encontró la ubicación exacta en el mapa.");
        }
      }
    } catch {
      setSearchAddressFeedback("Error al conectar con el servicio de mapas.");
    } finally {
      setIsSearchingAddress(false);
      setTimeout(() => setSearchAddressFeedback(null), 3500);
    }
  };

  // --- Fetch Data ---
  const fetchExports = async (typeFilter?: string) => {
    if (isDemo) return;
    try {
      setIsLoadingExports(true);
      const data = await getExportJobs(typeFilter);
      setExportJobs(data);
      writeStored(STORAGE_KEYS.exports, data);
    } catch (err) {
      console.error("Error fetching exports:", err);
    } finally {
      setIsLoadingExports(false);
    }
  };

  useEffect(() => {
    if (activeSection === "export") {
      void fetchExports();
    }
  }, [activeSection, isDemo]);

  // Polling for exports
  useEffect(() => {
    if (activeSection !== "export" || isDemo) return;
    const hasProcessing = exportJobs.some((j) => {
      const st = (j.status || "").toLowerCase();
      return st === "procesando" || st === "running" || st === "pending";
    });
    if (hasProcessing) {
      const interval = setInterval(() => {
        void fetchExports();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeSection, exportJobs, isDemo]);



  // Debounced search when user types address or colonia
  useEffect(() => {
    if (skipForwardGeocodeRef.current) return;
    if (!sucForm.address.trim() && !sucForm.colonia.trim()) return;

    const timer = setTimeout(() => {
      void handleLocateAddress(sucForm.address, sucForm.colonia);
    }, 1200);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sucForm.address, sucForm.colonia]);

  const sectionTabs: { id: ConfigSection; label: string }[] = [
    { id: "profile", label: "Mi perfil" },
    { id: "general", label: "General" },
    { id: "branding", label: "Branding" },
    { id: "roles", label: "Roles" },
    { id: "users", label: "Usuarios" },
    { id: "export", label: "Export" },
    { id: "sucursales", label: "Sucursales" },
  ];

  useEffect(() => {
    if (activeSection === "general") {
      void loadGeneralFromAuth();
    } else if (activeSection === "branding") {
      void loadBrandingFromAuth();
    } else if (activeSection === "sucursales") {
      loadOrgBranches();
    }
  }, [activeSection]);

  return (
    <section className="mdc-section mdc-section--config">
      <article className="mdc-card mdc-cfg-header">
        <div>
          <h3>Configuracion</h3>
          <p>Ajustes operativos, integraciones y administracion del modulo.</p>
        </div>
      </article>

      <div className="mdc-cfg-tabs" role="tablist" aria-label="Configuracion sections">
        {sectionTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeSection === tab.id}
            className={`mdc-cfg-tab${activeSection === tab.id ? " mdc-cfg-tab--active" : ""}`}
            onClick={() => selectSection(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSection === "profile" && <MyAccountScreen embedded />}

      {activeSection === "general" && (
        <article className="mdc-card">
          <h3>General</h3>
          <p>Datos de la organización (solo lectura).</p>
          {generalLoading ? <p className="mdc-cfg-feedback">Cargando organización…</p> : null}
          {generalFeedback ? (
            <p className={`mdc-cfg-feedback mdc-cfg-feedback--${generalFeedback.type}`}>{generalFeedback.message}</p>
          ) : null}
          <div className="mdc-cfg-form-grid">
            <Field label="Nombre comercial"><input value={general.name} readOnly disabled /></Field>
            <Field label="Razón social"><input value={general.companyLegalName} readOnly disabled /></Field>
            <Field label="RFC"><input value={general.fiscalId} readOnly disabled /></Field>
            <Field label="Moneda"><input value={general.currency} readOnly disabled /></Field>
            <Field label="País"><input value={general.country} readOnly disabled /></Field>
            <Field label="Sitio web"><input value={general.website} readOnly disabled /></Field>
            <Field label="Industria" className="mdc-cfg-form-grid__full"><input value={general.industry} readOnly disabled /></Field>
            <Field label="Estado"><input value={general.status} readOnly disabled /></Field>
            <Field label="Actualizada"><input value={general.updatedAt ? new Date(general.updatedAt).toLocaleString("es-MX") : ""} readOnly disabled /></Field>
          </div>
        </article>
      )}

      {activeSection === "branding" && (
        <div className="mdc-branding">
          <header className="mdc-branding__head">
            <div>
              <h3>Branding</h3>
              <p>Gestión de logotipos e identidad visual de la organización.</p>
            </div>
          </header>

          {brandingLoading ? <p className="mdc-cfg-feedback">Cargando branding…</p> : null}
          {brandingFeedback ? (
            <p className={`mdc-cfg-feedback mdc-cfg-feedback--${brandingFeedback.type}`}>{brandingFeedback.message}</p>
          ) : null}

          <article className="mdc-branding-panel">
            <h4>Logos e ícono</h4>
            <div className="mdc-branding-assets">
              <LogoUploadZone
                label="Logo principal"
                description="PNG transparente. Se usa en encabezados y correos."
                url={brandingDraft.url_log}
                pendingFile={pendingLogos.logo}
                disabled={brandingLoading || brandingSaving}
                onFileSelect={(file) => queueLogo("logo", file)}
              />
              <div className="mdc-branding-assets__triple">
                <LogoUploadZone
                  label="Logo fondo claro"
                  description="Optimizado para contrastar sobre fondos blancos o claros."
                  url={brandingDraft.url_log_light}
                  pendingFile={pendingLogos.logoLight}
                  disabled={brandingLoading || brandingSaving}
                  onFileSelect={(file) => queueLogo("logoLight", file)}
                />
                <LogoUploadZone
                  label="Logo fondo oscuro"
                  description="Optimizado para contrastar sobre fondos oscuros o nocturnos."
                  url={brandingDraft.url_log_dark}
                  pendingFile={pendingLogos.logoDark}
                  disabled={brandingLoading || brandingSaving}
                  onFileSelect={(file) => queueLogo("logoDark", file)}
                />
                <LogoUploadZone
                  label="Ícono"
                  description="PNG cuadrado para notificaciones, favicon y apps móviles."
                  url={brandingDraft.url_icon}
                  pendingFile={pendingLogos.icon}
                  disabled={brandingLoading || brandingSaving}
                  onFileSelect={(file) => queueLogo("icon", file)}
                />
              </div>
            </div>

            {brandingDraft.branding_updated_at ? (
              <p className="mdc-cfg-hint">Última actualización: {new Date(brandingDraft.branding_updated_at).toLocaleString("es-MX")}</p>
            ) : null}

            <div className="mdc-cfg-actions">
              <button
                type="button"
                className="mdc-btn mdc-btn--primary"
                onClick={() => void handleSaveBrandingLogos()}
                disabled={brandingLoading || brandingSaving}
              >
                {brandingSaving ? "Guardando…" : "Guardar logos"}
              </button>
            </div>
          </article>

          <article className="mdc-branding-panel">
            <h4>Colores corporativos</h4>
            <div className="mdc-branding-colors-layout">
              <div className="mdc-branding-colors-grid">
                <label className="mdc-branding-color-field">
                  <span>Color primario</span>
                  <div className="mdc-cfg-color-row">
                    <input
                      type="color"
                      value={HEX_COLOR_RE.test(brandingDraft.color_a) ? brandingDraft.color_a : "#271a59"}
                      onChange={(e) => setBrandingDraft((v) => ({ ...v, color_a: e.target.value.toUpperCase() }))}
                      disabled={brandingLoading || brandingSaving}
                      aria-label="Color primario"
                    />
                    <input
                      className="mdc-branding-hex"
                      value={brandingDraft.color_a}
                      onChange={(e) => setBrandingDraft((v) => ({ ...v, color_a: e.target.value.toUpperCase() }))}
                      placeholder="#RRGGBB"
                      disabled={brandingLoading || brandingSaving}
                    />
                  </div>
                </label>
                <label className="mdc-branding-color-field">
                  <span>Color secundario</span>
                  <div className="mdc-cfg-color-row">
                    <input
                      type="color"
                      value={HEX_COLOR_RE.test(brandingDraft.color_b) ? brandingDraft.color_b : "#64748b"}
                      onChange={(e) => setBrandingDraft((v) => ({ ...v, color_b: e.target.value.toUpperCase() }))}
                      disabled={brandingLoading || brandingSaving}
                      aria-label="Color secundario"
                    />
                    <input
                      className="mdc-branding-hex"
                      value={brandingDraft.color_b}
                      onChange={(e) => setBrandingDraft((v) => ({ ...v, color_b: e.target.value.toUpperCase() }))}
                      placeholder="#RRGGBB"
                      disabled={brandingLoading || brandingSaving}
                    />
                  </div>
                </label>
              </div>

              <div className="mdc-branding-preview">
                <div
                  className="mdc-branding-preview__bar"
                  style={{ background: HEX_COLOR_RE.test(brandingDraft.color_a) ? brandingDraft.color_a : "#271a59" }}
                >
                  {brandingDraft.url_log_dark || brandingDraft.url_log ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={brandingDraft.url_log_dark || brandingDraft.url_log || ""} alt={orgDisplayName} />
                  ) : (
                    <strong>{orgDisplayName}</strong>
                  )}
                  <span className="mdc-branding-preview__nav">Tablero · Solicitudes · Pagos</span>
                  <span
                    className="mdc-branding-preview__cta"
                    style={{ background: HEX_COLOR_RE.test(brandingDraft.color_b) ? brandingDraft.color_b : "#271a59" }}
                  >
                    Acción
                  </span>
                </div>
                <div className="mdc-branding-preview__page">
                  <p>Vista previa de la barra y el acento en navegación.</p>
                  <div className="mdc-branding-preview__card">Solicitudes recientes</div>
                </div>
              </div>
            </div>

            <div className="mdc-cfg-actions">
              <button
                type="button"
                className="mdc-btn mdc-btn--primary"
                onClick={() => void handleSaveBrandingColors()}
                disabled={brandingLoading || brandingSaving}
              >
                {brandingSaving ? "Guardando…" : "Guardar colores"}
              </button>
            </div>
          </article>
        </div>
      )}

      {activeSection === "roles" && <MdcConfigRolesPanel />}

      {activeSection === "users" && <MdcConfigUsersPanel />}

      {activeSection === "export" && (
        <article className="mdc-card">
          <div className="mdc-cfg-title-row">
            <div>
              <h3>Export</h3>
              <p>Elige el tipo y pulsa Exportar para revisar la vista previa antes de descargar.</p>
            </div>
            <div className="mdc-export-controls">
              <label className="mdc-export-picker">
                <span className="mdc-export-picker__label">Qué quieres exportar</span>
                <select
                  className="mdc-export-picker__select"
                  value={selectedExportType}
                  onChange={(e) => setSelectedExportType(e.target.value)}
                >
                  {EXPORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="mdc-btn mdc-btn--primary"
                disabled={isExporting}
                onClick={() => {
                  setPreviewData(null);
                  setShowExportPreview(true);
                  void fetchExportPreview(selectedExportType);
                }}
              >
                Exportar CSV
              </button>
            </div>
          </div>
          <div className="mdc-table-wrap">
            <table className="mdc-table mdc-cfg-table">
              <thead><tr><th>ID</th><th>Nombre</th><th>Fecha</th><th>Tipo</th><th>Estado</th></tr></thead>
              <tbody>
                {exportJobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                      {isLoadingExports ? "Cargando exportaciones…" : "No hay exportaciones recientes."}
                    </td>
                  </tr>
                ) : exportJobs.map((job) => {
                  const rawStatus = (job.status || "").toLowerCase();
                  const isCompleted = rawStatus === "completado" || rawStatus === "completed";
                  const isProcessing = rawStatus === "procesando" || rawStatus === "running" || rawStatus === "pending";
                  const isFailed = rawStatus === "error" || rawStatus === "failed";

                  return (
                    <tr key={job.id || `${job.name}-${String(job.date)}`}>
                      <td>{job.id || "—"}</td>
                      <td>{job.name}</td>
                      <td>{formatExportDate(job.date || job.createdAt)}</td>
                      <td>{EXPORT_TYPE_LABELS[job.type] ?? job.type}</td>
                      <td>
                        <span
                          className={
                            isCompleted
                              ? "mdc-badge mdc-badge--ok"
                              : isProcessing
                              ? "mdc-badge mdc-badge--info"
                              : "mdc-badge mdc-badge--bad"
                          }
                        >
                          {isCompleted ? "Completado" : isProcessing ? "Procesando" : isFailed ? "Error" : job.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {activeSection === "sucursales" && (
        <article className="mdc-card">
          {/* ── Header ── */}
          <div className="mdc-cfg-title-row">
            <div>
              <h3>Sucursales</h3>
              <p>Administra las sucursales de tu organización.</p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {isLoadingBranches && (
                <span style={{ fontSize: 12, color: "#64748b" }}>Cargando sucursales…</span>
              )}
              {sucMode === "idle" && (
                <button
                  type="button"
                  className="mdc-btn mdc-btn--primary"
                  onClick={() => {
                    const hasPrincipal = sucursales.some((s) => s.type === "PRINCIPAL" || s.isPrincipal);
                    setSucForm({
                      ...EMPTY_SUC,
                      type: hasPrincipal ? "SECUNDARIA" : "PRINCIPAL",
                      isPrincipal: !hasPrincipal,
                    });
                    setSucMode("create");
                    setEditingSucId(null);
                    setSucMapPicking(false);
                    setSucFeedback(null);
                  }}
                >
                  + Nueva sucursal
                </button>
              )}
            </div>
          </div>

          {/* ── Configuración General de Sucursales ── */}
          {sucMode === "idle" && (
            <div style={{ padding: "8px 0 24px 0", borderBottom: "1px solid #e2e8f0", marginBottom: "24px" }}>
              <h4 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "#1e293b", fontWeight: 600 }}>Configuración General</h4>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <label style={{ fontSize: "14px", color: "#475569" }}>
                  Radio de cercanía a sucursal (km):
                </label>
                <input 
                  type="number" 
                  min="0" 
                  max="15" 
                  step="1"
                  className="mdc-suc-input" 
                  style={{ width: "120px", height: "40px", background: isEditingRadius ? "#fff" : "#f8fafc", color: isEditingRadius ? "#1e293b" : "#64748b" }}
                  disabled={!isEditingRadius}
                  value={branchRadiusKm} 
                  onChange={(e) => {
                    const rawVal = e.target.value;
                    if (rawVal === "") {
                      setBranchRadiusKm("");
                      return;
                    }
                    let val = Number(rawVal);
                    if (isNaN(val)) return;
                    if (val < 0) val = 0;
                    if (val > 15) val = 15;
                    setBranchRadiusKm(val);
                    if (!isDemo) {
                      writeStored(STORAGE_KEYS.branchRadius, val);
                    }
                  }} 
                />

                <div style={{ position: "relative" }}>
                  {!isEditingRadius ? (
                    <button
                      type="button"
                      className="mdc-btn mdc-btn--outline"
                      style={{ height: "40px", width: "40px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                      onClick={() => setShowRadiusMenu(!showRadiusMenu)}
                      title="Configuración"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="mdc-btn mdc-btn--primary"
                      style={{ height: "40px", padding: "0 12px", display: "flex", alignItems: "center", gap: "8px" }}
                      disabled={isSavingBranchConfig}
                      onClick={async () => {
                        await handleSaveBranchConfig();
                        setIsEditingRadius(false);
                      }}
                    >
                      {isSavingBranchConfig ? (
                        "..."
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                            <polyline points="17 21 17 13 7 13 7 21"/>
                            <polyline points="7 3 7 8 15 8"/>
                          </svg>
                          Guardar
                        </>
                      )}
                    </button>
                  )}

                  {showRadiusMenu && !isEditingRadius && (
                    <div
                      style={{
                        position: "absolute",
                        top: "44px",
                        left: 0,
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        padding: "4px",
                        zIndex: 10,
                        width: "120px"
                      }}
                    >
                      <button
                        type="button"
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "8px 12px",
                          background: "transparent",
                          border: "none",
                          fontSize: "13px",
                          color: "#1e293b",
                          cursor: "pointer",
                          borderRadius: "4px"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        onClick={() => {
                          setIsEditingRadius(true);
                          setShowRadiusMenu(false);
                        }}
                      >
                        Actualizar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {sucFeedback && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
                background: sucFeedback.type === "error" ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                color: sucFeedback.type === "error" ? "#dc2626" : "#059669",
                border: `1px solid ${sucFeedback.type === "error" ? "rgba(239, 68, 68, 0.25)" : "rgba(16, 185, 129, 0.25)"}`,
              }}
            >
              <span>{sucFeedback.message}</span>
            </div>
          )}

          {/* ── Form (create / edit) ── */}
          {sucMode !== "idle" && (
            <div ref={sucFormRef} className="mdc-suc-form">
              <div className="mdc-suc-form__badge">
                {sucMode === "create" ? "Nueva sucursal" : "Editar sucursal"}
              </div>

              <div className="mdc-suc-form__layout">
                {/* ── Left Column: Map ── */}
                <div className="mdc-suc-form__left">
                  <div className="mdc-suc-map">
                    <div className="mdc-suc-map__hint">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      Pincha en el mapa para capturar coordenadas y autocompletar dirección
                    </div>
                    <MdcSucursalMapPicker
                      latitude={sucForm.latitude}
                      longitude={sucForm.longitude}
                      branchName={sucForm.name}
                      address={sucForm.address}
                      orgName={orgDisplayName}
                      orgLogoUrl={orgLogo}
                      onLocationSelect={({ lat, lng, address, colonia }) => {
                        skipForwardGeocodeRef.current = true;
                        setSucForm((p) => ({
                          ...p,
                          latitude: lat,
                          longitude: lng,
                          ...(address ? { address } : {}),
                          ...(colonia ? { colonia, neighborhood: colonia } : {}),
                        }));
                        setTimeout(() => {
                          skipForwardGeocodeRef.current = false;
                        }, 2000);
                      }}
                    />
                  </div>
                </div>

                {/* ── Right Column: Fields ── */}
                <div className="mdc-suc-form__right">
                  <div className="mdc-suc-form__grid">
                    {/* Nombre */}
                    <label className="mdc-suc-field mdc-suc-field--full">
                      <span>Nombre <span style={{ color: "#ef4444" }}>*</span></span>
                      <input
                        className="mdc-suc-input"
                        placeholder="Ej. Sucursal Reforma CDMX"
                        value={sucForm.name}
                        autoFocus
                        onChange={(e) => setSucForm((p) => ({ ...p, name: e.target.value }))}
                      />
                    </label>

                    {/* Dirección */}
                    <label className="mdc-suc-field">
                      <span>Dirección (calles)</span>
                      <input
                        className="mdc-suc-input"
                        placeholder="Ej. Av. Juárez 100"
                        value={sucForm.address}
                        onChange={(e) => setSucForm((p) => ({ ...p, address: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void handleLocateAddress();
                          }
                        }}
                      />
                    </label>

                    {/* Colonia */}
                    <label className="mdc-suc-field">
                      <span>Colonia</span>
                      <input
                        className="mdc-suc-input"
                        placeholder="Ej. Centro Histórico"
                        value={sucForm.colonia}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSucForm((p) => ({ ...p, colonia: val, neighborhood: val }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void handleLocateAddress();
                          }
                        }}
                      />
                    </label>

                    {/* Botón de ubicar en mapa y feedback */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gridColumn: "1 / -1", margin: "-4px 0 2px" }}>
                      <button
                        type="button"
                        className="mdc-btn mdc-btn--xs mdc-btn--ghost"
                        onClick={() => void handleLocateAddress()}
                        disabled={isSearchingAddress || (!sucForm.address.trim() && !sucForm.colonia.trim())}
                        style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", fontSize: 11, color: "#5b3ef5" }}
                        title="Localizar en el mapa según la calle y colonia escritas"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        {isSearchingAddress ? "Buscando en mapa…" : "Ubicar en mapa"}
                      </button>
                      {searchAddressFeedback && (
                        <span style={{ fontSize: 11, color: searchAddressFeedback.includes("encontrada") ? "#16a34a" : "#64748b", fontWeight: 500 }}>
                          {searchAddressFeedback}
                        </span>
                      )}
                    </div>

                    {/* Latitud (read-only) */}
                    <label className="mdc-suc-field">
                      <span>Latitud</span>
                      <div className="mdc-suc-coord-wrap">
                        <svg className="mdc-suc-coord-icon" viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        <input
                          className="mdc-suc-input mdc-suc-input--coord"
                          readOnly
                          placeholder="— pincha en el mapa —"
                          value={sucForm.latitude !== null ? sucForm.latitude.toFixed(6) : ""}
                        />
                      </div>
                    </label>

                    {/* Longitud (read-only) */}
                    <label className="mdc-suc-field">
                      <span>Longitud</span>
                      <div className="mdc-suc-coord-wrap">
                        <svg className="mdc-suc-coord-icon" viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        <input
                          className="mdc-suc-input mdc-suc-input--coord"
                          readOnly
                          placeholder="— pincha en el mapa —"
                          value={sucForm.longitude !== null ? sucForm.longitude.toFixed(6) : ""}
                        />
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* ── Bottom Section: Tipo de sucursal, Estado y Acciones (Wireframe layout) ── */}
              <div className="mdc-suc-form__footer">
                <div className="mdc-suc-form__options">
                  {/* Tipo de sucursal */}
                  <div className="mdc-suc-option-group">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span className="mdc-suc-field-label">Tipo de sucursal</span>
                      {isPrincipalDisabled && (
                        <span style={{ fontSize: 11, color: "#d97706", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          Ya existe una sucursal principal ({existingPrincipalBranch?.name})
                        </span>
                      )}
                    </div>
                    <div className="mdc-suc-toggle">
                      <button
                        type="button"
                        className={`mdc-suc-toggle__btn${(sucForm.type === "PRINCIPAL" || sucForm.isPrincipal) ? " mdc-suc-toggle__btn--principal" : ""}${isPrincipalDisabled ? " is-disabled" : ""}`}
                        disabled={isPrincipalDisabled}
                        onClick={() => {
                          if (!isPrincipalDisabled) {
                            setSucForm((p) => ({ ...p, type: "PRINCIPAL", isPrincipal: true }));
                          }
                        }}
                        title={isPrincipalDisabled ? `Ya existe una sucursal principal: ${existingPrincipalBranch?.name}. Solo se pueden registrar secundarias.` : "Establecer como Sucursal Principal"}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        Principal
                      </button>
                      <button
                        type="button"
                        className={`mdc-suc-toggle__btn${(sucForm.type === "SECUNDARIA" || !sucForm.isPrincipal) ? " mdc-suc-toggle__btn--secondary" : ""}`}
                        onClick={() => setSucForm((p) => ({ ...p, type: "SECUNDARIA", isPrincipal: false }))}
                      >
                        Secundaria
                      </button>
                    </div>
                  </div>

                  {/* Estado */}
                  <div className="mdc-suc-option-group">
                    <span className="mdc-suc-field-label">Estado</span>
                    <div className="mdc-suc-toggle">
                      <button
                        type="button"
                        className={`mdc-suc-toggle__btn${sucForm.status === "ACTIVE" ? " mdc-suc-toggle__btn--active" : ""}`}
                        onClick={() => setSucForm((p) => ({ ...p, status: "ACTIVE" }))}
                      >
                        <span className="mdc-suc-dot mdc-suc-dot--green" />
                        Activa
                      </button>
                      <button
                        type="button"
                        className={`mdc-suc-toggle__btn${sucForm.status === "INACTIVE" ? " mdc-suc-toggle__btn--inactive-sel" : ""}`}
                        onClick={() => setSucForm((p) => ({ ...p, status: "INACTIVE" }))}
                      >
                        <span className="mdc-suc-dot mdc-suc-dot--gray" />
                        Inactiva
                      </button>
                    </div>
                  </div>
                </div>

                {/* Acciones del form */}
                <div className="mdc-suc-form__actions-right">
                  <button
                    type="button"
                    className="mdc-btn mdc-btn--ghost"
                    onClick={() => { setSucMode("idle"); setEditingSucId(null); setSucFeedback(null); }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="mdc-btn mdc-btn--primary"
                    disabled={!sucForm.name.trim() || isSavingSucursal}
                    onClick={() => void handleSaveSucursal()}
                  >
                    {isSavingSucursal ? "Guardando…" : sucMode === "create" ? "Guardar" : "Actualizar"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Tabla de sucursales ── */}
          <div className="mdc-table-wrap" style={{ marginTop: sucMode !== "idle" ? 20 : 0 }}>
            <table className="mdc-table mdc-cfg-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Dirección</th>
                  <th>Colonia</th>
                  <th>Coordenadas</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sucursales.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                      No hay sucursales registradas. Haz clic en «+ Nueva sucursal» para agregar la primera.
                    </td>
                  </tr>
                ) : sucursales.map((suc) => (
                  <tr
                    key={suc.id}
                    className={`mdc-suc-table-row ${editingSucId === suc.id && sucMode === "edit" ? "mdc-suc-row--editing is-selected" : ""}`}
                    onClick={() => {
                      if (editingSucId === suc.id && sucMode === "edit") {
                        setSucMode("idle");
                        setEditingSucId(null);
                      } else {
                        const isP = suc.type === "PRINCIPAL" || Boolean(suc.isPrincipal);
                        setEditingSucId(suc.id);
                        setSucForm({
                          name: suc.name,
                          address: suc.address,
                          neighborhood: suc.neighborhood || suc.colonia,
                          colonia: suc.colonia || suc.neighborhood,
                          latitude: suc.latitude,
                          longitude: suc.longitude,
                          status: suc.status,
                          type: isP ? "PRINCIPAL" : "SECUNDARIA",
                          isPrincipal: isP,
                        });
                        setSucMode("edit");
                        setSucMapPicking(false);
                        setSucFeedback(null);
                        setTimeout(() => {
                          sucFormRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                        }, 50);
                      }
                    }}
                    title="Haz clic para desplegar esta sucursal"
                  >
                    <td style={{ fontWeight: 600 }}>{suc.name}</td>
                    <td>
                      {suc.type === "PRINCIPAL" || suc.isPrincipal ? (
                        <span
                          className="mdc-badge mdc-badge--purple"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            background: "rgba(91, 62, 245, 0.12)",
                            color: "#5b3ef5",
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                          }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          Principal
                        </span>
                      ) : (
                        <span
                          className="mdc-badge"
                          style={{
                            color: "#64748b",
                            background: "rgba(100, 116, 139, 0.1)",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                          }}
                        >
                          Secundaria
                        </span>
                      )}
                    </td>
                    <td>{suc.address || <span style={{ color: "#94a3b8" }}>—</span>}</td>
                    <td>{suc.colonia || <span style={{ color: "#94a3b8" }}>—</span>}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 11 }}>
                      {suc.latitude !== null && suc.longitude !== null
                        ? `${suc.latitude.toFixed(4)}, ${suc.longitude.toFixed(4)}`
                        : <span style={{ color: "#94a3b8" }}>Sin ubicación</span>}
                    </td>
                    <td>
                      <span className={suc.status === "ACTIVE" ? "mdc-badge mdc-badge--ok" : "mdc-badge"}>
                        {suc.status === "ACTIVE" ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="mdc-btn mdc-btn--xs mdc-btn--danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSucToDelete(suc);
                        }}
                        title="Eliminar sucursal"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {showExportPreview ? (
        <div
          className="mdc-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mdc-export-preview-title"
          onClick={() => !isExporting && setShowExportPreview(false)}
        >
          <div className="mdc-modal mdc-modal--wide mdc-export-preview-modal" onClick={(e) => e.stopPropagation()}>
            <header className="mdc-modal-head">
              <div>
                <p>Exportar</p>
                <h3 id="mdc-export-preview-title">Vista previa · {EXPORT_TYPE_LABELS[selectedExportType] ?? selectedExportType}</h3>
              </div>
              <button
                type="button"
                className="mdc-icon-btn"
                onClick={() => setShowExportPreview(false)}
                aria-label="Cerrar vista previa"
                disabled={isExporting}
              >
                ×
              </button>
            </header>
            <p className="mdc-export-preview-modal__lead">
              {isLoadingPreview
                ? "Cargando datos del servidor..."
                : exportPreview.total === 0
                  ? "No hay datos para este tipo de exportación con tu organización."
                  : `Se muestran ${exportPreview.rows.length} de ${exportPreview.total} registros. Confirma para descargar el CSV.`}
            </p>
            {isLoadingPreview ? (
              <div className="mdc-export-preview__empty" style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                <span style={{ display: "inline-block", width: 28, height: 28, border: "3px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <p style={{ marginTop: "0.75rem" }}>Consultando base de datos...</p>
              </div>
            ) : exportPreview.rows.length === 0 ? (
              <div className="mdc-export-preview__empty">Selecciona otro tipo o espera a que haya datos.</div>
            ) : (
              <div className="mdc-export-preview">
                <div className="mdc-export-preview__table-wrap">
                  <table>
                    <thead>
                      <tr>
                        {exportPreview.columns.map((column) => (
                          <th key={column}>{column.replaceAll("_", " ")}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {exportPreview.rows.map((row, index) => (
                        <tr key={`${exportPreview.fileBase}-${index}`}>
                          {exportPreview.columns.map((column) => (
                            <td key={column}>{row[column] === null || row[column] === undefined ? "—" : String(row[column])}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <footer className="mdc-modal-actions">
              <button
                type="button"
                className="mdc-btn mdc-btn--ghost"
                onClick={() => setShowExportPreview(false)}
                disabled={isExporting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="mdc-btn mdc-btn--primary"
                onClick={() => void confirmExportDownload()}
                disabled={isExporting || exportPreview.total === 0}
              >
                {isExporting ? "Exportando…" : "Descargar CSV"}
              </button>
            </footer>
          </div>
        </div>
      ) : null}

      {/* ── Modal de Confirmación de Eliminación de Sucursal ── */}
      {sucToDelete && (
        <div
          className="mdc-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setSucToDelete(null)}
          style={{ zIndex: 1200 }}
        >
          <div
            className="mdc-modal"
            style={{ maxWidth: 440, padding: 24, borderRadius: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mdc-modal-head" style={{ marginBottom: 14 }}>
              <div>
                <p style={{ color: "#ef4444" }}>Confirmar eliminación</p>
                <h3>¿Eliminar sucursal?</h3>
              </div>
              <button
                type="button"
                className="mdc-icon-btn"
                onClick={() => setSucToDelete(null)}
                aria-label="Cerrar modal"
              >
                &times;
              </button>
            </div>

            <div style={{ display: "flex", gap: 14, alignItems: "flex-start", margin: "16px 0 18px" }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "#fee2e2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <div>
                <p style={{ margin: "0 0 6px", fontSize: 13, color: "#1e293b", lineHeight: 1.5 }}>
                  ¿Estás seguro de que deseas eliminar la sucursal <strong>«{sucToDelete.name}»</strong>?
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>
                  Esta acción removerá la sucursal de la lista y su pin del mapa.
                </p>
              </div>
            </div>

            {/* Ficha resumen de la sucursal */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "12px 14px",
                marginBottom: 22,
                fontSize: 12,
                color: "#475569",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>ID:</span>
                <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#0f172a" }}>{sucToDelete.id}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Ubicación:</span>
                <span style={{ fontWeight: 500, color: "#0f172a", textAlign: "right" }}>
                  {[sucToDelete.address, sucToDelete.colonia].filter(Boolean).join(", ") || "Sin dirección"}
                </span>
              </div>
              {sucToDelete.latitude !== null && sucToDelete.longitude !== null && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8" }}>Coordenadas:</span>
                  <span style={{ fontFamily: "monospace", color: "#5b3ef5" }}>
                    {sucToDelete.latitude.toFixed(4)}, {sucToDelete.longitude.toFixed(4)}
                  </span>
                </div>
              )}
            </div>

            <div className="mdc-modal-actions" style={{ gap: 10 }}>
              <button
                type="button"
                className="mdc-btn mdc-btn--ghost"
                onClick={() => setSucToDelete(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="mdc-btn mdc-btn--danger"
                disabled={isDeletingSucursal}
                style={{
                  background: "#ef4444",
                  color: "#ffffff",
                  borderColor: "#dc2626",
                  boxShadow: "0 2px 8px rgba(239, 68, 68, 0.25)",
                  padding: "8px 18px",
                }}
                onClick={() => void handleDeleteSucursal(sucToDelete)}
              >
                {isDeletingSucursal ? "Eliminando…" : "Sí, eliminar sucursal"}
              </button>
            </div>
          </div>
        </div>
      )}


    </section>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={className}>
      <span>{label}</span>
      {children}
    </label>
  );
}
