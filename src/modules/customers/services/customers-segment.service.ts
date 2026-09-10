import { MOCK_BLACKLIST_CUSTOMERS } from "../data/blacklist-customers.mock";
import { MOCK_INACTIVE_CUSTOMERS } from "../data/inactive-customers.mock";
import type { BlacklistCustomerRow } from "../types/customer-segment.types";
import type { InactiveCustomerRow } from "../types/customer-segment.types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const customersSegmentService = {
  getInactiveCustomers: async (): Promise<InactiveCustomerRow[]> => {
    await delay(450);
    return [...MOCK_INACTIVE_CUSTOMERS];
  },

  getBlacklistCustomers: async (): Promise<BlacklistCustomerRow[]> => {
    await delay(450);
    return [...MOCK_BLACKLIST_CUSTOMERS];
  },
};
