import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export interface TenantContext {
  tenantId: string;
  slug: string;
}

export function getTenantContext(): TenantContext | undefined;
export function runWithTenantContext<T>(context: TenantContext, callback: () => T): T;
export function resolveTenantContextBySlug(slug: unknown, prisma: any): Promise<TenantContext | null>;
export function createTenantContextHook(prisma: any): (request: FastifyRequest, reply: FastifyReply, done: (error?: Error) => void) => void;
export function extendPrismaWithTenantScope<T extends object>(client: T): T;
