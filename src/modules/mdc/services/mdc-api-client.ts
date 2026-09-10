/** Base MDC sin slash final — evita `//finance-products` si el secret trae `/`. */
export function getMdcApiBaseUrl(fallback = "http://127.0.0.1:3000"): string {
  const raw = process.env.NEXT_PUBLIC_MDC_API_URL;
  const value = typeof raw === "string" && raw.trim() !== "" ? raw : fallback;
  return value.trim().replace(/\/$/, "");
}

export const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const orgId = typeof window !== "undefined" ? localStorage.getItem("organization_id") || "" : "";
  const userName = typeof window !== "undefined" ? localStorage.getItem("full_name") || "" : "";

  // 2. Preparamos las cabeceras
  const headers = new Headers(init?.headers);
  
  // 3. Inyectamos las cabeceras extra para la trazabilidad del backend
  if (orgId) {
    headers.set('x-org-id', orgId);
  }
  if (userName) {
    headers.set('x-user-name', userName);
  }

  // 4. Retornamos la llamada fetch original, pero con nuestras cabeceras inyectadas
  return fetch(input, {
    ...init,
    headers,
  });
};
