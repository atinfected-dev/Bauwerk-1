import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { allowRoles, requireAuth } from '../middleware/auth.js';
import type { AuthRequest } from '../types.js';

export const diaryRouter = Router();
diaryRouter.use(requireAuth);

const writeRoles = allowRoles('ADMIN', 'OFFICE', 'PROJECT_MANAGER', 'TECHNICIAN');
const deleteRoles = allowRoles('ADMIN', 'OFFICE', 'PROJECT_MANAGER');

const diarySchema = z.object({
  entryDate: z.coerce.date(),
  title: z.string().trim().min(2).max(160),
  workDone: z.string().trim().min(3).max(5000),
  incidents: z.string().trim().max(3000).optional().nullable(),
  staffCount: z.coerce.number().int().min(1).max(999).default(1),
  hoursWorked: z.coerce.number().min(0).max(24).optional().nullable(),
  weather: z.enum(['SUNNY', 'CLOUDY', 'RAIN', 'SNOW', 'STORM', 'MIXED', 'UNKNOWN']).default('UNKNOWN'),
  temperature: z.coerce.number().min(-60).max(70).optional().nullable(),
});

async function findProject(projectId: string, companyId: string) {
  return prisma.project.findFirst({ where: { id: projectId, companyId } });
}

diaryRouter.get('/projects/:projectId', async (req: AuthRequest, res) => {
  const project = await findProject(req.params.projectId, req.auth!.companyId);
  if (!project) return res.status(404).json({ error: 'Baustelle nicht gefunden.' });

  const entries = await prisma.diaryEntry.findMany({
    where: { projectId: project.id, companyId: req.auth!.companyId },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, role: true } },
    },
    orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
  });

  res.json(entries);
});

diaryRouter.post('/projects/:projectId', writeRoles, async (req: AuthRequest, res) => {
  const parsed = diarySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Bitte Bautagebuchdaten prüfen.' });

  const project = await findProject(req.params.projectId, req.auth!.companyId);
  if (!project) return res.status(404).json({ error: 'Baustelle nicht gefunden.' });

  const entry = await prisma.diaryEntry.create({
    data: {
      ...parsed.data,
      incidents: parsed.data.incidents || null,
      hoursWorked: parsed.data.hoursWorked ?? null,
      temperature: parsed.data.temperature ?? null,
      companyId: req.auth!.companyId,
      projectId: project.id,
      authorId: req.auth!.userId,
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, role: true } },
    },
  });

  res.status(201).json(entry);
});

diaryRouter.put('/:id', writeRoles, async (req: AuthRequest, res) => {
  const parsed = diarySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Bitte Bautagebuchdaten prüfen.' });

  const current = await prisma.diaryEntry.findFirst({
    where: { id: req.params.id, companyId: req.auth!.companyId },
  });
  if (!current) return res.status(404).json({ error: 'Eintrag nicht gefunden.' });

  const canEdit = current.authorId === req.auth!.userId || ['ADMIN', 'OFFICE', 'PROJECT_MANAGER'].includes(req.auth!.role);
  if (!canEdit) return res.status(403).json({ error: 'Dieser Eintrag darf nicht bearbeitet werden.' });

  const entry = await prisma.diaryEntry.update({
    where: { id: current.id },
    data: {
      ...parsed.data,
      incidents: parsed.data.incidents || null,
      hoursWorked: parsed.data.hoursWorked ?? null,
      temperature: parsed.data.temperature ?? null,
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, role: true } },
    },
  });

  res.json(entry);
});

diaryRouter.delete('/:id', deleteRoles, async (req: AuthRequest, res) => {
  const entry = await prisma.diaryEntry.findFirst({
    where: { id: req.params.id, companyId: req.auth!.companyId },
  });
  if (!entry) return res.status(404).json({ error: 'Eintrag nicht gefunden.' });

  await prisma.diaryEntry.delete({ where: { id: entry.id } });
  res.status(204).send();
});
