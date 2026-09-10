export enum LoanTransactionType {
  DISBURSEMENT = "DISBURSEMENT",
  REPAYMENT = "REPAYMENT",
  INTEREST_APPLIED = "INTEREST_APPLIED",
  FEE_APPLIED = "FEE_APPLIED",
  ADJUSTMENT = "ADJUSTMENT",
  REPAYMENT_ADJUSTMENT = "REPAYMENT_ADJUSTMENT",
}

export enum LoanTransactionStatus {
  ENTERED = "ENTERED",
  PENDING = "PENDING",
  REVERSED = "REVERSED",
}

export interface LoanTransaction {
  id: string;
  creationDate: string;
  productId: string;
  productName: string;
  type: LoanTransactionType;
  amount: number;
  balance: number;
  accountId: string;
  accountHolder: string;
  status: LoanTransactionStatus;
  user: string;
}
