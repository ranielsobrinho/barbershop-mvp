import jwt from 'jsonwebtoken';
import type { FastifyBaseLogger } from 'fastify';

export async function notifyAppointment(appointmentId: string, logger: Pick<FastifyBaseLogger, 'warn'>) {
  const secret = process.env.WHATSAPP_INTERNAL_SECRET;
  if (!secret) return;
  try {
    const token = jwt.sign({}, secret, {
      algorithm: 'HS256', expiresIn: '30s', audience: 'whatsapp-notifications', issuer: 'scheduling-service',
    });
    const response = await fetch(`${process.env.SETTINGS_SERVICE_URL || 'http://localhost:3006'}/internal/whatsapp/appointments`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId }), signal: AbortSignal.timeout(10000), redirect: 'error',
    });
    if (!response.ok) throw new Error('Notification failed');
    await response.body?.cancel();
  } catch {
    logger.warn({ appointmentId }, 'WhatsApp notification failed; appointment remains saved');
  }
}
