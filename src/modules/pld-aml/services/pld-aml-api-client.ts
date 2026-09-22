import { getStoredOrganization } from "@/lib/auth-api";

const AML_BROWSER_PROXY = "/api/pld-aml";

/** URL real del API AML. Solo el servidor (proxy) debe usarla. */
export function getAmlUpstreamBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_AML_API_URL || process.env.AML_API_URL;
  const value =
    typeof raw === "string" && raw.trim() !== ""
      ? raw
      : "https://tulana.aethereun.com/api/pld-aml";
  return value.trim().replace(/\/$/, "");
}

/** En el navegador se usa el proxy same-origin para evitar CORS. */
export function getAmlApiBaseUrl(): string {
  if (typeof window !== "undefined") return AML_BROWSER_PROXY;
  return getAmlUpstreamBaseUrl();
}

export class PldAmlApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "PldAmlApiError";
  }
}

function asErrorRecord(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  if (record.error && typeof record.error === "object") return record.error as Record<string, unknown>;
  return record;
}

function messageFromBody(body: unknown, fallback: string): string {
  const record = asErrorRecord(body);
  if (!record) return typeof body === "string" && body.trim() ? body : fallback;
  if (typeof record.message === "string" && record.message.trim()) {
    const code = typeof record.code === "string" ? record.code : "";
    const correlation = typeof record.correlation_id === "string" ? record.correlation_id : "";
    return [code, record.message, correlation ? `id ${correlation}` : ""].filter(Boolean).join(" · ");
  }
  if (Array.isArray(record.message) && record.message.length) return String(record.message[0]);
  if (typeof record.error === "string" && record.error.trim()) return record.error;
  if (typeof record.detail === "string" && record.detail.trim()) return record.detail;
  return fallback;
}

export function buildAmlCurl(method: string, path: string, body?: unknown, orgId = getStoredOrganization()?.id || "") {
  const url = `${getAmlUpstreamBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const lines = [`curl -sS -X ${method.toUpperCase()} '${url}'`, `  -H 'x-org-id: ${orgId || "ORG_ID"}'`, `  -H 'Accept: application/json'`];
  if (body !== undefined) {
    lines.splice(2, 0, `  -H 'Content-Type: application/json'`);
    lines.push(`  -d '${JSON.stringify(body)}'`);
  }
  return lines.join(" \\\n");
}

function logAmlCurl(method: string, path: string, init: RequestInit, status: number, payload: unknown) {
  if (typeof window === "undefined") return;
  let body: unknown;
  if (typeof init.body === "string") {
    try {
      body = JSON.parse(init.body);
    } catch {
      body = init.body;
    }
  }
  const curl = buildAmlCurl(method, path, body);
  console.group(`[PLD/AML] ${method} ${path} → ${status}`);
  console.log("Respuesta", payload);
  console.log("Curl para probar:\n" + curl);
  console.groupEnd();
}

export async function amlFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const base = getAmlApiBaseUrl();
  if (!base) {
    throw new PldAmlApiError("Configura NEXT_PUBLIC_AML_API_URL en .env y reinicia el servidor.", 0);
  }

  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const orgId = getStoredOrganization()?.id || "";
  const headers = new Headers(init.headers);

  if (orgId) headers.set("x-org-id", orgId);
  headers.delete("authorization");
  headers.delete("Authorization");
  if (!headers.has("Content-Type") && init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...init, headers });
}

function parseBody(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

export async function amlRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || "GET").toUpperCase();
  const response = await amlFetch(path, init);
  const payload = parseBody(await response.text());

  if (!response.ok) {
    logAmlCurl(method, path, init, response.status, payload);
    throw new PldAmlApiError(
      messageFromBody(payload, `Error ${response.status} en ${path}`),
      response.status,
      payload,
    );
  }

  return payload as T;
}

export async function amlBlob(path: string, init: RequestInit = {}): Promise<Blob> {
  const response = await amlFetch(path, init);
  if (!response.ok) {
    const payload = parseBody(await response.text()) ?? "";
    throw new PldAmlApiError(
      messageFromBody(payload, `Error ${response.status} al descargar ${path}`),
      response.status,
      payload,
    );
  }
  return response.blob();
}

export function toQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}

export function asList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of ["items", "results", "data", "records", "alerts", "logs", "blocks"]) {
      if (Array.isArray(record[key])) return record[key] as T[];
    }
  }
  return [];
}

export function triggerDownload(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}
