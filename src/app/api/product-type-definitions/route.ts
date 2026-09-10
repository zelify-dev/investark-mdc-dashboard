import { NextResponse } from "next/server";
import { getLoanMockState, updateMockProductType } from "@/app/api/loans/_mock-store";

export type ProductTypeDefinitionRow = {
  id: string;
  name: string;
  code: string;
  kind: "LOAN" | "DEPOSIT";
  description: string | null;
  badge: string | null;
  features: string[] | null;
  subtype_of: string | null;
  is_active: boolean;
  sort_order: number;
  updated_at: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") as "LOAN" | "DEPOSIT" | null;
  const data = getLoanMockState().productTypes.filter((row) => !kind || row.kind === kind);
  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { id: string; is_active: boolean };

  if (!body?.id || typeof body.is_active !== "boolean") {
    return NextResponse.json({ error: "Payload inválido: se requiere id y is_active" }, { status: 400 });
  }

  const data = updateMockProductType(body.id, { is_active: body.is_active, updated_at: new Date().toISOString().slice(0, 10) });
  if (!data) return NextResponse.json({ error: "Tipo de producto no encontrado." }, { status: 404 });
  return NextResponse.json({ data });
}
