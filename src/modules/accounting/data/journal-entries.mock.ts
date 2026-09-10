import type { JournalEntryRow } from "../types/journal-entries.types";

/** Total registros (referencia Figma: “1 – 50 of 869”). */
export const JOURNAL_ENTRIES_TOTAL = 869;

const GL_NAMES = [
  "Bank Loan Payable",
  "Transaction Deposit",
  "Sales Revenue - Products",
  "Interest Expense",
  "Cash at Bank",
  "Accounts Receivable",
  "Fee Income",
];

export function getJournalEntriesSlice(page: number, pageSize: number): JournalEntryRow[] {
  const start = (page - 1) * pageSize;
  const out: JournalEntryRow[] = [];
  for (let i = 0; i < pageSize && start + i < JOURNAL_ENTRIES_TOTAL; i++) {
    const idx = start + i;
    const entryId = 400 + idx;
    const transactionId = 700 + idx;
    const day = 1 + (idx % 28);
    const month = 1 + (idx % 12);
    const bookingDate = `${String(day).padStart(2, "0")}-${String(month).padStart(2, "0")}-2025`;
    const glAccountName = GL_NAMES[idx % GL_NAMES.length];
    const amount = 500 + (idx % 50) * 100;
    const dollars = amount / 100;
    const useDebit = idx % 3 !== 0;

    out.push({
      id: `je-${idx + 1}`,
      entryId,
      bookingDate,
      transactionId,
      glAccountName,
      debit: useDebit ? dollars : null,
      credit: useDebit ? null : dollars,
    });
  }
  return out;
}
