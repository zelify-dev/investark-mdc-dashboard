export type SystemActivityRow = {
  id: string;
  created_at: string;
  actor: string;
  action: string;
  module: string;
  affected_item_name: string | null;
  affected_item_id: string | null;
  affected_client_name: string | null;
  affected_client_id: string | null;
  branch_id: string | null;
};
