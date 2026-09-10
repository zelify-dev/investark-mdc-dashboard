import { getStoredOrganization } from "@/lib/auth-api";
import { createTraceabilityLog } from "./mdc-traceability.service";
import { customFetch, getMdcApiBaseUrl } from "./mdc-api-client";
const API_URL = getMdcApiBaseUrl("http://localhost:3000");

export type CollectionNote = {
  id?: string;
  text: string;
  createdAt?: string;
};

export type CollectionCase = {
  id?: string;
  applicationNo: string;
  customerName: string;
  email: string;
  phone: string;
  identification: string;
  birthDate: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  amountDue: number;
  dpd: number;
  status: "active" | "escalated" | string;
  assignedAgent: string;
  lastActivity: string;
  individualPerson?: boolean;
  legalEntity?: boolean;
  notes?: CollectionNote[];
  createdAt?: string;
};

export async function fetchCollections(mode: "natural" | "moral", orgId: string): Promise<CollectionCase[]> {
  try {
    const params = new URLSearchParams({ mode, orgId });
    const res = await customFetch(`${API_URL}/collections?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch collections");
    return res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function createCollectionCase(data: CollectionCase, orgId: string): Promise<CollectionCase | null> {
  try {
    const res = await customFetch(`${API_URL}/collections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, orgId }),
    });
    if (!res.ok) throw new Error("Failed to create collection case");
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function updateCollectionCase(id: string, data: Partial<CollectionCase>): Promise<CollectionCase | null> {
  try {
    const res = await customFetch(`${API_URL}/collections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update collection case");
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function deleteCollectionCase(id: string): Promise<boolean> {
  try {
    const res = await customFetch(`${API_URL}/collections/${id}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function addCollectionNote(id: string, text: string): Promise<CollectionNote | null> {
  try {
    const res = await customFetch(`${API_URL}/collections/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error("Failed to add note");
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}
