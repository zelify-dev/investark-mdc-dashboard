import { NextResponse } from "next/server";
import type { ProductFormInput } from "@/modules/products/types/product.types";
import { getLoanMockState } from "@/app/api/loans/_mock-store";

function getProductsFallback() {
  return NextResponse.json({
    data: getLoanMockState().productTypes.map((row) => ({
      id: row.id,
      name: row.name,
      kind: "LOAN",
      active: row.is_active,
      minAmount: 50000,
      maxAmount: 5000000,
      minInterestRate: 14,
      maxInterestRate: 28,
      loanTypeCode: row.code,
      paymentMethod: "DECLINING_BALANCE",
      gracePeriodInstallments: 0,
      maxInstallments: 60,
      repaymentFrequency: "MONTHLY",
      collateralRequired: false,
      updatedAt: row.updated_at,
    })),
  });
}

// ── GET /api/products ─────────────────────────────────────────
export async function GET() {
  return getProductsFallback();
}

// ── POST /api/products ────────────────────────────────────────
export async function POST(request: Request) {
  const payload = (await request.json()) as ProductFormInput;

  if (!payload?.name?.trim() || !payload?.kind) {
    return NextResponse.json({ error: "Payload inválido: se requiere name y kind" }, { status: 400 });
  }

  const prefix = payload.kind === "DEPOSIT" ? "DEP" : "LOAN";
  const id =
    typeof payload.id === "string" && payload.id.trim()
      ? payload.id.trim()
      : `${prefix}-PROD-${Date.now()}`;

  const today = new Date().toISOString().slice(0, 10);
  // Mock-only create response
  return NextResponse.json(
    {
      data: {
        id,
        name: payload.name.trim(),
        kind: payload.kind,
        active: true,
        minAmount: payload.minAmount,
        maxAmount: payload.maxAmount,
        minInterestRate: payload.minInterestRate,
        maxInterestRate: payload.maxInterestRate,
        ...(payload.kind === "DEPOSIT"
          ? {
              productType: payload.productType ?? "SAVINGS_PLAN",
              overdraftAllowed: Boolean(payload.overdraftAllowed),
              overdraftLimit: payload.overdraftLimit ?? 0,
              interestRateSettings: payload.interestRateSettings ?? "FIXED",
            }
          : {
              loanTypeCode: payload.loanTypeCode,
              paymentMethod: payload.paymentMethod ?? "EQUATED_INSTALLMENTS",
              gracePeriodInstallments: payload.gracePeriodInstallments ?? 0,
              maxInstallments: payload.maxInstallments ?? 12,
              repaymentFrequency: payload.repaymentFrequency ?? "MONTHLY",
              collateralRequired: Boolean(payload.collateralRequired),
            }),
        updatedAt: today,
      },
    },
    { status: 201 }
  );
}
