import { getStoredOrganization } from "@/lib/auth-api";
import { createTraceabilityLog } from "./mdc-traceability.service";
import { customFetch, getMdcApiBaseUrl } from "./mdc-api-client";
const getBaseUrl = (): string => getMdcApiBaseUrl();

export type MdcApiErrorShape = {
  message?: string;
  step?: "s3" | "bda" | "database" | "unknown" | string;
  detail?: string;
};

export type MdcApiError = Error & MdcApiErrorShape;

function buildApiError(fallbackMessage: string, payload?: MdcApiErrorShape | null): MdcApiError {
  return Object.assign(new Error(payload?.message || fallbackMessage), {
    step: payload?.step,
    detail: payload?.detail,
  });
}

export type RuleBreakdownCondition = {
  field?: string;
  label?: string;
  dataType?: string;
  operator?: string;
  operatorLabel?: string;
  expectedValue?: unknown;
  actualValue?: unknown;
  passed?: boolean;
  message?: string;
};

export type RuleBreakdownItem = {
  id?: string;
  name: string;
  severity?: string;
  status: string;
  passed?: boolean;
  matched?: boolean;
  conditionsCount?: number;
  passedConditionsCount?: number;
  failedConditionsCount?: number;
  reason?: string;
  conditions?: RuleBreakdownCondition[];
};

export type AnalyzeFinanceRequestPayload = {
  product: string;
  personType: "natural" | "moral" | string;
  orgId: string;
  identificationNumber: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  email: string;
  phone?: string;
  bank?: string;
  birthPlace?: string;
  maritalStatus?: string;
  educationLevel?: string;
  amount: number;
  montoCredito?: number;
  tipoEmpleo?: string;
  edad?: number;
  plazo?: number;
  capacidadPago?: number;
};

export type AnalyzeFinanceRequestResponse = {
  decision: string;
  status: string;
  riskLevel: string;
  reasons?: string[];
  summary?: {
    totalRules: number;
    evaluatedRules: number;
    approvedRules: number;
    reviewRules: number;
    rejectedRules: number;
    passedRules: number;
    failedRules: number;
  };
  rulesBreakdown?: RuleBreakdownItem[];
};

export type CreateFinanceRequest = {
  orgId: string;
  personType: "natural" | "moral" | string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  identificationNumber: string;
  email: string;
  product: string;
  amount: number;
  montoCredito?: number;
  bank?: string;
  phone?: string;
  birthPlace?: string;
  maritalStatus?: string;
  educationLevel?: string;
  tipoEmpleo?: string;
  edad?: number;
  plazo?: number;
  capacidadPago?: number;
  status?: string;
  riskLevel?: string;
  riskScore?: number;
  rulesBreakdown?: RuleBreakdownItem[];
};

export async function analyzeFinanceRequest(payload: AnalyzeFinanceRequestPayload): Promise<AnalyzeFinanceRequestResponse> {
  const res = await fetch(`${getBaseUrl()}/finance-requests/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let errorMessage = `Failed to analyze finance request (${res.status})`;
    try {
      const errorJson = await res.json();
      if (errorJson.message) errorMessage = errorJson.message;
    } catch {
      const text = await res.text();
      errorMessage += `: ${text.slice(0, 200)}`;
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

export type FinanceRequest = {
  id: string;
  orgId: string;
  personType: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  identificationNumber?: string;
  applicantId?: string;
  user?: {
    id?: string;
  };
  email: string;
  product: string;
  amount: number;
  status: string;
  riskLevel: string;
  riskScore: number;
  riskIndex?: number | string | null;
  createdAt: string;
  updatedAt: string;
  kycSessionId?: string | null;
  kycWebviewUrl?: string | null;
  zelifyUserId?: string | null;
  phone?: string;
  bank?: string;
};

/** Domicilio canónico del usuario MDC (comprobante CFE/Telmex). No viene de Auth. */
export type FinanceRequestUserAddress = {
  street?: string | null;
  exteriorNumber?: string | null;
  interiorNumber?: string | null;
  postalCode?: string | null;
  colonia?: string | null;
  municipality?: string | null;
  locality?: string | null;
  state?: string | null;
  stateSatKey?: string | null;
  coloniaMatch?: string | null;
};

export type FinanceRequestUser = {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  identificationNumber?: string | null;
  zelifyUserId?: string | null;
  kycStatus?: string | null;
  kycCompletedAt?: string | null;
  ocrConfidence?: number | null;
  faceMatchScore?: number | null;
  address?: FinanceRequestUserAddress | null;
};

// The detail endpoint returns a reduced payload while the list endpoint keeps
// the complete request shape used by the applications table.
export type FinanceRequestDetail = {
  id: string;
  orgId: string;
  product?: string;
  productId?: string;
  amount?: number | string;
  plazo?: number | string;
  interestRate?: number | string;
  identificationNumber?: string;
  firstName?: string;
  lastName?: string;
  status: string;
  userId?: string;
  user?: FinanceRequestUser;
  buroScore?: number;
  dti?: number | string | null;
  riskIndex?: number | string | null;
  lastConsulteBuro?: string;
  kycSessionId?: string | null;
  kycWebviewUrl?: string | null;
  zelifyUserId?: string | null;
};

export async function fetchFinanceRequests(orgId: string, personType?: string): Promise<FinanceRequest[]> {
  const params = new URLSearchParams({ orgId });
  if (personType) params.set("personType", personType);
  const res = await customFetch(`${getBaseUrl()}/finance-requests?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch finance requests (${res.status})`);
  return res.json();
}

export async function fetchFinanceRequestById(id: string): Promise<FinanceRequestDetail> {
  const res = await customFetch(`${getBaseUrl()}/finance-requests/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch finance request detail (${res.status})`);
  const payload = await res.json();
  return payload?.data || payload;
}

export type FinancialDocumentStatus =
  | "PROCESSING"
  | "COMPLETED"
  | "MANUAL_REVIEW_REQUIRED"
  | "FAILED"
  | "REJECTED";

export type DocumentMatchStatus = "match" | "mismatch" | "neutral" | "pending_kyc";
export type DocumentMatchFieldStatus = "match" | "mismatch" | "missing";

export type DocumentMatchField = {
  name: "nombre" | "curp";
  status: DocumentMatchFieldStatus;
  kyc: string | null;
  document: string | null;
};

export type DocumentMatch = {
  status: DocumentMatchStatus;
  fields: DocumentMatchField[];
  note: string;
  comparedAt: string;
};

export type FinancialDocumentProgressDocument = {
  documentId?: string;
  analysisId?: string | null;
  fileName?: string | null;
  status?: FinancialDocumentStatus | string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  occupiesSlot?: boolean | null;
  manualDecision?: "APPROVED" | "REJECTED" | string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  documentMatch?: DocumentMatch | null;
};

export type FinancialDocumentProgress = {
  userId: string;
  applicationId?: string;
  applicantId?: string;
  category: string;
  required: number;
  uploaded: number;
  pendingUpload: number;
  processing: number;
  completed: number;
  manualReview: number;
  failed: number;
  uploadComplete: boolean;
  processingComplete: boolean;
  complete: boolean;
  documents: FinancialDocumentProgressDocument[];
};

export async function fetchFinancialDocumentProgress(userId: string, category: string): Promise<FinancialDocumentProgress> {
  const res = await customFetch(`${getBaseUrl()}/financial-documents/${userId}/${category}/progress`);
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw buildApiError(`Failed to fetch document progress (${res.status})`, err);
  }
  return res.json();
}

export type UploadOneFinancialDocumentResponse = {
  documentId?: string;
  analysisId?: string | null;
  applicationId?: string;
  applicantId?: string;
  category?: string;
  fileName?: string;
  status?: FinancialDocumentStatus | string;
  reused?: boolean;
  progress?: {
    required: number;
    uploaded: number;
    pendingUpload: number;
    uploadComplete: boolean;
    processingComplete: boolean;
    complete: boolean;
  };
};

export type UploadConsolidatedPayrollResponse = {
  applicationId?: string;
  applicantId?: string;
  category?: string;
  analysisIds?: string[];
  analyses?: Array<{
    pageNumber?: number;
    documentId?: string;
    analysisId?: string;
    fileName?: string;
    status?: FinancialDocumentStatus | string;
    reused?: boolean;
  }>;
  progress?: {
    required: number;
    uploaded: number;
    pendingUpload: number;
    uploadComplete: boolean;
    processingComplete: boolean;
    complete: boolean;
  };
};

export async function uploadOneFinancialDocument(userId: string, category: string, file: File): Promise<UploadOneFinancialDocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${getBaseUrl()}/financial-documents/${userId}/${category}/upload-one`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw buildApiError(`Failed to upload document (${res.status})`, err);
  }
  return res.json();
}

export async function uploadConsolidatedPayroll(userId: string, file: File): Promise<UploadConsolidatedPayrollResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${getBaseUrl()}/financial-documents/${userId}/nomina/upload-consolidated`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw buildApiError(`Failed to upload consolidated payroll (${res.status})`, err);
  }
  return res.json();
}

export type FinancialDocumentProcessResponse = {
  analysisId: string;
  status: FinancialDocumentStatus | string;
};

export async function processFinancialDocumentAnalysis(analysisId: string): Promise<FinancialDocumentProcessResponse> {
  const res = await customFetch(`${getBaseUrl()}/financial-documents/${analysisId}/process`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw buildApiError(`Failed to process document analysis (${res.status})`, err);
  }
  return res.json();
}

export type FinancialDocumentManualReviewPayload = {
  decision: "APPROVED" | "REJECTED";
  reason: string;
  notes?: string;
  reviewedBy: string;
};

export type FinancialDocumentManualReviewResponse = {
  analysisId: string;
  documentId: string;
  status: FinancialDocumentStatus | string;
  manualDecision: "APPROVED" | "REJECTED" | string;
  reviewedBy: string;
  reviewedAt: string;
};

export async function reviewFinancialDocumentAnalysis(
  analysisId: string,
  payload: FinancialDocumentManualReviewPayload,
): Promise<FinancialDocumentManualReviewResponse> {
  const res = await customFetch(`${getBaseUrl()}/financial-documents/${analysisId}/manual-review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw buildApiError(`Failed to review document analysis (${res.status})`, err);
  }
  return res.json();
}

export type FinancialDocumentReprocessResponse = {
  previousAnalysisId: string;
  analysisId: string;
  documentId: string;
  status: FinancialDocumentStatus | string;
};

export async function reprocessFinancialDocumentAnalysis(analysisId: string): Promise<FinancialDocumentReprocessResponse> {
  const res = await customFetch(`${getBaseUrl()}/financial-documents/${analysisId}/reprocess`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw buildApiError(`Failed to reprocess document analysis (${res.status})`, err);
  }
  return res.json();
}

export type FinancialDocumentReplaceResponse = {
  previousDocumentId: string;
  documentId: string;
  analysisId: string;
  category: string;
  fileName: string;
  status: FinancialDocumentStatus | string;
  replaced: boolean;
};

export async function replaceFinancialDocument(documentId: string, file: File): Promise<FinancialDocumentReplaceResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await customFetch(`${getBaseUrl()}/financial-documents/${documentId}/replace`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw buildApiError(`Failed to replace document (${res.status})`, err);
  }
  return res.json();
}

export type FinancialDocumentDeleteResponse = {
  documentId: string;
  status: FinancialDocumentStatus | string;
  deleted: boolean;
};

export async function deleteFinancialDocument(documentId: string): Promise<FinancialDocumentDeleteResponse> {
  const res = await customFetch(`${getBaseUrl()}/financial-documents/${documentId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw buildApiError(`Failed to delete document (${res.status})`, err);
  }
  return res.json();
}

export type FinancialDocumentExtractionResponse = {
  analysisId?: string;
  documentId?: string;
  applicationId?: string;
  applicantId?: string;
  category?: string;
  fileName?: string;
  status?: FinancialDocumentStatus | string;
  confidence?: number | null;
  documentType?: string | null;
  blueprintArn?: string | null;
  processed?: boolean;
  extraction?: {
    rfc?: string | null;
    curp?: string | null;
    sexo?: string | null;
    documentType?: string | null;
    periodo_pago?: string | null;
    conducto_pago?: string | null;
    nombre_emisor?: string | null;
    numero_recibo?: string | null;
    centro_trabajo?: string | null;
    tipo_documento?: string | null;
    nombre_completo?: string | null;
    regimen_laboral?: string | null;
    fecha_expedicion?: string | null;
    fecha_pago_liquidacion?: string | null;
    numero_empleado_ficha?: string | null;
    resumen_financiero?: {
      isr?: number | null;
      neto_pagar?: number | null;
      total_deducciones?: number | null;
      ingresos_gravables?: number | null;
      total_percepciones?: number | null;
    } | null;
    movimientos_nomina?: Array<{
      dias?: number | null;
      clave?: string | null;
      concepto?: string | null;
      referencia?: string | null;
      deducciones?: number | null;
      percepciones?: number | null;
      saldo_adeudo?: number | null;
      pension_diaria?: number | null;
    }> | null;
    [key: string]: unknown;
  } | null;
  indicators?: Record<string, unknown> | null;
  validation?: {
    valid?: boolean;
    requiresManualReview?: boolean;
    reasonCodes?: string[];
    customOutputStatus?: string | null;
    message?: string | null;
    totals?: Record<string, unknown> | null;
    [key: string]: unknown;
  } | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  manualDecision?: "APPROVED" | "REJECTED" | string | null;
  manualReason?: string | null;
  manualNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  updatedAt?: string | null;
  documentMatch?: DocumentMatch | null;
  step?: string;
  detail?: string;
  [key: string]: unknown;
};

export async function fetchFinancialDocumentExtraction(analysisId: string): Promise<FinancialDocumentExtractionResponse> {
  const res = await customFetch(`${getBaseUrl()}/financial-documents/${analysisId}/extraction`);
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw buildApiError(`Failed to fetch document extraction (${res.status})`, err);
  }
  return res.json();
}

export type FinancialDocumentFileUrlResponse = {
  documentId: string;
  fileName: string;
  contentType: string;
  url: string;
  expiresIn: number;
};

export async function fetchFinancialDocumentFileUrl(documentId: string): Promise<FinancialDocumentFileUrlResponse> {
  const res = await customFetch(`${getBaseUrl()}/financial-documents/${documentId}/file-url`);
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw buildApiError(`Failed to fetch document file URL (${res.status})`, err);
  }
  return res.json();
}

export async function createFinanceRequest(body: CreateFinanceRequest): Promise<{ data: FinanceRequest, notification?: string }> {
  const res = await fetch(`${getBaseUrl()}/finance-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let errorMessage = `Failed to create finance request (${res.status})`;
    try {
      const errorJson = await res.json();
      if (errorJson.message) errorMessage = errorJson.message;
    } catch {
      const text = await res.text();
      errorMessage += `: ${text.slice(0, 200)}`;
    }
    throw new Error(errorMessage);
  }
  const responseJson = await res.json();
  const created = responseJson.data || responseJson;

  const orgId = getStoredOrganization()?.id || "demo-bypass-org";
  if (orgId !== "demo-bypass-org") {
    await createTraceabilityLog({
      orgId,
      action: "REQUEST_CREATE",
      detail: `Solicitud creada. ${responseJson.notification || ''}`.trim(),
      channel: "Consola",
      userName: "Ejecutivo Zelify",
      correlationId: `corr-req-${created.id ? created.id.substring(0, 8) : Date.now()}`,
    });
  }
  return responseJson;
}

export type AttachFinanceRequestKycPayload = {
  kycSessionId: string;
  kycWebviewUrl: string;
  zelifyUserId?: string;
};

/** Vincula la sesión KYC Zelify a la solicitud MDC. */
export async function attachFinanceRequestKyc(
  financeRequestId: string,
  body: AttachFinanceRequestKycPayload,
): Promise<unknown> {
  const url = `${getBaseUrl()}/finance-requests/${encodeURIComponent(financeRequestId)}/kyc`;
  console.log("[KYC] POST MDC …/kyc · request", {
    fixOwnerIfFails: "MDC (credit-decision-engine)",
    url,
    financeRequestId,
    body: {
      ...body,
      kycWebviewUrl: body.kycWebviewUrl?.replace(/([?&]token=)[^&\s]+/gi, "$1***"),
    },
  });

  const res = await customFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let errorMessage = `Failed to attach KYC session (${res.status})`;
    let responseBody: unknown = null;
    try {
      responseBody = await res.json();
      if ((responseBody as { message?: string })?.message) {
        errorMessage = (responseBody as { message: string }).message;
      }
    } catch {
      try {
        responseBody = await res.text();
      } catch {
        /* ignore */
      }
    }
    console.error("[KYC] ❌ POST MDC …/kyc · HTTP error", {
      teamHint: "MDC",
      status: res.status,
      financeRequestId,
      url,
      responseBody,
      message: errorMessage,
    });
    throw new Error(errorMessage);
  }

  const result = await res.json().catch(() => ({ ok: true }));
  console.log("[KYC] POST MDC …/kyc · OK", { financeRequestId, result });
  return result;
}

export async function updateFinanceRequest(id: string, patch: Partial<CreateFinanceRequest> & { riskLevel?: string; riskScore?: number }): Promise<FinanceRequest | null> {
  const res = await customFetch(`${getBaseUrl()}/finance-requests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) return null;
  const updated = await res.json();
  const orgId = getStoredOrganization()?.id || "demo-bypass-org";
  if (orgId !== "demo-bypass-org") {
    await createTraceabilityLog({
      orgId,
      action: "REQUEST_UPDATE",
      detail: "Solicitud actualizada",
      channel: "Consola",
      userName: "Ejecutivo Zelify",
      correlationId: `corr-req-${id.substring(0, 8)}`,
    });
  }
  return updated;
}

export async function deleteFinanceRequest(id: string): Promise<boolean> {
  const res = await customFetch(`${getBaseUrl()}/finance-requests/${id}`, {
    method: "DELETE",
  });
  const ok = res.ok;
  if (ok) {
    const orgId = getStoredOrganization()?.id || "demo-bypass-org";
    if (orgId !== "demo-bypass-org") {
      await createTraceabilityLog({
        orgId,
        action: "REQUEST_DELETE",
        detail: "Solicitud eliminada",
        channel: "Consola",
        userName: "Ejecutivo Zelify",
        correlationId: `corr-req-del-${Date.now()}`,
      });
    }
  }
  return ok;
}

export async function uploadFinancialDocument(applicationId: string, applicantId: string, file: File): Promise<unknown> {
  const formData = new FormData();
  formData.append("applicationId", applicationId);
  formData.append("applicantId", applicantId);
  formData.append("document", file);

  const res = await fetch(`${getBaseUrl()}/financial-documents/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `Failed to upload document (${res.status})`);
  }
  return res.json();
}
