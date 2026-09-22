import { AuthError, fetchWithAuth, getAccessToken } from "@/lib/auth-api";
import { normalizeMxPhone10 } from "@/modules/mdc/services/zelify-kyc-onboarding.service";

export const ADVISOR_KYC_PREFIX = "/api/advisor-kyc";

export type AdvisorKycLivenessStatus = "idle" | "pending" | "passed" | "failed";

export type AdvisorKycContact = {
  email: string | null;
  emailVerified: boolean;
  phone: string | null;
  phoneVerified: boolean;
};

export type AdvisorKycIdentity = {
  firstNames: string | null;
  lastNames: string | null;
  fullName: string | null;
  curp: string | null;
  birthDate: string | null;
  documentId: string | null;
};

export type AdvisorKycLiveness = {
  status: AdvisorKycLivenessStatus;
  sessionId: string | null;
  livenessUrl: string | null;
  confidence: number | null;
  faceMatchScore: number | null;
};

export type AdvisorKycCase = {
  caseId: string;
  userId: string | null;
  organizationId: string | null;
  contact: AdvisorKycContact;
  identity: AdvisorKycIdentity;
  liveness: AdvisorKycLiveness;
  notes: string | null;
  profile: Record<string, unknown> | null;
  createdAt: string | null;
  updatedAt: string | null;
  temporaryPassword?: string | null;
};

export type AdvisorKycCaseDraft = {
  firstNames?: string;
  lastNames?: string;
  email?: string;
  phone?: string;
  curp?: string;
  birthDate?: string;
  notes?: string;
  profile?: Record<string, unknown>;
};

export type AdvisorKycFlags = {
  hasUser: boolean;
  hasDocument: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  canCommitUser: boolean;
  canUploadId: boolean;
  canFacematch: boolean;
  canOpenLiveness: boolean;
};

export type AdvisorKycLivenessResult = {
  status: AdvisorKycLivenessStatus;
  rekognitionStatus?: string | null;
  confidence?: number | null;
  referenceImageUrl?: string | null;
  livenessUrl?: string | null;
  livenessSessionId?: string | null;
  case: AdvisorKycCase;
};

export type AdvisorKycFacematchResult = {
  match: boolean;
  similarity: number | null;
  message: string | null;
  case: AdvisorKycCase;
};

export function isAdvisorKycCaseId(value: string | null | undefined): boolean {
  return Boolean(value && /^adc_/i.test(value.trim()));
}

export function advisorKycMarkerUrl(caseId: string): string {
  return `https://dsnr2syjhiwo8.cloudfront.net/?advisorCase=${encodeURIComponent(caseId)}`;
}

export function advisorKycFlags(kycCase: AdvisorKycCase | null | undefined): AdvisorKycFlags {
  const hasUser = Boolean(kycCase?.userId);
  const hasDocument = Boolean(kycCase?.identity.documentId);
  const hasEmail = Boolean(kycCase?.contact.email);
  const phone = (kycCase?.contact.phone || "").replace(/\D/g, "");
  const hasPhone = phone.length === 10;
  const canCommitUser = !hasUser && hasEmail && hasPhone;
  return {
    hasUser,
    hasDocument,
    hasEmail,
    hasPhone,
    canCommitUser,
    canUploadId: hasUser || canCommitUser,
    canFacematch: hasUser && hasDocument,
    canOpenLiveness: Boolean(kycCase?.liveness.livenessUrl),
  };
}

export function whatsappAdvisorHref(phone: string | null | undefined, text: string): string | null {
  const digits = normalizeMxPhone10(phone || "");
  if (digits.length !== 10) return null;
  return `https://wa.me/52${digits}?text=${encodeURIComponent(text)}`;
}

function requireToken() {
  if (!getAccessToken()) {
    throw new Error("No hay sesión. Inicia sesión de nuevo para usar KYC asistido.");
  }
}

async function readAdvisorError(res: Response): Promise<never> {
  const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
  throw new AuthError(data.message || data.error || `Error advisor-kyc (${res.status})`, res.status, data);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeLivenessStatus(raw: unknown): AdvisorKycLivenessStatus {
  const value = String(raw || "idle").toLowerCase();
  if (value === "pending" || value === "passed" || value === "failed") return value;
  return "idle";
}

export function normalizeAdvisorKycCase(raw: unknown): AdvisorKycCase {
  const data = asRecord(raw);
  const contact = asRecord(data.contact);
  const identity = asRecord(data.identity);
  const liveness = asRecord(data.liveness);
  const profile = data.profile && typeof data.profile === "object" ? (data.profile as Record<string, unknown>) : null;
  return {
    caseId: asString(data.caseId) || "",
    userId: asString(data.userId),
    organizationId: asString(data.organizationId),
    contact: {
      email: asString(contact.email),
      emailVerified: asBoolean(contact.emailVerified),
      phone: asString(contact.phone),
      phoneVerified: asBoolean(contact.phoneVerified),
    },
    identity: {
      firstNames: asString(identity.firstNames),
      lastNames: asString(identity.lastNames),
      fullName: asString(identity.fullName),
      curp: asString(identity.curp),
      birthDate: asString(identity.birthDate),
      documentId: asString(identity.documentId),
    },
    liveness: {
      status: normalizeLivenessStatus(liveness.status),
      sessionId: asString(liveness.sessionId),
      livenessUrl: asString(liveness.livenessUrl),
      confidence: asNumber(liveness.confidence),
      faceMatchScore: asNumber(liveness.faceMatchScore),
    },
    notes: asString(data.notes),
    profile,
    createdAt: asString(data.createdAt),
    updatedAt: asString(data.updatedAt),
    temporaryPassword: asString(data.temporaryPassword),
  };
}

function unwrapCase(raw: unknown): AdvisorKycCase {
  const data = asRecord(raw);
  if (data.case) return normalizeAdvisorKycCase(data.case);
  if (data.caseId) {
    const kycCase = normalizeAdvisorKycCase(data);
    if (data.temporaryPassword) kycCase.temporaryPassword = asString(data.temporaryPassword);
    return kycCase;
  }
  throw new Error("Respuesta advisor-kyc sin expediente.");
}

function cleanDraft(draft: AdvisorKycCaseDraft): Record<string, unknown> {
  const phone = draft.phone ? normalizeMxPhone10(draft.phone) : "";
  const body: Record<string, unknown> = {};
  if (draft.firstNames?.trim()) body.firstNames = draft.firstNames.trim();
  if (draft.lastNames?.trim()) body.lastNames = draft.lastNames.trim();
  if (draft.email?.trim()) body.email = draft.email.trim().toLowerCase();
  if (phone.length === 10) body.phone = phone;
  if (draft.curp?.trim()) body.curp = draft.curp.replace(/\s+/g, "").toUpperCase();
  if (draft.birthDate?.trim()) body.birthDate = draft.birthDate.trim();
  if (draft.notes?.trim()) body.notes = draft.notes.trim();
  if (draft.profile) body.profile = draft.profile;
  return body;
}

export async function createAdvisorKycCase(draft: AdvisorKycCaseDraft = {}): Promise<AdvisorKycCase> {
  requireToken();
  const res = await fetchWithAuth(`${ADVISOR_KYC_PREFIX}/cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cleanDraft(draft)),
  });
  if (!res.ok) await readAdvisorError(res);
  return unwrapCase(await res.json());
}

export async function listAdvisorKycCases(query = ""): Promise<AdvisorKycCase[]> {
  requireToken();
  const qs = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
  const res = await fetchWithAuth(`${ADVISOR_KYC_PREFIX}/cases${qs}`);
  if (!res.ok) await readAdvisorError(res);
  const data = asRecord(await res.json());
  const cases = Array.isArray(data.cases) ? data.cases : [];
  return cases.map(normalizeAdvisorKycCase);
}

export async function fetchAdvisorKycCase(caseId: string): Promise<AdvisorKycCase> {
  requireToken();
  const res = await fetchWithAuth(`${ADVISOR_KYC_PREFIX}/cases/${encodeURIComponent(caseId)}`);
  if (!res.ok) await readAdvisorError(res);
  return unwrapCase(await res.json());
}

export async function patchAdvisorKycCase(caseId: string, draft: AdvisorKycCaseDraft): Promise<AdvisorKycCase> {
  requireToken();
  const res = await fetchWithAuth(`${ADVISOR_KYC_PREFIX}/cases/${encodeURIComponent(caseId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cleanDraft(draft)),
  });
  if (!res.ok) await readAdvisorError(res);
  return unwrapCase(await res.json());
}

export async function sendAdvisorKycEmailOtp(caseId: string, email?: string): Promise<string> {
  requireToken();
  const res = await fetchWithAuth(`${ADVISOR_KYC_PREFIX}/cases/${encodeURIComponent(caseId)}/otp/email/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(email ? { email } : {}),
  });
  if (!res.ok) await readAdvisorError(res);
  const data = asRecord(await res.json());
  return asString(data.message) || "OTP enviado por correo.";
}

export async function verifyAdvisorKycEmailOtp(caseId: string, code: string, email?: string): Promise<AdvisorKycCase> {
  requireToken();
  const res = await fetchWithAuth(`${ADVISOR_KYC_PREFIX}/cases/${encodeURIComponent(caseId)}/otp/email/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: code.trim(), ...(email ? { email } : {}) }),
  });
  if (!res.ok) await readAdvisorError(res);
  return unwrapCase(await res.json());
}

export async function sendAdvisorKycPhoneOtp(caseId: string, phone?: string): Promise<string> {
  requireToken();
  const phone10 = phone ? normalizeMxPhone10(phone) : "";
  const res = await fetchWithAuth(`${ADVISOR_KYC_PREFIX}/cases/${encodeURIComponent(caseId)}/otp/phone/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(phone10.length === 10 ? { phone: phone10 } : {}),
  });
  if (!res.ok) await readAdvisorError(res);
  const data = asRecord(await res.json());
  return asString(data.message) || "OTP enviado por SMS.";
}

export async function verifyAdvisorKycPhoneOtp(caseId: string, code: string, phone?: string): Promise<AdvisorKycCase> {
  requireToken();
  const phone10 = phone ? normalizeMxPhone10(phone) : "";
  const res = await fetchWithAuth(`${ADVISOR_KYC_PREFIX}/cases/${encodeURIComponent(caseId)}/otp/phone/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: code.trim(), ...(phone10.length === 10 ? { phone: phone10 } : {}) }),
  });
  if (!res.ok) await readAdvisorError(res);
  return unwrapCase(await res.json());
}

export async function commitAdvisorKycUser(caseId: string): Promise<AdvisorKycCase> {
  requireToken();
  const res = await fetchWithAuth(`${ADVISOR_KYC_PREFIX}/cases/${encodeURIComponent(caseId)}/commit-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) await readAdvisorError(res);
  return unwrapCase(await res.json());
}

export async function uploadAdvisorKycId(caseId: string, frontImage: File, backImage: File): Promise<AdvisorKycCase> {
  requireToken();
  const form = new FormData();
  form.append("frontImage", frontImage);
  form.append("backImage", backImage);
  const res = await fetchWithAuth(`${ADVISOR_KYC_PREFIX}/cases/${encodeURIComponent(caseId)}/documents/id`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) await readAdvisorError(res);
  return unwrapCase(await res.json());
}

export async function createAdvisorKycLivenessLink(caseId: string): Promise<AdvisorKycLivenessResult> {
  requireToken();
  const res = await fetchWithAuth(`${ADVISOR_KYC_PREFIX}/cases/${encodeURIComponent(caseId)}/liveness/link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) await readAdvisorError(res);
  const data = asRecord(await res.json());
  const kycCase = unwrapCase(data.case || data);
  return {
    status: normalizeLivenessStatus(data.status || kycCase.liveness.status),
    livenessSessionId: asString(data.livenessSessionId),
    livenessUrl: asString(data.livenessUrl) || kycCase.liveness.livenessUrl,
    case: kycCase,
  };
}

export async function fetchAdvisorKycLiveness(caseId: string): Promise<AdvisorKycLivenessResult> {
  requireToken();
  const res = await fetchWithAuth(`${ADVISOR_KYC_PREFIX}/cases/${encodeURIComponent(caseId)}/liveness`);
  if (!res.ok) await readAdvisorError(res);
  const data = asRecord(await res.json());
  const kycCase = data.case ? unwrapCase(data.case) : unwrapCase({ ...data, caseId: data.caseId || caseId });
  return {
    status: normalizeLivenessStatus(data.status || kycCase.liveness.status),
    rekognitionStatus: asString(data.rekognitionStatus),
    confidence: asNumber(data.confidence),
    referenceImageUrl: asString(data.referenceImageUrl),
    livenessUrl: asString(data.livenessUrl) || kycCase.liveness.livenessUrl,
    case: kycCase,
  };
}

export async function runAdvisorKycFacematch(caseId: string, selfieImage?: File): Promise<AdvisorKycFacematchResult> {
  requireToken();
  const form = new FormData();
  if (selfieImage) form.append("selfieImage", selfieImage);
  const res = await fetchWithAuth(`${ADVISOR_KYC_PREFIX}/cases/${encodeURIComponent(caseId)}/facematch`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) await readAdvisorError(res);
  const data = asRecord(await res.json());
  return {
    match: data.match === true,
    similarity: asNumber(data.similarity),
    message: asString(data.message),
    case: unwrapCase(data.case || data),
  };
}
