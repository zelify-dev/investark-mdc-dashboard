export type CoaCategory = "all" | "assets" | "liabilities" | "equity" | "income" | "expenses";

export type ChartOfAccountRow = {
  id: string;
  glCode: string;
  accountName: string;
  type: string;
  usage: string;
  currency: string;
  inUse: boolean;
  manualEntriesAllowed: boolean;
  category: Exclude<CoaCategory, "all">;
  showDeleteAction?: boolean;
};
