import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import type { AuthRequest } from '../types.js';

export const materialsRouter = Router();
materialsRouter.use(requireAuth);

const units = ['PIECE','METER','SQUARE_METER','KILOGRAM','LITER','PACKAGE','ROLL','OTHER'] as const;
const bookingTypes = ['CONSUMPTION','RETURN'] as const;
const materialPayload = z.object({
  articleNumber: z.string().trim().min(1).max(80),
  name: z.string().trim().min(2).max(180),
  description: z.string().trim().max(2000).optional().nullable(),
  manufacturer: z.string().trim().max(120).optional().nullable(),
  unit: z.enum(units).default('PIECE'),
  purchasePrice: z.coerce.number().min(0).max(999999).optional().nullable(),
  salesPrice: z.coerce.number().min(0).max(999999).optional().nullable(),
  stockQuantity: z.coerce.number().min(0).max(999999999).default(0),
  minimumStock: z.coerce.number().min(0).max(999999999).default(0),
  active: z.boolean().default(true),
});
const bookingPayload = z.object({
  materialId: z.string().uuid(),
  type: z.enum(bookingTypes).default('CONSUMPTION'),
  quantity: z.coerce.number().positive().max(999999999),
  unitPrice: z.coerce.number().min(0).max(999999).optional().nullable(),
  note: z.string().trim().max(1000).optional().nullable(),
  bookedAt: z.coerce.date().optional(),
});

materialsRouter.get('/', async (req: AuthRequest, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const rows = await prisma.material.findMany({
    where: { companyId: req.auth!.companyId, ...(q ? { OR: [
      { name: { contains: q, mode: 'insensitive' } },
      { articleNumber: { contains: q, mode: 'insensitive' } },
      { manufacturer: { contains: q, mode: 'insensitive' } },
    ] } : {}) },
    orderBy: [{ active: 'desc' }, { name: 'asc' }],
  });
  res.json(rows.map((row) => ({ ...row, lowStock: Number(row.stockQuantity) <= Number(row.minimumStock) })));
});

materialsRouter.post('/', async (req: AuthRequest, res) => {
  const parsed = materialPayload.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Bitte Materialangaben prüfen.' });
  try {
    const row = await prisma.material.create({ data: { companyId: req.auth!.companyId, ...parsed.data } });
    res.status(201).json({ ...row, lowStock: Number(row.stockQuantity) <= Number(row.minimumStock) });
  } catch (error: any) {
    if (error?.code === 'P2002') return res.status(409).json({ error: 'Diese Artikelnummer ist bereits vergeben.' });
    throw error;
  }
});

materialsRouter.put('/:id', async (req: AuthRequest, res) => {
  const parsed = materialPayload.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Bitte Materialangaben prüfen.' });
  const current = await prisma.material.findFirst({ where: { id: req.params.id, companyId: req.auth!.companyId } });
  if (!current) return res.status(404).json({ error: 'Material nicht gefunden.' });
  const row = await prisma.material.update({ where: { id: current.id }, data: parsed.data });
  res.json({ ...row, lowStock: Number(row.stockQuantity) <= Number(row.minimumStock) });
});

materialsRouter.get('/projects/:projectId', async (req: AuthRequest, res) => {
  const project = await prisma.project.findFirst({ where: { id: req.params.projectId, companyId: req.auth!.companyId } });
  if (!project) return res.status(404).json({ error: 'Baustelle nicht gefunden.' });
  const rows = await prisma.materialBooking.findMany({
    where: { projectId: project.id, companyId: req.auth!.companyId },
    include: {
      material: true,
      bookedBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: [{ bookedAt: 'desc' }, { createdAt: 'desc' }],
  });
  res.json(rows);
});

materialsRouter.post('/projects/:projectId/bookings', async (req: AuthRequest, res) => {
  const parsed = bookingPayload.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Bitte Buchungsangaben prüfen.' });
  const [project, material] = await Promise.all([
    prisma.project.findFirst({ where: { id: req.params.projectId, companyId: req.auth!.companyId } }),
    prisma.material.findFirst({ where: { id: parsed.data.materialId, companyId: req.auth!.companyId, active: true } }),
  ]);
  if (!project) return res.status(404).json({ error: 'Baustelle nicht gefunden.' });
  if (!material) return res.status(404).json({ error: 'Material nicht gefunden.' });
  const quantity = parsed.data.quantity;
  const signed = parsed.data.type === 'CONSUMPTION' ? -quantity : quantity;
  if (Number(material.stockQuantity) + signed < 0) return res.status(409).json({ error: 'Der Lagerbestand reicht für diese Buchung nicht aus.' });

  const row = await prisma.$transaction(async (tx) => {
    await tx.material.update({ where: { id: material.id }, data: { stockQuantity: { increment: signed } } });
    return tx.materialBooking.create({
      data: {
        companyId: req.auth!.companyId,
        projectId: project.id,
        materialId: material.id,
        bookedById: req.auth!.userId,
        type: parsed.data.type,
        quantity,
        unitPrice: parsed.data.unitPrice ?? material.salesPrice ?? material.purchasePrice,
        note: parsed.data.note || null,
        bookedAt: parsed.data.bookedAt ?? new Date(),
      },
      include: { material: true, bookedBy: { select: { id: true, firstName: true, lastName: true } } },
    });
  });
  res.status(201).json(row);
});

materialsRouter.delete('/bookings/:id', async (req: AuthRequest, res) => {
  const booking = await prisma.materialBooking.findFirst({ where: { id: req.params.id, companyId: req.auth!.companyId } });
  if (!booking) return res.status(404).json({ error: 'Buchung nicht gefunden.' });
  const reverse = booking.type === 'CONSUMPTION' ? Number(booking.quantity) : -Number(booking.quantity);
  await prisma.$transaction([
    prisma.material.update({ where: { id: booking.materialId }, data: { stockQuantity: { increment: reverse } } }),
    prisma.materialBooking.delete({ where: { id: booking.id } }),
  ]);
  res.status(204).send();
});
