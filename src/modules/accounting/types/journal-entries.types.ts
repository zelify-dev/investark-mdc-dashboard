export type JournalEntryRow = {
  id: string;
  entryId: number;
  bookingDate: string;
  transactionId: number;
  glAccountName: string;
  /** Importe en la columna débito (USD); null si no aplica. */
  debit: number | null;
  /** Importe en la columna crédito (USD); null si no aplica. */
  credit: number | null;
};
