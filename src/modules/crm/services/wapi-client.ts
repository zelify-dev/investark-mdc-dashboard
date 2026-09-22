const WAPI_BROWSER_PROXY = "/api/wapi";
const WAPI_DEFAULT_UPSTREAM = "https://g2x26vy4ft.us-east-1.awsapprunner.com";

export function getWapiUpstreamBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_WAPI_API_URL || process.env.WAPI_API_URL;
  const value = typeof raw === "string" && raw.trim() ? raw : WAPI_DEFAULT_UPSTREAM;
  return value.trim().replace(/\/$/, "");
}

export function getWapiApiBaseUrl(): string {
  if (typeof window !== "undefined") return WAPI_BROWSER_PROXY;
  return `${getWapiUpstreamBaseUrl()}/api`;
}

export class WapiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "WapiError";
  }
}

export type WapiConversation = {
  id: string;
  phone: string;
  contactName: string | null;
  profilePictureUrl: string | null;
  lastMessage: string | null;
  lastMessageType: string | null;
  lastMessageDirection: "inbound" | "outbound" | string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  replied: boolean;
  lastReadAt: string | null;
  updatedAt: string | null;
};

export type WapiMessage = {
  id: string;
  direction: "inbound" | "outbound" | string;
  phone: string;
  type: string;
  text: string | null;
  mediaId: string | null;
  mimeType: string | null;
  caption: string | null;
  filename: string | null;
  waMessageId: string | null;
  contactName: string | null;
  occurredAt: string | null;
  mediaLink: string | null;
  templateName: string | null;
  sentByUserId: string | null;
  status: "sent" | "delivered" | "read" | "failed" | string | null;
};

export type WapiPage<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};

export type WapiChannel = {
  displayPhone?: string;
  displayName?: string;
  verifiedName?: string;
  display_phone_number?: string;
  verified_name?: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

async function wapiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getWapiApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init?.headers);
  if (init?.body && typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url, { ...init, headers, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const record = asRecord(data);
    throw new WapiError(
      String(record.message || record.error || `Error WAPI (${res.status})`),
      res.status,
      data,
    );
  }
  return data as T;
}

export function normalizePhone(value: string): string {
  return (value || "").replace(/\D/g, "");
}

export function mediaDownloadUrl(mediaId: string): string {
  return `${getWapiApiBaseUrl()}/whatsapp/media/${encodeURIComponent(mediaId)}/download`;
}

export async function fetchWapiConversations(query = "", page = 1): Promise<WapiPage<WapiConversation>> {
  const qs = new URLSearchParams({ page: String(page), limit: "50" });
  if (query.trim()) qs.set("q", query.trim());
  return wapiFetch(`/whatsapp/conversations?${qs.toString()}`);
}

export async function fetchWapiConversation(phone: string): Promise<WapiConversation> {
  return wapiFetch(`/whatsapp/conversations/${encodeURIComponent(normalizePhone(phone))}`);
}

export async function fetchWapiHistory(phone: string, page = 1, limit = 80): Promise<WapiPage<WapiMessage>> {
  const qs = new URLSearchParams({
    phone: normalizePhone(phone),
    page: String(page),
    limit: String(limit),
  });
  return wapiFetch(`/whatsapp/messages/history?${qs.toString()}`);
}

export async function replyWapiConversation(
  phone: string,
  text: string,
  sentByUserId?: string,
  replyTo?: string | null,
): Promise<unknown> {
  return wapiFetch(`/whatsapp/conversations/${encodeURIComponent(normalizePhone(phone))}/reply`, {
    method: "POST",
    body: JSON.stringify({
      text,
      sent_by_user_id: sentByUserId || null,
      reply_to_message_id: replyTo || null,
    }),
  });
}

export async function markWapiConversationRead(phone: string, userId?: string, messageId?: string): Promise<unknown> {
  return wapiFetch(`/whatsapp/conversations/${encodeURIComponent(normalizePhone(phone))}/mark-read`, {
    method: "POST",
    body: JSON.stringify({
      read_by_user_id: userId || null,
      ...(messageId ? { message_id: messageId } : {}),
    }),
  });
}

export async function sendWapiText(to: string, text: string, sentByUserId?: string): Promise<unknown> {
  return wapiFetch("/whatsapp/messages/text", {
    method: "POST",
    body: JSON.stringify({
      to: normalizePhone(to),
      text,
      preview_url: false,
      sent_by_user_id: sentByUserId || null,
    }),
  });
}

export async function simulateWapiInbound(input: {
  from: string;
  contact_name?: string;
  text?: string;
  type?: string;
}): Promise<unknown> {
  return wapiFetch("/sandbox/inbound", {
    method: "POST",
    body: JSON.stringify({
      from: normalizePhone(input.from),
      contact_name: input.contact_name || "Usuario sandbox",
      type: input.type || "text",
      text: input.text || "Hola, quiero información",
    }),
  });
}

export async function fetchWapiChannel(): Promise<WapiChannel> {
  return wapiFetch("/whatsapp/channel");
}

export type WapiDocumentCategory = "nomina" | "extracto" | "comprobante_domicilio";

export type WapiOwnerProgress = {
  ownerId: string;
  required: Record<string, number>;
  completed: Record<string, number>;
  uploadComplete: boolean;
  documents: Array<{
    documentId: string;
    category: string;
    status: string;
    originalFileName?: string | null;
  }>;
};

export async function fetchWapiOwnerProgress(ownerId: string): Promise<WapiOwnerProgress> {
  return wapiFetch(`/documents/owners/${encodeURIComponent(ownerId)}/progress`);
}

export async function uploadWapiDocument(
  category: WapiDocumentCategory,
  file: File,
  ownerId: string,
): Promise<{ documentId: string; status: string }> {
  const form = new FormData();
  form.append("file", file);
  const qs = new URLSearchParams({ owner_id: ownerId });
  const url = `${getWapiApiBaseUrl()}/documents/${category}?${qs.toString()}`;
  const res = await fetch(url, { method: "POST", body: form, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const record = asRecord(data);
    throw new WapiError(String(record.message || "No se pudo subir el documento."), res.status, data);
  }
  return data as { documentId: string; status: string };
}

export async function evaluateWapiOwner(ownerId: string): Promise<{ finalDecision: string }> {
  return wapiFetch(`/documents/owners/${encodeURIComponent(ownerId)}/evaluate`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}
