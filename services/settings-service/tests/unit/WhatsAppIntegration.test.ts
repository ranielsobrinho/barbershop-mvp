import { beforeEach, describe, expect, it, vi } from 'vitest';
import { decrypt, emptyIntegration, encrypt, integrationSchema, mergeIntegration, publicIntegration, sendMessage } from '../../src/infrastructure/whatsapp/integration.js';

beforeEach(() => { process.env.WHATSAPP_ENCRYPTION_KEY = 'ab'.repeat(32); });

describe('WhatsApp configuration', () => {
  it('encrypts secrets with distinct nonces and detects tampering', () => {
    const first = encrypt('secret');
    expect(first).not.toContain('secret');
    expect(first).not.toEqual(encrypt('secret'));
    expect(decrypt(first)).toBe('secret');
    process.env.WHATSAPP_ENCRYPTION_KEY = 'cd'.repeat(32);
    expect(() => decrypt(first)).toThrow();
  });
  it('preserves blank credentials, switches providers, and disables without deleting secrets', () => {
    const wame = mergeIntegration(emptyIntegration, { provider: 'WAME', wameApiKey: 'key' });
    expect(mergeIntegration(wame, { provider: 'WAME', wameApiKey: '' })).toEqual(wame);
    const zapster = mergeIntegration(wame, { provider: 'ZAPSTER', zapsterApiToken: 'token', zapsterInstanceId: 'id' });
    const disabled = mergeIntegration(zapster, { provider: null });
    expect(mergeIntegration(disabled, { provider: 'WAME' }).wameApiKey).toBe(wame.wameApiKey);
    expect(publicIntegration(zapster)).toEqual({ provider: 'ZAPSTER', wameApiKeyConfigured: true, zapsterApiTokenConfigured: true, zapsterInstanceId: 'id', messageAwaitingConfirmation: null, messageConfirmed: null, messageCancelled: null, messageRescheduled: null });
  });
  it('rejects unsupported providers and incomplete activation', () => {
    expect(integrationSchema.safeParse({ provider: 'OTHER' }).success).toBe(false);
    expect(() => mergeIntegration(emptyIntegration, { provider: 'WAME' })).toThrow();
    expect(() => mergeIntegration(emptyIntegration, { provider: 'ZAPSTER', zapsterApiToken: 'token' })).toThrow();
  });
});

describe('provider adapters', () => {
  it('uses the Wame URL credential and normalized recipient', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true });
    await sendMessage(mergeIntegration(emptyIntegration, { provider: 'WAME', wameApiKey: 'key/one' }), '(85) 99999-1234', 'Olá', fetcher);
    expect(fetcher).toHaveBeenCalledWith('https://server.wame.api.br/key%2Fone/message/text', expect.objectContaining({ body: JSON.stringify({ to: '5585999991234', text: 'Olá' }), redirect: 'error' }));
  });
  it('uses Zapster bearer auth and instance_id', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true });
    await sendMessage(mergeIntegration(emptyIntegration, { provider: 'ZAPSTER', zapsterApiToken: 'token', zapsterInstanceId: 'instance' }), '5585999991234', 'Olá', fetcher);
    expect(fetcher).toHaveBeenCalledWith('https://api.zapsterapi.com/v1/wa/messages', expect.objectContaining({ headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' }, body: JSON.stringify({ recipient: '5585999991234', instance_id: 'instance', text: 'Olá' }) }));
  });
  it('skips disabled integrations and sanitizes network failures', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('https://secret-key/'));
    await sendMessage(emptyIntegration, 'invalid', 'text', fetcher);
    expect(fetcher).not.toHaveBeenCalled();
    await expect(sendMessage(mergeIntegration(emptyIntegration, { provider: 'WAME', wameApiKey: 'secret-key' }), '85999991234', 'text', fetcher)).rejects.toThrow('Falha no envio WhatsApp');
  });
  it('rejects provider HTTP errors', async () => {
    await expect(sendMessage(mergeIntegration(emptyIntegration, { provider: 'WAME', wameApiKey: 'key' }), '85999991234', 'text', vi.fn().mockResolvedValue({ ok: false }))).rejects.toThrow('Falha no envio WhatsApp');
  });
});
