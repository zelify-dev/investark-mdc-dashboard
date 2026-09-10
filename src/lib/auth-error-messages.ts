/**
 * Errores de la API de auth → mensaje UX recomendado para el frontend.
 *
 * Tabla referencia:
 *
 * | Endpoint                          | Código | Mensaje UX |
 * |-----------------------------------|--------|------------|
 * | Comunes (casi todos)              |        |            |
 * | (cualquiera)                      | 400    | Mostrar message del API y marcar campos si vienen en body |
 * | (cualquiera)                      | 401    | Ver contexto: login → "Email/contraseña incorrectos"; protegido → refresh o "Sesión expirada" |
 * | (cualquiera)                      | 403    | "No tienes acceso / cuenta deshabilitada" |
 * | (cualquiera)                      | 500    | "Algo falló. Intenta de nuevo." |
 * | POST /api/auth/register           | 201    | OK         |
 * | POST /api/auth/register           | 409    | "Este correo ya tiene cuenta. Inicia sesión." |
 * | POST /api/auth/dashboard/login   | 201    | OK         |
 * | POST /api/auth/dashboard/login   | 401    | "Email o contraseña incorrectos" |
 * | POST /api/auth/dashboard/login   | 403    | "Usuario o sede deshabilitados" |
 * | POST /api/auth/dashboard/login   | 409    | Email en múltiples sedes (elegir sede) |
 * | POST /api/auth/dashboard/login   | 423    | Body: message + retry_after (segundos hasta desbloqueo). Ya no usar 401 para bloqueo. |
 * | POST /api/auth/dashboard/login   | 429    | "Demasiados intentos" / rate limit (recomendado para ráfaga de logins) |
 * | POST /api/auth/refresh            | 201    | OK         |
 * | POST /api/auth/refresh            | 401    | Refresh inválido/sesión revocada → cerrar sesión, "Sesión expirada" |
 * | POST /api/auth/logout             | 201    | OK         |
 * | POST /api/auth/logout             | 401    | Si no mandas Bearer (igual cerramos sesión local) |
 * | GET /api/me, /api/me/sessions, DEL | 200/201| OK         |
 * | GET /api/me, etc.                 | 401    | Token expirado → intentar refresh; si falla → "Sesión expirada" |
 * | GET /api/me, etc.                 | 403    | Cuenta deshabilitada |
 */

export type AuthErrorContext = "login" | "register" | "protected" | "generic" | "verify-otp";

const MESSAGES_ES: Record<number, string> = {
  400: "Revisa los datos enviados.",
  401: "Sesión expirada. Inicia sesión de nuevo.",
  403: "No tienes acceso o la cuenta está deshabilitada.",
  404: "No encontrado.",
  423: "Cuenta bloqueada temporalmente por seguridad. Inténtalo de nuevo en unos minutos.",
  429: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
  500: "Algo falló. Intenta de nuevo.",
};

const MESSAGES_LOGIN_ES: Record<number, string> = {
  401: "Email o contraseña incorrectos.",
  403: "Usuario o sede deshabilitados.",
  423: "Cuenta bloqueada temporalmente por seguridad. Inténtalo de nuevo en unos minutos.",
  429: "Demasiados intentos de inicio de sesión. Espera unos minutos e inténtalo de nuevo.",
};

const MESSAGES_REGISTER_ES: Record<number, string> = {
  409: "Este correo ya tiene cuenta. Inicia sesión.",
};

const MESSAGES_OTP_ES: Record<number, string> = {
  401: "Código OTP inválido o expirado.",
  423: "Cuenta bloqueada temporalmente por seguridad. Inténtalo de nuevo en unos minutos.",
  429: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
};

const MESSAGES_EN: Record<number, string> = {
  400: "Please check the data you entered.",
  401: "Session expired. Please sign in again.",
  403: "Access denied or account disabled.",
  404: "Not found.",
  423: "Account temporarily locked for security. Please try again in a few minutes.",
  429: "Too many attempts. Please wait a few minutes and try again.",
  500: "Something went wrong. Please try again.",
};

const MESSAGES_LOGIN_EN: Record<number, string> = {
  401: "Incorrect email or password.",
  403: "User or branch disabled.",
  423: "Account temporarily locked for security. Please try again in a few minutes.",
  429: "Too many sign-in attempts. Please wait a few minutes and try again.",
};

const MESSAGES_REGISTER_EN: Record<number, string> = {
  409: "This email is already registered. Sign in.",
};

const MESSAGES_OTP_EN: Record<number, string> = {
  401: "Invalid or expired OTP code.",
  423: "Account temporarily locked for security. Please try again in a few minutes.",
  429: "Too many attempts. Please wait a few minutes and try again.",
};

/**
 * Devuelve el mensaje UX recomendado para un código HTTP del API de auth.
 * @param statusCode Código HTTP (400, 401, 403, 404, 423, 429, 500)
 * @param context "login" | "register" | "protected" (endpoint con Bearer) | "generic"
 * @param lang "es" | "en"
 * @param apiMessage Si el API devolvió un message, se puede usar en lugar del genérico para 400/500
 */
/** Si el API aún devuelve 401 en bloqueo/rate limit pero con message explícito, no ocultarlo tras “credenciales incorrectas”. */
function looksLikeLockoutOrRateLimitMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("bloquead") ||
    m.includes("locked") ||
    m.includes("demasiados") ||
    m.includes("too many") ||
    m.includes("rate limit") ||
    m.includes("temporalmente") ||
    m.includes("try again in") ||
    m.includes("reintenta en")
  );
}

export function getAuthErrorMessage(
  statusCode: number,
  context: AuthErrorContext = "generic",
  lang: "es" | "en" = "es",
  apiMessage?: string
): string {
  if (
    apiMessage &&
    (statusCode === 400 ||
      statusCode === 423 ||
      statusCode === 429 ||
      statusCode === 500)
  ) {
    return apiMessage;
  }
  if (
    context === "login" &&
    statusCode === 401 &&
    apiMessage &&
    looksLikeLockoutOrRateLimitMessage(apiMessage)
  ) {
    return apiMessage;
  }
  const loginMap = lang === "es" ? MESSAGES_LOGIN_ES : MESSAGES_LOGIN_EN;
  const registerMap = lang === "es" ? MESSAGES_REGISTER_ES : MESSAGES_REGISTER_EN;
  const otpMap = lang === "es" ? MESSAGES_OTP_ES : MESSAGES_OTP_EN;
  const genericMap = lang === "es" ? MESSAGES_ES : MESSAGES_EN;
  if (context === "login" && loginMap[statusCode]) return loginMap[statusCode];
  if (context === "register" && registerMap[statusCode]) return registerMap[statusCode];
  if (context === "verify-otp" && otpMap[statusCode]) return otpMap[statusCode];
  return genericMap[statusCode] ?? genericMap[500];
}

/** Contrato API 423 (login dashboard / app): `message` + `retry_after` en segundos. */
function extractBodyMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const m = (body as { message?: unknown }).message;
  if (typeof m === "string" && m.trim()) return m.trim();
  return undefined;
}

function parseRetryAfterSeconds(body: unknown): number | null {
  if (!body || typeof body !== "object") return null;
  const o = body as { retry_after?: unknown; retryAfter?: unknown };
  const v = o.retry_after ?? o.retryAfter;
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return Math.ceil(v);
  if (typeof v === "string" && /^\d+$/.test(v)) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return Math.ceil(n);
  }
  return null;
}

function formatRetryAfterSuffix(seconds: number, lang: "es" | "en"): string {
  if (seconds <= 0) return "";
  if (lang === "en") {
    if (seconds >= 3600) {
      const h = Math.floor(seconds / 3600);
      const m = Math.ceil((seconds % 3600) / 60);
      return m > 0
        ? `(Try again in about ${h} h ${m} min.)`
        : `(Try again in about ${h} h.)`;
    }
    if (seconds >= 60) {
      const m = Math.ceil(seconds / 60);
      return `(Try again in about ${m} minute${m === 1 ? "" : "s"}.)`;
    }
    return `(Try again in ${seconds} second${seconds === 1 ? "" : "s"}.)`;
  }
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.ceil((seconds % 3600) / 60);
    return m > 0
      ? `(Podrás volver a intentarlo en aproximadamente ${h} h y ${m} min.)`
      : `(Podrás volver a intentarlo en aproximadamente ${h} h.)`;
  }
  if (seconds >= 60) {
    const m = Math.ceil(seconds / 60);
    return `(Podrás volver a intentarlo en aproximadamente ${m} minuto${m === 1 ? "" : "s"}.)`;
  }
  return `(Podrás volver a intentarlo en ${seconds} segundo${seconds === 1 ? "" : "s"}.)`;
}

/** Mensaje completo para errores del flujo login/OTP del dashboard (incluye 423 + retry_after). */
export function getLoginAuthErrorDisplay(
  err: { statusCode: number; message: string; body?: unknown },
  step: 1 | 2,
  lang: "es" | "en",
): string {
  const context: AuthErrorContext = step === 1 ? "login" : "verify-otp";
  const bodyMsg = extractBodyMessage(err.body);

  if (err.statusCode === 423) {
    const base = bodyMsg || getAuthErrorMessage(423, context, lang);
    const sec = parseRetryAfterSeconds(err.body);
    if (sec != null) {
      return `${base} ${formatRetryAfterSuffix(sec, lang)}`.trim();
    }
    return base;
  }

  const apiHint = bodyMsg || err.message;
  return getAuthErrorMessage(err.statusCode, context, lang, apiHint) || err.message;
}
