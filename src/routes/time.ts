import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { allowRoles, requireAuth } from '../middleware/auth.js';
import type { AuthRequest } from '../types.js';

export const timeRouter = Router();
timeRouter.use(requireAuth);

const managerRoles = ['ADMIN', 'OFFICE', 'PROJECT_MANAGER'];
const deleteRoles = allowRoles(...managerRoles);
const entryInclude = {
  breaks: { orderBy: { startTime: 'asc' as const } },
  user: { select: { id: true, firstName: true, lastName: true, role: true } },
  project: { select: { id: true, projectNumber: true, name: true } },
  task: { select: { id: true, title: true } },
};

const startSchema = z.object({
  type: z.enum(['WORK', 'TRAVEL', 'TRAINING', 'OFFICE', 'OTHER']).default('WORK'),
  note: z.string().trim().max(1000).optional().nullable(),
  taskId: z.string().uuid().optional().nullable(),
});

const manualSchema = z.object({
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  breakMinutes: z.coerce.number().int().min(0).max(1440).default(0),
  type: z.enum(['WORK', 'TRAVEL', 'TRAINING', 'OFFICE', 'OTHER']).default('WORK'),
  note: z.string().trim().max(1000).optional().nullable(),
});

const updateSchema = z.object({
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  breakMinutes: z.coerce.number().int().min(0).max(1440).default(0),
  type: z.enum(['WORK', 'TRAVEL', 'TRAINING', 'OFFICE', 'OTHER']),
  note: z.string().trim().max(1000).optional().nullable(),
});

function serializeEntry(entry: any) {
  const now = new Date();
  const effectiveEnd = entry.endTime ?? now;
  const grossMinutes = Math.max(0, Math.floor((effectiveEnd.getTime() - entry.startTime.getTime()) / 60000));
  const breakMinutes = entry.breaks.reduce((sum: number, item: any) => {
    const end = item.endTime ?? now;
    return sum + Math.max(0, Math.floor((end.getTime() - item.startTime.getTime()) / 60000));
  }, 0);
  return { ...entry, grossMinutes, breakMinutes, netMinutes: Math.max(0, grossMinutes - breakMinutes) };
}

async function projectForCompany(projectId: string, companyId: string) {
  return prisma.project.findFirst({ where: { id: projectId, companyId } });
}

async function entryForCompany(id: string, companyId: string) {
  return prisma.timeEntry.findFirst({ where: { id, companyId }, include: entryInclude });
}

function canChange(req: AuthRequest, userId: string) {
  return userId === req.auth!.userId || managerRoles.includes(req.auth!.role);
}

function validateRange(startTime: Date, endTime: Date, breakMinutes: number) {
  const grossMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
  if (grossMinutes <= 0) return 'Das Ende muss nach dem Beginn liegen.';
  if (grossMinutes > 36 * 60) return 'Ein Zeiteintrag darf höchstens 36 Stunden umfassen.';
  if (breakMinutes >= grossMinutes) return 'Die Pausenzeit muss kürzer als die Gesamtzeit sein.';
  return null;
}

timeRouter.get('/current', async (req: AuthRequest, res) => {
  const entry = await prisma.timeEntry.findFirst({
    where: { companyId: req.auth!.companyId, userId: req.auth!.userId, status: { in: ['RUNNING', 'PAUSED'] } },
    include: entryInclude,
    orderBy: { startTime: 'desc' },
  });
  res.json(entry ? serializeEntry(entry) : null);
});

timeRouter.get('/projects/:projectId', async (req: AuthRequest, res) => {
  const project = await projectForCompany(req.params.projectId, req.auth!.companyId);
  if (!project) return res.status(404).json({ error: 'Baustelle nicht gefunden.' });

  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;
  const ownOnly = !managerRoles.includes(req.auth!.role);
  const entries = await prisma.timeEntry.findMany({
    where: {
      companyId: req.auth!.companyId,
      projectId: project.id,
      ...(ownOnly ? { userId: req.auth!.userId } : {}),
      ...(from || to ? { startTime: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    },
    include: entryInclude,
    orderBy: { startTime: 'desc' },
  });
  res.json(entries.map(serializeEntry));
});

timeRouter.post('/projects/:projectId/start', async (req: AuthRequest, res) => {
  const parsed = startSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: 'Bitte Angaben zur Zeiterfassung prüfen.' });
  const project = await projectForCompany(req.params.projectId, req.auth!.companyId);
  if (!project) return res.status(404).json({ error: 'Baustelle nicht gefunden.' });

  const active = await prisma.timeEntry.findFirst({
    where: { companyId: req.auth!.companyId, userId: req.auth!.userId, status: { in: ['RUNNING', 'PAUSED'] } },
  });
  if (active) return res.status(409).json({ error: 'Es läuft bereits eine Zeiterfassung. Bitte diese zuerst beenden.' });

  const entry = await prisma.timeEntry.create({
    data: {
      companyId: req.auth!.companyId,
      projectId: project.id,
      userId: req.auth!.userId,
      startTime: new Date(),
      type: parsed.data.type,
      note: parsed.data.note || null,
      taskId: parsed.data.taskId || null,
    },
    include: entryInclude,
  });
  res.status(201).json(serializeEntry(entry));
});

timeRouter.post('/:id/pause', async (req: AuthRequest, res) => {
  const entry = await entryForCompany(req.params.id, req.auth!.companyId);
  if (!entry) return res.status(404).json({ error: 'Zeiteintrag nicht gefunden.' });
  if (!canChange(req, entry.userId)) return res.status(403).json({ error: 'Keine Berechtigung.' });
  if (entry.status !== 'RUNNING') return res.status(409).json({ error: 'Nur eine laufende Zeit kann pausiert werden.' });

  await prisma.$transaction([
    prisma.timeBreak.create({ data: { timeEntryId: entry.id, startTime: new Date() } }),
    prisma.timeEntry.update({ where: { id: entry.id }, data: { status: 'PAUSED' } }),
  ]);
  const updated = await entryForCompany(entry.id, req.auth!.companyId);
  res.json(serializeEntry(updated));
});

timeRouter.post('/:id/resume', async (req: AuthRequest, res) => {
  const entry = await entryForCompany(req.params.id, req.auth!.companyId);
  if (!entry) return res.status(404).json({ error: 'Zeiteintrag nicht gefunden.' });
  if (!canChange(req, entry.userId)) return res.status(403).json({ error: 'Keine Berechtigung.' });
  if (entry.status !== 'PAUSED') return res.status(409).json({ error: 'Dieser Zeiteintrag ist nicht pausiert.' });
  const openBreak = entry.breaks.find((item: any) => !item.endTime);
  if (!openBreak) return res.status(409).json({ error: 'Offene Pause nicht gefunden.' });

  await prisma.$transaction([
    prisma.timeBreak.update({ where: { id: openBreak.id }, data: { endTime: new Date() } }),
    prisma.timeEntry.update({ where: { id: entry.id }, data: { status: 'RUNNING' } }),
  ]);
  const updated = await entryForCompany(entry.id, req.auth!.companyId);
  res.json(serializeEntry(updated));
});

timeRouter.post('/:id/stop', async (req: AuthRequest, res) => {
  const entry = await entryForCompany(req.params.id, req.auth!.companyId);
  if (!entry) return res.status(404).json({ error: 'Zeiteintrag nicht gefunden.' });
  if (!canChange(req, entry.userId)) return res.status(403).json({ error: 'Keine Berechtigung.' });
  if (entry.status === 'COMPLETED') return res.status(409).json({ error: 'Dieser Zeiteintrag ist bereits beendet.' });
  const now = new Date();
  const openBreak = entry.breaks.find((item: any) => !item.endTime);
  await prisma.$transaction([
    ...(openBreak ? [prisma.timeBreak.update({ where: { id: openBreak.id }, data: { endTime: now } })] : []),
    prisma.timeEntry.update({ where: { id: entry.id }, data: { endTime: now, status: 'COMPLETED' } }),
  ]);
  const updated = await entryForCompany(entry.id, req.auth!.companyId);
  res.json(serializeEntry(updated));
});

timeRouter.post('/projects/:projectId/manual', async (req: AuthRequest, res) => {
  const parsed = manualSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Bitte manuelle Zeitangaben prüfen.' });
  const project = await projectForCompany(req.params.projectId, req.auth!.companyId);
  if (!project) return res.status(404).json({ error: 'Baustelle nicht gefunden.' });
  const rangeError = validateRange(parsed.data.startTime, parsed.data.endTime, parsed.data.breakMinutes);
  if (rangeError) return res.status(400).json({ error: rangeError });

  const entry = await prisma.timeEntry.create({
    data: {
      companyId: req.auth!.companyId,
      projectId: project.id,
      userId: req.auth!.userId,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      status: 'COMPLETED',
      type: parsed.data.type,
      note: parsed.data.note || null,
      manuallyEdited: true,
      breaks: parsed.data.breakMinutes > 0 ? {
        create: { startTime: parsed.data.startTime, endTime: new Date(parsed.data.startTime.getTime() + parsed.data.breakMinutes * 60000) },
      } : undefined,
    },
    include: entryInclude,
  });
  res.status(201).json(serializeEntry(entry));
});

timeRouter.put('/:id', async (req: AuthRequest, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Bitte Zeitangaben prüfen.' });
  const current = await entryForCompany(req.params.id, req.auth!.companyId);
  if (!current) return res.status(404).json({ error: 'Zeiteintrag nicht gefunden.' });
  if (!canChange(req, current.userId)) return res.status(403).json({ error: 'Keine Berechtigung.' });
  if (current.status !== 'COMPLETED') return res.status(409).json({ error: 'Laufende Zeiten müssen zuerst beendet werden.' });
  const rangeError = validateRange(parsed.data.startTime, parsed.data.endTime, parsed.data.breakMinutes);
  if (rangeError) return res.status(400).json({ error: rangeError });

  await prisma.$transaction(async (tx) => {
    await tx.timeBreak.deleteMany({ where: { timeEntryId: current.id } });
    await tx.timeEntry.update({
      where: { id: current.id },
      data: {
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        type: parsed.data.type,
        note: parsed.data.note || null,
        manuallyEdited: true,
        breaks: parsed.data.breakMinutes > 0 ? {
          create: { startTime: parsed.data.startTime, endTime: new Date(parsed.data.startTime.getTime() + parsed.data.breakMinutes * 60000) },
        } : undefined,
      },
    });
  });
  const updated = await entryForCompany(current.id, req.auth!.companyId);
  res.json(serializeEntry(updated));
});

timeRouter.delete('/:id', deleteRoles, async (req: AuthRequest, res) => {
  const entry = await entryForCompany(req.params.id, req.auth!.companyId);
  if (!entry) return res.status(404).json({ error: 'Zeiteintrag nicht gefunden.' });
  await prisma.timeEntry.delete({ where: { id: entry.id } });
  res.status(204).send();
});
