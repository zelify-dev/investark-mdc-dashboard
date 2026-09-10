"use client";

import { type Customer as MockCustomer, mockCustomers } from "@/mocks/customers";
import { CustomerTable } from "@/modules/customers/components/customer-table";
import { ClientState, type Customer } from "@/modules/customers/types/customer.types";

export function CustomersTable() {
  const rows: Customer[] = mockCustomers.map(mockToListCustomer);
  return <CustomerTable customers={rows} />;
}

function mockToListCustomer(c: MockCustomer): Customer {
  return {
    id: c.id,
    fullName: c.fullName,
    state: mapMockStateToClientState(c.state),
    creditOfficer: c.creditOfficer,
    totalBalance: c.totalBalance,
    lastModified: c.lastModified,
    birthDate: c.personalInfo.birthDate,
  };
}

function mapMockStateToClientState(state: MockCustomer["state"]): ClientState {
  switch (state) {
    case "Active":
      return ClientState.ACTIVE;
    case "Inactive":
      return ClientState.INACTIVE;
    case "Blacklisted":
      return ClientState.BLACKLISTED;
    case "Pending Approval":
      return ClientState.PENDING;
    case "In Arrears":
      return ClientState.ACTIVE;
    default:
      return ClientState.ACTIVE;
  }
}
