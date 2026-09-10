export type InactiveSubStatus = "INACTIVE" | "SUSPENDED" | "DORMANT" | "CLOSED";

export interface InactiveCustomerRow {
  id: string;
  fullName: string;
  subStatus: InactiveSubStatus;
  branch: string;
  centre: string;
  lastActivity: string;
  updatedAt: string;
  assignedOfficer: string;
}

export type BlacklistRiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface BlacklistCustomerRow {
  id: string;
  fullName: string;
  reason: string;
  riskLevel: BlacklistRiskLevel;
  status: string;
  branch: string;
  addedAt: string;
  reviewedBy: string;
}
