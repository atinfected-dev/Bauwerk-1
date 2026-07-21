import type { Customer } from '@/types/customer';

export type ProjectStatus =
  | 'PLANNED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'BILLED';

export interface Project {
  id: string;
  projectNumber: string;
  customerId: string;
  customer: Customer;
  name: string;
  address: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPayload {
  projectNumber: string;
  customerId: string;
  name: string;
  address: string;
  description?: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
}
