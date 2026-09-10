import { NextResponse } from "next/server";
import { DEPOSIT_ACCOUNTS_MOCK } from "@/modules/deposits/data/deposit-accounts.mock";

function nextState(current: string, action: string): string {
  const transitions: Record<string, Record<string, string>> = {
    PENDING_APPROVAL: { APPROVE: "APPROVED" },
    APPROVED: { ACTIVATE: "ACTIVE" },
    ACTIVE: { MARK_DORMANT: "DORMANT", CLOSE: "CLOSED", BEGIN_MATURITY: "BEGIN_MATURITY_PERIOD" },
    DORMANT: { REACTIVATE: "ACTIVE" },
    BEGIN_MATURITY_PERIOD: { MATURE: "MATURED" },
    MATURED: { CLOSE: "CLOSED" },
    CLOSED: { WRITE_OFF: "WRITTEN_OFF" },
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
    note?: string;
    relatedLoanId?: string;
    relatedAccountId?: string;
    merchantName?: string;
    reason?: string;
  };

  const account = DEPOSIT_ACCOUNTS_MOCK.find((x) => x.id === id);
  if (!account) {
    // Still accept actions for unknown ids in mock mode
    return NextResponse.json({ ok: true, state: "ACTIVE" });
  }

  if (["DEPOSIT", "WITHDRAWAL", "TRANSFER_TO_LOAN", "TRANSFER_TO_DEPOSIT", "ADJUSTMENT", "INTEREST_REVERSAL", "WRITE_OFF", "CARD_HOLD", "RELEASE_HOLD"].includes(body.action)) {
    return NextResponse.json({ ok: true });
  }

  if (body.action === "APPLY_INTEREST") {
    const rate = Number(account.interestRate.replace("%", ""));
    const interest = Number((account.balances.total * (rate / 100) / 12).toFixed(2));
    return NextResponse.json({ ok: true, interestApplied: interest });
  }

  const state = nextState(account.state, body.action);
  return NextResponse.json({ ok: true, state });
}
