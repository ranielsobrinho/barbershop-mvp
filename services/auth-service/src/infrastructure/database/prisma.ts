import { PrismaClient } from '@barbershop/prisma/client';
import { extendPrismaWithTenantScope } from '@barbershop/tenant-context';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.prisma || extendPrismaWithTenantScope(new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
}));

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
