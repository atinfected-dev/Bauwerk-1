import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { allowRoles, requireAuth } from '../middleware/auth.js';
import type { AuthRequest } from '../types.js';

export const projectsRouter = Router();
projectsRouter.use(requireAuth);
const writeRoles = allowRoles('ADMIN', 'OFFICE', 'PROJECT_MANAGER');
const schema = z.object({
  projectNumber: z.string().min(1).max(30), customerId: z.uuid(), name: z.string().min(2).max(200),
  address: z.string().min(5).max(500), description: z.string().max(2000).optional(),
  status: z.enum(['PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'BILLED']).default('PLANNED')
});

projectsRouter.get('/', async (req: AuthRequest, res) => {
  const projects = await prisma.project.findMany({ where: { companyId: req.auth!.companyId }, include: { customer: true }, orderBy: { createdAt: 'desc' } });
  res.json(projects);
});
projectsRouter.post('/', writeRoles, async (req: AuthRequest, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Bitte Baustellendaten prüfen.' });
  const customer = await prisma.customer.findFirst({ where: { id: parsed.data.customerId, companyId: req.auth!.companyId } });
  if (!customer) return res.status(400).json({ error: 'Kunde gehört nicht zu diesem Betrieb.' });
  try {
    const project = await prisma.project.create({ data: { ...parsed.data, companyId: req.auth!.companyId }, include: { customer: true } });
    res.status(201).json(project);
  } catch { res.status(409).json({ error: 'Baustellennummer bereits vorhanden.' }); }
});
