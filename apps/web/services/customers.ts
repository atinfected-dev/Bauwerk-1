import { api } from "@/lib/api";
import type { Customer, CustomerPayload } from "@/types/customer";

export async function getCustomers(search = ""): Promise<Customer[]> {
  const response = await api.get<Customer[]>("/customers", {
    params: search ? { q: search } : undefined,
  });

  return response.data;
}

export async function createCustomer(
  payload: CustomerPayload,
): Promise<Customer> {
  const response = await api.post<Customer>("/customers", payload);
  return response.data;
}

export async function updateCustomer(
  id: string,
  payload: CustomerPayload,
): Promise<Customer> {
  const response = await api.put<Customer>(`/customers/${id}`, payload);
  return response.data;
}

export async function deleteCustomer(id: string): Promise<void> {
  await api.delete(`/customers/${id}`);
}
