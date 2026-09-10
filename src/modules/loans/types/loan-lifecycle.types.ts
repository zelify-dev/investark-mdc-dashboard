export type LoanLifecycleState =
  | "PARTIAL_APPLICATION"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "ACTIVE"
  | "ACTIVE_IN_ARREARS"
  | "LOCKED"
  | "CLOSED"
  | "WRITTEN_OFF";

export type Loan = {
  id: string;
  productTypeId: string;
  productCode: string;
  productName: string;
  customerId: string;
  customerName: string;
  principalAmount: number;
  currency: string;
  lifecycleState: LoanLifecycleState;
  disbursementDate: string | null;
  disbursementChannel: string | null;
  expectedDisbursementDate: string | null;
  outstandingPrincipal: number;
  outstandingInterest: number;
  outstandingFees: number;
  outstandingPenalties: number;
  interestCalculationMethod: string;
  rateMode: "FIXED" | "INDEXED";
  nominalRate: number;
  indexName: string | null;
  spreadRate: number | null;
  reviewFrequency: string;
  accruedDaily: boolean;
  gracePeriodType: string | null;
  gracePeriodDays: number;
  arrearsCountingMethod: string;
  arrearsToleranceDays: number;
  arrearsTolerancePct: number;
  penaltyDailyRate: number;
  lockSuspendsAccrual: boolean;
  allocationMethod: "HORIZONTAL" | "VERTICAL";
  allocationPriority: string[];
};

export type LoanTranche = {
  id: string;
  loanId: string;
  trancheNo: number;
  expectedDate: string;
  disbursedDate: string | null;
  amount: number;
  disbursementChannel: string | null;
  status: "PLANNED" | "DISBURSED" | "CANCELLED";
};

export type LoanScheduleItem = {
  id: string;
  loanId: string;
  installmentNo: number;
  dueDate: string;
  principalDue: number;
  interestDue: number;
  feesDue: number;
  penaltiesDue: number;
  principalPaid: number;
  interestPaid: number;
  feesPaid: number;
  penaltiesPaid: number;
  status: "PAID" | "PARTIAL" | "DUE" | "OVERDUE";
};

export type LoanTransaction = {
  id: string;
  loanId: string;
  txType: string;
  txDate: string;
  channel: string | null;
  amountTotal: number;
  principalComponent: number;
  interestComponent: number;
  feesComponent: number;
  penaltiesComponent: number;
  relatedDepositAccount: string | null;
  notes: string | null;
  auditReason: string | null;
};

export type LoanProductDefinition = {
  id: string;
  name: string;
  code: string;
  badge: string | null;
  description: string | null;
  subtypeOf: string | null;
  isActive: boolean;
};
