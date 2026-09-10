import { getAccessToken, getAuthBaseUrl, fetchWithAuth } from "@/lib/auth-api";

export type ZelifyKycPrefill = {
  email: string;
  phone?: string;
  curp: string;
  firstNames?: string;
  lastNames?: string;
};

export type ZelifyKycSessionResponse = {
  sessionId: string;
  webviewUrl: string;
  expiresAt?: string;
};

export type ZelifyKycSessionStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "expired"
  | "rejected"
  | "failed";

/** identity: objeto o null. Nunca string. rfc siempre null → no mostrar. */
export type ZelifyKycIdentity = {
  firstNames: string | null;
  lastNames: string | null;
  curp: string | null;
  rfc: string | null;
  sex: string | null;
  birthDate: string | null;
  /** true = INE/liveness OK; false = REJECTED; null = aún no corre */
  ineMatched: boolean | null;
  ocrConfidence: number | null;
  faceMatchScore: number | null;
};

/** address corto (resumen). objeto o null. Nunca string. */
export type ZelifyKycAddress = {
  street: string | null;
  colony: string | null;
  municipality: string | null;
  state: string | null;
  zip: string | null;
};

export type ZelifyKycOnboardingContact = {
  email: string | null;
  emailVerified: boolean | null;
  phone: string | null;
  phoneVerified: boolean | null;
};

export type ZelifyKycOnboardingSpouse = {
  fullName: string | null;
  phone: string | null;
};

export type ZelifyKycOnboardingPersonal = {
  maritalStatus: string | null;
  maritalStatusOther: string | null;
  hasSpouse: boolean | null;
  spouse: ZelifyKycOnboardingSpouse | null;
  education: string | null;
  educationOther: string | null;
  /** Entrevista Auth — no es domicilio canónico (eso vive en MDC user.address). */
  housingType: string | null;
  housingTypeOther: string | null;
  landmark: string | null;
};

export type ZelifyKycOnboardingAddress = {
  housingType: string | null;
  housingTypeOther: string | null;
  postalCode: string | null;
  stateCode: string | null;
  stateName: string | null;
  municipality: string | null;
  locality: string | null;
  settlementType: string | null;
  settlementName: string | null;
  streetName: string | null;
  exteriorNumber: string | null;
  interiorNumber: string | null;
  landmark: string | null;
};

export type ZelifyKycOnboardingReference = {
  fullName: string | null;
  relation: string | null;
  relationOther: string | null;
  phone: string | null;
};

/** Expediente completo post-register. null = paso no corrió. */
export type ZelifyKycOnboarding = {
  country: string | null;
  contact: ZelifyKycOnboardingContact | null;
  personal: ZelifyKycOnboardingPersonal | null;
  address: ZelifyKycOnboardingAddress | null;
  references: ZelifyKycOnboardingReference[] | null;
  acceptedTerms: boolean | null;
};

export type ZelifyKycSessionDetail = {
  sessionId: string;
  status: ZelifyKycSessionStatus;
  /** En Auth se llama userId (null hasta register). En MDC se guarda como zelifyUserId. */
  userId: string | null;
  identity: ZelifyKycIdentity | null;
  /** Resumen corto de domicilio (INE). El expediente completo está en onboarding.address. */
  address: ZelifyKycAddress | null;
  onboarding: ZelifyKycOnboarding | null;
  completedAt?: string | null;
  /** lists hoy = null → esconder bloque Listas en UI */
  lists: null;
  expiresAt?: string;
  /**
   * El GET de Zelify NO trae token. No usar para abrir/copiar.
   * Link operable = kycWebviewUrl de MDC.
   */
  webviewUrl?: string;
};

const KYC_LOG = "[KYC]";

/** Enmascara token de query y Bearer para logs seguros pero útiles. */
export function maskKycSecret(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === "string") {
    return value
      .replace(/([?&]token=)[^&\s]+/gi, "$1***")
      .replace(/(Bearer\s+)[A-Za-z0-9._\-]+/gi, "$1***");
  }
  if (Array.isArray(value)) return value.map(maskKycSecret);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (/token|authorization|secret|password/i.test(k) && typeof v === "string") {
        out[k] = v.length > 8 ? `${v.slice(0, 4)}…***` : "***";
      } else if (k === "webviewUrl" || k === "kycWebviewUrl" || k === "url") {
        out[k] = maskKycSecret(v);
      } else {
        out[k] = maskKycSecret(v);
      }
    }
    return out;
  }
  return value;
}

export function kycLog(step: string, detail?: unknown) {
  if (detail === undefined) {
    console.log(`${KYC_LOG} ${step}`);
    return;
  }
  console.log(`${KYC_LOG} ${step}`, maskKycSecret(detail));
}

export function kycWarn(step: string, detail?: unknown) {
  if (detail === undefined) {
    console.warn(`${KYC_LOG} ${step}`);
    return;
  }
  console.warn(`${KYC_LOG} ${step}`, maskKycSecret(detail));
}

export function kycError(
  step: string,
  err: unknown,
  context?: Record<string, unknown>,
) {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  console.error(`${KYC_LOG} ❌ ${step}`, {
    teamHint: inferKycErrorOwner(message),
    message,
    ...(context ? { context: maskKycSecret(context) } : {}),
    error: err,
    stack,
  });
}

/** Heurística para saber a quién escalar el fallo. */
export function inferKycErrorOwner(message: string): "Auth" | "MDC" | "Front" | "Webview" | "Desconocido" {
  const m = message.toLowerCase();
  if (
    m.includes("unauthorized") ||
    m.includes("sesión expirada") ||
    m.includes("kyc_onboarding_sessions") ||
    m.includes("null value in column") ||
    m.includes("violates not-null") ||
    m.includes("no se pudo crear la sesión") ||
    m.includes("no se pudo consultar kyc") ||
    m.includes("access_token") ||
    m.includes("/api/v2/kyc-onboarding")
  ) {
    return "Auth";
  }
  if (
    m.includes("attach kyc") ||
    (m.includes("finance-requests") && m.includes("/kyc")) ||
    m.includes("failed to attach kyc")
  ) {
    return "MDC";
  }
  if (m.includes("curp") && (m.includes("faltan") || m.includes("18"))) return "Front";
  return "Desconocido";
}

function ensureAuthTokenOrThrow() {
  const token = getAccessToken();
  if (!token) {
    kycError("authHeaders", new Error("No hay access_token de Zelify. Inicia sesión de nuevo."), {
      fixIn: "Front/login — getAccessToken() vacío",
    });
    throw new Error("No hay access_token de Zelify. Inicia sesión de nuevo.");
  }
  kycLog("auth · Bearer presente", { tokenLen: token.length, tokenPrefix: `${token.slice(0, 8)}…` });
}

function resolveKycWebviewUrl(webviewUrl: string): string {
  const trimmed = (webviewUrl || "").trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/session/")) {
    const resolved = `https://kyc.zelify.com${trimmed}`;
    kycLog("resolveKycWebviewUrl · prefijo kyc.zelify.com (solo create POST)", {
      from: trimmed,
      to: maskKycSecret(resolved),
    });
    return resolved;
  }
  return trimmed;
}

function normalizeSessionStatus(raw: unknown): ZelifyKycSessionStatus {
  const value = String(raw || "pending").toLowerCase().replace(/\s+/g, "_");
  if (
    value === "pending" ||
    value === "in_progress" ||
    value === "completed" ||
    value === "expired" ||
    value === "rejected" ||
    value === "failed"
  ) {
    return value;
  }
  if (value === "complete" || value === "done" || value === "approved") return "completed";
  if (value === "in-progress" || value === "processing") return "in_progress";
  if (value === "expire" || value === "expired_link") return "expired";
  if (value === "reject" || value === "declined") return "rejected";
  if (value === "error") return "failed";
  kycWarn("normalizeSessionStatus · status desconocido, fallback pending", { raw });
  return "pending";
}

function asNullableString(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function asNullableBoolean(value: unknown): boolean | null {
  if (value === true || value === false) return value;
  return null;
}

function asNullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** identity/address: solo objeto o null. Nunca string. */
function parseIdentity(raw: unknown): ZelifyKycIdentity | null {
  if (raw == null) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) {
    kycWarn("parseIdentity · Auth mandó no-objeto (se ignora; debe ser objeto|null)", {
      type: typeof raw,
      raw,
    });
    return null;
  }
  const obj = raw as Record<string, unknown>;
  return {
    firstNames: asNullableString(obj.firstNames ?? obj.first_names),
    lastNames: asNullableString(obj.lastNames ?? obj.last_names),
    curp: asNullableString(obj.curp),
    rfc: null,
    sex: asNullableString(obj.sex),
    birthDate: asNullableString(obj.birthDate ?? obj.birth_date),
    ineMatched: asNullableBoolean(obj.ineMatched ?? obj.ine_matched),
    ocrConfidence: asNullableNumber(obj.ocrConfidence ?? obj.ocr_confidence),
    faceMatchScore: asNullableNumber(obj.faceMatchScore ?? obj.face_match_score),
  };
}

function parseAddress(raw: unknown): ZelifyKycAddress | null {
  if (raw == null) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) {
    kycWarn("parseAddress · Auth mandó no-objeto (se ignora; debe ser objeto|null)", {
      type: typeof raw,
      raw,
    });
    return null;
  }
  const obj = raw as Record<string, unknown>;
  return {
    street: asNullableString(obj.street),
    colony: asNullableString(obj.colony),
    municipality: asNullableString(obj.municipality),
    state: asNullableString(obj.state),
    zip: asNullableString(obj.zip),
  };
}

function parseOnboardingContact(raw: unknown): ZelifyKycOnboardingContact | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  return {
    email: asNullableString(obj.email),
    emailVerified: asNullableBoolean(obj.emailVerified ?? obj.email_verified),
    phone: asNullableString(obj.phone),
    phoneVerified: asNullableBoolean(obj.phoneVerified ?? obj.phone_verified),
  };
}

function parseOnboardingSpouse(raw: unknown): ZelifyKycOnboardingSpouse | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  return {
    fullName: asNullableString(obj.fullName ?? obj.full_name),
    phone: asNullableString(obj.phone),
  };
}

function parseOnboardingPersonal(raw: unknown): ZelifyKycOnboardingPersonal | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  return {
    maritalStatus: asNullableString(obj.maritalStatus ?? obj.marital_status),
    maritalStatusOther: asNullableString(obj.maritalStatusOther ?? obj.marital_status_other),
    hasSpouse: asNullableBoolean(obj.hasSpouse ?? obj.has_spouse),
    spouse: parseOnboardingSpouse(obj.spouse),
    education: asNullableString(obj.education),
    educationOther: asNullableString(obj.educationOther ?? obj.education_other),
    housingType: asNullableString(obj.housingType ?? obj.housing_type),
    housingTypeOther: asNullableString(obj.housingTypeOther ?? obj.housing_type_other),
    landmark: asNullableString(obj.landmark),
  };
}

function parseOnboardingAddress(raw: unknown): ZelifyKycOnboardingAddress | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  return {
    housingType: asNullableString(obj.housingType ?? obj.housing_type),
    housingTypeOther: asNullableString(obj.housingTypeOther ?? obj.housing_type_other),
    postalCode: asNullableString(obj.postalCode ?? obj.postal_code),
    stateCode: asNullableString(obj.stateCode ?? obj.state_code),
    stateName: asNullableString(obj.stateName ?? obj.state_name),
    municipality: asNullableString(obj.municipality),
    locality: asNullableString(obj.locality),
    settlementType: asNullableString(obj.settlementType ?? obj.settlement_type),
    settlementName: asNullableString(obj.settlementName ?? obj.settlement_name),
    streetName: asNullableString(obj.streetName ?? obj.street_name),
    exteriorNumber: asNullableString(obj.exteriorNumber ?? obj.exterior_number),
    interiorNumber: asNullableString(obj.interiorNumber ?? obj.interior_number),
    landmark: asNullableString(obj.landmark),
  };
}

function parseOnboardingReferences(raw: unknown): ZelifyKycOnboardingReference[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw)) {
    kycWarn("parseOnboardingReferences · no es array", { type: typeof raw });
    return null;
  }
  return raw
    .filter((item): item is Record<string, unknown> => item != null && typeof item === "object")
    .map((obj) => ({
      fullName: asNullableString(obj.fullName ?? obj.full_name),
      relation: asNullableString(obj.relation),
      relationOther: asNullableString(obj.relationOther ?? obj.relation_other),
      phone: asNullableString(obj.phone),
    }));
}

function parseOnboarding(raw: unknown): ZelifyKycOnboarding | null {
  if (raw == null) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) {
    kycWarn("parseOnboarding · Auth mandó no-objeto (se ignora)", { type: typeof raw });
    return null;
  }
  const obj = raw as Record<string, unknown>;
  const personal = parseOnboardingPersonal(obj.personal);
  const legacyAddress = parseOnboardingAddress(obj.address);
  // Auth ya no guarda domicilio; housing/landmark pueden venir en personal o (legacy) en address.
  if (personal && legacyAddress) {
    if (!personal.housingType && legacyAddress.housingType) {
      personal.housingType = legacyAddress.housingType;
      personal.housingTypeOther = personal.housingTypeOther ?? legacyAddress.housingTypeOther;
    }
    if (!personal.landmark && legacyAddress.landmark) {
      personal.landmark = legacyAddress.landmark;
    }
  }
  return {
    country: asNullableString(obj.country),
    contact: parseOnboardingContact(obj.contact),
    personal,
    // Se parsea por compatibilidad pero Front no debe pintar domicilio desde aquí.
    address: legacyAddress,
    references: parseOnboardingReferences(obj.references),
    acceptedTerms: asNullableBoolean(obj.acceptedTerms ?? obj.accepted_terms),
  };
}

function mapSessionDetail(data: any): ZelifyKycSessionDetail {
  const sessionId = data?.sessionId || data?.session_id || data?.id;
  // Auth JSON trae userId (no zelifyUserId).
  const userId = asNullableString(data?.userId ?? data?.user_id);
  const onboarding = parseOnboarding(data?.onboarding);
  const mapped: ZelifyKycSessionDetail = {
    sessionId: String(sessionId || ""),
    status: normalizeSessionStatus(data?.status),
    userId,
    identity: parseIdentity(data?.identity),
    address: parseAddress(data?.address),
    onboarding,
    completedAt: asNullableString(data?.completedAt ?? data?.completed_at),
    lists: null,
    expiresAt: data?.expiresAt || data?.expires_at,
    webviewUrl: data?.webviewUrl || data?.webview_url,
  };
  kycLog("mapSessionDetail", {
    sessionId: mapped.sessionId,
    status: mapped.status,
    userId: mapped.userId,
    hasIdentity: mapped.identity != null,
    hasAddress: mapped.address != null,
    hasOnboarding: mapped.onboarding != null,
    hasOnboardingContact: mapped.onboarding?.contact != null,
    hasOnboardingPersonal: mapped.onboarding?.personal != null,
    referencesCount: mapped.onboarding?.references?.length ?? 0,
    ineMatched: mapped.identity?.ineMatched ?? null,
    getWebviewUrlPresent: Boolean(mapped.webviewUrl),
    note: "No abrir webviewUrl del GET; usar kycWebviewUrl de MDC",
  });
  return mapped;
}

async function readErrorBody(res: Response): Promise<{ message: string; raw: unknown }> {
  const text = await res.text().catch(() => "");
  let raw: unknown = text;
  let message = `HTTP ${res.status}`;
  try {
    raw = text ? JSON.parse(text) : null;
    const obj = raw as { message?: string; error?: string; detail?: string } | null;
    message = obj?.message || obj?.error || obj?.detail || text || message;
  } catch {
    if (text) message = text.slice(0, 500);
  }
  return { message, raw };
}

/**
 * Crea sesión KYC onboarding Zelify.
 * Auth: solo Bearer del login. Sin x-api-key / secrets en el front.
 */
export async function createZelifyKycOnboardingSession(
  prefill: ZelifyKycPrefill,
): Promise<ZelifyKycSessionResponse> {
  const base = getAuthBaseUrl().replace(/\/$/, "");
  const url = `${base}/api/v2/kyc-onboarding/sessions`;
  const body = { prefill };

  kycLog("POST Auth /sessions · request", {
    fixOwnerIfFails: "Auth (zelify-core-products)",
    url,
    prefill,
  });

  ensureAuthTokenOrThrow();

  let res: Response;
  try {
    res = await fetchWithAuth("/api/v2/kyc-onboarding/sessions", {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch (err) {
    kycError("POST Auth /sessions · network/fetch falló", err, { url, fixOwner: "Auth / red / CORS / sesión" });
    throw err;
  }

  if (!res.ok) {
    const { message, raw } = await readErrorBody(res);
    const error = new Error(message || `No se pudo crear la sesión KYC (${res.status})`);
    kycError("POST Auth /sessions · HTTP error", error, {
      fixOwner: "Auth",
      status: res.status,
      statusText: res.statusText,
      url,
      responseBody: raw,
      hint:
        typeof message === "string" && message.includes("kyc_onboarding_sessions")
          ? "Auth inserta sin id en kyc_onboarding_sessions (NOT NULL). Corregir backend Auth."
          : undefined,
    });
    throw error;
  }

  const data = await res.json();
  kycLog("POST Auth /sessions · response raw", data);

  const sessionId = data.sessionId || data.session_id || data.id;
  const rawUrl = data.webviewUrl || data.webview_url || data.url || "";
  if (!sessionId || !rawUrl) {
    const error = new Error("La respuesta KYC no incluye sessionId/webviewUrl.");
    kycError("POST Auth /sessions · payload incompleto", error, {
      fixOwner: "Auth",
      data,
    });
    throw error;
  }

  const resolved = {
    sessionId: String(sessionId),
    webviewUrl: resolveKycWebviewUrl(String(rawUrl)),
    expiresAt: data.expiresAt || data.expires_at,
  };
  kycLog("POST Auth /sessions · OK (usar este webviewUrl en MDC /kyc)", resolved);
  return resolved;
}

/**
 * Consulta estado de sesión KYC.
 * No usar webviewUrl de esta respuesta para el link (sin token). Usar kycWebviewUrl de MDC.
 */
export async function fetchZelifyKycOnboardingSession(
  kycSessionId: string,
): Promise<ZelifyKycSessionDetail> {
  const base = getAuthBaseUrl().replace(/\/$/, "");
  const url = `${base}/api/v2/kyc-onboarding/sessions/${encodeURIComponent(kycSessionId)}`;

  kycLog("GET Auth /sessions/{id} · request", {
    fixOwnerIfFails: "Auth",
    url,
    kycSessionId,
  });

  ensureAuthTokenOrThrow();

  let res: Response;
  try {
    res = await fetchWithAuth(`/api/v2/kyc-onboarding/sessions/${encodeURIComponent(kycSessionId)}`, {
      method: "GET",
    });
  } catch (err) {
    kycError("GET Auth /sessions/{id} · network/fetch falló", err, { url, kycSessionId });
    throw err;
  }

  if (!res.ok) {
    const { message, raw } = await readErrorBody(res);
    const error = new Error(message || `No se pudo consultar KYC (${res.status})`);
    kycError("GET Auth /sessions/{id} · HTTP error", error, {
      fixOwner: "Auth",
      status: res.status,
      kycSessionId,
      responseBody: raw,
    });
    throw error;
  }

  const payload = await res.json();
  kycLog("GET Auth /sessions/{id} · response raw", payload);
  const data = payload?.data || payload;
  return mapSessionDetail(data);
}

/** Bonus: buscar sesión por CURP. */
export async function fetchZelifyKycOnboardingSessionByCurp(
  curp: string,
): Promise<ZelifyKycSessionDetail | null> {
  const base = getAuthBaseUrl().replace(/\/$/, "");
  const cleaned = curp.replace(/\s+/g, "").toUpperCase();
  const url = `${base}/api/v2/kyc-onboarding/sessions?curp=${encodeURIComponent(cleaned)}`;

  kycLog("GET Auth /sessions?curp= · request", { url, curp: cleaned });

  ensureAuthTokenOrThrow();

  let res: Response;
  try {
    res = await fetchWithAuth(`/api/v2/kyc-onboarding/sessions?curp=${encodeURIComponent(cleaned)}`, {
      method: "GET",
    });
  } catch (err) {
    kycError("GET Auth /sessions?curp= · network/fetch falló", err, { url, curp: cleaned });
    throw err;
  }

  if (res.status === 404) {
    kycLog("GET Auth /sessions?curp= · 404 (sin sesión)", { curp: cleaned });
    return null;
  }
  if (!res.ok) {
    const { message, raw } = await readErrorBody(res);
    const error = new Error(message || `No se pudo buscar KYC por CURP (${res.status})`);
    kycError("GET Auth /sessions?curp= · HTTP error", error, {
      fixOwner: "Auth",
      status: res.status,
      responseBody: raw,
    });
    throw error;
  }
  const payload = await res.json();
  kycLog("GET Auth /sessions?curp= · response raw", payload);
  const data = Array.isArray(payload) ? payload[0] : payload?.data || payload;
  if (!data) return null;
  return mapSessionDetail(data);
}

/** CURP mexicana: 18 caracteres alfanuméricos (sin espacios). */
export function isCurpLike(identificationNumber: string): boolean {
  const cleaned = identificationNumber.replace(/\s+/g, "").toUpperCase();
  return cleaned.length === 18 && /^[A-Z0-9]{18}$/.test(cleaned);
}

/** Normaliza teléfono a 10 dígitos (sin +52). */
export function normalizeMxPhone10(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("52")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits.slice(-10);
}

/** Etiqueta UI a partir del status Zelify (dueño del estado). */
export function kycStatusLabel(status: ZelifyKycSessionStatus | null | undefined): string {
  switch (status) {
    case "completed":
      return "Verificación completa";
    case "expired":
      return "Link vencido";
    case "rejected":
    case "failed":
      return "Verificación no aprobada";
    case "pending":
    case "in_progress":
    default:
      return "Verificación pendiente";
  }
}

export function formatIneMatched(ineMatched: boolean | null | undefined): string | null {
  if (ineMatched === true) return "INE / liveness OK";
  if (ineMatched === false) return "Documento rechazado";
  return null;
}

export function formatKycPercent(value: unknown): string | null {
  const parsed = asNullableNumber(value);
  if (parsed == null) return null;
  return `${parsed.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
}

export function kycScoreTone(value: unknown): "ok" | "warn" | "bad" | "neutral" {
  const parsed = asNullableNumber(value);
  if (parsed == null) return "neutral";
  if (parsed >= 80) return "ok";
  if (parsed >= 50) return "warn";
  return "bad";
}

/** Une campos no-null con separador; si todos null → null (no inventar "OK"). */
export function joinKycFields(parts: Array<string | null | undefined>, sep = " · "): string | null {
  const values = parts.map((p) => (p == null ? "" : String(p).trim())).filter(Boolean);
  return values.length ? values.join(sep) : null;
}

export function formatKycIdentitySummary(identity: ZelifyKycIdentity | null): string | null {
  if (!identity) return null;
  const name = joinKycFields([identity.firstNames, identity.lastNames], " ");
  const ine = formatIneMatched(identity.ineMatched);
  return joinKycFields([name, identity.curp, identity.sex, identity.birthDate, ine]);
}

export function formatKycAddressSummary(address: ZelifyKycAddress | null): string | null {
  if (!address) return null;
  return joinKycFields([
    address.street,
    address.colony,
    address.municipality,
    address.state,
    address.zip,
  ]);
}

const MARITAL_LABELS: Record<string, string> = {
  soltero: "Soltero(a)",
  casado: "Casado(a)",
  union_libre: "Unión libre",
  divorciado: "Divorciado(a)",
  viudo: "Viudo(a)",
  otro: "Otro",
};

const EDUCATION_LABELS: Record<string, string> = {
  sin_estudios: "Sin estudios",
  primaria: "Primaria",
  secundaria: "Secundaria",
  preparatoria: "Preparatoria",
  tecnico: "Técnico",
  universitario: "Universitario",
  posgrado: "Posgrado",
  otro: "Otro",
};

const HOUSING_LABELS: Record<string, string> = {
  propia: "Propia",
  rentada: "Rentada",
  familiar: "Familiar",
  otra: "Otra",
};

const RELATION_LABELS: Record<string, string> = {
  amistad: "Amistad",
  familiar: "Familiar",
  laboral: "Laboral",
  otro: "Otro",
};

function labelFromMap(value: string | null | undefined, map: Record<string, string>, other?: string | null): string | null {
  if (!value) return null;
  if (value === "otro" || value === "otra") {
    return other?.trim() || map[value] || value;
  }
  return map[value] || value;
}

export function formatMaritalStatus(status: string | null, other?: string | null): string | null {
  return labelFromMap(status, MARITAL_LABELS, other);
}

export function formatEducation(education: string | null, other?: string | null): string | null {
  return labelFromMap(education, EDUCATION_LABELS, other);
}

export function formatHousingType(housing: string | null, other?: string | null): string | null {
  return labelFromMap(housing, HOUSING_LABELS, other);
}

export function formatRelation(relation: string | null, other?: string | null): string | null {
  return labelFromMap(relation, RELATION_LABELS, other);
}

export function formatSexLabel(sex: string | null | undefined): string | null {
  if (!sex) return null;
  const s = sex.trim().toUpperCase();
  if (s === "H" || s === "HOMBRE" || s === "MASCULINO") return "Hombre";
  if (s === "M" || s === "F" || s === "MUJER" || s === "FEMENINO") return "Mujer";
  return sex;
}

/** @deprecated Auth ya no guarda domicilio. Preferir formatMdcUserAddressLines. */
export function formatOnboardingAddressLines(address: ZelifyKycOnboardingAddress | null): string[] {
  if (!address) return [];
  const street = joinKycFields(
    [
      address.streetName,
      address.exteriorNumber ? `#${address.exteriorNumber}` : null,
      address.interiorNumber ? `Int. ${address.interiorNumber}` : null,
    ],
    " ",
  );
  const settlement = joinKycFields(
    [address.settlementType, address.settlementName],
    " ",
  );
  const city = joinKycFields(
    [address.municipality, address.stateName || address.stateCode, address.postalCode],
    ", ",
  );
  return [street, settlement, address.locality, city, address.landmark, formatHousingType(address.housingType, address.housingTypeOther)]
    .filter((line): line is string => Boolean(line));
}

/** Domicilio canónico desde MDC `user.address` (comprobante). */
export function formatMdcUserAddressLines(address: {
  street?: string | null;
  exteriorNumber?: string | null;
  interiorNumber?: string | null;
  postalCode?: string | null;
  colonia?: string | null;
  municipality?: string | null;
  locality?: string | null;
  state?: string | null;
} | null | undefined): string[] {
  if (!address) return [];
  const street = joinKycFields(
    [
      address.street,
      address.exteriorNumber ? `#${address.exteriorNumber}` : null,
      address.interiorNumber ? `Int. ${address.interiorNumber}` : null,
    ],
    " ",
  );
  const city = joinKycFields(
    [address.municipality, address.state, address.postalCode],
    ", ",
  );
  return [street, address.colonia, address.locality, city].filter((line): line is string => Boolean(line));
}
