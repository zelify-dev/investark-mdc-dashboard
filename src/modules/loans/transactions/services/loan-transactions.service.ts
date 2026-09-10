import { 
  LoanTransaction, 
  LoanTransactionType, 
  LoanTransactionStatus 
} from "../types/loan-transaction.types";

const MOCK_TRANSACTIONS: LoanTransaction[] = [
  {
    id: "LT-001",
    creationDate: "2024-04-10T10:30:00Z",
    productId: "LP-DYN-001",
    productName: "Crédito Capital de Trabajo PYME",
    type: LoanTransactionType.DISBURSEMENT,
    amount: 5000.00,
    balance: 5000.00,
    accountId: "ACC-5521",
    accountHolder: "Roberto Gomez",
    status: LoanTransactionStatus.ENTERED,
    user: "Admin System",
  },
  {
    id: "LT-002",
    creationDate: "2024-04-12T15:20:00Z",
    productId: "LP-DYN-001",
    productName: "Crédito Capital de Trabajo PYME",
    type: LoanTransactionType.INTEREST_APPLIED,
    amount: 45.50,
    balance: 5045.50,
    accountId: "ACC-5521",
    accountHolder: "Roberto Gomez",
    status: LoanTransactionStatus.ENTERED,
    user: "System Job",
  },
  {
    id: "LT-003",
    creationDate: "2024-04-15T09:00:00Z",
    productId: "LP-DYN-001",
    productName: "Crédito Capital de Trabajo PYME",
    type: LoanTransactionType.REPAYMENT,
    amount: 250.00,
    balance: 4795.50,
    accountId: "ACC-5521",
    accountHolder: "Roberto Gomez",
    status: LoanTransactionStatus.ENTERED,
    user: "Branch Cashier",
  },
  {
    id: "LT-004",
    creationDate: "2024-04-18T11:45:00Z",
    productId: "LP-DYN-001",
    productName: "Crédito Capital de Trabajo PYME",
    type: LoanTransactionType.FEE_APPLIED,
    amount: 10.00,
    balance: 4805.50,
    accountId: "ACC-5521",
    accountHolder: "Roberto Gomez",
    status: LoanTransactionStatus.ENTERED,
    user: "System Job",
  },
  {
    id: "LT-005",
    creationDate: "2024-04-20T14:10:00Z",
    productId: "LP-GRP-002",
    productName: "Préstamo Solidario Mujeres Emprenden",
    type: LoanTransactionType.DISBURSEMENT,
    amount: 12000.00,
    balance: 12000.00,
    accountId: "ACC-8912",
    accountHolder: "Tech Solutions Corp",
    status: LoanTransactionStatus.PENDING,
    user: "Loan Officer",
  },
  {
    id: "LT-006",
    creationDate: "2024-04-21T08:30:00Z",
    productId: "LP-DYN-001",
    productName: "Crédito Capital de Trabajo PYME",
    type: LoanTransactionType.ADJUSTMENT,
    amount: -5.00,
    balance: 4800.50,
    accountId: "ACC-5521",
    accountHolder: "Roberto Gomez",
    status: LoanTransactionStatus.REVERSED,
    user: "Admin Supervisor",
  },
  {
    id: "LT-007",
    creationDate: "2024-04-22T16:00:00Z",
    productId: "LP-GRP-002",
    productName: "Préstamo Solidario Mujeres Emprenden",
    type: LoanTransactionType.REPAYMENT,
    amount: 1500.00,
    balance: 10500.00,
    accountId: "ACC-8912",
    accountHolder: "Tech Solutions Corp",
    status: LoanTransactionStatus.ENTERED,
    user: "Self Service Portal",
  },
];

export const loanTransactionsService = {
  getTransactions: async (): Promise<LoanTransaction[]> => {
    // Simulate network delay
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_TRANSACTIONS), 800);
    });
  },
};
