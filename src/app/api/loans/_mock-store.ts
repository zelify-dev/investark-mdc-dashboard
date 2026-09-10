import { ClientState, type Customer } from "@/modules/customers/types/customer.types";
import { GroupState, type Group } from "@/modules/groups/types/group.types";
import type {
  Loan,
  LoanLifecycleState,
  LoanProductDefinition,
  LoanScheduleItem,
  LoanTransaction,
  LoanTranche,
} from "@/modules/loans/types/loan-lifecycle.types";
import type { ProductTypeDefinitionRow } from "@/app/api/product-type-definitions/route";
import { LOAN_BASELINE, SCHEDULE_BASELINE, TRANSACTION_BASELINE, TRANCHE_BASELINE } from "./_demo-seed";

type LoanMockState = {
  loans: Loan[];
  schedules: LoanScheduleItem[];
  transactions: LoanTransaction[];
  tranches: LoanTranche[];
  productTypes: ProductTypeDefinitionRow[];
  customers: Customer[];
  groups: Group[];
};

const LOAN_PRODUCT_TYPES: ProductTypeDefinitionRow[] = [
  {
    id: "loan-type-fixed-term",
    name: "Préstamo a Plazo Fijo",
    code: "FIXED_TERM_LOAN",
    kind: "LOAN",
    description: "Crédito amortizable con calendario fijo de pagos.",
    badge: "Core",
    features: ["Plazo fijo", "Amortización mensual"],
    subtype_of: null,
    is_active: true,
    sort_order: 1,
    updated_at: "2026-06-24",
  },
  {
    id: "loan-type-revolving",
    name: "Crédito revolvente",
    code: "REVOLVING_CREDIT",
    kind: "LOAN",
    description: "Línea rotativa para capital de trabajo.",
    badge: "Empresarial",
    features: ["Disponibilidad flexible", "Renovación"],
    subtype_of: null,
    is_active: true,
    sort_order: 2,
    updated_at: "2026-06-24",
  },
  {
    id: "loan-type-auto",
    name: "Crédito automotriz",
    code: "AUTO_EV_01",
    kind: "LOAN",
    description: "Financiamiento vehicular.",
    badge: "Retail",
    features: ["Vehículo nuevo", "Plazo medio"],
    subtype_of: null,
    is_active: true,
    sort_order: 3,
    updated_at: "2026-06-24",
  },
];

const CUSTOMER_BASELINE: Customer[] = [
  { id: "CU-100001", fullName: "Andrea Molina", email: "andrea.molina@gmail.com", mobilePhone: "+52 55 0001 0001", documentType: "INE", documentNumber: "AMO100001", state: ClientState.ACTIVE, birthDate: "1991-04-12", lastModified: "2026-06-24", kycStatus: "VERIFIED", amlStatus: "CLEAR" },
  { id: "CU-894293", fullName: "José Arevalo", email: "jose.arevalo894293@gmail.com", mobilePhone: "+52 55 0002 0002", documentType: "INE", documentNumber: "JAR894293", state: ClientState.ACTIVE, birthDate: "1990-11-08", lastModified: "2026-06-24", kycStatus: "VERIFIED", amlStatus: "CLEAR" },
  { id: "CU-552210", fullName: "Vicente Narvaez", email: "vicente.narvaez@gmail.com", mobilePhone: "+52 55 0003 0003", documentType: "INE", documentNumber: "VNA552210", state: ClientState.PENDING, birthDate: "1988-09-20", lastModified: "2026-06-24", kycStatus: "PENDING", amlStatus: "REVIEW" },
  { id: "CU-417420", fullName: "Jose Luis Romero", email: "jose.romero417420@gmail.com", mobilePhone: "+52 55 0004 0004", documentType: "INE", documentNumber: "JRO417420", state: ClientState.ACTIVE, birthDate: "1987-01-10", lastModified: "2026-06-24", kycStatus: "VERIFIED", amlStatus: "CLEAR" },
  { id: "CU-479948", fullName: "Juan Hernandez", email: "juan.hernandez479948@gmail.com", mobilePhone: "+52 55 0005 0005", documentType: "INE", documentNumber: "JHE479948", state: ClientState.ACTIVE, birthDate: "1992-06-15", lastModified: "2026-06-24", kycStatus: "VERIFIED", amlStatus: "CLEAR" },
  { id: "CU-443177", fullName: "Ana Sofía Ramírez", email: "ana.ramirez443177@gmail.com", mobilePhone: "+52 55 0006 0006", documentType: "INE", documentNumber: "ARA443177", state: ClientState.ACTIVE, birthDate: "1993-03-28", lastModified: "2026-06-24", kycStatus: "VERIFIED", amlStatus: "CLEAR" },
  { id: "CU-263818", fullName: "María Fernanda Torres", email: "maria.torres263818@gmail.com", mobilePhone: "+52 55 0007 0007", documentType: "INE", documentNumber: "MTO263818", state: ClientState.ACTIVE, birthDate: "1989-12-02", lastModified: "2026-06-24", kycStatus: "VERIFIED", amlStatus: "CLEAR" },
  { id: "CU-104110", fullName: "Luis Alberto García", email: "luis.garcia104110@gmail.com", mobilePhone: "+52 55 0008 0008", documentType: "INE", documentNumber: "LGA104110", state: ClientState.INACTIVE, birthDate: "1986-07-17", lastModified: "2026-06-24", kycStatus: "PENDING", amlStatus: "REVIEW" },
];

const GROUP_BASELINE: Group[] = [
  {
    id: "GRP-DELTA-001",
    name: "GRUPO DELTA INDUSTRIAL SA DE CV",
    groupType: "EMPRESA",
    kybStatus: "VERIFIED",
    assignedBranch: "CDMX-CORP",
    createdAt: "2026-06-24",
    state: GroupState.ACTIVE,
    membersCount: 2,
    lastModified: "2026-06-24",
    email: "tesoreria@grupodelta.mx",
    mobilePhone: "+52 55 8800 1000",
    members: [
      { id: "CU-479948", name: "Juan Hernandez", roleName: "Representante legal", kycStatus: "VERIFIED", amlStatus: "CLEAR" },
      { id: "CU-443177", name: "Ana Sofía Ramírez", roleName: "Apoderada", kycStatus: "VERIFIED", amlStatus: "CLEAR" },
    ],
  },
  {
    id: "GRP-OPS-002",
    name: "Operadora Centro Logístico SA de CV",
    groupType: "EMPRESA",
    kybStatus: "PENDING",
    assignedBranch: "MTY-EMP",
    createdAt: "2026-06-20",
    state: GroupState.PENDING_APPROVAL,
    membersCount: 1,
    lastModified: "2026-06-24",
    email: "finanzas@centrologistico.mx",
    mobilePhone: "+52 81 7700 2000",
    members: [
      { id: "CU-552210", name: "Vicente Narvaez", roleName: "Socio", kycStatus: "PENDING", amlStatus: "REVIEW" },
    ],
  },
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildInitialState(): LoanMockState {
  return {
    loans: LOAN_BASELINE.map<Loan>((loan, index) => ({
      id: loan.id,
      productTypeId: LOAN_PRODUCT_TYPES[index % LOAN_PRODUCT_TYPES.length]?.id ?? LOAN_PRODUCT_TYPES[0].id,
      productCode: LOAN_PRODUCT_TYPES[index % LOAN_PRODUCT_TYPES.length]?.code ?? LOAN_PRODUCT_TYPES[0].code,
      productName: LOAN_PRODUCT_TYPES[index % LOAN_PRODUCT_TYPES.length]?.name ?? LOAN_PRODUCT_TYPES[0].name,
      customerId: loan.customerId,
      customerName: loan.customerName,
      principalAmount: loan.principalAmount,
      currency: loan.currency,
      lifecycleState: loan.lifecycleState as LoanLifecycleState,
      disbursementDate: loan.disbursementDate,
      disbursementChannel: loan.disbursementChannel,
      expectedDisbursementDate: loan.expectedDisbursementDate,
      outstandingPrincipal: loan.outstandingPrincipal,
      outstandingInterest: loan.outstandingInterest,
      outstandingFees: loan.outstandingFees,
      outstandingPenalties: loan.outstandingPenalties,
      interestCalculationMethod: loan.interestCalculationMethod,
      rateMode: loan.rateMode,
      nominalRate: loan.nominalRate,
      indexName: loan.indexName,
      spreadRate: loan.spreadRate,
      reviewFrequency: loan.reviewFrequency,
      accruedDaily: loan.accruedDaily,
      gracePeriodType: loan.gracePeriodType,
      gracePeriodDays: loan.gracePeriodDays,
      arrearsCountingMethod: loan.arrearsCountingMethod,
      arrearsToleranceDays: loan.arrearsToleranceDays,
      arrearsTolerancePct: loan.arrearsTolerancePct,
      penaltyDailyRate: loan.penaltyDailyRate,
      lockSuspendsAccrual: loan.lockSuspendsAccrual,
      allocationMethod: loan.allocationMethod,
      allocationPriority: loan.allocationPriority,
    })),
    schedules: SCHEDULE_BASELINE.map((item) => ({
      id: item.id,
      loanId: item.loan_id,
      installmentNo: item.installment_no,
      dueDate: item.due_date,
      principalDue: item.principal_due,
      interestDue: item.interest_due,
      feesDue: item.fees_due,
      penaltiesDue: item.penalties_due,
      principalPaid: item.principal_paid,
      interestPaid: item.interest_paid,
      feesPaid: item.fees_paid,
      penaltiesPaid: item.penalties_paid,
      status: item.status,
    })),
    transactions: TRANSACTION_BASELINE.map((item) => ({
      id: item.id,
      loanId: item.loan_id,
      txType: item.tx_type,
      txDate: item.tx_date,
      channel: item.channel,
      amountTotal: item.amount_total,
      principalComponent: item.principal_component,
      interestComponent: item.interest_component,
      feesComponent: item.fees_component,
      penaltiesComponent: item.penalties_component,
      relatedDepositAccount: item.related_deposit_account,
      notes: item.notes,
      auditReason: item.audit_reason,
    })),
    tranches: TRANCHE_BASELINE.map((item) => ({
      id: item.id,
      loanId: item.loan_id,
      trancheNo: item.tranche_no,
      expectedDate: item.expected_date,
      disbursedDate: item.disbursed_date,
      amount: item.amount,
      disbursementChannel: item.disbursement_channel,
      status: item.status,
    })),
    productTypes: clone(LOAN_PRODUCT_TYPES),
    customers: clone(CUSTOMER_BASELINE),
    groups: clone(GROUP_BASELINE),
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __zelifyLoanMockState__: LoanMockState | undefined;
}

function getStore(): LoanMockState {
  if (!globalThis.__zelifyLoanMockState__) {
    globalThis.__zelifyLoanMockState__ = buildInitialState();
  }
  return globalThis.__zelifyLoanMockState__;
}

export function getLoanMockState(): LoanMockState {
  return getStore();
}

export function createMockLoan(payload: {
  id: string;
  productTypeId: string;
  customerId: string;
  customerName: string;
  principalAmount: number;
  expectedDisbursementDate: string;
  nominalRate: number;
  disbursementChannel: string;
}) {
  const store = getStore();
  const product = store.productTypes.find((item) => item.id === payload.productTypeId) ?? store.productTypes[0];
  const loan: Loan = {
    id: payload.id,
    productTypeId: product.id,
    productCode: product.code,
    productName: product.name,
    customerId: payload.customerId,
    customerName: payload.customerName,
    principalAmount: payload.principalAmount,
    currency: "MXN",
    lifecycleState: "PARTIAL_APPLICATION",
    disbursementDate: null,
    disbursementChannel: payload.disbursementChannel,
    expectedDisbursementDate: payload.expectedDisbursementDate,
    outstandingPrincipal: payload.principalAmount,
    outstandingInterest: 0,
    outstandingFees: 0,
    outstandingPenalties: 0,
    interestCalculationMethod: "DECLINING_BALANCE",
    rateMode: "FIXED",
    nominalRate: payload.nominalRate,
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
  store.loans.unshift(loan);
  return loan;
}

export function updateMockLoanState(loanId: string, updater: (loan: Loan) => Loan): Loan | null {
  const store = getStore();
  const index = store.loans.findIndex((item) => item.id === loanId);
  if (index < 0) return null;
  const next = updater(store.loans[index]);
  store.loans[index] = next;
  return next;
}

export function appendMockLoanTransaction(tx: LoanTransaction) {
  getStore().transactions.unshift(tx);
}

export function appendMockLoanTranche(tranche: LoanTranche) {
  getStore().tranches.push(tranche);
}

export function updateMockProductType(id: string, patch: Partial<ProductTypeDefinitionRow>) {
  const store = getStore();
  const index = store.productTypes.findIndex((item) => item.id === id);
  if (index < 0) return null;
  store.productTypes[index] = { ...store.productTypes[index], ...patch };
  return store.productTypes[index];
}

export function createMockProductType(row: ProductTypeDefinitionRow) {
  getStore().productTypes.push(row);
  return row;
}

