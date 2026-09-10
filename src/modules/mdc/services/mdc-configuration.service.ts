import { getStoredOrganization } from "@/lib/auth-api";
import { createTraceabilityLog } from "./mdc-traceability.service";
import { customFetch, getMdcApiBaseUrl } from "./mdc-api-client";
const API_URL = getMdcApiBaseUrl("http://localhost:3000");

export type GeneralSettings = {
  companyName: string;
  legalName: string;
  taxId: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  timezone: string;
  currency: string;
};

export type RoleRow = {
  id?: string;
  name: string;
  description: string;
  permissions: string | string[];
};

export type UserRow = {
  id?: string;
  fullName: string;
  email: string;
  role?: RoleRow | string;
  status: "active" | "inactive";
};

export type ExportJobStatus =
  | "Completado"
  | "Procesando"
  | "Error"
  | "completed"
  | "running"
  | "failed"
  | (string & {});

export type ExportJobType =
  | "Clientes"
  | "Solicitudes"
  | "Pagos de los clientes"
  | "Resultados KYC"
  | "clients"
  | "applications"
  | "payments"
  | "kycResults"
  | "full"
  | (string & {});

export type ExportJob = {
  id?: string;
  name: string;
  date: string | Date;
  status: ExportJobStatus;
  type: ExportJobType;
  fileUrl?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

// General Settings
export async function getGeneralSettings(): Promise<GeneralSettings> {
  const res = await customFetch(`${API_URL}/configuration/general`);
  if (!res.ok) throw new Error("Failed to fetch general settings");
  return res.json();
}

export async function updateGeneralSettings(data: GeneralSettings): Promise<GeneralSettings> {
  const res = await customFetch(`${API_URL}/configuration/general`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update general settings");
  const updated = await res.json();
  const orgId = getStoredOrganization()?.id || "demo-bypass-org";
  if (orgId !== "demo-bypass-org") {
    await createTraceabilityLog({
      orgId,
      action: "CONFIG_UPDATE",
      detail: "Configuración actualizada",
      channel: "Consola",
      userName: "Ejecutivo Zelify",
      correlationId: `corr-cfg-gen-${Date.now()}`,
    });
  }
  return updated;
}

// Roles
export async function getRoles(orgId?: string): Promise<RoleRow[]> {
  const queryParam = orgId ? `?orgId=${orgId}` : '';
  const res = await customFetch(`${API_URL}/configuration/roles${queryParam}`);
  if (!res.ok) throw new Error("Failed to fetch roles");
  return res.json();
}

export async function createRole(data: Partial<RoleRow>): Promise<RoleRow> {
  const res = await customFetch(`${API_URL}/configuration/roles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create role");
  const created = await res.json();
  const orgId = getStoredOrganization()?.id || "demo-bypass-org";
  if (orgId !== "demo-bypass-org") {
    await createTraceabilityLog({
      orgId,
      action: "CONFIG_CREATE",
      detail: "Configuración creada",
      channel: "Consola",
      userName: "Ejecutivo Zelify",
      correlationId: `corr-cfg-${created.id ? created.id.substring(0, 8) : Date.now()}`,
    });
  }
  return created;
}

export async function deleteRole(id: string): Promise<boolean> {
  const res = await customFetch(`${API_URL}/configuration/roles/${id}`, { method: "DELETE" });
  const ok = res.ok;
  if (ok) {
    const orgId = getStoredOrganization()?.id || "demo-bypass-org";
    if (orgId !== "demo-bypass-org") {
      await createTraceabilityLog({
        orgId,
        action: "CONFIG_DELETE",
        detail: "Configuración eliminada",
        channel: "Consola",
        userName: "Ejecutivo Zelify",
        correlationId: `corr-cfg-del-${Date.now()}`,
      });
    }
  }
  return ok;
}

// Users
export async function getUsers(): Promise<UserRow[]> {
  const res = await customFetch(`${API_URL}/configuration/users`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function createUser(data: Partial<UserRow>): Promise<UserRow> {
  const res = await customFetch(`${API_URL}/configuration/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create user");
  return res.json();
}

export async function deleteUser(id: string): Promise<boolean> {
  const res = await customFetch(`${API_URL}/configuration/users/${id}`, { method: "DELETE" });
  return res.ok;
}

// Exports
export async function getExportJobs(type?: string): Promise<ExportJob[]> {
  const queryParam = type && type !== "all" && type !== "Todos" ? `?type=${encodeURIComponent(type)}` : "";
  const res = await customFetch(`${API_URL}/configuration/exports${queryParam}`);
  if (!res.ok) throw new Error(`Failed to fetch exports: ${res.statusText}`);
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.exports)) return data.exports;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

export async function createExportJob(data: Partial<ExportJob> & { type: string; name?: string; date?: string | Date }): Promise<ExportJob> {
  const res = await customFetch(`${API_URL}/configuration/exports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let errMsg = `Failed to create export: ${res.statusText}`;
    try {
      const errBody = await res.json();
      if (errBody?.message) {
        errMsg = Array.isArray(errBody.message) ? errBody.message.join(", ") : errBody.message;
      }
    } catch { }
    throw new Error(errMsg);
  }
  return res.json();
}

export async function updateExportJobStatus(id: string, status: ExportJob["status"]): Promise<ExportJob> {
  const res = await customFetch(`${API_URL}/configuration/exports/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update export status");
  return res.json();
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
    window.URL.revokeObjectURL(blobUrl);
  }, 250);
}

function extractFilenameFromHeader(disposition: string | null, fallback: string): string {
  if (!disposition) return fallback;
  const matchStar = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (matchStar && matchStar[1]) {
    try {
      return decodeURIComponent(matchStar[1].trim());
    } catch { }
  }
  const match = disposition.match(/filename="?([^";]+)"?/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return fallback;
}

export async function downloadExportDirectly(type: string, orgId?: string): Promise<void> {
  const organizationId =
    orgId || getStoredOrganization()?.id;

  const payload = {
    type,
    organizationId,
    name: `Exportación ${type}`,
    date: new Date().toISOString()
  };

  const res = await customFetch(`${API_URL}/configuration/exports/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMsg = `Error al generar la exportación (${res.status})`;
    try {
      const errBody = await res.json();
      if (errBody?.message) {
        errMsg = Array.isArray(errBody.message) ? errBody.message.join(", ") : errBody.message;
      }
    } catch { }
    throw new Error(errMsg);
  }

  const disposition = res.headers.get("content-disposition");
  const extension = type === "Exportación completa" ? "xlsx" : "csv";
  const defaultFilename = `export_${type.toLowerCase().replace(/ /g, "_")}_${Date.now()}.${extension}`;
  const filename = extractFilenameFromHeader(disposition, defaultFilename);

  const blob = await res.blob();
  triggerBlobDownload(blob, filename);
}

export async function downloadExportById(id: string, fallbackName?: string): Promise<void> {
  const res = await customFetch(`${API_URL}/configuration/exports/${id}/download`);
  if (!res.ok) {
    let errMsg = `Error al descargar el archivo (${res.status})`;
    try {
      const errBody = await res.json();
      if (errBody?.message) {
        errMsg = Array.isArray(errBody.message) ? errBody.message.join(", ") : errBody.message;
      }
    } catch { }
    throw new Error(errMsg);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await res.json();
    if (data?.url) {
      const link = document.createElement("a");
      link.href = data.url;
      link.setAttribute("download", fallbackName || "export.csv");
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) document.body.removeChild(link);
      }, 300);
      return;
    }
  }

  const disposition = res.headers.get("content-disposition");
  const filename = extractFilenameFromHeader(disposition, fallbackName || `export_${id}.csv`);
  const blob = await res.blob();
  triggerBlobDownload(blob, filename);
}

export async function getExportDownloadUrl(id: string): Promise<{ url: string }> {
  const res = await customFetch(`${API_URL}/configuration/exports/${id}/download`);
  if (!res.ok) throw new Error("Failed to get export download URL");
  return res.json();
}

// Branches / Sucursales
export type BranchType = "PRINCIPAL" | "SECUNDARIA";

export type BranchRow = {
  id: string;
  orgId?: string;
  name: string;
  address: string;
  neighborhood: string;
  colonia: string;
  latitude: number | null;
  longitude: number | null;
  status: "ACTIVE" | "INACTIVE";
  type?: BranchType;
  isPrincipal?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateBranchDto = {
  name: string;
  address: string;
  neighborhood: string;
  latitude: number | null;
  longitude: number | null;
  status: "ACTIVE" | "INACTIVE";
  type?: BranchType;
  isPrincipal?: boolean;
};

export type UpdateBranchDto = Partial<CreateBranchDto>;

export async function getBranchConfig(orgId?: string): Promise<{ maxSearchDistanceKm: number }> {
  const currentOrgId = orgId || getStoredOrganization()?.id || "demo-bypass-org";
  if (currentOrgId === "demo-bypass-org") {
    return { maxSearchDistanceKm: 5 };
  }
  const res = await customFetch(`${API_URL}/configuration/branches/config?organizationId=${encodeURIComponent(currentOrgId)}`);
  if (!res.ok) {
    if (res.status === 404) return { maxSearchDistanceKm: 5 }; // Fallback
    throw new Error(`Failed to fetch branch config: ${res.statusText}`);
  }
  return res.json();
}

export async function updateBranchConfig(data: { maxSearchDistanceKm: number }, orgId?: string): Promise<{ maxSearchDistanceKm: number }> {
  const currentOrgId = orgId || getStoredOrganization()?.id || "demo-bypass-org";
  if (currentOrgId === "demo-bypass-org") {
    return data;
  }
  const res = await customFetch(`${API_URL}/configuration/branches/config?organizationId=${encodeURIComponent(currentOrgId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let errMsg = `Failed to update branch config: ${res.statusText}`;
    try {
      const errBody = await res.json();
      if (errBody && errBody.message) {
        errMsg = Array.isArray(errBody.message) ? errBody.message.join(", ") : errBody.message;
      }
    } catch (e) {
      // Ignorar
    }
    throw new Error(errMsg);
  }
  return res.json();
}

export async function getBranches(orgId?: string): Promise<BranchRow[]> {
  const currentOrgId = orgId || getStoredOrganization()?.id || "demo-bypass-org";
  const res = await customFetch(`${API_URL}/configuration/branches?organizationId=${encodeURIComponent(currentOrgId)}`);
  if (!res.ok) throw new Error(`Failed to fetch branches: ${res.statusText}`);
  const data = await res.json();
  const list: any[] = Array.isArray(data) ? data : (data.branches ?? []);
  return list.map((b: any) => {
    const isPrincipal = b.isPrincipal !== undefined ? Boolean(b.isPrincipal) : b.type === "PRINCIPAL";
    const type: BranchType = b.type === "PRINCIPAL" || isPrincipal ? "PRINCIPAL" : "SECUNDARIA";
    return {
      id: b.id,
      orgId: b.orgId || currentOrgId,
      name: b.name || "",
      address: b.address || "",
      neighborhood: b.neighborhood || b.colonia || "",
      colonia: b.colonia || b.neighborhood || "",
      latitude: b.latitude != null ? Number(b.latitude) : null,
      longitude: b.longitude != null ? Number(b.longitude) : null,
      status: b.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      type,
      isPrincipal,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    };
  });
}

export async function createBranch(data: CreateBranchDto, orgId?: string): Promise<BranchRow> {
  const currentOrgId = orgId || getStoredOrganization()?.id || "demo-bypass-org";
  const isPrincipal = data.isPrincipal !== undefined ? Boolean(data.isPrincipal) : data.type === "PRINCIPAL";
  const type: BranchType = data.type || (isPrincipal ? "PRINCIPAL" : "SECUNDARIA");
  const bodyPayload = {
    name: data.name,
    address: data.address,
    neighborhood: data.neighborhood,
    latitude: data.latitude,
    longitude: data.longitude,
    status: data.status,
    type,
    isPrincipal,
  };

  const res = await customFetch(`${API_URL}/configuration/branches?organizationId=${encodeURIComponent(currentOrgId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyPayload),
  });

  if (!res.ok) {
    let errMsg = `Failed to create branch: ${res.statusText}`;
    try {
      const errBody = await res.json();
      if (errBody?.message) {
        errMsg = Array.isArray(errBody.message) ? errBody.message.join(", ") : errBody.message;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errMsg);
  }
  const b = await res.json();

  if (currentOrgId !== "demo-bypass-org") {
    await createTraceabilityLog({
      orgId: currentOrgId,
      action: "CONFIG_CREATE",
      detail: `Sucursal creada: ${b.name || data.name} (${type})`,
      channel: "Consola",
      userName: "Ejecutivo Zelify",
      correlationId: `corr-cfg-branch-${b.id ? b.id.substring(0, 8) : Date.now()}`,
    });
  }

  const resIsPrincipal = b.isPrincipal !== undefined ? Boolean(b.isPrincipal) : (b.type === "PRINCIPAL" || isPrincipal);
  const resType: BranchType = b.type || (resIsPrincipal ? "PRINCIPAL" : "SECUNDARIA");

  return {
    id: b.id,
    orgId: b.orgId || currentOrgId,
    name: b.name || data.name,
    address: b.address || data.address,
    neighborhood: b.neighborhood || data.neighborhood,
    colonia: b.colonia || b.neighborhood || data.neighborhood,
    latitude: b.latitude != null ? Number(b.latitude) : data.latitude,
    longitude: b.longitude != null ? Number(b.longitude) : data.longitude,
    status: b.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    type: resType,
    isPrincipal: resIsPrincipal,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

export async function updateBranch(id: string, data: UpdateBranchDto): Promise<BranchRow> {
  const bodyPayload: Record<string, any> = {};
  if (data.name !== undefined) bodyPayload.name = data.name;
  if (data.address !== undefined) bodyPayload.address = data.address;
  if (data.neighborhood !== undefined) bodyPayload.neighborhood = data.neighborhood;
  if (data.latitude !== undefined) bodyPayload.latitude = data.latitude;
  if (data.longitude !== undefined) bodyPayload.longitude = data.longitude;
  if (data.status !== undefined) bodyPayload.status = data.status;
  if (data.type !== undefined) {
    bodyPayload.type = data.type;
    bodyPayload.isPrincipal = data.type === "PRINCIPAL";
  } else if (data.isPrincipal !== undefined) {
    bodyPayload.isPrincipal = data.isPrincipal;
    bodyPayload.type = data.isPrincipal ? "PRINCIPAL" : "SECUNDARIA";
  }

  const res = await customFetch(`${API_URL}/configuration/branches/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyPayload),
  });

  if (!res.ok) {
    let errMsg = `Failed to update branch: ${res.statusText}`;
    try {
      const errBody = await res.json();
      if (errBody?.message) {
        errMsg = Array.isArray(errBody.message) ? errBody.message.join(", ") : errBody.message;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errMsg);
  }
  const b = await res.json();

  const orgId = getStoredOrganization()?.id || "demo-bypass-org";
  if (orgId !== "demo-bypass-org") {
    await createTraceabilityLog({
      orgId,
      action: "CONFIG_UPDATE",
      detail: `Sucursal actualizada: ${b.name || id}`,
      channel: "Consola",
      userName: "Ejecutivo Zelify",
      correlationId: `corr-cfg-branch-upd-${Date.now()}`,
    });
  }

  const resIsPrincipal = b.isPrincipal !== undefined ? Boolean(b.isPrincipal) : (b.type === "PRINCIPAL" || data.isPrincipal || data.type === "PRINCIPAL");
  const resType: BranchType = b.type || (resIsPrincipal ? "PRINCIPAL" : "SECUNDARIA");

  return {
    id: b.id || id,
    orgId: b.orgId || orgId,
    name: b.name || data.name || "",
    address: b.address || data.address || "",
    neighborhood: b.neighborhood || data.neighborhood || b.colonia || "",
    colonia: b.colonia || b.neighborhood || data.neighborhood || "",
    latitude: b.latitude != null ? Number(b.latitude) : (data.latitude ?? null),
    longitude: b.longitude != null ? Number(b.longitude) : (data.longitude ?? null),
    status: b.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    type: resType,
    isPrincipal: resIsPrincipal,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

export async function deleteBranch(id: string): Promise<boolean> {
  const res = await customFetch(`${API_URL}/configuration/branches/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  const ok = res.ok;
  if (ok) {
    const orgId = getStoredOrganization()?.id || "demo-bypass-org";
    if (orgId !== "demo-bypass-org") {
      await createTraceabilityLog({
        orgId,
        action: "CONFIG_DELETE",
        detail: `Sucursal eliminada ID: ${id}`,
        channel: "Consola",
        userName: "Ejecutivo Zelify",
        correlationId: `corr-cfg-branch-del-${Date.now()}`,
      });
    }
  }
  return ok;
}
