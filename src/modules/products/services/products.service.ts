/**
 * Products service — reads product type definitions from Supabase
 * via /api/product-type-definitions (6 loan types + 5 deposit types).
 */
import type { ProductTypeDefinition, ProductKind } from "../types/product.types";

type ApiResponse<T> = { data: T };

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return json.data;
}

export const productsService = {
  getAllTypes: () =>
    apiFetch<ProductTypeDefinition[]>("/api/product-type-definitions"),

  getLoanTypes: () =>
    apiFetch<ProductTypeDefinition[]>("/api/product-type-definitions?kind=LOAN"),

  getDepositTypes: () =>
    apiFetch<ProductTypeDefinition[]>("/api/product-type-definitions?kind=DEPOSIT"),

  toggleActive: (id: string, is_active: boolean) =>
    apiFetch<ProductTypeDefinition>("/api/product-type-definitions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active }),
    }),

  /** @deprecated — kept for backward compatibility; use getAllTypes() */
  getAllProducts: async (): Promise<[]> => [],
};

export type { ProductTypeDefinition, ProductKind };
