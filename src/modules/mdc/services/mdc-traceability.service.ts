import { getStoredUser } from "@/lib/auth-api";
import { getMdcApiBaseUrl } from "./mdc-api-client";

export interface TraceabilityLogDTO {
  id?: string;
  orgId: string;
  action: string;
  detail: string;
  channel: string;
  userName: string;
  correlationId?: string;
  rateBefore?: number | null;
  rateAfter?: number | null;
  createdAt?: string;
}

const getBaseUrl = (): string => getMdcApiBaseUrl();

export const fetchTraceabilityLogs = async (orgId?: string): Promise<TraceabilityLogDTO[]> => {
  const url = orgId ? `${getBaseUrl()}/traceability-logs?orgId=${encodeURIComponent(orgId)}` : `${getBaseUrl()}/traceability-logs`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch traceability logs");
      return [];
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching traceability logs:", error);
    return [];
  }
};

export const createTraceabilityLog = async (log: Omit<TraceabilityLogDTO, "id" | "createdAt">): Promise<TraceabilityLogDTO | null> => {
  const url = `${getBaseUrl()}/traceability-logs`;
  
  const user = getStoredUser();
  const fallbackUserName = user ? (user.full_name || user.email) : "Ejecutivo Zelify";
  const finalUserName = (!log.userName || log.userName === "Ejecutivo Zelify") ? fallbackUserName : log.userName;
  
  const payload = {
    ...log,
    userName: finalUserName,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("Failed to create traceability log");
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Error creating traceability log:", error);
    return null;
  }
};
