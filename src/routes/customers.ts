import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { allowRoles, requireAuth } from '../middleware/auth.js';
import type { AuthRequest } from '../types.js';

export const customersRouter = Router();
customersRouter.use(requireAuth);
const writeRoles = allowRoles('ADMIN', 'OFFICE', 'PROJECT_MANAGER');
const schema = z.object({
  customerNumber: z.string().min(1).max(30),
  name: z.string().min(2).max(200),
  contactName: z.string().max(200).optional(),
  email: z.union([z.email(), z.literal('')]).optional(),
  phone: z.string().max(50).optional(),
  billingAddress: z.string().max(500).optional()
});

customersRouter.get('/', async (req: AuthRequest, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const customers = await prisma.customer.findMany({
    where: { companyId: req.auth!.companyId, ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { customerNumber: { contains: q, mode: 'insensitive' } }, { contactName: { contains: q, mode: 'insensitive' } }] } : {}) },
    orderBy: { name: 'asc' }
  });
  res.json(customers);
});

customersRouter.post('/', writeRoles, async (req: AuthRequest, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Bitte Kundendaten prüfen.' });
  try {
    const customer = await prisma.customer.create({ data: { ...parsed.data, email: parsed.data.email || null, companyId: req.auth!.companyId } });
    res.status(201).json(customer);
  } catch { res.status(409).json({ error: 'Kundennummer bereits vorhanden.' }); }
});

customersRouter.put('/:id', writeRoles, async (req: AuthRequest, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Bitte Kundendaten prüfen.' });
  const existing = await prisma.customer.findFirst({ where: { id: req.params.id, companyId: req.auth!.companyId } });
  if (!existing) return res.status(404).json({ error: 'Kunde nicht gefunden.' });
  const customer = await prisma.customer.update({ where: { id: existing.id }, data: { ...parsed.data, email: parsed.data.email || null } });
  res.json(customer);
});

customersRouter.delete('/:id', allowRoles('ADMIN'), async (req: AuthRequest, res) => {
  const existing = await prisma.customer.findFirst({ where: { id: req.params.id, companyId: req.auth!.companyId }, include: { _count: { select: { projects: true } } } });
  if (!existing) return res.status(404).json({ error: 'Kunde nicht gefunden.' });
  if (existing._count.projects > 0) return res.status(409).json({ error: 'Kunde besitzt Baustellen und kann nicht gelöscht werden.' });
  await prisma.customer.delete({ where: { id: existing.id } });
  res.status(204).end();
});
