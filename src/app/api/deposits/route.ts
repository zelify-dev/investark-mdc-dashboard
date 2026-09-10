import { NextResponse } from "next/server";
import { DEPOSIT_ACCOUNTS_MOCK } from "@/modules/deposits/data/deposit-accounts.mock";

function getDepositsFallback() {
  return NextResponse.json({
    data: DEPOSIT_ACCOUNTS_MOCK.map((x, index) => ({
      id: x.id,
      productTypeId: `deposit-type-${x.productKey}`,
      productCode: x.productKey.toUpperCase(),
      productName: x.productKey.replace(/_/g, " "),
      holderKind: x.holder.type === "GROUP" ? "COMPANY" : "INDIVIDUAL",
      holderId: `holder-${index + 1}`,
      holderName: x.holder.name,
      state: x.state,
      balance: x.balances.total,
      availableBalance: x.balances.available,
      overdraftLimit: 0,
      isDormant: false,
      dormantAfterDays: 90,
      allowInterestAccrual: true,
      interestBaseMethod: "DAILY_BALANCE",
      daysConvention: "360",
      rateMode: "FIXED",
      nominalRate: Number(x.interestRate.replace("%", "")),
      withholdingTaxPct: 0,
      overdraftInterestRate: 0,
      minTxAmount: 0,
      maxWithdrawalAmount: 0,
      recommendedDepositAmount: null,
    })),
  });
}

export async function GET() {
  return getDepositsFallback();
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    id: string;
    productTypeId: string;
    holderKind: "INDIVIDUAL" | "COMPANY";
    holderId: string;
    holderName: string;
    branchId?: string;
    nominalRate: number;
    overdraftLimit: number;
  };
  if (!body.id || !body.productTypeId || !body.holderId || !body.holderName) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }
  // Mock-only: no hay persistencia remota.
  return NextResponse.json({ ok: true }, { status: 201 });
}
