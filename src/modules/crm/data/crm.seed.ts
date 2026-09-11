export type CrmLeadStatus = "nuevo" | "contactado" | "calificado" | "descartado";
export type CrmLeadSource = "whatsapp" | "web" | "referral" | "mdc";
export type CrmOpportunityStage =
  | "prospeccion"
  | "calificacion"
  | "propuesta"
  | "negociacion"
  | "ganada"
  | "perdida";

export type CrmRisk = "low" | "medium" | "high";

export type CrmLead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: CrmLeadSource;
  status: CrmLeadStatus;
  owner: string;
  interest: string;
  amount: number;
  createdAt: string;
  score: number;
};

export type CrmOpportunity = {
  id: string;
  title: string;
  client: string;
  product: string;
  stage: CrmOpportunityStage;
  amount: number;
  owner: string;
  closeDate: string;
  probability: number;
  termMonths: number;
  rate: number;
  risk: CrmRisk;
  score: number;
};

export type CrmCampaign = {
  id: string;
  name: string;
  channel: "whatsapp" | "email" | "sms";
  status: "borrador" | "activa" | "pausada" | "finalizada";
  audience: number;
  sent: number;
  replies: number;
  launchedAt: string;
};

export type CrmActivity = {
  id: string;
  type: "llamada" | "whatsapp" | "reunion" | "tarea";
  title: string;
  relatedTo: string;
  owner: string;
  dueAt: string;
  status: "pendiente" | "hecha";
};

export type WhatsappIntent = "duda" | "originacion" | "cobranza" | "documentos";

export type WhatsappMessage = {
  from: "in" | "out" | "ai";
  text: string;
  at: string;
};

export type WhatsappThread = {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
  tags: string[];
  intent: WhatsappIntent;
  product: string;
  amountDue?: number;
  dueDate?: string;
  overdueDays?: number;
  city: string;
  messages: WhatsappMessage[];
};

export const CRM_OWNERS = ["Ana Ríos", "Luis Ortega", "María Solís", "Diego Peña"] as const;

export const CRM_LEADS: CrmLead[] = [
  {
    id: "LD-1041",
    name: "Paola Méndez",
    phone: "+52 55 1844 2291",
    email: "paola.mendez@correo.com",
    source: "whatsapp",
    status: "nuevo",
    owner: "Ana Ríos",
    interest: "Crédito personal",
    amount: 85000,
    createdAt: "2026-09-10T14:20:00.000Z",
    score: 72,
  },
  {
    id: "LD-1038",
    name: "Grupo Andina SA de CV",
    phone: "+52 33 2109 4410",
    email: "compras@andina.mx",
    source: "web",
    status: "calificado",
    owner: "Luis Ortega",
    interest: "Crédito revolvente",
    amount: 1800000,
    createdAt: "2026-09-09T18:05:00.000Z",
    score: 88,
  },
  {
    id: "LD-1034",
    name: "Héctor Salazar",
    phone: "+52 81 6550 1188",
    email: "hsalazar@outlook.com",
    source: "referral",
    status: "contactado",
    owner: "María Solís",
    interest: "Crédito automotriz",
    amount: 320000,
    createdAt: "2026-09-08T11:40:00.000Z",
    score: 64,
  },
  {
    id: "LD-1029",
    name: "Carmen Varela",
    phone: "+52 55 9021 7733",
    email: "cvarela@gmail.com",
    source: "whatsapp",
    status: "contactado",
    owner: "Diego Peña",
    interest: "Crédito personal",
    amount: 60000,
    createdAt: "2026-09-07T16:12:00.000Z",
    score: 58,
  },
  {
    id: "LD-1022",
    name: "Taller Norte Logística",
    phone: "+52 22 2441 8802",
    email: "direccion@tallernorte.mx",
    source: "mdc",
    status: "calificado",
    owner: "Ana Ríos",
    interest: "Arrendamiento financiero",
    amount: 950000,
    createdAt: "2026-09-05T09:30:00.000Z",
    score: 91,
  },
  {
    id: "LD-1018",
    name: "Iván Cruz",
    phone: "+52 55 3310 2298",
    email: "ivan.cruz@mail.com",
    source: "web",
    status: "descartado",
    owner: "Luis Ortega",
    interest: "Crédito personal",
    amount: 45000,
    createdAt: "2026-09-03T13:18:00.000Z",
    score: 31,
  },
];

export const CRM_OPPORTUNITIES: CrmOpportunity[] = [
  {
    id: "OP-220",
    title: "Línea revolvente Andina",
    client: "Grupo Andina SA de CV",
    product: "Crédito revolvente",
    stage: "negociacion",
    amount: 1800000,
    owner: "Luis Ortega",
    closeDate: "2026-09-28",
    probability: 70,
    termMonths: 24,
    rate: 18.4,
    risk: "medium",
    score: 742,
  },
  {
    id: "OP-214",
    title: "Arrendamiento flotilla Norte",
    client: "Taller Norte Logística",
    product: "Arrendamiento financiero",
    stage: "propuesta",
    amount: 950000,
    owner: "Ana Ríos",
    closeDate: "2026-10-08",
    probability: 55,
    termMonths: 36,
    rate: 16.9,
    risk: "low",
    score: 801,
  },
  {
    id: "OP-209",
    title: "Automotriz Salazar",
    client: "Héctor Salazar",
    product: "Crédito automotriz",
    stage: "calificacion",
    amount: 320000,
    owner: "María Solís",
    closeDate: "2026-10-15",
    probability: 40,
    termMonths: 48,
    rate: 19.2,
    risk: "medium",
    score: 688,
  },
  {
    id: "OP-201",
    title: "Personal Méndez",
    client: "Paola Méndez",
    product: "Crédito personal",
    stage: "prospeccion",
    amount: 85000,
    owner: "Ana Ríos",
    closeDate: "2026-10-22",
    probability: 25,
    termMonths: 18,
    rate: 28.5,
    risk: "medium",
    score: 651,
  },
  {
    id: "OP-188",
    title: "Simple empresarial Solís Retail",
    client: "Solís Retail",
    product: "Crédito simple empresarial",
    stage: "ganada",
    amount: 640000,
    owner: "Diego Peña",
    closeDate: "2026-09-02",
    probability: 100,
    termMonths: 24,
    rate: 17.1,
    risk: "low",
    score: 824,
  },
  {
    id: "OP-176",
    title: "Personal Cruz",
    client: "Iván Cruz",
    product: "Crédito personal",
    stage: "perdida",
    amount: 45000,
    owner: "Luis Ortega",
    closeDate: "2026-08-29",
    probability: 0,
    termMonths: 12,
    rate: 32.0,
    risk: "high",
    score: 498,
  },
];

export const CRM_CAMPAIGNS: CrmCampaign[] = [
  {
    id: "CP-31",
    name: "WhatsApp · preaprobados septiembre",
    channel: "whatsapp",
    status: "activa",
    audience: 420,
    sent: 386,
    replies: 94,
    launchedAt: "2026-09-08",
  },
  {
    id: "CP-28",
    name: "Reactivación clientes MDC",
    channel: "whatsapp",
    status: "activa",
    audience: 180,
    sent: 180,
    replies: 41,
    launchedAt: "2026-09-04",
  },
  {
    id: "CP-24",
    name: "Nurturing web forms",
    channel: "email",
    status: "pausada",
    audience: 260,
    sent: 210,
    replies: 18,
    launchedAt: "2026-08-26",
  },
  {
    id: "CP-19",
    name: "Recordatorio documentos KYB",
    channel: "sms",
    status: "finalizada",
    audience: 75,
    sent: 75,
    replies: 22,
    launchedAt: "2026-08-12",
  },
];

export const CRM_ACTIVITIES: CrmActivity[] = [
  {
    id: "AC-91",
    type: "whatsapp",
    title: "Enviar oferta revolvente Andina",
    relatedTo: "Grupo Andina SA de CV",
    owner: "Luis Ortega",
    dueAt: "2026-09-10T19:00:00.000Z",
    status: "pendiente",
  },
  {
    id: "AC-88",
    type: "llamada",
    title: "Validar expediente Taller Norte",
    relatedTo: "Taller Norte Logística",
    owner: "Ana Ríos",
    dueAt: "2026-09-11T16:00:00.000Z",
    status: "pendiente",
  },
  {
    id: "AC-84",
    type: "reunion",
    title: "Cerrar oferta automotriz",
    relatedTo: "Héctor Salazar",
    owner: "María Solís",
    dueAt: "2026-09-12T15:30:00.000Z",
    status: "pendiente",
  },
  {
    id: "AC-79",
    type: "tarea",
    title: "Precalificar prospecto web",
    relatedTo: "Paola Méndez",
    owner: "Diego Peña",
    dueAt: "2026-09-09T18:00:00.000Z",
    status: "hecha",
  },
];

export const WHATSAPP_THREADS: WhatsappThread[] = [
  {
    id: "WA-1",
    name: "Paola Méndez",
    phone: "+52 55 1844 2291",
    lastMessage: "¿Me pueden decir el monto máximo?",
    lastAt: "2026-09-10T16:42:00.000Z",
    unread: 2,
    tags: ["duda", "personal"],
    intent: "duda",
    product: "Crédito personal",
    city: "CDMX",
    messages: [
      { from: "in", text: "Hola, vi la campaña de crédito personal.", at: "2026-09-10T16:28:00.000Z" },
      { from: "out", text: "Hola Paola, sí. ¿Buscas un monto aproximado?", at: "2026-09-10T16:31:00.000Z" },
      { from: "in", text: "Entre 60 y 90 mil.", at: "2026-09-10T16:36:00.000Z" },
      { from: "in", text: "¿Me pueden decir el monto máximo?", at: "2026-09-10T16:42:00.000Z" },
    ],
  },
  {
    id: "WA-2",
    name: "Grupo Andina",
    phone: "+52 33 2109 4410",
    lastMessage: "¿La tasa ya incluye IVA?",
    lastAt: "2026-09-10T15:18:00.000Z",
    unread: 1,
    tags: ["duda", "pm"],
    intent: "duda",
    product: "Crédito revolvente",
    city: "Guadalajara",
    messages: [
      { from: "out", text: "Buenas tardes, adjunto la línea revolvente de $1,800,000 a 24 meses.", at: "2026-09-10T14:50:00.000Z" },
      { from: "in", text: "Gracias. La revisa finanzas hoy.", at: "2026-09-10T14:58:00.000Z" },
      { from: "in", text: "¿La tasa ya incluye IVA?", at: "2026-09-10T15:18:00.000Z" },
    ],
  },
  {
    id: "WA-3",
    name: "Carmen Varela",
    phone: "+52 55 9021 7733",
    lastMessage: "¿Con INE basta o también pedirán comprobante?",
    lastAt: "2026-09-10T12:22:00.000Z",
    unread: 1,
    tags: ["documentos"],
    intent: "documentos",
    product: "Crédito personal",
    city: "CDMX",
    messages: [
      { from: "out", text: "Carmen, para continuar necesitamos INE vigente.", at: "2026-09-10T12:10:00.000Z" },
      { from: "in", text: "Perfecto, les mando INE más tarde.", at: "2026-09-10T12:18:00.000Z" },
      { from: "in", text: "¿Con INE basta o también pedirán comprobante?", at: "2026-09-10T12:22:00.000Z" },
    ],
  },
  {
    id: "WA-4",
    name: "Roberto Nava",
    phone: "+52 81 4410 2287",
    lastMessage: "Ya pagué ayer, ¿me pueden confirmar?",
    lastAt: "2026-09-10T17:05:00.000Z",
    unread: 3,
    tags: ["cobranza", "atraso"],
    intent: "cobranza",
    product: "Crédito personal",
    amountDue: 4280,
    dueDate: "2026-09-05",
    overdueDays: 5,
    city: "Monterrey",
    messages: [
      { from: "ai", text: "Hola Roberto, te recordamos que tu pago de $4,280 vence el 5 sep. Evita recargos pagando hoy.", at: "2026-09-10T09:02:00.000Z" },
      { from: "in", text: "Ando justado esta semana.", at: "2026-09-10T10:14:00.000Z" },
      { from: "ai", text: "Puedes liquidar en 3 días hábiles sin afectar buró. Te dejo el enlace de pago SPEI.", at: "2026-09-10T10:16:00.000Z" },
      { from: "in", text: "Ya pagué ayer, ¿me pueden confirmar?", at: "2026-09-10T17:05:00.000Z" },
    ],
  },
  {
    id: "WA-5",
    name: "Lucía Ferrer",
    phone: "+52 55 7781 3340",
    lastMessage: "¿Puedo pagar solo intereses este mes?",
    lastAt: "2026-09-10T16:58:00.000Z",
    unread: 1,
    tags: ["cobranza"],
    intent: "cobranza",
    product: "Crédito revolvente",
    amountDue: 6120,
    dueDate: "2026-09-08",
    overdueDays: 2,
    city: "CDMX",
    messages: [
      { from: "ai", text: "Lucía, tu mínimo de $6,120 está pendiente desde el 8 sep.", at: "2026-09-10T08:40:00.000Z" },
      { from: "in", text: "¿Puedo pagar solo intereses este mes?", at: "2026-09-10T16:58:00.000Z" },
    ],
  },
  {
    id: "WA-6",
    name: "Taller Norte Logística",
    phone: "+52 22 2441 8802",
    lastMessage: "Mandamos facturas de la flotilla.",
    lastAt: "2026-09-10T11:40:00.000Z",
    unread: 0,
    tags: ["expediente", "pm"],
    intent: "documentos",
    product: "Arrendamiento financiero",
    city: "Puebla",
    messages: [
      { from: "out", text: "Para el análisis MDC faltan estados de cuenta y facturas de unidades.", at: "2026-09-10T11:12:00.000Z" },
      { from: "in", text: "Mandamos facturas de la flotilla.", at: "2026-09-10T11:40:00.000Z" },
    ],
  },
  {
    id: "WA-7",
    name: "Héctor Salazar",
    phone: "+52 81 6550 1188",
    lastMessage: "¿Cuánto queda de enganche?",
    lastAt: "2026-09-10T13:27:00.000Z",
    unread: 1,
    tags: ["duda", "auto"],
    intent: "duda",
    product: "Crédito automotriz",
    city: "Monterrey",
    messages: [
      { from: "out", text: "Héctor, tu preaprobado automotriz es de $320,000 a 48 meses.", at: "2026-09-10T13:10:00.000Z" },
      { from: "in", text: "¿Cuánto queda de enganche?", at: "2026-09-10T13:27:00.000Z" },
    ],
  },
  {
    id: "WA-8",
    name: "Sofía Rangel",
    phone: "+52 33 9002 1184",
    lastMessage: "El cargo no se refleja todavía.",
    lastAt: "2026-09-10T17:21:00.000Z",
    unread: 2,
    tags: ["cobranza"],
    intent: "cobranza",
    product: "Crédito personal",
    amountDue: 2150,
    dueDate: "2026-09-09",
    overdueDays: 1,
    city: "Guadalajara",
    messages: [
      { from: "ai", text: "Sofía, hoy vence tu pago de $2,150. Si ya pagaste, ignora este aviso.", at: "2026-09-10T08:00:00.000Z" },
      { from: "in", text: "Pagué por OXXO hace rato.", at: "2026-09-10T17:12:00.000Z" },
      { from: "in", text: "El cargo no se refleja todavía.", at: "2026-09-10T17:21:00.000Z" },
    ],
  },
  {
    id: "WA-9",
    name: "Javier Orozco",
    phone: "+52 55 3310 9022",
    lastMessage: "¿Afecta buró si me atraso 3 días?",
    lastAt: "2026-09-10T09:48:00.000Z",
    unread: 1,
    tags: ["duda", "cobranza"],
    intent: "duda",
    product: "Crédito personal",
    amountDue: 3890,
    dueDate: "2026-09-12",
    overdueDays: 0,
    city: "CDMX",
    messages: [
      { from: "in", text: "Me pagan el viernes.", at: "2026-09-10T09:40:00.000Z" },
      { from: "in", text: "¿Afecta buró si me atraso 3 días?", at: "2026-09-10T09:48:00.000Z" },
    ],
  },
  {
    id: "WA-10",
    name: "Marina Solís Retail",
    phone: "+52 55 6100 4412",
    lastMessage: "Confirmo desembolso para el lunes.",
    lastAt: "2026-09-09T18:30:00.000Z",
    unread: 0,
    tags: ["formalizada"],
    intent: "originacion",
    product: "Crédito simple empresarial",
    city: "CDMX",
    messages: [
      { from: "out", text: "Línea formalizada por $640,000. Agenda de desembolso lista.", at: "2026-09-09T18:10:00.000Z" },
      { from: "in", text: "Confirmo desembolso para el lunes.", at: "2026-09-09T18:30:00.000Z" },
    ],
  },
  {
    id: "WA-11",
    name: "Diego Palacios",
    phone: "+52 44 2210 7781",
    lastMessage: "¿Pueden bajar la mensualidad?",
    lastAt: "2026-09-10T14:11:00.000Z",
    unread: 1,
    tags: ["duda", "reestructura"],
    intent: "duda",
    product: "Crédito personal",
    amountDue: 5400,
    dueDate: "2026-09-18",
    overdueDays: 0,
    city: "León",
    messages: [
      { from: "in", text: "Me subieron otras deudas.", at: "2026-09-10T14:05:00.000Z" },
      { from: "in", text: "¿Pueden bajar la mensualidad?", at: "2026-09-10T14:11:00.000Z" },
    ],
  },
  {
    id: "WA-12",
    name: "Elena Quiroz",
    phone: "+52 55 8801 2294",
    lastMessage: "Listo, ya subí el comprobante de domicilio.",
    lastAt: "2026-09-10T10:55:00.000Z",
    unread: 0,
    tags: ["documentos"],
    intent: "documentos",
    product: "Crédito personal",
    city: "CDMX",
    messages: [
      { from: "ai", text: "Elena, para precalificar faltan INE y comprobante de domicilio menor a 3 meses.", at: "2026-09-10T10:20:00.000Z" },
      { from: "in", text: "Listo, ya subí el comprobante de domicilio.", at: "2026-09-10T10:55:00.000Z" },
    ],
  },
  {
    id: "WA-13",
    name: "Iván Cruz",
    phone: "+52 55 3310 2298",
    lastMessage: "No voy a continuar.",
    lastAt: "2026-09-03T13:40:00.000Z",
    unread: 0,
    tags: ["declinado"],
    intent: "originacion",
    product: "Crédito personal",
    city: "CDMX",
    messages: [
      { from: "out", text: "Iván, el score no alcanzó para la línea solicitada.", at: "2026-09-03T13:22:00.000Z" },
      { from: "in", text: "No voy a continuar.", at: "2026-09-03T13:40:00.000Z" },
    ],
  },
  {
    id: "WA-14",
    name: "Patricia Gómez",
    phone: "+52 99 1550 8821",
    lastMessage: "Mándenme el recordatorio otra vez.",
    lastAt: "2026-09-10T17:44:00.000Z",
    unread: 2,
    tags: ["cobranza", "mora"],
    intent: "cobranza",
    product: "Crédito personal",
    amountDue: 8900,
    dueDate: "2026-08-28",
    overdueDays: 13,
    city: "Mérida",
    messages: [
      { from: "ai", text: "Patricia, tu crédito lleva 13 días de atraso. El saldo es $8,900. Regularízalo hoy para evitar cobranza extrajudicial.", at: "2026-09-10T08:12:00.000Z" },
      { from: "in", text: "Se me pasó.", at: "2026-09-10T17:40:00.000Z" },
      { from: "in", text: "Mándenme el recordatorio otra vez.", at: "2026-09-10T17:44:00.000Z" },
    ],
  },
];

export const WHATSAPP_API = {
  connected: true,
  provider: "WhatsApp Cloud API",
  phone: "+52 55 4000 1188",
  wabaId: "WABA-778291",
  businessName: "Kumaza",
  webhook: "https://api.kumaza.mx/webhooks/whatsapp",
  templates: [
    { name: "preaprobado_sep", status: "aprobada", language: "es_MX" },
    { name: "solicitud_documentos", status: "aprobada", language: "es_MX" },
    { name: "recordatorio_pago", status: "aprobada", language: "es_MX" },
    { name: "recordatorio_mora", status: "aprobada", language: "es_MX" },
  ],
};

export const INTENT_LABEL: Record<WhatsappIntent, string> = {
  duda: "Duda",
  originacion: "Originación",
  cobranza: "Cobranza",
  documentos: "Documentos",
};

export const LEAD_SOURCE_LABEL: Record<CrmLeadSource, string> = {
  whatsapp: "WhatsApp",
  web: "Formulario web",
  referral: "Referido",
  mdc: "Motor MDC",
};

export const LEAD_STATUS_LABEL: Record<CrmLeadStatus, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  calificado: "Precalificado",
  descartado: "Declinado",
};

export const OPP_STAGE_LABEL: Record<CrmOpportunityStage, string> = {
  prospeccion: "Precalificación",
  calificacion: "Expediente",
  propuesta: "Análisis MDC",
  negociacion: "Oferta",
  ganada: "Formalizada",
  perdida: "Declinada",
};

export const RISK_LABEL: Record<CrmRisk, string> = {
  low: "Riesgo bajo",
  medium: "Riesgo medio",
  high: "Riesgo alto",
};

export function moneyMxn(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
