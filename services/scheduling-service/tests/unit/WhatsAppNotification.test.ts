import { afterEach, describe, expect, it, vi } from 'vitest';
import { notifyAppointment } from '../../src/infrastructure/notifications/notifyAppointment.js';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe('appointment notifications', () => {
  it('does not fail the saved appointment when settings-service is unavailable', async () => {
    vi.stubEnv('WHATSAPP_INTERNAL_SECRET', 'test-secret');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    const logger = { warn: vi.fn() };
    await expect(notifyAppointment('appointment-id', logger)).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith({ appointmentId: 'appointment-id' }, expect.any(String));
  });
  it('skips unconfigured service integration', async () => {
    vi.stubEnv('WHATSAPP_INTERNAL_SECRET', '');
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    await notifyAppointment('id', { warn: vi.fn() });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
