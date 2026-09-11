import {
  KUMAZA_CRM_ORG_ID,
  type CrmDocument,
  type CrmFaq,
  type CrmLead,
  type CrmOrgConfig,
  type CrmProcessConfig,
  type CrmTemplate,
  type DocKind,
  type LeadStatus,
} from "./kumaza-crm.types";

export const DOC_KIND_LABEL: Record<DocKind, string> = {
  nomina: "Nómina",
  estado_cuenta: "Estado de cuenta",
  comprobante_domicilio: "Comprobante de domicilio",
};

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  nuevo: "Nuevo",
  en_conversacion: "En conversación",
  docs_pendiente: "Documentación pendiente",
  docs_completo: "Documentación completa",
  validando: "Validando",
  precalificado: "Precalificado",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  cerrado: "Cerrado",
};

export const DEFAULT_ORG: CrmOrgConfig = {
  orgId: KUMAZA_CRM_ORG_ID,
  tradeName: "Kumaza",
  legalName: "Kumaza SOFOM ENR",
  businessName: "Kumaza Sociedad Financiera de Objeto Múltiple, E.N.R.",
  taxId: "KUM2409109A1",
  countries: "México",
  website: "https://kumaza.mx",
  industry: "Crédito y originación",
  whatsappPhone: "+52 55 4000 1188",
  wabaId: "WABA-778291",
};

export const DEFAULT_PROCESS: CrmProcessConfig = {
  welcome:
    "Hola, soy el canal oficial de Kumaza. Para precalificar tu crédito vamos a identificar tu perfil y pedir 3 documentos: nómina, estado de cuenta y comprobante de domicilio.",
  requestDocs:
    "Para continuar, comparte por este chat: 1) recibo de nómina, 2) estado de cuenta de tu banco en México y 3) comprobante de domicilio (agua, luz, internet o teléfono).",
  followUp: "Seguimos pendientes de tu expediente. ¿Ya tienes el documento que te pedimos?",
  rejectedDoc:
    "El archivo no corresponde al tipo de documento solicitado. Vuelve a cargarlo con claridad, preferentemente PDF o foto nítida.",
  completeFile: "Expediente completo. Iniciamos validación y te avisamos el resultado de precalificación.",
  finish: "Proceso cerrado. Puedes consultar tu historial con el operador. Gracias por escribir a Kumaza.",
  requiredDocs: ["nomina", "estado_cuenta", "comprobante_domicilio"],
  validationOrder: ["nomina", "estado_cuenta", "comprobante_domicilio"],
};

export const DEFAULT_TEMPLATES: CrmTemplate[] = [
  { id: "tpl-welcome", name: "Bienvenida", category: "inicio", body: DEFAULT_PROCESS.welcome, active: true },
  { id: "tpl-nomina", name: "Solicitud de nómina", category: "documentos", body: "Por favor envía tu recibo de nómina más reciente (PDF o foto). Puede ser uno o varios periodos.", active: true },
  { id: "tpl-bank", name: "Solicitud de extracto bancario", category: "documentos", body: "Envía tu estado de cuenta de los últimos 30 días. Aceptamos Banorte, BBVA, Santander, Banamex, HSBC, Azteca y otros bancos de México.", active: true },
  { id: "tpl-address", name: "Solicitud de comprobante de domicilio", category: "documentos", body: "Envía un comprobante de domicilio vigente: agua, luz, internet o teléfono, a tu nombre o del domicilio declarado.", active: true },
  { id: "tpl-rejected", name: "Documento rechazado", category: "validacion", body: DEFAULT_PROCESS.rejectedDoc, active: true },
  { id: "tpl-pending", name: "Documento pendiente", category: "seguimiento", body: "Aún falta un documento para completar tu expediente. ¿Lo puedes mandar ahora?", active: true },
  { id: "tpl-complete", name: "Expediente completo", category: "validacion", body: DEFAULT_PROCESS.completeFile, active: true },
  { id: "tpl-validating", name: "Proceso en validación", category: "validacion", body: "Estamos validando tus documentos. Te avisamos en cuanto tengamos el resultado.", active: true },
  { id: "tpl-prequal", name: "Resultado de precalificación", category: "cierre", body: "Tu precalificación ya está lista. El operador te comparte la capacidad disponible.", active: true },
  { id: "tpl-close", name: "Cierre de conversación", category: "cierre", body: DEFAULT_PROCESS.finish, active: true },
];

export const DEFAULT_FAQS: CrmFaq[] = [
  { id: "faq-1", question: "¿Qué documentos necesito?", answer: "Nómina, estado de cuenta bancario de México y comprobante de domicilio (agua, luz, internet o teléfono).", category: "documentos", active: true },
  { id: "faq-2", question: "¿Puedo mandar varias nóminas?", answer: "Sí. Puedes cargar uno o varios recibos de nómina. Deben verse claros y corresponder a nómina.", category: "documentos", active: true },
  { id: "faq-3", question: "¿Qué bancos aceptan?", answer: "Banorte, BBVA, Santander, Citibanamex, HSBC, Azteca, BanCoppel, Inbursa y otros bancos de México.", category: "documentos", active: true },
  { id: "faq-4", question: "¿Cómo sé el estado de mi expediente?", answer: "El operador o Alaiza te indican qué documentos están recibidos, pendientes o en revisión.", category: "proceso", active: true },
  { id: "faq-5", question: "¿Cuánto tarda la precalificación?", answer: "Cuando el expediente está completo, la validación y precalificación se resuelven en esta misma conversación.", category: "proceso", active: true },
  { id: "faq-6", question: "¿Por qué rechazaron mi archivo?", answer: "Porque no coincide con el tipo pedido (nómina, estado de cuenta o comprobante) o no se lee con claridad.", category: "validacion", active: true },
];

function docs(partial: CrmDocument[]): CrmDocument[] {
  const base: Record<DocKind, CrmDocument> = {
    nomina: { id: "d-nom", kind: "nomina", fileName: "nomina.pdf", status: "pendiente" },
    estado_cuenta: { id: "d-bank", kind: "estado_cuenta", fileName: "estado-cuenta.pdf", status: "pendiente" },
    comprobante_domicilio: { id: "d-addr", kind: "comprobante_domicilio", fileName: "comprobante.pdf", status: "pendiente" },
  };
  for (const item of partial) base[item.kind] = { ...base[item.kind], ...item };
  return [base.nomina, base.estado_cuenta, base.comprobante_domicilio];
}

export const DEFAULT_LEADS: CrmLead[] = [
  {
    id: "LD-1041",
    name: "Paola Méndez",
    phone: "+52 55 1844 2291",
    createdAt: "2026-09-10T16:28:00.000Z",
    lastAt: "2026-09-10T16:42:00.000Z",
    chatStatus: "abierta",
    status: "docs_pendiente",
    operator: "Ana Ríos",
    unread: 2,
    lastMessage: "¿También piden estado de cuenta?",
    city: "CDMX",
    documents: docs([{ id: "pm-n", kind: "nomina", fileName: "nomina-ago.pdf", status: "recibido", uploadedAt: "2026-09-10T16:38:00.000Z" }]),
    validationNote: "Nómina recibida. Faltan banco y domicilio.",
    prequalResult: "pendiente",
    capacity: null,
    needsHuman: false,
    messages: [
      { id: "m1", from: "ai", kind: "template", text: DEFAULT_PROCESS.welcome, at: "2026-09-10T16:28:00.000Z" },
      { id: "m2", from: "in", kind: "text", text: "Hola, quiero un crédito personal.", at: "2026-09-10T16:29:00.000Z" },
      { id: "m3", from: "out", kind: "doc_request", text: "Paola, mándanos tu nómina para abrir expediente.", at: "2026-09-10T16:31:00.000Z" },
      { id: "m4", from: "in", kind: "doc", text: "Envié nomina-ago.pdf", at: "2026-09-10T16:38:00.000Z", docId: "pm-n" },
      { id: "m5", from: "in", kind: "text", text: "¿También piden estado de cuenta?", at: "2026-09-10T16:42:00.000Z" },
    ],
  },
  {
    id: "LD-1042",
    name: "Roberto Nava",
    phone: "+52 81 4410 2287",
    createdAt: "2026-09-09T09:00:00.000Z",
    lastAt: "2026-09-10T17:05:00.000Z",
    chatStatus: "abierta",
    status: "validando",
    operator: "Luis Ortega",
    unread: 1,
    lastMessage: "Ya subí los tres documentos.",
    city: "Monterrey",
    documents: docs([
      { id: "rn-n", kind: "nomina", fileName: "nomina-nava.pdf", status: "validado", uploadedAt: "2026-09-10T10:00:00.000Z" },
      { id: "rn-b", kind: "estado_cuenta", fileName: "bbva-agosto.pdf", status: "revision", bank: "BBVA", uploadedAt: "2026-09-10T10:12:00.000Z" },
      { id: "rn-a", kind: "comprobante_domicilio", fileName: "cfe-nava.pdf", status: "validado", service: "luz", uploadedAt: "2026-09-10T10:20:00.000Z" },
    ]),
    validationNote: "Estado de cuenta BBVA en revisión de autenticidad.",
    prequalResult: "pendiente",
    capacity: null,
    needsHuman: true,
    messages: [
      { id: "r1", from: "ai", kind: "template", text: DEFAULT_PROCESS.requestDocs, at: "2026-09-09T09:01:00.000Z" },
      { id: "r2", from: "in", kind: "doc", text: "Subí nómina, BBVA y CFE.", at: "2026-09-10T10:20:00.000Z" },
      { id: "r3", from: "out", kind: "text", text: "Gracias. El extracto BBVA quedó en revisión.", at: "2026-09-10T11:00:00.000Z" },
      { id: "r4", from: "in", kind: "text", text: "Ya subí los tres documentos.", at: "2026-09-10T17:05:00.000Z" },
    ],
  },
  {
    id: "LD-1043",
    name: "Carmen Varela",
    phone: "+52 55 9021 7733",
    createdAt: "2026-09-10T12:00:00.000Z",
    lastAt: "2026-09-10T12:22:00.000Z",
    chatStatus: "abierta",
    status: "en_conversacion",
    operator: "Diego Peña",
    unread: 1,
    lastMessage: "¿Con INE basta?",
    city: "CDMX",
    documents: docs([]),
    validationNote: "Aún no carga documentos.",
    prequalResult: "pendiente",
    capacity: null,
    needsHuman: false,
    messages: [
      { id: "c1", from: "ai", kind: "template", text: DEFAULT_PROCESS.welcome, at: "2026-09-10T12:00:00.000Z" },
      { id: "c2", from: "in", kind: "text", text: "¿Con INE basta?", at: "2026-09-10T12:22:00.000Z" },
    ],
  },
  {
    id: "LD-1044",
    name: "Lucía Ferrer",
    phone: "+52 55 7781 3340",
    createdAt: "2026-09-08T08:00:00.000Z",
    lastAt: "2026-09-10T16:58:00.000Z",
    chatStatus: "abierta",
    status: "docs_completo",
    operator: "María Solís",
    unread: 0,
    lastMessage: "Expediente completo. Iniciamos validación.",
    city: "CDMX",
    documents: docs([
      { id: "lf-n", kind: "nomina", fileName: "nomina-lucia.pdf", status: "recibido", uploadedAt: "2026-09-10T15:00:00.000Z" },
      { id: "lf-b", kind: "estado_cuenta", fileName: "santander-lucia.pdf", status: "recibido", bank: "Santander", uploadedAt: "2026-09-10T15:10:00.000Z" },
      { id: "lf-a", kind: "comprobante_domicilio", fileName: "telmex-lucia.pdf", status: "recibido", service: "telefono", uploadedAt: "2026-09-10T15:20:00.000Z" },
    ]),
    validationNote: "Tres documentos recibidos. Pendiente validar tipo de archivo.",
    prequalResult: "pendiente",
    capacity: null,
    needsHuman: false,
    messages: [
      { id: "l1", from: "in", kind: "doc", text: "Envié los tres archivos.", at: "2026-09-10T15:20:00.000Z" },
      { id: "l2", from: "ai", kind: "template", text: DEFAULT_PROCESS.completeFile, at: "2026-09-10T16:58:00.000Z" },
    ],
  },
  {
    id: "LD-1045",
    name: "Héctor Salazar",
    phone: "+52 81 6550 1188",
    createdAt: "2026-09-07T13:00:00.000Z",
    lastAt: "2026-09-10T13:27:00.000Z",
    chatStatus: "abierta",
    status: "precalificado",
    operator: "María Solís",
    unread: 0,
    lastMessage: "Capacidad precalificada: $320,000.",
    city: "Monterrey",
    documents: docs([
      { id: "hs-n", kind: "nomina", fileName: "nomina-hector.pdf", status: "validado", uploadedAt: "2026-09-08T10:00:00.000Z" },
      { id: "hs-b", kind: "estado_cuenta", fileName: "banorte-hector.pdf", status: "validado", bank: "Banorte", uploadedAt: "2026-09-08T10:10:00.000Z" },
      { id: "hs-a", kind: "comprobante_domicilio", fileName: "agua-hector.pdf", status: "validado", service: "agua", uploadedAt: "2026-09-08T10:20:00.000Z" },
    ]),
    validationNote: "Expediente validado. Precalificación lista.",
    prequalResult: "aprobado",
    capacity: 320000,
    needsHuman: false,
    messages: [
      { id: "h1", from: "out", kind: "template", text: "Tu precalificación ya está lista.", at: "2026-09-10T13:20:00.000Z" },
      { id: "h2", from: "ai", kind: "text", text: "Capacidad precalificada: $320,000.", at: "2026-09-10T13:27:00.000Z" },
    ],
  },
  {
    id: "LD-1046",
    name: "Sofía Rangel",
    phone: "+52 33 9002 1184",
    createdAt: "2026-09-06T11:00:00.000Z",
    lastAt: "2026-09-09T18:00:00.000Z",
    chatStatus: "cerrada",
    status: "cerrado",
    operator: "Ana Ríos",
    unread: 0,
    lastMessage: "Proceso cerrado. Gracias por escribir a Kumaza.",
    city: "Guadalajara",
    documents: docs([
      { id: "sr-n", kind: "nomina", fileName: "nomina-sofia.pdf", status: "validado", uploadedAt: "2026-09-07T09:00:00.000Z" },
      { id: "sr-b", kind: "estado_cuenta", fileName: "hsbc-sofia.pdf", status: "validado", bank: "HSBC", uploadedAt: "2026-09-07T09:10:00.000Z" },
      { id: "sr-a", kind: "comprobante_domicilio", fileName: "izzi-sofia.pdf", status: "validado", service: "internet", uploadedAt: "2026-09-07T09:20:00.000Z" },
    ]),
    validationNote: "Cerrada tras precalificación. Capacidad $85,000.",
    prequalResult: "aprobado",
    capacity: 85000,
    needsHuman: false,
    messages: [
      { id: "s1", from: "ai", kind: "text", text: "Precalificación aprobada. Capacidad $85,000.", at: "2026-09-09T17:40:00.000Z" },
      { id: "s2", from: "out", kind: "template", text: DEFAULT_PROCESS.finish, at: "2026-09-09T18:00:00.000Z" },
    ],
  },
  {
    id: "LD-1047",
    name: "Javier Orozco",
    phone: "+52 55 3310 9022",
    createdAt: "2026-09-10T09:30:00.000Z",
    lastAt: "2026-09-10T09:48:00.000Z",
    chatStatus: "abierta",
    status: "nuevo",
    operator: "Diego Peña",
    unread: 1,
    lastMessage: "Hola, me escribieron de Kumaza.",
    city: "CDMX",
    documents: docs([]),
    validationNote: "Lead nuevo. Pendiente identificar y pedir documentos.",
    prequalResult: "pendiente",
    capacity: null,
    needsHuman: false,
    messages: [{ id: "j1", from: "in", kind: "text", text: "Hola, me escribieron de Kumaza.", at: "2026-09-10T09:48:00.000Z" }],
  },
  {
    id: "LD-1048",
    name: "Patricia Gómez",
    phone: "+52 99 1550 8821",
    createdAt: "2026-09-05T10:00:00.000Z",
    lastAt: "2026-09-10T17:44:00.000Z",
    chatStatus: "abierta",
    status: "docs_pendiente",
    operator: "Luis Ortega",
    unread: 2,
    lastMessage: "Me rechazaron el archivo.",
    city: "Mérida",
    documents: docs([
      { id: "pg-n", kind: "nomina", fileName: "foto-borrosa.jpg", status: "rechazado", note: "No se lee como nómina.", uploadedAt: "2026-09-10T17:20:00.000Z" },
    ]),
    validationNote: "Nómina rechazada por ilegible. Faltan banco y domicilio.",
    prequalResult: "pendiente",
    capacity: null,
    needsHuman: true,
    messages: [
      { id: "p1", from: "out", kind: "doc_request", text: "Patricia, envía tu nómina.", at: "2026-09-10T17:00:00.000Z" },
      { id: "p2", from: "in", kind: "doc", text: "Mandé foto-borrosa.jpg", at: "2026-09-10T17:20:00.000Z", docId: "pg-n" },
      { id: "p3", from: "ai", kind: "template", text: DEFAULT_PROCESS.rejectedDoc, at: "2026-09-10T17:30:00.000Z" },
      { id: "p4", from: "in", kind: "text", text: "Me rechazaron el archivo.", at: "2026-09-10T17:44:00.000Z" },
    ],
  },
  {
    id: "LD-1049",
    name: "Elena Quiroz",
    phone: "+52 55 8801 2294",
    createdAt: "2026-09-04T10:00:00.000Z",
    lastAt: "2026-09-09T12:00:00.000Z",
    chatStatus: "cerrada",
    status: "rechazado",
    operator: "Ana Ríos",
    unread: 0,
    lastMessage: "El expediente no alcanzó precalificación.",
    city: "CDMX",
    documents: docs([
      { id: "eq-n", kind: "nomina", fileName: "nomina-elena.pdf", status: "validado", uploadedAt: "2026-09-08T11:00:00.000Z" },
      { id: "eq-b", kind: "estado_cuenta", fileName: "azteca-elena.pdf", status: "validado", bank: "Banco Azteca", uploadedAt: "2026-09-08T11:10:00.000Z" },
      { id: "eq-a", kind: "comprobante_domicilio", fileName: "cfe-elena.pdf", status: "validado", service: "luz", uploadedAt: "2026-09-08T11:20:00.000Z" },
    ]),
    validationNote: "Documentos válidos. Ingresos insuficientes.",
    prequalResult: "rechazado",
    capacity: 0,
    needsHuman: false,
    messages: [
      { id: "e1", from: "out", kind: "text", text: "El expediente no alcanzó precalificación.", at: "2026-09-09T12:00:00.000Z" },
    ],
  },
];

export const OPERATORS = ["Ana Ríos", "Luis Ortega", "María Solís", "Diego Peña"] as const;

export function moneyMxn(value: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value);
}

export function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export function docCounts(lead: CrmLead) {
  const received = lead.documents.filter((item) => item.status === "recibido" || item.status === "revision" || item.status === "validado").length;
  const pending = lead.documents.filter((item) => item.status === "pendiente" || item.status === "rechazado").length;
  const review = lead.documents.filter((item) => item.status === "revision").length;
  return { received, pending, review, total: lead.documents.length };
}

export function detectBank(fileName: string) {
  const hay = fileName.toLowerCase();
  if (hay.includes("bbva")) return "BBVA";
  if (hay.includes("santander")) return "Santander";
  if (hay.includes("banorte")) return "Banorte";
  if (hay.includes("banamex") || hay.includes("citi")) return "Citibanamex";
  if (hay.includes("hsbc")) return "HSBC";
  if (hay.includes("azteca")) return "Banco Azteca";
  if (hay.includes("coppel")) return "BanCoppel";
  if (hay.includes("inbursa")) return "Inbursa";
  return "Banco de México";
}
