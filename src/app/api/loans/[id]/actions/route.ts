import { NextResponse } from "next/server";
import { logSystemActivity } from "@/lib/activity-log";
import { appendMockLoanTransaction, appendMockLoanTranche, getLoanMockState, updateMockLoanState } from "../../_mock-store";

function nextState(current: string, action: string): string {
  const transitions: Record<string, Record<string, string>> = {
    PARTIAL_APPLICATION: { SUBMIT: "PENDING_APPROVAL" },
    PENDING_APPROVAL: { APPROVE: "APPROVED" },
    ACTIVE: { MARK_ARREARS: "ACTIVE_IN_ARREARS", LOCK: "LOCKED", CLOSE: "CLOSED", WRITE_OFF: "WRITTEN_OFF", PAY_OFF: "CLOSED", TERMINATE: "CLOSED" },
    ACTIVE_IN_ARREARS: { LOCK: "LOCKED", CURE: "ACTIVE", WRITE_OFF: "WRITTEN_OFF", PAY_OFF: "CLOSED", TERMINATE: "CLOSED" },
    LOCKED: { UNLOCK: "ACTIVE", TERMINATE: "CLOSED" },
    APPROVED: { DISBURSE: "ACTIVE", TERMINATE: "CLOSED" },
  };
  return transitions[current]?.[action] ?? current;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as {
    action: string;
    amount?: number;
    channel?: string;
    txDate?: string;
    reason?: string;
    restructureType?: "RESCHEDULING" | "REFINANCING" | "CAPITALIZATION";
    details?: Record<string, unknown>;
  };

  const storeLoan = getLoanMockState().loans.find((item) => item.id === id);
  if (!storeLoan) return NextResponse.json({ error: "Prestamo no encontrado." }, { status: 404 });
  const currentState = storeLoan.lifecycleState;
  const newState = nextState(currentState, body.action);
  if (body.action === "DISBURSE_TRANCHE") {
    appendMockLoanTranche({
      id: `${id}-tr-${Date.now()}`,
      loanId: id,
      trancheNo: Date.now() % 100000,
      expectedDate: body.txDate ?? new Date().toISOString().slice(0, 10),
      disbursedDate: body.txDate ?? new Date().toISOString().slice(0, 10),
      amount: Number(body.amount ?? 0),
      disbursementChannel: body.channel ?? "TRANSFERENCIA",
      status: "DISBURSED",
    });
  }
  if (["REPAYMENT", "BULK_REPAYMENT", "REPAYMENT_FROM_DEPOSIT", "PAY_OFF", "TERMINATE", "WRITE_OFF", "RESCHEDULE", "REFINANCE", "CAPITALIZE_INTEREST"].includes(body.action)) {
    appendMockLoanTransaction({
      id: `${id}-tx-${Date.now()}`,
      loanId: id,
      txType: body.action,
      txDate: body.txDate ?? new Date().toISOString().slice(0, 10),
      channel: body.channel ?? "CAJA",
      amountTotal: Number(body.amount ?? 0),
      principalComponent: Number(body.amount ?? 0),
      interestComponent: 0,
      feesComponent: 0,
      penaltiesComponent: 0,
      relatedDepositAccount: null,
      notes: body.reason ?? null,
      auditReason: body.reason ?? null,
    });
  }
  updateMockLoanState(id, (loan) => ({
    ...loan,
    lifecycleState: newState as typeof loan.lifecycleState,
    disbursementDate: body.action === "DISBURSE" ? body.txDate ?? new Date().toISOString().slice(0, 10) : loan.disbursementDate,
    disbursementChannel: body.action === "DISBURSE" ? body.channel ?? "TRANSFERENCIA" : loan.disbursementChannel,
  }));
  await logSystemActivity({
    action: `Cambio de estado préstamo: ${currentState} -> ${newState}`,
    module: "loans",
    affectedItemName: storeLoan.productName,
    affectedItemId: id,
    affectedClientName: storeLoan.customerName,
    affectedClientId: storeLoan.customerId,
  });
  return NextResponse.json({ ok: true, lifecycleState: newState });
}
