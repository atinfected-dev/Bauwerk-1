export type UserRole =
  | "ADMIN"
  | "OFFICE"
  | "PROJECT_MANAGER"
  | "TECHNICIAN";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface Company {
  id: string;
  name: string;
}

export interface AuthResponse {
  user: AuthUser;
  company: Company;
}

export interface LoginPayload {
  email: string;
  password: string;
}
