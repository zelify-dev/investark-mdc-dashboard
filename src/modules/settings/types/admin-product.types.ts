import type { ProductTypeDefinition } from "@/modules/products/types/product.types";

export type AdminProductKind = "loans" | "deposits";

export type AdminProductRow = {
  id: string;
  kind: AdminProductKind;
  productName: string;
  productCode: string;
  category: string;
  productType: string;
  productSubtype?: string;
  lastModified: string;
  isActive: boolean;
  isDeactivated: boolean;
};

export type { ProductTypeDefinition };
