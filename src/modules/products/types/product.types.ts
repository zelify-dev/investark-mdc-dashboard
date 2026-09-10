export type ProductKind = "DEPOSIT" | "LOAN";

// ─────────────────────────────────────────────
// Loan product type codes
// ─────────────────────────────────────────────
export type LoanProductTypeCode =
  | "FIXED_TERM_LOAN"
  | "DYNAMIC_TERM_LOAN"
  | "REVOLVING_CREDIT"
  | "TRANCHED_LOAN"
  | "DYNAMIC_MORTGAGE";

// ─────────────────────────────────────────────
// Deposit product type codes
// ─────────────────────────────────────────────
export type DepositProductTypeCode =
  | "SAVINGS_ACCOUNT"
  | "CURRENT_ACCOUNT"
  | "FIXED_DEPOSIT"
  | "SAVINGS_PLAN"
  | "STORED_VALUE_WALLET";

/** @deprecated Use LoanProductTypeCode or DepositProductTypeCode */
export type DepositProductType = DepositProductTypeCode;

// ─────────────────────────────────────────────
// Payment methods
// ─────────────────────────────────────────────
export type LoanPaymentMethod = "EQUATED_INSTALLMENTS" | "DECLINING_BALANCE";
export type LoanPaymentSubtype =
  | "STANDARD_PAYMENTS"
  | "BALLOON_PAYMENTS"
  | "OPTIMIZED_PAYMENTS"
  | "PAYMENT_PLAN";

export type RepaymentFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

// ─────────────────────────────────────────────
// Product categories
// ─────────────────────────────────────────────
export type ProductCategoryId =
  | "PERSONAL_BANKING"
  | "BUSINESS_BANKING"
  | "PERSONAL_DEPOSITS"
  | "BUSINESS_DEPOSITS"
  | "STORED_VALUE"
  | "PERSONAL_LENDING"
  | "BUSINESS_LENDING"
  | "MICROFINANCE"
  | "MORTGAGES"
  | "PURCHASE_FINANCE"
  | "UNCATEGORIZED";

export type ProductCategory = {
  id: ProductCategoryId;
  name: string;
  description: string;
  applies_to: "LOAN" | "DEPOSIT" | "BOTH";
  sort_order: number;
};

// ─────────────────────────────────────────────
// Product type definition (catalog entry in DB)
// ─────────────────────────────────────────────
export type ProductTypeDefinition = {
  id: LoanProductTypeCode | DepositProductTypeCode;
  name: string;
  code: string;
  kind: ProductKind;
  description: string | null;
  badge: string | null;
  features: string[] | null;
  subtype_of: string | null;
  is_active: boolean;
  sort_order: number;
  updated_at: string;
};

// ─────────────────────────────────────────────
// Product instances (user-created)
// ─────────────────────────────────────────────
export type BaseProduct = {
  id: string;
  name: string;
  kind: ProductKind;
  active: boolean;
  minAmount: number;
  maxAmount: number;
  minInterestRate: number;
  maxInterestRate: number;
  updatedAt: string;
};

export type DepositProduct = BaseProduct & {
  kind: "DEPOSIT";
  productType: DepositProductTypeCode;
  overdraftAllowed: boolean;
  overdraftLimit: number;
  interestRateSettings: "FIXED" | "TIERED";
};

export type LoanProduct = BaseProduct & {
  kind: "LOAN";
  loanTypeCode?: LoanProductTypeCode;
  paymentMethod: LoanPaymentMethod;
  gracePeriodInstallments: number;
  maxInstallments: number;
  repaymentFrequency: RepaymentFrequency;
  collateralRequired: boolean;
};

export type Product = DepositProduct | LoanProduct;

export type ProductFormInput = {
  id?: string;
  name: string;
  kind: ProductKind;
  minAmount: number;
  maxAmount: number;
  minInterestRate: number;
  maxInterestRate: number;
  // deposit
  productType?: DepositProductTypeCode;
  overdraftAllowed?: boolean;
  overdraftLimit?: number;
  interestRateSettings?: "FIXED" | "TIERED";
  // loan
  loanTypeCode?: LoanProductTypeCode;
  paymentMethod?: LoanPaymentMethod;
  gracePeriodInstallments?: number;
  maxInstallments?: number;
  repaymentFrequency?: RepaymentFrequency;
  collateralRequired?: boolean;
};
