export enum GroupState {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  BLACKLISTED = "BLACKLISTED",
}

export type CompanyType = "EMPRESA" | "SOLIDARIO" | "MANCOMUNADO";
export type KybStatus = "NOT_STARTED" | "PENDING" | "VERIFIED" | "REJECTED";
export type MemberKycStatus = "NOT_STARTED" | "PENDING" | "VERIFIED" | "REJECTED";
export type MemberAmlStatus = "NOT_STARTED" | "CLEAR" | "REVIEW" | "BLOCKED";

export interface CompanyMember {
  id: string;
  name: string;
  roleName: string;
  kycStatus?: MemberKycStatus;
  amlStatus?: MemberAmlStatus;
}

export interface Group {
  id: string;
  name: string;
  groupType: CompanyType;
  kybStatus?: KybStatus;
  assignedBranch: string;
  createdAt: string;
  state: GroupState;
  membersCount: number;
  lastModified: string;
  members?: CompanyMember[];
  email?: string;
  mobilePhone?: string;
}

export type GroupView = 
  | "all-groups" 
  | "active-loans" 
  | "active-deposits" 
  | "sin-cuentas-activas" 
  | "sin-miembros";
