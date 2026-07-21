import { PrismaClient, Role, ProjectStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
  const passwordHash = await bcrypt.hash('demo1234', 12);
  const company = await prisma.company.upsert({ where: { id: '11111111-1111-4111-8111-111111111111' }, update: {}, create: { id: '11111111-1111-4111-8111-111111111111', name: 'Ertz Elektrotechnik Demo', email: 'info@ertz-demo.de' } });
  for (const u of [
    { email: 'admin@ertz-demo.de', firstName: 'Frederik', lastName: 'Ertz', role: Role.ADMIN },
    { email: 'buero@ertz-demo.de', firstName: 'Demo', lastName: 'Büro', role: Role.OFFICE },
    { email: 'monteur@ertz-demo.de', firstName: 'Demo', lastName: 'Monteur', role: Role.TECHNICIAN }
  ]) await prisma.user.upsert({ where: { companyId_email: { companyId: company.id, email: u.email } }, update: { passwordHash }, create: { ...u, passwordHash, companyId: company.id } });
  const customer = await prisma.customer.upsert({ where: { companyId_customerNumber: { companyId: company.id, customerNumber: 'K-1001' } }, update: {}, create: { companyId: company.id, customerNumber: 'K-1001', name: 'Musterbau GmbH', contactName: 'Max Muster', email: 'bauleitung@example.de', billingAddress: 'Musterstraße 1, 66424 Homburg' } });
  await prisma.project.upsert({ where: { companyId_projectNumber: { companyId: company.id, projectNumber: 'B-2026-001' } }, update: {}, create: { companyId: company.id, customerId: customer.id, projectNumber: 'B-2026-001', name: 'Mehrfamilienhaus Homburg', address: 'Baustraße 10, 66424 Homburg', status: ProjectStatus.ACTIVE } });
}
main().catch(console.error).finally(() => prisma.$disconnect());
