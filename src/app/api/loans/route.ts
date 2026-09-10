import { NextResponse } from "next/server";
import { logSystemActivity } from "@/lib/activity-log";
import { createMockLoan, getLoanMockState } from "./_mock-store";

export async function GET() {
  return NextResponse.json({ data: getLoanMockState().loans });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    id: string;
    productTypeId: string;
    customerId: string;
    customerName: string;
    principalAmount: number;
    expectedDisbursementDate: string;
    nominalRate: number;
    disbursementChannel: string;
  };
  if (!body.id || !body.productTypeId || !body.customerId || !body.customerName) {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }
  createMockLoan(body);
  await logSystemActivity({
    action: "Préstamo creado",
    module: "loans",
    affectedItemName: body.id,
    affectedItemId: body.id,
    affectedClientName: body.customerName,
    affectedClientId: body.customerId,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
