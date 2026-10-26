import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { z } from 'zod';

export const integrationSchema = z.object({
  provider: z.enum(['WAME', 'ZAPSTER']).nullable(),
  wameApiKey: z.string().trim().max(2048).optional(),
  zapsterApiToken: z.string().trim().max(2048).optional(),
  zapsterInstanceId: z.string().trim().max(200).optional(),
  messageAwaitingConfirmation: z.string().trim().max(2000).optional(),
  messageConfirmed: z.string().trim().max(2000).optional(),
  messageCancelled: z.string().trim().max(2000).optional(),
  messageRescheduled: z.string().trim().max(2000).optional(),
}).strict();

export interface Integration {
  provider: 'WAME' | 'ZAPSTER' | null;
  wameApiKey: string | null;
  zapsterApiToken: string | null;
  zapsterInstanceId: string | null;
  messageAwaitingConfirmation: string | null;
  messageConfirmed: string | null;
  messageCancelled: string | null;
  messageRescheduled: string | null;
}
export const emptyIntegration: Integration = {
  provider: null, wameApiKey: null, zapsterApiToken: null, zapsterInstanceId: null,
  messageAwaitingConfirmation: null, messageConfirmed: null,
  messageCancelled: null, messageRescheduled: null,
};
export function publicIntegration(value: Integration) {
  return {
    provider: value.provider,
    wameApiKeyConfigured: Boolean(value.wameApiKey),
    zapsterApiTokenConfigured: Boolean(value.zapsterApiToken),
    zapsterInstanceId: value.zapsterInstanceId,
    messageAwaitingConfirmation: value.messageAwaitingConfirmation,
    messageConfirmed: value.messageConfirmed,
    messageCancelled: value.messageCancelled,
    messageRescheduled: value.messageRescheduled,
  };
}
function key() {
  const value = process.env.WHATSAPP_ENCRYPTION_KEY || '';
  if (!/^[a-f\d]{64}$/i.test(value)) throw new Error('WHATSAPP_ENCRYPTION_KEY must contain 64 hex characters');
  return Buffer.from(value, 'hex');
}
export function encrypt(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(b => b.toString('base64')).join('.');
}
export function decrypt(secret: string) {
  const [iv, tag, encrypted] = secret.split('.').map(part => Buffer.from(part, 'base64'));
  const cipher = createDecipheriv('aes-256-gcm', key(), iv);
  cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(encrypted), cipher.final()]).toString('utf8');
}
export function mergeIntegration(current: Integration, input: z.infer<typeof integrationSchema>): Integration {
  const next = {
    provider: input.provider,
    wameApiKey: input.wameApiKey ? encrypt(input.wameApiKey) : current.wameApiKey,
    zapsterApiToken: input.zapsterApiToken ? encrypt(input.zapsterApiToken) : current.zapsterApiToken,
    zapsterInstanceId: input.zapsterInstanceId || current.zapsterInstanceId,
    messageAwaitingConfirmation: input.messageAwaitingConfirmation ?? current.messageAwaitingConfirmation,
    messageConfirmed: input.messageConfirmed ?? current.messageConfirmed,
    messageCancelled: input.messageCancelled ?? current.messageCancelled,
    messageRescheduled: input.messageRescheduled ?? current.messageRescheduled,
  };
  if (next.provider === 'WAME' && !next.wameApiKey) throw new Error('API Key Wame é obrigatória');
  if (next.provider === 'ZAPSTER' && (!next.zapsterApiToken || !next.zapsterInstanceId)) {
    throw new Error('Token e Instance ID Zapster são obrigatórios');
  }
  return next;
}

export async function sendMessage(config: Integration, phone: string, text: string, fetcher = fetch) {
  if (!config.provider) return;
  let recipient = phone.replace(/\D/g, '');
  if (recipient.length === 10 || recipient.length === 11) recipient = `55${recipient}`;
  if (!/^[1-9]\d{10,14}$/.test(recipient)) throw new Error('Telefone inválido');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  let url: string;
  let body: object;
  if (config.provider === 'WAME') {
    if (!config.wameApiKey) throw new Error('Wame não configurado');
    url = `https://server.wame.api.br/${encodeURIComponent(decrypt(config.wameApiKey))}/message/text`;
    body = { to: recipient, text };
  } else {
    if (!config.zapsterApiToken || !config.zapsterInstanceId) throw new Error('Zapster não configurado');
    url = 'https://api.zapsterapi.com/v1/wa/messages';
    headers.Authorization = `Bearer ${decrypt(config.zapsterApiToken)}`;
    body = { recipient, instance_id: config.zapsterInstanceId, text };
  }
  // Never propagate provider responses or fetch errors: Wame URLs contain credentials.
  try {
    const response = await fetcher(url, {
      method: 'POST', headers, body: JSON.stringify(body), redirect: 'error',
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('Provider rejected message');
    await response.body?.cancel();
  } catch {
    throw new Error('Falha no envio WhatsApp');
  }
}
