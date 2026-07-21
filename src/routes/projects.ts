import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { allowRoles, requireAuth } from '../middleware/auth.js';
import type { AuthRequest } from '../types.js';

export const projectsRouter = Router();
projectsRouter.use(requireAuth);

const writeRoles = allowRoles('ADMIN', 'OFFICE', 'PROJECT_MANAGER');
const deleteRoles = allowRoles('ADMIN');

const projectStatusSchema = z.enum([
  'PLANNED',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'BILLED',
]);

const projectSchema = z.object({
  projectNumber: z.string().trim().min(1).max(30),
  customerId: z.uuid(),
  name: z.string().trim().min(2).max(200),
  address: z.string().trim().min(5).max(500),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  status: projectStatusSchema.default('PLANNED'),
  startDate: z.iso.date().optional().or(z.literal('')),
  endDate: z.iso.date().optional().or(z.literal('')),
});

function toDate(value?: string): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function routeId(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

projectsRouter.get('/', async (req: AuthRequest, res) => {
  const search = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const statusResult = projectStatusSchema.safeParse(req.query.status);

  const projects = await prisma.project.findMany({
    where: {
      companyId: req.auth!.companyId,
      ...(statusResult.success ? { status: statusResult.data } : {}),
      ...(search
        ? {
            OR: [
              { projectNumber: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
              { address: { contains: search, mode: 'insensitive' } },
              { customer: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json(projects);
});

projectsRouter.get('/:id', async (req: AuthRequest, res) => {
  const project = await prisma.project.findFirst({
    where: {
      id: routeId(req.params.id),
      companyId: req.auth!.companyId,
    },
    include: { customer: true },
  });

  if (!project) {
    return res.status(404).json({ error: 'Baustelle wurde nicht gefunden.' });
  }

  res.json(project);
});

projectsRouter.post('/', writeRoles, async (req: AuthRequest, res) => {
  const parsed = projectSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Bitte Baustellendaten prüfen.' });
  }

  const customer = await prisma.customer.findFirst({
    where: {
      id: parsed.data.customerId,
      companyId: req.auth!.companyId,
    },
  });

  if (!customer) {
    return res.status(400).json({ error: 'Kunde gehört nicht zu diesem Betrieb.' });
  }

  try {
    const project = await prisma.project.create({
      data: {
        companyId: req.auth!.companyId,
        customerId: parsed.data.customerId,
        projectNumber: parsed.data.projectNumber,
        name: parsed.data.name,
        address: parsed.data.address,
        description: parsed.data.description || null,
        status: parsed.data.status,
        startDate: toDate(parsed.data.startDate),
        endDate: toDate(parsed.data.endDate),
      },
      include: { customer: true },
    });

    res.status(201).json(project);
  } catch {
    res.status(409).json({ error: 'Baustellennummer bereits vorhanden.' });
  }
});

projectsRouter.put('/:id', writeRoles, async (req: AuthRequest, res) => {
  const parsed = projectSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Bitte Baustellendaten prüfen.' });
  }

  const existingProject = await prisma.project.findFirst({
    where: {
      id: routeId(req.params.id),
      companyId: req.auth!.companyId,
    },
  });

  if (!existingProject) {
    return res.status(404).json({ error: 'Baustelle wurde nicht gefunden.' });
  }

  const customer = await prisma.customer.findFirst({
    where: {
      id: parsed.data.customerId,
      companyId: req.auth!.companyId,
    },
  });

  if (!customer) {
    return res.status(400).json({ error: 'Kunde gehört nicht zu diesem Betrieb.' });
  }

  try {
    const project = await prisma.project.update({
      where: { id: existingProject.id },
      data: {
        customerId: parsed.data.customerId,
        projectNumber: parsed.data.projectNumber,
        name: parsed.data.name,
        address: parsed.data.address,
        description: parsed.data.description || null,
        status: parsed.data.status,
        startDate: toDate(parsed.data.startDate),
        endDate: toDate(parsed.data.endDate),
      },
      include: { customer: true },
    });

    res.json(project);
  } catch {
    res.status(409).json({ error: 'Baustellennummer bereits vorhanden.' });
  }
});

projectsRouter.delete('/:id', deleteRoles, async (req: AuthRequest, res) => {
  const project = await prisma.project.findFirst({
    where: {
      id: routeId(req.params.id),
      companyId: req.auth!.companyId,
    },
  });

  if (!project) {
    return res.status(404).json({ error: 'Baustelle wurde nicht gefunden.' });
  }

  await prisma.project.delete({ where: { id: project.id } });
  res.status(204).send();
});
