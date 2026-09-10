import { NextResponse } from "next/server";

import { Customer } from "@/modules/customers/types/customer.types";
import { getLoanMockState } from "@/app/api/loans/_mock-store";

export async function GET() {
  return NextResponse.json({ data: getLoanMockState().customers });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Customer;

  if (!body?.id || !body?.fullName || !body?.documentType || !body?.documentNumber || !body?.state) {
    return NextResponse.json({ error: "Payload inválido para cliente" }, { status: 400 });
  }

  // Mock-only: echo created customer without remote persistence
  return NextResponse.json(
    {
      data: {
        ...body,
        lastModified: body.lastModified ?? new Date().toISOString().slice(0, 10),
      },
    },
    { status: 201 }
  );
}
