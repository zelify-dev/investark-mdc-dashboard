/**
 * Cliente para la API de autenticación (registro, login, refresh, logout, me, sesiones).
 * Base URL: exclusivamente NEXT_PUBLIC_AUTH_API_URL del .env. No hay URLs base quemadas.
 * Prefijo de rutas: /api (ej. /api/auth/login, /api/me, /api/organizations/:id/users).
 * Nota: en Next.js las variables NEXT_PUBLIC_* se inyectan en build time; si cambias .env
 * debes reiniciar el servidor de desarrollo (npm run dev) para que tome el nuevo valor.
 *
 * Seguridad:
 * - Tokens y datos de sesión en sessionStorage (se borran al cerrar la pestaña).
 * - En producción usar HTTPS.
 * - No se exponen tokens en logs.
 * - Logout: POST /api/auth/logout y luego clearAuthSession.
 */
import { deduplicateFetch, clearApiCache } from "@/lib/api-cache";

const getBaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_AUTH_API_URL;
  if (!url || typeof url !== "string" || url.trim() === "") {
    if (typeof window !== "undefined") {
      console.warn(
        "[auth-api] NEXT_PUBLIC_AUTH_API_URL está vacío o no definido. Configura la variable en .env (ej. NEXT_PUBLIC_AUTH_API_URL=http://localhost:8080) y reinicia el servidor."
      );
    }
    return "";
  }
  const base = url.replace(/\/$/, "").trim();
  // Obligatorio: base debe ser URL absoluta del backend (ej. http://localhost:8080).
  if (!base.startsWith("http://") && !base.startsWith("https://")) {
    if (typeof window !== "undefined") {
      console.error("NEXT_PUBLIC_AUTH_API_URL debe ser una URL absoluta (ej. http://localhost:8080). Actual:", url);
    }
    return "";
  }
  return base;
};

/**
 * GET /api/health — comprueba conexión con la API.
 * Útil para verificar que NEXT_PUBLIC_AUTH_API_URL responde.
 */
export async function checkHealth(): Promise<{ ok: boolean; status: number; data?: unknown }> {
  const base = getBaseUrl();
  if (!base) {
    return { ok: false, status: 0 };
  }
  try {
    const res = await fetch(`${base}/api/health`, { method: "GET" });
    const data = res.ok ? await res.json().catch(() => ({})) : undefined;
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: err };
  }
}

/** Para errores de auth con código HTTP (409, 401, 403, 423) */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/** Keys en sessionStorage para la sesión */
/** Marca en sessionStorage que el siguiente flujo debe mostrar “sesión expirada” (no se borra en clearAuthSession). */
const SESSION_EXPIRED_FLASH_KEY = "zelify_session_expired_notice";

export function markSessionExpiredFlash(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_EXPIRED_FLASH_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function peekSessionExpiredFlash(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_EXPIRED_FLASH_KEY) === "1";
}

export function clearSessionExpiredFlash(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_EXPIRED_FLASH_KEY);
  } catch {
    /* ignore */
  }
}

export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER: "user",
  ORGANIZATION: "organization",
  ROLES: "roles",
  ORGANIZATION_SCOPES: "organization_scopes",
  IS_AUTHENTICATED: "isAuthenticated",
  USER_EMAIL: "userEmail",
  DEMO_BYPASS: "zelify_demo_bypass",
} as const;

export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  status: string;
  photo?: string | null;
  username?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  document_number?: string | null;
  email_verified?: boolean;
  phone_verified?: boolean;
  must_change_password?: boolean;
  identity_verified?: boolean;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
  merchant_id?: string | null;
};

export type AuthOrganization = {
  id: string;
  name: string;
  status: string;
  url_log?: string | null;
  url_log_dark?: string | null;
  url_log_light?: string | null;
};

/** Respuesta de GET /api/organizations/:id/branding (público). Campos de branding; cualquiera puede ser null. */
export type OrganizationBranding = {
  id: string;
  url_log: string | null;
  url_log_dark: string | null;
  url_log_light: string | null;
  url_icon: string | null;
  color_a: string | null;
  color_b: string | null;
  branding_updated_at?: string | null;
};

/** Payload PATCH /api/organizations/:id (ORG_ADMIN / OWNER). */
export type UpdateOrganizationPayload = {
  name?: string;
  company_legal_name?: string;
  fiscal_id?: string;
  currency?: string;
  country?: string;
  website?: string;
  industry?: string;
  swift?: string;
};

/** Perfil cliente de la org: GET/PATCH /api/organizations/:id/cliente */
export type OrganizationCliente = {
  local_address?: string | null;
  [key: string]: unknown;
};

/** Detalles completos de la organización (GET /api/organizations/:id). */
export type OrganizationDetails = {
  id: string;
  name: string;
  status: string;
  organization_type?: string;
  fiscal_id?: string;
  currency?: string;
  zcoins?: string;
  country?: string;
  company_legal_name?: string;
  website?: string;
  industry?: string;
  environment?: string;
  swift?: string;
  mdc_access?: boolean;
  registration_config?: unknown;
  url_log?: string | null;
  url_log_dark?: string | null;
  url_log_light?: string | null;
  url_icon?: string | null;
  color_a?: string | null;
  color_b?: string | null;
  branding_updated_at?: string | null;
  scopes?: string[];
  user_onboarding_config?: unknown;
  default_daily_account_limit?: string;
  created_at?: string;
  updated_at?: string;
  /** Si el backend las envía en GET /api/organizations/:id, habilitan integraciones (p. ej. webhooks) tras onboarding. */
  onboarding_verified?: boolean;
  onboarding_completed?: boolean;
  kyb_verified?: boolean;
  users?: AuthUser[];
};

/**
 * Indica si la organización completó/verificó onboarding según GET /api/organizations/:id.
 * Sin ningún flag en true, las integraciones sensibles (webhooks) permanecen deshabilitadas.
 */
export function isOrganizationOnboardingVerified(
  org: OrganizationDetails | null | undefined
): boolean {
  // Override manual (solo si se configura explícitamente en el entorno).
  // Útil para ambientes de desarrollo / QA cuando necesitas habilitar features bloqueadas por onboarding.
  if (process.env.NEXT_PUBLIC_FORCE_ONBOARDING_VERIFIED?.toLowerCase() === "true") {
    return true;
  }
  if (!org) return false;
  if (org.onboarding_verified === true) return true;
  if (org.onboarding_completed === true) return true;
  if (org.kyb_verified === true) return true;
  return false;
}

/**
 * Webhooks, notificaciones, dominios, logs (cuando apliquen), sandbox de API keys:
 * habilitados si la org tiene **al menos un scope** en sesión (GET …/scopes).
 * Si no hay scopes (lista vacía o aún null), se mantiene el criterio anterior por **onboarding verificado**.
 */
export function canUseOrganizationIntegrations(
  org: OrganizationDetails | null | undefined,
  scopesFromSession: string[] | null
): boolean {
  if (scopesFromSession != null && scopesFromSession.length > 0) return true;
  return isOrganizationOnboardingVerified(org);
}

export type AuthSuccessResponse = {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
  organization: AuthOrganization;
  roles: string[];
  api_keys_created?: boolean;
};

export type LoginStep1Response = {
  session_id: string;
  message: string;
};

export type RefreshResponse = {
  access_token: string;
  refresh_token: string;
};

export type RegisterPayload = {
  organization_name: string;
  country: string;
  company_legal_name: string;
  website: string;
  industry: string;
  full_name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  organization_id?: string;
};

export type Login409Response = {
  organizations?: { id: string; name: string }[];
  message?: string;
};

export type SessionItem = {
  id: string;
  created_at?: string;
  last_seen_at?: string;
  ip?: string;
  user_agent?: string;
  expires_at?: string;
  revoked_at?: string | null;
  active?: boolean;
};

export type MeResponse = {
  user: AuthUser;
  organization?: AuthOrganization;
  roles?: string[];
  [key: string]: unknown;
};

/** Devuelve la URL base del API (sin barra final). */
export function getAuthBaseUrl(): string {
  return getBaseUrl();
}

/** Devuelve el access_token guardado o null. No enviar Bearer si no hay token (el backend respondería 403). */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = sessionStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  return token && token.trim() ? token.trim() : null;
}

/** 
 * Extrae el sid (Session ID) del access_token (JWT) para identificar la sesión actual.
 */
export function getCurrentSessionId(): string | null {
  const token = getAccessToken();
  if (!token) return null;
  try {
    // Decodificar el payload del JWT (segunda parte)
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    return payload.sid || null;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[auth-api] Error al decodificar sid del token:", err);
    }
    return null;
  }
}

/** Request genérico al API con Authorization Bearer. Si recibe 401 o 403 con sesión activa,
 * intenta refresh y reintenta una vez.
 * Si el refresh falla (token inválido/sesión revocada), limpia la sesión y lanza AuthError para redirigir a login. */
export async function fetchWithAuth(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const base = getBaseUrl();
  if (!base) throw new Error("NEXT_PUBLIC_AUTH_API_URL no está configurado");
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  // Asegurar que la petición va al backend, no al mismo origen (Next.js)
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    throw new Error("La URL del API debe ser absoluta. Configura NEXT_PUBLIC_AUTH_API_URL (ej. http://localhost:8080)");
  }
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && (options.body && typeof options.body === "string")) {
    headers.set("Content-Type", "application/json");
  }
  const fetcher = async () => {
    let res = await fetch(url, { ...options, headers });
    const shouldAttemptRefresh =
      Boolean(token) && (res.status === 401 || res.status === 403);

    if (shouldAttemptRefresh) {
      const refreshed = await refresh();
      if (refreshed) {
        const newToken = getAccessToken();
        if (newToken) {
          headers.set("Authorization", `Bearer ${newToken}`);
          res = await fetch(url, { ...options, headers });
        }
      } else {
        markSessionExpiredFlash();
        clearAuthSession();
        throw new AuthError("Sesión expirada. Inicia sesión de nuevo.", 401);
      }
    }
    // Tras refresh, un 401 indica sesión inválida (p. ej. refresh rotado o revocado). No limpiar por 403: puede ser permiso real.
    if (Boolean(token) && res.status === 401) {
      markSessionExpiredFlash();
      clearAuthSession();
      throw new AuthError("Sesión expirada. Inicia sesión de nuevo.", 401);
    }
    return res;
  };

  // Solo deduplicamos peticiones GET; POST/PATCH/DELETE deben ir directas
  if (options.method && options.method !== "GET") {
    return fetcher();
  }

  // Clave para el caché: "METHOD:URL"
  const method = options.method || "GET";
  const key = `${method}:${url}`;

  return deduplicateFetch(key, fetcher);
}

/** POST /api/auth/register */
export async function register(
  payload: RegisterPayload
): Promise<AuthSuccessResponse> {
  const base = getBaseUrl();
  if (!base) {
    throw new Error("NEXT_PUBLIC_AUTH_API_URL no está configurado en .env");
  }
  const res = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 409) {
    throw new AuthError(
      data.message || "Este correo ya tiene cuenta. Inicia sesión.",
      409,
      data
    );
  }
  if (!res.ok) {
    const msg = data.message || (res.status === 400 ? "Revisa los datos enviados." : res.status >= 500 ? "Algo falló. Intenta de nuevo." : "Error en el registro");
    throw new AuthError(msg, res.status, data);
  }
  return data as AuthSuccessResponse;
}

/** POST /api/auth/dashboard/login */
export async function login(
  payload: LoginPayload
): Promise<LoginStep1Response | Login409Response | AuthSuccessResponse> {
  const base = getBaseUrl();
  if (!base) {
    throw new Error("NEXT_PUBLIC_AUTH_API_URL no está configurado en .env");
  }
  const body: Record<string, string> = {
    email: payload.email,
    password: payload.password,
  };
  if (payload.organization_id) body.organization_id = payload.organization_id;
  const res = await fetch(`${base}/api/auth/dashboard/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 409) return data as Login409Response;

  // Si devuelve 200/201 y tiene tokens, es un bypass de OTP
  const hasToken = "access_token" in data || "accessToken" in data;
  if (res.ok && hasToken) {
    return data as AuthSuccessResponse;
  }

  if (!res.ok) {
    const apiMsg =
      typeof (data as { message?: string }).message === "string"
        ? (data as { message: string }).message.trim()
        : "";
    let msg = apiMsg;
    if (!msg) {
      if (res.status === 401) msg = "Email o contraseña incorrectos.";
      else if (res.status === 403) msg = "Usuario o sede deshabilitados.";
      else if (res.status === 423)
        msg =
          "Cuenta bloqueada temporalmente por seguridad. Inténtalo de nuevo en unos minutos.";
      else if (res.status === 429)
        msg =
          "Demasiados intentos de inicio de sesión. Espera unos minutos e inténtalo de nuevo.";
      else if (res.status >= 500) msg = "Algo falló. Intenta de nuevo.";
      else msg = "Error en el inicio de sesión";
    }
    throw new AuthError(msg, res.status, data);
  }
  return data as LoginStep1Response;
}

/** POST /api/auth/dashboard/login/verify-otp */
export async function verifyDashboardOtp(payload: {
  session_id: string;
  otp_code: string;
}): Promise<AuthSuccessResponse> {
  const base = getBaseUrl();
  if (!base) throw new Error("NEXT_PUBLIC_AUTH_API_URL no está configurado en .env");
  const res = await fetch(`${base}/api/auth/dashboard/login/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const apiMsg =
      typeof (data as { message?: string }).message === "string"
        ? (data as { message: string }).message.trim()
        : "";
    let msg = apiMsg;
    if (!msg) {
      if (res.status === 401) msg = "Código OTP inválido o expirado.";
      else if (res.status === 423)
        msg =
          "Cuenta bloqueada temporalmente por seguridad. Inténtalo de nuevo en unos minutos.";
      else if (res.status === 429)
        msg =
          "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
      else msg = "Código OTP inválido o expirado.";
    }
    throw new AuthError(msg, res.status, data);
  }
  return data as AuthSuccessResponse;
}

/** POST /api/auth/refresh. Actualiza tokens en sessionStorage. Devuelve true si hubo rotación. */
export async function refresh(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const k = AUTH_STORAGE_KEYS;
  const refreshToken = sessionStorage.getItem(k.REFRESH_TOKEN);
  if (!refreshToken) return false;
  const base = getBaseUrl();
  if (!base) return false;
  const res = await fetch(`${base}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token || !data.refresh_token) {
    return false;
  }
  sessionStorage.setItem(k.ACCESS_TOKEN, data.access_token);
  sessionStorage.setItem(k.REFRESH_TOKEN, data.refresh_token);
  return true;
}

const LOGOUT_FETCH_MS = 10_000;

/** POST /api/auth/logout (invalida sesión en el servidor) y luego limpia sessionStorage. */
export async function logout(): Promise<void> {
  const base = getBaseUrl();
  const token = getAccessToken();
  if (base && token) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LOGOUT_FETCH_MS);
    try {
      await fetch(`${base}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });
    } catch {
      // Red, timeout o abort: igual cerramos sesión local
    } finally {
      clearTimeout(timeoutId);
    }
  }
  clearAuthSession();
  clearApiCache();
}

/** Roles del usuario actual (ej: ["ORG_ADMIN"], ["OWNER"]). Acepta string[] o Array<{ code: string }> del API y normaliza a códigos en mayúsculas. */
function normalizeRoleCodes(roles: unknown): string[] {
  if (!roles || !Array.isArray(roles) || roles.length === 0) return [];
  return roles
    .map((r: unknown) => (typeof r === "string" ? r : (r as { code?: string })?.code ?? "").toUpperCase())
    .filter(Boolean);
}

/** Guarda la sesión en sessionStorage. Se pierde al cerrar la pestaña.
 * El access_token es obligatorio para que peticiones como POST .../dashboard/members lleven Authorization: Bearer.
 * Acepta access_token (snake_case) o accessToken (camelCase) por si el backend devuelve uno u otro.
 */
export function persistAuthSession(response: AuthSuccessResponse): void {
  if (typeof window === "undefined") return;
  const k = AUTH_STORAGE_KEYS;
  const raw = response as AuthSuccessResponse & { accessToken?: string };
  const accessToken = (raw.access_token ?? raw.accessToken ?? "").trim();
  const refreshToken = (raw.refresh_token ?? (raw as { refreshToken?: string }).refreshToken ?? "").trim();
  if (accessToken) {
    sessionStorage.setItem(k.ACCESS_TOKEN, accessToken);
  } else {
    if (typeof window !== "undefined") {
      console.warn("[auth-api] persistAuthSession: no access_token en la respuesta; las peticiones autenticadas fallarán (403).", { keys: Object.keys(response) });
    }
  }
  if (refreshToken) sessionStorage.setItem(k.REFRESH_TOKEN, refreshToken);
  sessionStorage.setItem(k.USER, JSON.stringify(response.user));
  sessionStorage.setItem(k.ORGANIZATION, JSON.stringify(response.organization));
  rememberLastOrganization(response.organization);
  sessionStorage.setItem(k.ROLES, JSON.stringify(normalizeRoleCodes(response.roles ?? [])));
  sessionStorage.setItem(k.IS_AUTHENTICATED, "true");
  sessionStorage.setItem(k.USER_EMAIL, response.user.email);
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(
    new CustomEvent("authchange", { detail: { authenticated: true } })
  );
}

/** Elimina todos los datos de sesión (sessionStorage). */
export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  Object.values(AUTH_STORAGE_KEYS).forEach((key) =>
    sessionStorage.removeItem(key)
  );
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(
    new CustomEvent("authchange", { detail: { authenticated: false } })
  );
}

/** Usuario guardado (para header/navbar). */
export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEYS.USER);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

const LAST_ORGANIZATION_KEY = "zelify-last-organization";

/** Logo de cliente desde branding/org. Ignora solo logos de producto (Aethereun/Zelify). */
export function pickOrganizationLogoUrl(
  source?: {
    url_log?: string | null;
    url_log_light?: string | null;
    url_log_dark?: string | null;
    logoUrl?: string | null;
  } | null,
): string | null {
  const candidate =
    source?.url_log_light ||
    source?.url_log ||
    source?.url_log_dark ||
    source?.logoUrl ||
    null;
  if (!candidate || /mdc-navbar-logo|zelifyLogo/i.test(candidate)) return null;
  return candidate;
}

/** Persiste la última org para que login pueda pedir el branding público. */
export function rememberLastOrganization(org?: { id?: string; name?: string } | null): void {
  if (typeof window === "undefined" || !org?.id) return;
  window.localStorage.setItem(
    LAST_ORGANIZATION_KEY,
    JSON.stringify({ id: org.id, name: org.name ?? "" }),
  );
}

export function getLastOrganization(): { id: string; name: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_ORGANIZATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id?: string; name?: string };
    if (!parsed.id) return null;
    return { id: parsed.id, name: parsed.name ?? "" };
  } catch {
    return null;
  }
}

/** Organización guardada (id = Client ID / Organization ID en Zelify Keys). */
export function getStoredOrganization(): AuthOrganization | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEYS.ORGANIZATION);
    if (!raw) return null;
    return JSON.parse(raw) as AuthOrganization;
  } catch {
    return null;
  }
}

const ORGS_WITHOUT_LEGAL_PERSON = new Set([
  "fa90c82c-12d8-4039-980a-9d1a258fcb66",
  "68c7e605-203e-4b1a-af0e-ab70f556262b", // INVESTARK
]);

/** Organizaciones que no operan persona jurídica en MDC. */
export function isLegalPersonDisabledOrganization(
  org: AuthOrganization | null = getStoredOrganization(),
): boolean {
  const id = org?.id?.trim().toLowerCase();
  return Boolean(id && ORGS_WITHOUT_LEGAL_PERSON.has(id));
}

/** Roles del usuario actual (ej: ["ORG_ADMIN"], ["BUSINESS"], ["DEVELOPER"]). */
export function getStoredRoles(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEYS.ROLES);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

/** GET /api/organizations/:id — detalles completos de la organización (Bearer). */
export async function getOrganization(id: string): Promise<OrganizationDetails> {
  const res = await fetchWithAuth(`/api/organizations/${encodeURIComponent(id)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener la sede",
      res.status,
      data
    );
  }
  return data as OrganizationDetails;
}

/**
 * PATCH /api/organizations/:id — actualizar datos de org (ORG_ADMIN / OWNER).
 * El :id debe ser el organizationId del JWT; si no, 403.
 */
export async function updateOrganization(
  id: string,
  payload: UpdateOrganizationPayload
): Promise<OrganizationDetails> {
  const res = await fetchWithAuth(`/api/organizations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al actualizar la organización",
      res.status,
      data
    );
  }
  return data as OrganizationDetails;
}

/** GET /api/organizations/:id/cliente — perfil cliente (local_address). 404 si no hay fila. */
export async function getOrganizationCliente(id: string): Promise<OrganizationCliente | null> {
  const res = await fetchWithAuth(`/api/organizations/${encodeURIComponent(id)}/cliente`);
  if (res.status === 404) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener el perfil cliente",
      res.status,
      data
    );
  }
  return data as OrganizationCliente;
}

/** PATCH /api/organizations/:id/cliente — actualizar local_address (ORG_ADMIN). */
export async function updateOrganizationCliente(
  id: string,
  payload: { local_address: string }
): Promise<OrganizationCliente> {
  const res = await fetchWithAuth(`/api/organizations/${encodeURIComponent(id)}/cliente`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al actualizar la dirección",
      res.status,
      data
    );
  }
  return data as OrganizationCliente;
}

/**
 * GET /api/organizations/:id/branding — obtener branding (público; se manda Bearer si hay sesión).
 */
export async function getOrganizationBranding(id: string): Promise<OrganizationBranding> {
  const res = await fetchWithAuth(`/api/organizations/${encodeURIComponent(id)}/branding`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      res.status === 404
        ? "Sede no encontrada"
        : (data as { message?: string }).message ?? "Error al obtener el branding",
      res.status,
      data
    );
  }
  return data as OrganizationBranding;
}

/** Tipo de logo para POST /api/organizations/:id/branding/logo. Solo PNG. */
export type BrandingLogoType = "logo" | "logoDark" | "logoLight" | "icon";

/**
 * POST /api/organizations/:id/branding/logo — subir logo/ícono (multipart). Solo PNG.
 * Campos form-data: logo, logoDark, logoLight, icon. Requiere Bearer y x-org-id.
 * Respuesta 201: objeto branding completo. 400 si no es PNG.
 */
export async function uploadOrganizationLogo(
  orgId: string,
  file: File,
  type: BrandingLogoType
): Promise<OrganizationBranding> {
  return uploadOrganizationLogos(orgId, { [type]: file });
}

/**
 * POST /api/organizations/:id/branding/logo — uno o más PNG (logo, logoDark, logoLight, icon).
 */
export async function uploadOrganizationLogos(
  orgId: string,
  files: Partial<Record<BrandingLogoType, File>>
): Promise<OrganizationBranding> {
  const entries = Object.entries(files).filter(([, file]) => Boolean(file)) as Array<[BrandingLogoType, File]>;
  if (entries.length === 0) {
    throw new AuthError("Selecciona al menos un archivo PNG.", 400, {});
  }
  const form = new FormData();
  for (const [type, file] of entries) {
    if (file.type !== "image/png" && !file.name.toLowerCase().endsWith(".png")) {
      throw new AuthError("Solo se permiten archivos PNG para los logos de branding.", 400, {});
    }
    form.append(type, file);
  }
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(orgId)}/branding/logo`,
    {
      method: "POST",
      body: form,
      headers: { "x-org-id": orgId },
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al subir el logo",
      res.status,
      data
    );
  }
  return data as OrganizationBranding;
}

/** Payload para PATCH /api/organizations/:id/branding. Todos los campos opcionales. */
export type UpdateOrganizationBrandingPayload = {
  url_log?: string | null;
  url_log_dark?: string | null;
  url_log_light?: string | null;
  url_icon?: string | null;
  color_a?: string | null;
  color_b?: string | null;
};

/**
 * PATCH /api/organizations/:id/branding — actualizar URLs y/o colores (Bearer, x-org-id, JSON).
 * Respuesta 200: objeto branding completo (mismo formato que GET).
 */
export async function updateOrganizationBranding(
  orgId: string,
  payload: UpdateOrganizationBrandingPayload
): Promise<OrganizationBranding> {
  const res = await fetchWithAuth(
    `/api/organizations/${encodeURIComponent(orgId)}/branding`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-org-id": orgId },
      body: JSON.stringify(payload),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      res.status === 400
        ? "Colores deben ser #RRGGBB (6 hex)."
        : (data as { message?: string }).message ?? "Error al actualizar branding";
    throw new AuthError(msg, res.status, data);
  }
  return data as OrganizationBranding;
}

/** GET /api/me — perfil del usuario logueado. */
export async function getMe(): Promise<MeResponse> {
  const res = await fetchWithAuth("/api/me");
  if (!res.ok) {
    throw new AuthError("No se pudo obtener el perfil del usuario", res.status);
  }
  const data = await res.json();
  if (typeof window !== "undefined") {
    console.log("[auth-api] getMe Raw Response:", data);
  }
  // El backend devuelve los datos del usuario en la raíz. 
  return data as MeResponse;
}

/** Scopes de la organización (GET /api/organizations/:id/scopes). Se guardan tras login/syncMe. */
export type OrganizationScopeItem = {
  id: string;
  scope: string;
  created_at?: string;
  updated_at?: string;
};

/** GET /api/organizations/:id/scopes — listar scopes de la organización (para filtrar módulos en el dashboard). */
export async function getOrganizationScopes(orgId: string): Promise<OrganizationScopeItem[]> {
  const path = `/api/organizations/${encodeURIComponent(orgId)}/scopes`;
  if (typeof window !== "undefined") {
    console.log("[getOrganizationScopes] GET", path);
  }
  const res = await fetchWithAuth(path);
  const data = await res.json().catch(() => ({}));
  if (typeof window !== "undefined") {
    console.log("[getOrganizationScopes] Respuesta", res.status, res.ok ? "OK" : "ERROR", data);
  }
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al obtener scopes",
      res.status,
      data
    );
  }
  const list = (data as { scopes?: OrganizationScopeItem[] }).scopes;
  return Array.isArray(list) ? list : [];
}

/** Devuelve los scope strings guardados (ej. ["auth.authentication.*", "aml.*"]) o null si no hay. */
export function getStoredOrganizationScopes(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEYS.ORGANIZATION_SCOPES);
    if (!raw) return null;
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
}

/** Guarda la lista de scope strings en sessionStorage (usado tras GET scopes). */
export function setStoredOrganizationScopes(scopes: string[]): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEYS.ORGANIZATION_SCOPES, JSON.stringify(scopes));
  } catch {
    // ignore
  }
}

/** Llama GET /api/me y actualiza user/org/roles en sessionStorage. Tras eso obtiene y guarda scopes de la org. */
export async function syncMe(): Promise<void> {
  if (typeof window === "undefined") return;
  const me = await getMe();
  const k = AUTH_STORAGE_KEYS;

  // Si me.user existe (versión vieja), lo usamos. 
  // Si no (versión nueva), el objeto 'me' es el usuario.
  const user = me.user || (me as unknown as AuthUser);
  const organization = me.organization;

  if (user && user.id) sessionStorage.setItem(k.USER, JSON.stringify(user));
  if (organization) {
    sessionStorage.setItem(k.ORGANIZATION, JSON.stringify(organization));
    rememberLastOrganization(organization);
  }

  const topRoles = (me as { roles?: unknown }).roles;
  const userRoles = (user as { roles?: unknown })?.roles;
  const rolesInput: unknown[] = [
    ...(Array.isArray(topRoles) ? topRoles : []),
    ...(Array.isArray(userRoles) ? userRoles : []),
  ];
  sessionStorage.setItem(k.ROLES, JSON.stringify(normalizeRoleCodes(rolesInput)));

  if (me.organization?.id) {
    try {
      const items = await getOrganizationScopes(me.organization.id);
      const scopeStrings = items.map((s) => s.scope);
      setStoredOrganizationScopes(scopeStrings);
      if (typeof window !== "undefined") {
        console.log("[syncMe] Scopes cargados para org", me.organization.id, ":", scopeStrings.length, "scopes", scopeStrings);
      }
    } catch (err) {
      if (typeof window !== "undefined") {
        console.warn("[syncMe] Error al cargar scopes de la org:", err);
      }
      setStoredOrganizationScopes([]);
    }
  } else if (typeof window !== "undefined") {
    console.log("[syncMe] No hay organization.id en /api/me, no se cargan scopes");
  }
}

/** PATCH /api/me — actualizar perfil (full_name / username). */
export async function updateMe(
  payload: Partial<Pick<AuthUser, "full_name" | "username">>
): Promise<MeResponse> {
  const res = await fetchWithAuth("/api/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AuthError(data.message || "Error al actualizar perfil", res.status, data);
  if (data.user && typeof window !== "undefined") {
    sessionStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(data.user));
    window.dispatchEvent(new Event("user-updated"));
  }
  return data as MeResponse;
}

/** GET /api/me/sessions — listar sesiones del usuario. */
export async function getSessions(): Promise<SessionItem[]> {
  const res = await fetchWithAuth("/api/me/sessions");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AuthError(data.message || "Error al listar sesiones", res.status, data);
  return Array.isArray(data) ? data : data.sessions ?? [];
}

/**
 * Cambiar contraseña (flujo "debe cambiar en primer login").
 * Backend: POST /api/me/change-password con { new_password }. Debe devolver usuario con must_change_password: false.
 */
export async function changePassword(newPassword: string): Promise<MeResponse> {
  const res = await fetchWithAuth("/api/me/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_password: newPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al cambiar contraseña",
      res.status,
      data
    );
  }
  const me = data as MeResponse;
  if (typeof window !== "undefined" && me.user) {
    sessionStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(me.user));
  }
  return me;
}

/**
 * Cambio de contraseña obligatorio (primer login) — endpoint recomendado con org en la URL.
 * POST /api/auth/organizations/{orgId}/members/password/reset
 * Body: { current_password, new_password }. Requiere Bearer del nuevo usuario.
 * Tras 201 el backend pone must_change_password = false; conviene llamar syncMe() después para actualizar sesión.
 */
export async function memberPasswordReset(
  orgId: string,
  body: { current_password: string; new_password: string }
): Promise<{ ok: boolean }> {
  const res = await fetchWithAuth(
    `/api/auth/organizations/${encodeURIComponent(orgId)}/members/password/reset`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al restablecer contraseña",
      res.status,
      data
    );
  }
  return data as { ok: boolean };
}

/**
 * Alternativa para cambio de contraseña (primer login).
 * POST /api/auth/password/change con { current_password, new_password }.
 */
export async function authPasswordChange(body: {
  current_password: string;
  new_password: string;
}): Promise<{ ok: boolean }> {
  const res = await fetchWithAuth("/api/auth/password/change", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al cambiar contraseña",
      res.status,
      data
    );
  }
  return data as { ok: boolean };
}

/** DELETE /api/me/sessions/:sessionId — revocar una sesión. */
export async function revokeSession(sessionId: string): Promise<void> {
  const res = await fetchWithAuth(`/api/me/sessions/${sessionId}`, {
    method: "DELETE",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AuthError(data.message || "Error al revocar sesión", res.status, data);
}

/** POST /api/send-email — enviar correo (ej. credenciales al nuevo miembro). Requiere Bearer. */
export async function sendEmail(payload: {
  recipient: string;
  purpose: string;
  message: string;
}): Promise<{ message: string }> {
  const res = await fetchWithAuth("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthError(
      (data as { message?: string }).message ?? "Error al enviar correo",
      res.status,
      data
    );
  }
  return data as { message: string };
}

/**
 * POST /api/me/photo — subir/cambiar foto de perfil (multipart/form-data).
 * Backend actualiza automáticamente url_photo del perfil.
 */
export async function uploadProfilePhoto(file: File): Promise<MeResponse> {
  const form = new FormData();
  form.append("photo", file);
  if (process.env.NODE_ENV === "development") {
    console.log(`[auth-api] POST /api/me/photo | File: ${file.name} (${file.size} bytes)`);
  }
  const res = await fetchWithAuth("/api/me/photo", {
    method: "POST",
    body: form,
    // Nota: El navegador establecerá el boundary correcto para multipart/form-data
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (process.env.NODE_ENV === "development") {
      console.error("[auth-api] Error en POST /api/me/photo:", data);
    }
    throw new AuthError(data.message || "Error al subir la foto de perfil", res.status, data);
  }

  // Sincronizar localmente si la respuesta trae el usuario o la nueva url_photo
  if (typeof window !== "undefined") {
    const currentUser = getStoredUser();
    if (currentUser) {
      // El backend usa la propiedad 'photo' (según log) pero manejamos fallback por si acaso
      const updatedUser = data.user || { ...currentUser, photo: data.photo || data.url_photo };
      sessionStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("user-updated"));
    }
  }
  return data as MeResponse;
}

/**
 * PATCH /api/me/email/change — iniciar flujo de cambio de correo (envía OTP al nuevo email).
 */
export async function initiateEmailChange(email: string): Promise<{ message: string }> {
  const res = await fetchWithAuth("/api/me/email/change", {
    method: "PATCH",
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AuthError(data.message || "Error al iniciar cambio de email", res.status, data);
  return data as { message: string };
}

/**
 * PATCH /api/me/email/verify — verificar código OTP y completar cambio de correo.
 */
export async function verifyEmailChange(otpCode: string): Promise<MeResponse> {
  const res = await fetchWithAuth("/api/me/email/verify", {
    method: "PATCH",
    body: JSON.stringify({ otp_code: otpCode }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AuthError(data.message || "Código OTP inválido o expirado", res.status, data);

  if (data.user && typeof window !== "undefined") {
    sessionStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(data.user));
    sessionStorage.setItem(AUTH_STORAGE_KEYS.USER_EMAIL, data.user.email);
    window.dispatchEvent(new Event("storage"));
  }
  return data as MeResponse;
}

/**
 * PATCH /api/me/phone/change — iniciar flujo de cambio de teléfono (envía OTP vía SMS).
 */
export async function initiatePhoneChange(phone: string): Promise<{ message: string }> {
  const res = await fetchWithAuth("/api/me/phone/change", {
    method: "PATCH",
    body: JSON.stringify({ phone }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AuthError(data.message || "Error al iniciar cambio de teléfono", res.status, data);
  return data as { message: string };
}

/**
 * PATCH /api/me/phone/verify — verificar código OTP y completar cambio de teléfono.
 */
export async function verifyPhoneChange(otpCode: string): Promise<MeResponse> {
  const res = await fetchWithAuth("/api/me/phone/verify", {
    method: "PATCH",
    body: JSON.stringify({ otp_code: otpCode }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AuthError(data.message || "Código OTP inválido o expirado", res.status, data);

  if (data.user && typeof window !== "undefined") {
    sessionStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(data.user));
    window.dispatchEvent(new Event("storage"));
  }
  return data as MeResponse;
}
