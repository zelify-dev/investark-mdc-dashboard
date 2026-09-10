export type BranchStatus = "ACTIVE" | "INACTIVE";
export type BranchType = "PRINCIPAL" | "SECUNDARIA";
export type BranchUserRole = "CREDIT_OFFICER" | "BRANCH_MANAGER" | "OPERATIONS" | "TELLER";

export type Centre = {
  id: string;
  branchId: string;
  name: string;
  meetingDay: string;
  meetingPlace: string;
  status: BranchStatus;
};

export type BranchPortfolio = {
  branchId: string;
  activeLoans: number;
  totalDeposits: number;
  assignedCustomers: number;
  delinquencyRate: number;
  glReportLabel: string;
};

export type BranchUser = {
  id: string;
  branchId: string;
  fullName: string;
  roleName: BranchUserRole;
  email: string | null;
  transactionsBranch: string;
};

export type Branch = {
  id: string;
  organizationId: string;
  name: string;
  status: BranchStatus;
  type?: BranchType;
  isPrincipal?: boolean;
  region: string;
  address: string | null;
  colonia: string | null;
  latitude: number | null;
  longitude: number | null;
  centres: Centre[];
  portfolio: BranchPortfolio | null;
  users: BranchUser[];
};

export type BranchesPayload = {
  organization: { id: string; name: string } | null;
  branches: Branch[];
};

export type BranchFormData = {
  organizationId: string;
  name: string;
  address: string;
  colonia: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  status: BranchStatus;
  type?: BranchType;
  isPrincipal?: boolean;
};
