import { type Customer as DetailCustomer, mockCustomers } from "@/mocks/customers";

import { MOCK_BLACKLIST_CUSTOMERS } from "../data/blacklist-customers.mock";
import { MOCK_INACTIVE_CUSTOMERS } from "../data/inactive-customers.mock";
import { ClientState, type Customer as ListCustomer } from "../types/customer.types";

const stateByListState: Record<ClientState, DetailCustomer["state"]> = {
  [ClientState.ACTIVE]: "Active",
  [ClientState.INACTIVE]: "Inactive",
  [ClientState.BLACKLISTED]: "Blacklisted",
  [ClientState.PENDING]: "Pending Approval",
};

function mapListCustomerToDetail(customer: ListCustomer): DetailCustomer {
  const baseState = stateByListState[customer.state];
  const documentLabelByType: Record<string, string> = {
    INE: "INE",
    CURP: "CURP",
    RFC: "RFC",
    PASAPORTE: "Pasaporte",
    RESIDENCIA: "Residencia",
  };
  const kycLabelByStatus: Record<string, string> = {
    NOT_STARTED: "No iniciado",
    PENDING: "Pendiente",
    VERIFIED: "Verificado",
    REJECTED: "Rechazado",
  };
  const amlLabelByStatus: Record<string, string> = {
    NOT_STARTED: "No iniciado",
    CLEAR: "Limpio",
    REVIEW: "En revisión",
    BLOCKED: "Bloqueado",
  };

  const now = new Date().toISOString().slice(0, 10);
  const created = customer.statusChangedAt || customer.lastModified || now;
  const kycLabel = customer.kycStatus ? (kycLabelByStatus[customer.kycStatus] ?? customer.kycStatus) : "Opcional";
  const amlLabel = customer.amlStatus ? (amlLabelByStatus[customer.amlStatus] ?? customer.amlStatus) : "Opcional";
  const documentTypeLabel = documentLabelByType[customer.documentType] ?? customer.documentType;
  const statusReason = customer.statusReason?.trim() ? customer.statusReason : "Sin motivo registrado";

  return {
    id: customer.id,
    fullName: customer.fullName,
    email: customer.email || `${customer.id}@correo.mx`,
    phone: customer.mobilePhone || "No registrado",
    state: baseState,
    branch: "Sucursal principal",
    creditOfficer: "No asignado",
    totalBalance: 0,
    lastModified: customer.lastModified || now,
    createdDate: created,
    approvedDate: customer.state === ClientState.PENDING ? undefined : (customer.statusChangedAt || undefined),
    clientType: "Individual",
    assignedCentre: "México",
    personalInfo: {
      gender: "N/A",
      birthDate: customer.birthDate || "No registrado",
      preferredLanguage: "Español",
      address: customer.address || "No registrada",
    },
    accounts: [],
    activity: [
      {
        id: `EV-${customer.id}-state`,
        type: "Estado",
        description: `Estado actual: ${baseState}. Motivo: ${statusReason}.`,
        timestamp: customer.statusChangedAt || customer.lastModified || now,
        category: "Operation",
      },
      {
        id: `EV-${customer.id}-doc`,
        type: "Identidad",
        description: `Documento: ${documentTypeLabel} ${customer.documentNumber}.`,
        timestamp: customer.lastModified || now,
        category: "Identity",
      },
      {
        id: `EV-${customer.id}-kycaml`,
        type: "Compliance",
        description: `KYC: ${kycLabel}. AML: ${amlLabel}.`,
        timestamp: customer.kycVerifiedAt || customer.lastModified || now,
        category: "Operation",
      },
    ],
  };
}

function mapInactiveCustomer(customerId: string): DetailCustomer | null {
  const customer = MOCK_INACTIVE_CUSTOMERS.find((row) => row.id === customerId);
  if (!customer) return null;
  return {
    id: customer.id,
    fullName: customer.fullName,
    email: `${customer.id}@inactive.demo.zelify.local`,
    phone: "+1 000 000 0000",
    state: "Inactive",
    branch: customer.branch,
    creditOfficer: customer.assignedOfficer === "—" ? "Sin asignar" : customer.assignedOfficer,
    totalBalance: 0,
    lastModified: customer.updatedAt,
    createdDate: "2023-01-01",
    approvedDate: "2023-01-05",
    clientType: "Individual",
    assignedCentre: customer.centre,
    personalInfo: {
      gender: "N/A",
      birthDate: "1990-01-01",
      preferredLanguage: "Spanish",
      address: "Cliente inactivo (demo)",
    },
    accounts: [],
    activity: [
      {
        id: `EV-${customer.id}-inactive`,
        type: "Status Change",
        description: `Cliente marcado como ${customer.subStatus}`,
        timestamp: customer.updatedAt,
        category: "Product",
      },
    ],
  };
}

function mapBlacklistCustomer(customerId: string): DetailCustomer | null {
  const customer = MOCK_BLACKLIST_CUSTOMERS.find((row) => row.id === customerId);
  if (!customer) return null;
  return {
    id: customer.id,
    fullName: customer.fullName,
    email: `${customer.id}@risk.demo.zelify.local`,
    phone: "+1 000 000 0000",
    state: "Blacklisted",
    branch: customer.branch,
    creditOfficer: customer.reviewedBy === "—" ? "Compliance Team" : customer.reviewedBy,
    totalBalance: 0,
    lastModified: customer.addedAt,
    createdDate: "2022-01-01",
    approvedDate: "2022-01-03",
    clientType: "Individual",
    assignedCentre: "Compliance",
    personalInfo: {
      gender: "N/A",
      birthDate: "1988-01-01",
      preferredLanguage: "Spanish",
      address: "Cliente en lista de observacion",
    },
    accounts: [],
    activity: [
      {
        id: `EV-${customer.id}-risk`,
        type: "Compliance",
        description: `${customer.reason}. Nivel: ${customer.riskLevel}`,
        timestamp: customer.addedAt,
        category: "Compliance",
      },
    ],
  };
}

export function resolveCustomerProfile(
  customerId: string,
  listCustomers?: ListCustomer[]
): DetailCustomer | null {
  const fromList = (listCustomers ?? []).find((customer) => customer.id === customerId);
  if (fromList) return mapListCustomerToDetail(fromList);

  const fromInactive = mapInactiveCustomer(customerId);
  if (fromInactive) return fromInactive;

  const fromBlacklist = mapBlacklistCustomer(customerId);
  if (fromBlacklist) return fromBlacklist;

  const fromMockCustomers = mockCustomers.find((customer) => customer.id === customerId);
  if (fromMockCustomers) return fromMockCustomers;

  return null;
}
