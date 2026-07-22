import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { allowRoles, requireAuth } from '../middleware/auth.js';
import type { AuthRequest } from '../types.js';

const uploadRoot = path.resolve(process.cwd(), 'uploads', 'documents');
fs.mkdirSync(uploadRoot, { recursive: true });

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadRoot),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '');
    callback(null, `${randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) return callback(new Error('Dieser Dateityp wird nicht unterstützt.'));
    callback(null, true);
  },
});

const categorySchema = z.enum(['OFFER', 'ORDER', 'INVOICE', 'DELIVERY_NOTE', 'TEST_REPORT', 'PLAN', 'PHOTO', 'OTHER']);
const metadataSchema = z.object({
  category: categorySchema.default('OTHER'),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  taskId: z.string().uuid().optional().or(z.literal('')),
  diaryEntryId: z.string().uuid().optional().or(z.literal('')),
});

export const documentsRouter = Router();
documentsRouter.use(requireAuth);

function param(value: string | string[]): string { return Array.isArray(value) ? value[0] : value; }

async function assertProject(companyId: string, projectId: string) {
  return prisma.project.findFirst({ where: { id: projectId, companyId }, select: { id: true } });
}

function removeFiles(files: Express.Multer.File[]) {
  for (const file of files) fs.rm(file.path, { force: true }, () => undefined);
}

function serialize(document: any) {
  return {
    ...document,
    previewUrl: `/documents/${document.id}/content?inline=1`,
    downloadUrl: `/documents/${document.id}/content`,
  };
}

documentsRouter.get('/projects/:projectId', async (req: AuthRequest, res) => {
  const project = await assertProject(req.auth!.companyId, param(req.params.projectId));
  if (!project) return res.status(404).json({ error: 'Baustelle nicht gefunden.' });

  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const onlyLatest = req.query.allVersions !== '1';

  const documents = await prisma.document.findMany({
    where: {
      companyId: req.auth!.companyId,
      projectId: param(req.params.projectId),
      ...(category && categorySchema.safeParse(category).success ? { category: category as any } : {}),
      ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { originalName: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }] } : {}),
    },
    include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } }, task: { select: { id: true, title: true } } },
    orderBy: [{ createdAt: 'desc' }],
  });

  const result = onlyLatest
    ? [...new Map(documents.map((document: any) => [document.groupId, document])).values()]
    : documents;
  res.json(result.map(serialize));
});

documentsRouter.post('/projects/:projectId', upload.array('files', 10), async (req: AuthRequest, res) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  const project = await assertProject(req.auth!.companyId, param(req.params.projectId));
  if (!project) { removeFiles(files); return res.status(404).json({ error: 'Baustelle nicht gefunden.' }); }
  if (!files.length) return res.status(400).json({ error: 'Bitte mindestens eine Datei auswählen.' });

  const parsed = metadataSchema.safeParse(req.body);
  if (!parsed.success) { removeFiles(files); return res.status(400).json({ error: 'Ungültige Dokumentdaten.', details: parsed.error.flatten() }); }

  const taskId = parsed.data.taskId || null;
  const diaryEntryId = parsed.data.diaryEntryId || null;
  if (taskId) {
    const task = await prisma.task.findFirst({ where: { id: taskId, projectId: project.id, companyId: req.auth!.companyId }, select: { id: true } });
    if (!task) { removeFiles(files); return res.status(400).json({ error: 'Die ausgewählte Aufgabe gehört nicht zu dieser Baustelle.' }); }
  }
  if (diaryEntryId) {
    const entry = await prisma.diaryEntry.findFirst({ where: { id: diaryEntryId, projectId: project.id, companyId: req.auth!.companyId }, select: { id: true } });
    if (!entry) { removeFiles(files); return res.status(400).json({ error: 'Der Bautagebucheintrag gehört nicht zu dieser Baustelle.' }); }
  }

  const created = await prisma.$transaction(files.map((file) => prisma.document.create({
    data: {
      companyId: req.auth!.companyId,
      projectId: project.id,
      taskId,
      diaryEntryId,
      uploadedById: req.auth!.userId,
      groupId: randomUUID(),
      name: path.parse(file.originalname).name,
      originalName: file.originalname,
      storageName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      category: parsed.data.category,
      description: parsed.data.description || null,
    },
    include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } }, task: { select: { id: true, title: true } } },
  })));
  res.status(201).json(created.map(serialize));
});

documentsRouter.post('/:id/versions', upload.single('file'), async (req: AuthRequest, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'Bitte eine Datei auswählen.' });
  const current = await prisma.document.findFirst({ where: { id: param(req.params.id), companyId: req.auth!.companyId } });
  if (!current) { removeFiles([file]); return res.status(404).json({ error: 'Dokument nicht gefunden.' }); }

  const latest = await prisma.document.aggregate({ where: { groupId: current.groupId }, _max: { version: true } });
  const created = await prisma.document.create({
    data: {
      companyId: current.companyId, projectId: current.projectId, taskId: current.taskId, diaryEntryId: current.diaryEntryId,
      uploadedById: req.auth!.userId, groupId: current.groupId, version: (latest._max.version ?? current.version) + 1,
      name: current.name, originalName: file.originalname, storageName: file.filename, mimeType: file.mimetype,
      size: file.size, category: current.category, description: current.description,
    },
    include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } }, task: { select: { id: true, title: true } } },
  });
  res.status(201).json(serialize(created));
});

documentsRouter.get('/:id/versions', async (req: AuthRequest, res) => {
  const current = await prisma.document.findFirst({ where: { id: param(req.params.id), companyId: req.auth!.companyId }, select: { groupId: true } });
  if (!current) return res.status(404).json({ error: 'Dokument nicht gefunden.' });
  const versions = await prisma.document.findMany({ where: { groupId: current.groupId, companyId: req.auth!.companyId }, include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { version: 'desc' } });
  res.json(versions.map(serialize));
});

documentsRouter.get('/:id/content', async (req: AuthRequest, res) => {
  const document = await prisma.document.findFirst({ where: { id: param(req.params.id), companyId: req.auth!.companyId } });
  if (!document) return res.status(404).json({ error: 'Dokument nicht gefunden.' });
  const filePath = path.join(uploadRoot, document.storageName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Datei wurde im Speicher nicht gefunden.' });
  res.type(document.mimeType);
  res.setHeader('Content-Disposition', `${req.query.inline === '1' ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(document.originalName)}`);
  res.sendFile(filePath);
});

documentsRouter.delete('/:id', allowRoles('ADMIN', 'OFFICE', 'PROJECT_MANAGER'), async (req: AuthRequest, res) => {
  const document = await prisma.document.findFirst({ where: { id: param(req.params.id), companyId: req.auth!.companyId } });
  if (!document) return res.status(404).json({ error: 'Dokument nicht gefunden.' });
  await prisma.document.delete({ where: { id: document.id } });
  fs.rm(path.join(uploadRoot, document.storageName), { force: true }, () => undefined);
  res.status(204).end();
});
