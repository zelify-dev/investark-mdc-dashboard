import { Customer } from '../types/customer.types';

export const customersService = {
  getCustomers: async (): Promise<Customer[]> => {
    const response = await fetch("/api/customers", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = (await response.json()) as { data: Customer[] };
    return json.data ?? [];
  },
  createCustomer: async (customer: Customer): Promise<Customer> => {
    const response = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customer),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = (await response.json()) as { data: Customer };
    return json.data;
  },
  updateCustomer: async (id: string, customer: Customer): Promise<Customer> => {
    const response = await fetch(`/api/customers/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customer),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = (await response.json()) as { data: Customer };
    return json.data;
  },
  deleteCustomer: async (id: string): Promise<void> => {
    const response = await fetch(`/api/customers/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  },
};
