import type { DepositAccountRow, DepositsKpiSnapshot } from "../types/deposit-account.types";

export const DEPOSITS_KPI: DepositsKpiSnapshot = {
  totalVolume: 24_580_900.5,
  totalVolumeTrendLabel: "+12%",
  activeAccounts: 1245,
  activeAccountsMeta: "48",
  totalHolds: 145_200,
  holdsMeta: "12",
  interestAccrued: 12_850.12,
  interestCutDate: "2026-04-19",
};

export const DEPOSIT_ACCOUNTS_MOCK: DepositAccountRow[] = [
  {
    id: "DEP-1020",
    holder: {
      name: "Sofía Valenzuela",
      type: "INDIVIDUAL",
      avatar: "",
    },
    productKey: "flex_savings",
    balances: {
      total: 15200.0,
      available: 14000.0,
      hold: 1200.0,
    },
    interestRate: "4.20%",
    state: "ACTIVE",
    lastMovement: "2026-04-19T14:20:00Z",
    branchKey: "quito_central",
  },
  {
    id: "DEP-4450",
    holder: {
      name: "Corporación Tecnológica S.A.",
      type: "GROUP",
      avatar: "",
    },
    productKey: "term_deposit",
    balances: {
      total: 500000.0,
      available: 500000.0,
      hold: 0.0,
    },
    interestRate: "8.50%",
    state: "PENDING_APPROVAL",
    lastMovement: "2026-04-18T09:00:00Z",
    branchKey: "gye_port",
  },
  {
    id: "DEP-8812",
    holder: {
      name: "Marco Antonio Solís",
      type: "INDIVIDUAL",
      avatar: "",
    },
    productKey: "payroll",
    balances: {
      total: 850.25,
      available: 0.0,
      hold: 850.25,
    },
    interestRate: "0.50%",
    state: "LOCKED",
    lastMovement: "2026-04-10T11:45:00Z",
    branchKey: "cuenca_sur",
  },
  {
    id: "DEP-2103",
    holder: {
      name: "Lucía Mendoza",
      type: "INDIVIDUAL",
      avatar: "",
    },
    productKey: "traditional",
    balances: {
      total: 3200.5,
      available: 3200.5,
      hold: 0,
    },
    interestRate: "3.10%",
    state: "ACTIVE",
    lastMovement: "2026-04-19T08:15:00Z",
    branchKey: "main",
  },
  {
    id: "DEP-5591",
    holder: {
      name: "Grupo Andino",
      type: "GROUP",
      avatar: "",
    },
    productKey: "term_deposit",
    balances: {
      total: 125000.0,
      available: 0,
      hold: 0,
    },
    interestRate: "7.25%",
    state: "CLOSED",
    lastMovement: "2026-03-01T16:00:00Z",
    branchKey: "north",
  },
];
