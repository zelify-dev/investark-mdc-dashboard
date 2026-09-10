import { NextResponse } from "next/server";
import { getLoanMockState } from "../../_mock-store";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ data: getLoanMockState().transactions.filter((x) => x.loanId === id) });
}
