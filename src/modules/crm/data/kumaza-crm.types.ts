export const KUMAZA_CRM_ORG_ID = "9642c5d0-05a3-4193-a85c-d59e46b031e8";

export type DocKind = "nomina" | "estado_cuenta" | "comprobante_domicilio";
export type DocStatus = "pendiente" | "recibido" | "revision" | "rechazado" | "validado";
export type ChatStatus = "abierta" | "pendiente" | "cerrada";
export type LeadStatus =
  | "nuevo"
  | "en_conversacion"
  | "docs_pendiente"
  | "docs_completo"
  | "validando"
  | "precalificado"
  | "aprobado"
  | "rechazado"
  | "cerrado";
export type MessageFrom = "in" | "out" | "ai" | "system";
export type MessageKind = "text" | "template" | "doc_request" | "doc";
export type PrequalResult = "pendiente" | "aprobado" | "rechazado";

export type CrmDocument = {
  id: string;
  kind: DocKind;
  fileName: string;
  status: DocStatus;
  bank?: string;
  service?: "agua" | "luz" | "internet" | "telefono" | "otro";
  note?: string;
  uploadedAt?: string;
};

export type CrmMessage = {
  id: string;
  from: MessageFrom;
  kind: MessageKind;
  text: string;
  at: string;
  docId?: string;
};

export type CrmLead = {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  lastAt: string;
  chatStatus: ChatStatus;
  status: LeadStatus;
  operator: string;
  unread: number;
  lastMessage: string;
  city: string;
  documents: CrmDocument[];
  validationNote: string;
  prequalResult: PrequalResult;
  capacity: number | null;
  needsHuman: boolean;
  messages: CrmMessage[];
};

export type CrmTemplate = {
  id: string;
  name: string;
  category: string;
  body: string;
  active: boolean;
};

export type CrmFaq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  active: boolean;
};

export type CrmOrgConfig = {
  orgId: string;
  tradeName: string;
  legalName: string;
  businessName: string;
  taxId: string;
  countries: string;
  website: string;
  industry: string;
  whatsappPhone: string;
  wabaId: string;
};

export type CrmProcessConfig = {
  welcome: string;
  requestDocs: string;
  followUp: string;
  rejectedDoc: string;
  completeFile: string;
  finish: string;
  requiredDocs: DocKind[];
  validationOrder: DocKind[];
};
