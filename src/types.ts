import type { Request } from 'express';
export type AuthUser = { userId: string; companyId: string; role: string; email: string };
export type AuthRequest = Request & { auth?: AuthUser };
