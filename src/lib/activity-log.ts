export async function logSystemActivity(_input: {
  actor?: string;
  action: string;
  module: string;
  affectedItemName?: string | null;
  affectedItemId?: string | null;
  affectedClientName?: string | null;
  affectedClientId?: string | null;
  branchId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  // No-op: Supabase removido; la UI usa mocks locales.
}
