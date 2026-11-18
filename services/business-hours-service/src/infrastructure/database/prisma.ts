import { PrismaClient } from '@barbershop/prisma/client';
import { extendPrismaWithTenantScope } from '@barbershop/tenant-context';
const g = globalThis as unknown as { prisma: PrismaClient };
export const prisma: PrismaClient = g.prisma || extendPrismaWithTenantScope(new PrismaClient());
if (process.env.NODE_ENV !== 'production') g.prisma = prisma;
export default prisma;
