export interface Customer {
  id: string;
  customerNumber: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  billingAddress: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPayload {
  customerNumber: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  billingAddress?: string;
}
