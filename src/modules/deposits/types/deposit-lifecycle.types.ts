export type DepositState =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "ACTIVE"
  | "DORMANT"
  | "BEGIN_MATURITY_PERIOD"
  | "MATURED"
  | "CLOSED"
  | "WRITTEN_OFF";

export type DepositAccount = {
  id: string;
  productTypeId: string;
  productCode: string;
  productName: string;
  holderKind: "INDIVIDUAL" | "COMPANY";
  holderId: string;
  holderName: string;
  state: DepositState;
  balance: number;
  availableBalance: number;
  overdraftLimit: number;
  isDormant: boolean;
  dormantAfterDays: number;
  allowInterestAccrual: boolean;
  interestBaseMethod: string;
  daysConvention: string;
  rateMode: "FIXED" | "INDEXED" | "TIERED";
  nominalRate: number;
  withholdingTaxPct: number;
  overdraftInterestRate: number;
  minTxAmount: number;
  maxWithdrawalAmount: number;
  recommendedDepositAmount: number | null;
};

export type DepositTransaction = {
  id: string;
  depositAccountId: string;
  txType: string;
  txDate: string;
  channel: string | null;
  amount: number;
  relatedAccountId: string | null;
  relatedLoanId: string | null;
  note: string | null;
  auditReason: string | null;
};

export type DepositHold = {
  id: string;
  depositAccountId: string;
  merchantName: string;
  amount: number;
  status: "HELD" | "RELEASED";
};
