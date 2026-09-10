export enum ClientState {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLACKLISTED = 'BLACKLISTED',
  PENDING = 'PENDING',
}

export type KycStatus = "NOT_STARTED" | "PENDING" | "VERIFIED" | "REJECTED";
export type AmlStatus = "NOT_STARTED" | "CLEAR" | "REVIEW" | "BLOCKED";
export type DocumentType = "INE" | "CURP" | "RFC" | "PASAPORTE" | "RESIDENCIA";

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  mobilePhone: string;
  documentType: DocumentType;
  documentNumber: string;
  state: ClientState;
  statusReason?: string;
  statusChangedAt?: string;
  address?: string;
  lastModified: string;
  birthDate: string;
  /** Alta en Zelify (ISO); desde 2026-05-24 habilita sync a LCC. */
  createdAt?: string;
  // Optional until Zelify products populate them automatically
  kycStatus?: KycStatus;
  kycVerifiedAt?: string;
  amlStatus?: AmlStatus;
}

export interface CustomerFilters {
  branch: string;
  birthDateAfter?: string;
}
