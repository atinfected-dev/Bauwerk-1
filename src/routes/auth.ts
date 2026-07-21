import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import type { AuthRequest } from '../types.js';

export const authRouter = Router();
const loginSchema = z.object({ email: z.email(), password: z.string().min(8) });

function publicUser(user: { id: string; email: string; firstName: string; lastName: string; role: string }) {
  return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role };
}

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Ungültige Anmeldedaten.' });
  const user = await prisma.user.findFirst({ where: { email: parsed.data.email.toLowerCase(), active: true }, include: { company: true } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return res.status(401).json({ error: 'E-Mail oder Passwort falsch.' });
  const token = jwt.sign({ userId: user.id, companyId: user.companyId, role: user.role, email: user.email }, process.env.JWT_SECRET || 'development-only-secret', { expiresIn: '8h' });
  res.cookie('bauwerk_token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 8 * 60 * 60 * 1000 });
  res.json({ user: publicUser(user), company: { id: user.company.id, name: user.company.name } });
});

authRouter.post('/logout', (_req, res) => { res.clearCookie('bauwerk_token'); res.status(204).end(); });
authRouter.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findFirst({ where: { id: req.auth!.userId, companyId: req.auth!.companyId, active: true }, include: { company: true } });
  if (!user) return res.status(401).json({ error: 'Benutzer nicht gefunden.' });
  res.json({ user: publicUser(user), company: { id: user.company.id, name: user.company.name } });
});
