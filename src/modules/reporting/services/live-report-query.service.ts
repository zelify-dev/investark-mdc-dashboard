import { getStoredOrganization } from "@/lib/auth-api";
import {
  fetchFinanceRequestById,
  fetchFinanceRequests,
  fetchFinancialDocumentExtraction,
  fetchFinancialDocumentFileUrl,
  fetchFinancialDocumentProgress,
  type FinanceRequest,
} from "@/modules/mdc/services/mdc-finance-requests.service";
import { fetchFinanceProducts, fetchRules, fetchUserRules } from "@/modules/mdc/services/mdc-rules.service";
import { fetchZelifyKycOnboardingSession, fetchZelifyKycOnboardingSessionByCurp } from "@/modules/mdc/services/zelify-kyc-onboarding.service";

export type LiveReportSection = "kyc" | "rules" | "documents";
export type KycReportModule = "session" | "identity" | "contact" | "personal" | "address" | "references" | "curp";
export type RuleReportModule = "summary" | "rules";
export type DocumentReportModule = "progress" | "payroll" | "bankStatement" | "address";

export type LiveReportSectionResult = {
  section: LiveReportSection;
  data: unknown;
  error?: string;
  kycModules?: KycReportModule[];
  ruleModules?: RuleReportModule[];
  documentModules?: DocumentReportModule[];
};

export type LiveReportResult = {
  subjectName: string;
  userId: string;
  financeRequestId: string;
  sections: LiveReportSectionResult[];
};

const DOCUMENT_CATEGORIES = ["nomina", "extracto", "comprobante_domicilio"];
const FULL_DETAIL_PATTERN = /\bcompleto\b|\bcompleta\b|\bcompletos\b|\bcompletas\b|\bcomplet\b|\bcomplto\b|\bcompelto\b|\bintegral\b|\bintegra\b|\btotal\b|\btotales\b|\btotl\b|\btodo\b|\btoda\b|\btodos\b|\btodas\b|\btodito\b|\bfull\b|\bful\b|\ball\b|\bentero\b|\bentera\b|\bgeneral\b|\bglobal\b|\bamplio\b|\bamplia\b|\bextendido\b|\bexhaustivo\b|\bdetallado\b|\bdetallada\b|\bdetalle\b|\bprofundo\b/;

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getRequestedReportSections(prompt: string): LiveReportSection[] {
  const normalized = normalize(prompt);
  const sections = new Set<LiveReportSection>();
  const requestsFullDetail = FULL_DETAIL_PATTERN.test(normalized);

  if (requestsFullDetail || /\bkyc\b|\bkic\b|\bkyv\b|\bky\b|\bk y c\b|identidad|identida|identifica(?:cion|cion)?|identifcacion|identificacoin|idntidad|onboarding|alta de usuario|verifica(?:cion)?|verficacion|verifcacion|verificacion|validacion de identidad|validar identidad|curp|ine|ife|documento de identidad|prueba de vida|liveness|biometria|biometrico|biometrico|rostro|selfie|face match|contacto|referencias?|datos personales|informacion personal|perfil(?: del cliente)?|perfilamiento|estado de la sesion|sesion(?: de kyc)?|domicilio|direccion|direcion|ubicacion|residencia|vivienda|correo|e mail|email|mail|telefono|tel(?:efono)?|celular|movil|whatsapp|educacion|conyuge|esposa|esposo/.test(normalized)) sections.add("kyc");
  if (requestsFullDetail || /\bregla\b|\breglas\b|\brglas\b|\bregls\b|\breglaa\b|\brule\b|\brules\b|motor de decisi(?:on)?|motor de desici(?:on)?|motor decision|motor desicion|motor de credito|motor cortex|cortex|resumen de reglas|politica(?:s)?|poliza|policy|umbral(?:es)?|threshold|limite|criterio(?:s)?|condicion(?:es)?|decision|desicion|dictamen|resultado(?: de reglas)?|veredicto|aprobacion|aprovacion|aprobado|rechazo|rechas[o]?|rechazado|revision|revicion|revisar|dti|endeudamiento|deuda ingreso|capacidad de pago|score|socre|scor|puntaje|calificacion|buro|buro de credito|credito|riesgo/.test(normalized)) sections.add("rules");
  if (requestsFullDetail || /documenta(?:cion|cion)?|documetacion|documentos?|documntos|docuemntos|doctos|docs|soportes?|expediente|papeles|extrac(?:cion)?|extraccion|extracion|extraction|ocr|nomina|nommina|nominia|nomin|payroll|recibo(?: de pago)?|recibo nomina|desprendible|talon de pago|extracto|estrato|extract|extracto bancario|estado de cuenta|cuenta bancaria|bancario|banco|comprobante|comprobate|comprovante|comprobante de domicilio|recibo de servicios|pdf|pfd|archivo|fichero|adjunto|anexo|carga(?:dos)?|subido(?:s)?/.test(normalized)) sections.add("documents");

  return [...sections];
}

export function getRequestedKycModules(prompt: string): KycReportModule[] | undefined {
  const normalized = normalize(prompt);
  if (FULL_DETAIL_PATTERN.test(normalized) || /\bkyc\b|\bkic\b|\bkyv\b|onboarding|perfilamiento/.test(normalized)) return undefined;

  const modules = new Set<KycReportModule>();
  if (/estado de la sesion|estado sesion|\bsesion\b|avance(?: de kyc)?|progreso(?: de kyc)?/.test(normalized)) modules.add("session");
  if (/identidad|identida|identificacion|identifcacion|identificacoin|\bcurp\b|\bine\b|documento de identidad|prueba de vida|liveness|biometria|biometrico|rostro|selfie/.test(normalized)) modules.add("identity");
  if (/contacto|correo|e mail|email|telefono|tel(?:efono)?|celular|movil/.test(normalized)) modules.add("contact");
  if (/datos personales|dato personal|informacion personal|perfil|estado civil|educacion|conyuge|esposa|esposo/.test(normalized)) modules.add("personal");
  if (/domicilio|direccion|ubicacion|residencia|vivienda/.test(normalized)) modules.add("address");
  if (/referencias? personales?|referencia familiar|referencia laboral|contactos de referencia/.test(normalized)) modules.add("references");
  if (/consulta por curp|buscar por curp|validar curp/.test(normalized)) modules.add("curp");

  return modules.size ? [...modules] : undefined;
}

export function getRequestedRuleModules(prompt: string): RuleReportModule[] | undefined {
  const normalized = normalize(prompt);
  if (FULL_DETAIL_PATTERN.test(normalized) || /\breglas\b|\brglas\b|\brules\b|motor de decision|motor de desicion|motor cortex|politicas?/.test(normalized)) return undefined;

  const modules = new Set<RuleReportModule>();
  if (/resumen|decision final|desicion final|estado final|dictamen|resultado final|veredicto|resolucion/.test(normalized)) modules.add("summary");
  if (/politica|poliza|umbral|threshold|criterio|dti|endeudamiento|score|socre|puntaje|buro|nomina|condicion|aprobacion|aprovacion|aprobado|rechazo|rechas[o]?|rechazado|revision|revicion/.test(normalized)) modules.add("rules");
  return modules.size ? [...modules] : undefined;
}

export function getRequestedDocumentModules(prompt: string): DocumentReportModule[] | undefined {
  const normalized = normalize(prompt);
  if (FULL_DETAIL_PATTERN.test(normalized) || /documentacion|documetacion|documentos|documntos|doctos|docs|expediente/.test(normalized)) return undefined;

  const modules = new Set<DocumentReportModule>();
  if (/progreso|cargados|subidos|procesados|procesamiento|estado de documentos|expediente/.test(normalized)) modules.add("progress");
  if (/nomina|nommina|nominia|payroll|recibo de pago|recibo nomina|desprendible/.test(normalized)) modules.add("payroll");
  if (/extracto|estrato|estado de cuenta|cuenta bancaria|bancario|banco/.test(normalized)) modules.add("bankStatement");
  if (/comprobante|comprobate|comprovante|domicilio|direccion|ubicacion|residencia|recibo de servicios/.test(normalized)) modules.add("address");
  if (/\bpdf\b|archivo|adjunto|anexo|extrac(?:cion)?/.test(normalized) && modules.size === 0) {
    modules.add("payroll");
    modules.add("bankStatement");
    modules.add("address");
  }
  return modules.size ? [...modules] : undefined;
}

export function extractSubjectName(prompt: string): string | null {
  const match = prompt.match(/(?:reporte|informe|resumen)\s+de\s+(.+?)(?=\s+(?:para|con|sobre|del|en)\s+(?:el\s+|la\s+)?(?:proceso\s+de\s+)?(?:kyc|reglas?|motor|documentaci[oó]n|documentos?|extracci[oó]n|n[oó]mina|extracto|comprobante|referencias?|identidad|contacto|domicilio|datos personales)\b)/i)
    || prompt.match(/(?:kyc|identidad|contacto|datos personales|estado de la sesi[oó]n|domicilio|referencias?(?: personales?| familiares?| laborales?)?|reglas?|motor(?: de (?:decisi[oó]n|desici[oó]n))?|documentaci[oó]n|documentos?|n[oó]mina|extracto|comprobante)\s+(?:de|para|sobre|acerca de|respecto a|relacionad[oa] con|correspondiente a)\s+(.+?)(?:\s+persona)?$/i)
    || prompt.match(/\bde\s+([a-záéíóúüñ' -]+)$/i);

  return match?.[1].trim().replace(/^(?:la\s+)?persona\s+/i, "").replace(/\s+persona$/i, "").replace(/\s+/g, " ") || null;
}

function extractApplicationReference(prompt: string): string | null {
  return prompt.match(/\bAPP-([a-f0-9-]+)\b/i)?.[1]?.replace(/-/g, "").toLowerCase() || null;
}

function requestName(request: FinanceRequest): string {
  const user = request.user as (FinanceRequest["user"] & { firstName?: string; lastName?: string; fullName?: string }) | undefined;
  return [request.firstName, request.lastName].filter(Boolean).join(" ") || user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(" ");
}

function resolveRequestForSubject(requests: FinanceRequest[], subjectName: string): FinanceRequest | null {
  const expected = normalize(subjectName);
  const tokens = expected.split(" ").filter(Boolean);
  const candidates = requests
    .map((request) => {
      const candidate = normalize(requestName(request));
      const matchedTokens = tokens.filter((token) => candidate.includes(token)).length;
      return { request, candidate, matchedTokens };
    })
    .filter(({ candidate, matchedTokens }) => candidate && matchedTokens === tokens.length)
    .sort((left, right) => {
      if (left.candidate === expected) return -1;
      if (right.candidate === expected) return 1;
      return right.matchedTokens - left.matchedTokens;
    });

  return candidates[0]?.request || null;
}

function resolveUserId(request: FinanceRequest, detail: Awaited<ReturnType<typeof fetchFinanceRequestById>>): string | null {
  return detail.userId || detail.user?.id || detail.zelifyUserId || request.user?.id || request.zelifyUserId || null;
}

async function loadDocumentExtractions(userId: string) {
  const progressByCategory = await Promise.all(
    DOCUMENT_CATEGORIES.map(async (category) => ({
      category,
      progress: await fetchFinancialDocumentProgress(userId, category),
    })),
  );
  const analysisIds = [...new Set(
    progressByCategory.flatMap(({ progress }) => progress.documents.map((document) => document.analysisId).filter((id): id is string => Boolean(id))),
  )];
  const extractions = await Promise.all(analysisIds.map((analysisId) => fetchFinancialDocumentExtraction(analysisId)));
  const documentIds = [...new Set(
    progressByCategory.flatMap(({ progress }) => progress.documents.map((document) => document.documentId).filter((id): id is string => Boolean(id))),
  )];
  const files = await Promise.all(documentIds.map(async (documentId) => {
    try {
      const file = await fetchFinancialDocumentFileUrl(documentId);
      return {
        documentId,
        fileName: file.fileName,
        contentType: file.contentType,
        url: file.url,
        available: true,
      };
    } catch {
      return { documentId, available: false };
    }
  }));

  return { progressByCategory, extractions, files };
}

export async function generateLiveReport(prompt: string): Promise<LiveReportResult> {
  const sections = getRequestedReportSections(prompt);
  const requestedKycModules = getRequestedKycModules(prompt);
  const requestedRuleModules = getRequestedRuleModules(prompt);
  const requestedDocumentModules = getRequestedDocumentModules(prompt);

  const subjectName = extractSubjectName(prompt);
  const applicationReference = extractApplicationReference(prompt);
  if (!subjectName && !applicationReference) throw new Error("Indica el número de solicitud para generar el informe.");
  if (!sections.length) throw new Error("No fue posible identificar el tipo de informe. Reintenta con una solicitud más específica.");

  const orgId = getStoredOrganization()?.id;
  if (!orgId) throw new Error("No hay una organización activa para consultar.");

  const requests = await fetchFinanceRequests(orgId);
  const request = applicationReference
    ? requests.find((candidate) => candidate.id.replace(/-/g, "").toLowerCase().startsWith(applicationReference)) || null
    : resolveRequestForSubject(requests, subjectName as string);
  if (!request) throw new Error(applicationReference
    ? `No se encontró la solicitud APP-${applicationReference.toUpperCase()}.`
    : `No se encontró una solicitud para ${subjectName}.`);

  const detail = await fetchFinanceRequestById(request.id);
  const userId = resolveUserId(request, detail);
  if (!userId) throw new Error(`La solicitud de ${subjectName} no tiene un usuario vinculado.`);

  const sectionResults = await Promise.all(sections.map(async (section): Promise<LiveReportSectionResult> => {
    try {
      if (section === "kyc") {
        const kycSessionId = detail.kycSessionId || request.kycSessionId;
        if (!kycSessionId) return { section, data: null, error: "La solicitud no tiene una sesión KYC vinculada." };
        const session = await fetchZelifyKycOnboardingSession(kycSessionId);
        const sessionByCurp = session.identity?.curp
          ? await fetchZelifyKycOnboardingSessionByCurp(session.identity.curp)
          : null;
        return { section, data: { session, sessionByCurp }, kycModules: requestedKycModules };
      }
      if (section === "rules") {
        const [userRules, rules, products] = await Promise.all([
          fetchUserRules(orgId, userId),
          fetchRules(request.personType === "moral" ? "moral" : "natural", orgId),
          fetchFinanceProducts(orgId),
        ]);
        const productNames = Object.fromEntries(products.map((product) => [
          String(product.id ?? product.productId ?? ""),
          String(product.name ?? product.productName ?? product.label ?? "Producto sin nombre"),
        ]));
        return {
          section,
          data: {
            ...userRules,
            ruleNames: Object.fromEntries(rules.map((rule) => [rule.id, rule.name])),
            ruleDetails: Object.fromEntries(rules.map((rule) => [rule.id, {
              description: rule.description,
              conditions: (rule as unknown as Record<string, unknown>).conditions ?? [],
              products: rule.products.map((product) => productNames[String(product)] || String(product)),
            }])),
          },
          ruleModules: requestedRuleModules,
        };
      }
      return { section, data: await loadDocumentExtractions(userId), documentModules: requestedDocumentModules };
    } catch (error) {
      return { section, data: null, error: error instanceof Error ? error.message : "No fue posible consultar el servicio." };
    }
  }));

  return { subjectName: requestName(request) || subjectName || `APP-${applicationReference?.toUpperCase()}`, userId, financeRequestId: request.id, sections: sectionResults };
}
