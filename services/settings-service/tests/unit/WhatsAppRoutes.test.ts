import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import jwt from 'jsonwebtoken';
const db = vi.hoisted(() => ({ findUnique: vi.fn(), upsert: vi.fn() }));
vi.mock('../../src/infrastructure/database/prisma.js', () => ({ prisma: { whatsAppIntegration: db } }));
import { whatsappRoutes } from '../../src/interfaces/http/routes/whatsappRoutes.js';
import { emptyIntegration } from '../../src/infrastructure/whatsapp/integration.js';

const app = Fastify();
const headers = () => ({ authorization: `Bearer ${jwt.sign({ sub: 'admin' }, process.env.JWT_SECRET!)}` });
beforeEach(async () => {
  vi.clearAllMocks();
  process.env.JWT_SECRET = 'test-admin-secret';
  process.env.WHATSAPP_INTERNAL_SECRET = 'test-service-secret';
  process.env.WHATSAPP_ENCRYPTION_KEY = 'ab'.repeat(32);
  db.findUnique.mockResolvedValue(null);
});
await app.register(cookie);
await whatsappRoutes(app);
afterEach(() => { vi.restoreAllMocks(); });

describe('WhatsApp management endpoints', () => {
  it('requires authentication for reads and writes', async () => {
    for (const method of ['GET', 'PUT'] as const) {
      const response = await app.inject({ method, url: '/api/admin/whatsapp-integration' });
      expect(response.statusCode).toBe(401);
    }
    expect(db.findUnique).not.toHaveBeenCalled();
  });
  it('returns disabled defaults before first save', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/admin/whatsapp-integration', headers: headers() });
    expect(response.statusCode).toBe(200);
    expect(response.json().integration).toEqual({ provider: null, wameApiKeyConfigured: false, zapsterApiTokenConfigured: false, zapsterInstanceId: null, messageAwaitingConfirmation: null, messageConfirmed: null, messageCancelled: null, messageRescheduled: null });
  });
  it('saves encrypted credentials and never returns them', async () => {
    db.upsert.mockImplementation(async ({ create }) => create);
    const response = await app.inject({ method: 'PUT', url: '/api/admin/whatsapp-integration', headers: headers(), payload: { provider: 'WAME', wameApiKey: 'private-key' } });
    expect(response.statusCode).toBe(200);
    expect(response.body).not.toContain('private-key');
    expect(response.json().integration.wameApiKeyConfigured).toBe(true);
    expect(db.upsert.mock.calls[0][0].create.wameApiKey).not.toBe('private-key');
  });
  it('rejects invalid configuration without writing', async () => {
    for (const payload of [{ provider: 'INVALID' }, { provider: 'WAME' }, { provider: 'ZAPSTER', zapsterInstanceId: 'id' }]) {
      const response = await app.inject({ method: 'PUT', url: '/api/admin/whatsapp-integration', headers: headers(), payload });
      expect(response.statusCode).toBe(400);
    }
    expect(db.upsert).not.toHaveBeenCalled();
  });
  it('rejects admin JWTs at the internal endpoint', async () => {
    const response = await app.inject({ method: 'POST', url: '/internal/whatsapp/appointments', headers: headers(), payload: { appointmentId: 'id' } });
    expect(response.statusCode).toBe(401);
  });
  it('accepts scoped service JWTs and skips disabled integration', async () => {
    db.findUnique.mockResolvedValue(emptyIntegration);
    const token = jwt.sign({}, process.env.WHATSAPP_INTERNAL_SECRET!, { audience: 'whatsapp-notifications', issuer: 'scheduling-service', expiresIn: '30s' });
    const response = await app.inject({ method: 'POST', url: '/internal/whatsapp/appointments', headers: { authorization: `Bearer ${token}` }, payload: { appointmentId: 'id' } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ sent: false });
  });
});
