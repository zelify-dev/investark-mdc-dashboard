type LoanRowSeed = {
  id: string;
  customerId: string;
  customerName: string;
  principalAmount: number;
  currency: string;
  lifecycleState: string;
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

type LoanScheduleSeed = {
  id: string;
  loan_id: string;
  installment_no: number;
  due_date: string;
  principal_due: number;
  interest_due: number;
  fees_due: number;
  penalties_due: number;
  principal_paid: number;
  interest_paid: number;
  fees_paid: number;
  penalties_paid: number;
  status: "PAID" | "PARTIAL" | "DUE" | "OVERDUE";
};

type LoanTransactionSeed = {
  id: string;
  loan_id: string;
  tx_type: string;
  tx_date: string;
  channel: string | null;
  amount_total: number;
  principal_component: number;
  interest_component: number;
  fees_component: number;
  penalties_component: number;
  related_deposit_account: string | null;
  notes: string | null;
  audit_reason: string | null;
};

type LoanTrancheSeed = {
  id: string;
  loan_id: string;
  tranche_no: number;
  expected_date: string;
  disbursed_date: string | null;
  amount: number;
  disbursement_channel: string | null;
  status: "PLANNED" | "DISBURSED" | "CANCELLED";
};

function monthlyRate(rate: number) {
  return rate / 100 / 12;
}

function buildSchedule(loan: LoanRowSeed, installments = 12): LoanScheduleSeed[] {
  const principalSlice = Number((loan.principalAmount / installments).toFixed(2));
  const r = monthlyRate(loan.nominalRate);
  const dueDates = Array.from({ length: installments }).map((_, i) => {
    const base = new Date(loan.expectedDisbursementDate ?? "2026-06-15");
    base.setMonth(base.getMonth() + i + 1);
    return base.toISOString().slice(0, 10);
  });

  return dueDates.map((dueDate, i) => {
    const remainingBefore = loan.principalAmount - principalSlice * i;
    const interestDue = Number((remainingBefore * r).toFixed(2));
    const status: LoanScheduleSeed["status"] =
      i < 2 && loan.lifecycleState === "ACTIVE"
        ? "PAID"
        : i === 2 && loan.lifecycleState === "ACTIVE"
          ? "PARTIAL"
          : loan.lifecycleState === "ACTIVE_IN_ARREARS" && i < 3
            ? "OVERDUE"
            : "DUE";
    return {
      id: `${loan.id}-sch-${i + 1}`,
      loan_id: loan.id,
      installment_no: i + 1,
      due_date: dueDate,
      principal_due: principalSlice,
      interest_due: interestDue,
      fees_due: i === 0 ? 250 : 0,
      penalties_due: status === "OVERDUE" ? 180 : 0,
      principal_paid: status === "PAID" ? principalSlice : status === "PARTIAL" ? Number((principalSlice * 0.45).toFixed(2)) : 0,
      interest_paid: status === "PAID" ? interestDue : status === "PARTIAL" ? Number((interestDue * 0.5).toFixed(2)) : 0,
      fees_paid: status === "PAID" && i === 0 ? 250 : 0,
      penalties_paid: 0,
      status,
    };
  });
}

function buildTransactions(loan: LoanRowSeed): LoanTransactionSeed[] {
  return [
    {
      id: `${loan.id}-tx-1`,
      loan_id: loan.id,
      tx_type: "DISBURSEMENT",
      tx_date: loan.disbursementDate ?? loan.expectedDisbursementDate ?? "2026-06-15",
      channel: loan.disbursementChannel ?? "TRANSFERENCIA",
      amount_total: loan.principalAmount,
      principal_component: loan.principalAmount,
      interest_component: 0,
      fees_component: 0,
      penalties_component: 0,
      related_deposit_account: null,
      notes: "Desembolso inicial",
      audit_reason: "Originación",
    },
    {
      id: `${loan.id}-tx-2`,
      loan_id: loan.id,
      tx_type: "REPAYMENT",
      tx_date: "2026-07-15",
      channel: "CAJA",
      amount_total: 12500,
      principal_component: 9800,
      interest_component: 2450,
      fees_component: 250,
      penalties_component: 0,
      related_deposit_account: null,
      notes: "Pago de primera cuota",
      audit_reason: "Pago en ventanilla",
    },
    {
      id: `${loan.id}-tx-3`,
      loan_id: loan.id,
      tx_type: loan.lifecycleState === "ACTIVE_IN_ARREARS" ? "REPAYMENT_FROM_DEPOSIT" : "BULK_REPAYMENT",
      tx_date: "2026-08-15",
      channel: loan.lifecycleState === "ACTIVE_IN_ARREARS" ? "DEPOSIT_TRANSFER" : "BULK",
      amount_total: loan.lifecycleState === "ACTIVE_IN_ARREARS" ? 6400 : 18300,
      principal_component: loan.lifecycleState === "ACTIVE_IN_ARREARS" ? 4200 : 15100,
      interest_component: loan.lifecycleState === "ACTIVE_IN_ARREARS" ? 1800 : 2700,
      fees_component: 0,
      penalties_component: loan.lifecycleState === "ACTIVE_IN_ARREARS" ? 400 : 500,
      related_deposit_account: loan.lifecycleState === "ACTIVE_IN_ARREARS" ? "DEP-4410" : null,
      notes: loan.lifecycleState === "ACTIVE_IN_ARREARS" ? "Cargo desde depósito para regularización" : "Pago masivo aplicado",
      audit_reason: loan.lifecycleState === "ACTIVE_IN_ARREARS" ? "Cobranza preventiva" : "Pago corporativo",
    },
  ];
}

function buildTranches(loan: LoanRowSeed): LoanTrancheSeed[] {
  const half = Number((loan.principalAmount / 2).toFixed(2));
  return [
    {
      id: `${loan.id}-tr-1`,
      loan_id: loan.id,
      tranche_no: 1,
      expected_date: loan.expectedDisbursementDate ?? "2026-06-15",
      disbursed_date: loan.disbursementDate ?? "2026-06-15",
      amount: half,
      disbursement_channel: loan.disbursementChannel ?? "TRANSFERENCIA",
      status: "DISBURSED",
    },
    {
      id: `${loan.id}-tr-2`,
      loan_id: loan.id,
      tranche_no: 2,
      expected_date: "2026-07-15",
      disbursed_date: loan.lifecycleState === "ACTIVE" || loan.lifecycleState === "ACTIVE_IN_ARREARS" ? "2026-07-15" : null,
      amount: loan.principalAmount - half,
      disbursement_channel: loan.disbursementChannel ?? "TRANSFERENCIA",
      status: loan.lifecycleState === "ACTIVE" || loan.lifecycleState === "ACTIVE_IN_ARREARS" ? "DISBURSED" : "PLANNED",
    },
  ];
}

function baseLoan(id: string, customerId: string, customerName: string, amount: number, state: LoanRowSeed["lifecycleState"], channel: string | null, rate: number): LoanRowSeed {
  const active = state === "ACTIVE" || state === "ACTIVE_IN_ARREARS" || state === "LOCKED";
  return {
    id,
    customerId,
    customerName,
    principalAmount: amount,
    currency: "MXN",
    lifecycleState: state,
    disbursementDate: active ? "2026-06-15" : null,
    disbursementChannel: channel,
    expectedDisbursementDate: "2026-06-15",
    outstandingPrincipal: active ? Number((amount * 0.78).toFixed(2)) : amount,
    outstandingInterest: active ? Number((amount * 0.045).toFixed(2)) : 0,
    outstandingFees: active ? 250 : 0,
    outstandingPenalties: state === "ACTIVE_IN_ARREARS" ? 480 : 0,
    interestCalculationMethod: "DECLINING_BALANCE",
    rateMode: "FIXED",
    nominalRate: rate,
    indexName: null,
    spreadRate: null,
    reviewFrequency: "MONTHLY",
    accruedDaily: true,
    gracePeriodType: null,
    gracePeriodDays: 0,
    arrearsCountingMethod: "DAYS_PAST_DUE",
    arrearsToleranceDays: 3,
    arrearsTolerancePct: 5,
    penaltyDailyRate: 0.12,
    lockSuspendsAccrual: false,
    allocationMethod: "HORIZONTAL",
    allocationPriority: ["PENALTIES", "FEES", "INTEREST", "PRINCIPAL"],
  };
}

export const LOAN_BASELINE: LoanRowSeed[] = [
  baseLoan("LN-2026-0001", "CU-100001", "Andrea Molina", 120000, "PENDING_APPROVAL", null, 22.5),
  baseLoan("LN-2026-0002", "CU-894293", "José Arevalo", 200000, "PARTIAL_APPLICATION", "CAJA", 21.9),
  baseLoan("LN-2026-0003", "CU-552210", "Vicente Narvaez", 200000, "PENDING_APPROVAL", "CAJA", 23.4),
  baseLoan("LN-2026-0004", "CU-417420", "Jose Luis Romero", 85000, "APPROVED", "TRANSFERENCIA", 24.1),
  baseLoan("LN-2026-0005", "CU-479948", "Juan Hernandez", 315000, "ACTIVE", "SPEI", 18.6),
  baseLoan("LN-2026-0006", "CU-443177", "Ana Sofía Ramírez", 275000, "ACTIVE_IN_ARREARS", "SPEI", 19.4),
  baseLoan("LN-2026-0007", "CU-263818", "María Fernanda Torres", 98000, "ACTIVE", "CAJA", 20.8),
  baseLoan("LN-2026-0008", "CU-104110", "Luis Alberto García", 150000, "LOCKED", "TRANSFERENCIA", 21.2),
];

export const SCHEDULE_BASELINE = LOAN_BASELINE.flatMap((loan) => buildSchedule(loan, 12));
export const TRANSACTION_BASELINE = LOAN_BASELINE.flatMap((loan) => buildTransactions(loan));
export const TRANCHE_BASELINE = LOAN_BASELINE.flatMap((loan) => buildTranches(loan));
