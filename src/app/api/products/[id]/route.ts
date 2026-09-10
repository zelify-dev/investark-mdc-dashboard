import { NextResponse } from "next/server";
import type { ProductFormInput } from "@/modules/products/types/product.types";

// ── PATCH /api/products/[id] ──────────────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as Partial<ProductFormInput> & { active?: boolean };
  const today = new Date().toISOString().slice(0, 10);

  // Mock-only: echo update without persistence
  return NextResponse.json({
    data: {
      id,
      name: body.name?.trim() ?? id,
      kind: body.kind ?? "LOAN",
      active: body.active ?? true,
      min_amount: body.minAmount ?? 0,
      max_amount: body.maxAmount ?? 0,
      min_interest_rate: body.minInterestRate ?? 0,
      max_interest_rate: body.maxInterestRate ?? 0,
      product_type: body.productType ?? null,
      overdraft_allowed: body.overdraftAllowed ?? false,
      overdraft_limit: body.overdraftLimit ?? 0,
      interest_rate_settings: body.interestRateSettings ?? "FIXED",
      loan_type_code: body.loanTypeCode ?? null,
      payment_method: body.paymentMethod ?? "EQUATED_INSTALLMENTS",
      grace_period_installments: body.gracePeriodInstallments ?? 0,
      max_installments: body.maxInstallments ?? 12,
      repayment_frequency: body.repaymentFrequency ?? "MONTHLY",
      collateral_required: body.collateralRequired ?? false,
      updated_at: today,
    },
  });
}

// ── DELETE /api/products/[id] ─────────────────────────────────
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  void id;
  return NextResponse.json({ ok: true });
}
