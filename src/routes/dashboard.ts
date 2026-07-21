import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import type { AuthRequest } from '../types.js';
export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);
dashboardRouter.get('/', async (req: AuthRequest, res) => {
  const companyId = req.auth!.companyId;
  const [customers, projects, active, completed] = await Promise.all([
    prisma.customer.count({ where: { companyId } }),
    prisma.project.count({ where: { companyId } }),
    prisma.project.count({ where: { companyId, status: 'ACTIVE' } }),
    prisma.project.count({ where: { companyId, status: 'COMPLETED' } })
  ]);
  res.json({ customers, projects, activeProjects: active, completedProjects: completed });
});
