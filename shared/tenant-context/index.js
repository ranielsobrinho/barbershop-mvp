import { AsyncLocalStorage } from 'node:async_hooks';

const storage = new AsyncLocalStorage();
const defaultTenantSlug = process.env.DEFAULT_TENANT_SLUG || 'seu-carlos';
const tenantModels = new Set([
  'Service', 'Appointment', 'Customer', 'AppointmentReminder', 'BusinessHours',
  'Barber', 'BarberBusinessHours', 'Block', 'Settings', 'WhatsAppIntegration',
]);

export function getTenantContext() {
  return storage.getStore();
}

export function runWithTenantContext(context, callback) {
  return storage.run(context, callback);
}

export async function resolveTenantContextBySlug(slug, prisma) {
  if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const tenant = await prisma.tenant.findFirst({
    where: { slug, active: true },
    select: { id: true, slug: true },
  });
  return tenant ? { tenantId: tenant.id, slug: tenant.slug } : null;
}

export function createTenantContextHook(prisma) {
  return (request, reply, done) => {
    const requestedSlug = request.headers['x-shop-slug'] ?? defaultTenantSlug;
    if (typeof requestedSlug !== 'string') {
      reply.code(400).send({ error: 'InvalidShopSlug' });
      return;
    }

    resolveTenantContextBySlug(requestedSlug, prisma).then((context) => {
      if (!context) {
        reply.code(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(requestedSlug) ? 404 : 400)
          .send({ error: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(requestedSlug) ? 'ShopNotFound' : 'InvalidShopSlug' });
        return;
      }
      request.tenant = context;
      storage.run(context, done);
    }, done);
  };
}

export function extendPrismaWithTenantScope(client) {
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!tenantModels.has(model)) return query(args);

          const context = getTenantContext();
          const tenantId = context?.tenantId || (process.env.NODE_ENV === 'production' ? null : 'tenant_seu_carlos');
          if (!tenantId) throw new Error('Tenant context is required for tenant-owned data access');

          const scopedArgs = { ...args };
          if (operation === 'create') {
            scopedArgs.data = { ...scopedArgs.data, tenantId };
          } else if (operation === 'createMany' || operation === 'createManyAndReturn') {
            scopedArgs.data = Array.isArray(scopedArgs.data)
              ? scopedArgs.data.map((row) => ({ ...row, tenantId }))
              : { ...scopedArgs.data, tenantId };
          } else if (operation === 'upsert') {
            scopedArgs.where = { ...scopedArgs.where, tenantId };
            scopedArgs.create = { ...scopedArgs.create, tenantId };
            scopedArgs.update = { ...scopedArgs.update, tenantId };
          } else {
            scopedArgs.where = { ...scopedArgs.where, tenantId };
            if (operation === 'update' || operation === 'updateMany' || operation === 'updateManyAndReturn') {
              scopedArgs.data = { ...scopedArgs.data, tenantId };
            }
          }
          return query(scopedArgs);
        },
      },
    },
  });
}
