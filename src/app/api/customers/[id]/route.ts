import { NextResponse } from "next/server";
import type { Customer } from "@/modules/customers/types/customer.types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as Customer;

  // Mock-only: echo update without remote persistence
  return NextResponse.json({
    data: {
      ...body,
      id,
      lastModified: new Date().toISOString().slice(0, 10),
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  void id;
  return NextResponse.json({ ok: true });
}
