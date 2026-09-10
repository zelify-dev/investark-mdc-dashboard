export type DepositHolderType = "INDIVIDUAL" | "GROUP";

export type DepositAccountState =
  | "ACTIVE"
  | "PENDING_APPROVAL"
  | "LOCKED"
  | "CLOSED"
  | "BLOCKED";

export type DepositAccountHolder = {
  name: string;
  type: DepositHolderType;
  avatar: string;
};

export type DepositBalances = {
  total: number;
  available: number;
  hold: number;
};

export type DepositAccountRow = {
  id: string;
  holder: DepositAccountHolder;
  productKey: string;
  balances: DepositBalances;
  interestRate: string;
  state: DepositAccountState;
  lastMovement: string;
  branchKey: string;
};

export type DepositsKpiSnapshot = {
  totalVolume: number;
  totalVolumeTrendLabel: string;
  activeAccounts: number;
  activeAccountsMeta: string;
  totalHolds: number;
  holdsMeta: string;
  interestAccrued: number;
  interestCutDate: string;
};
