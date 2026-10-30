import jwt from 'jsonwebtoken';

export interface ReminderDeliveryResult {
  sent: boolean;
  reason?: 'disabled' | 'provider-not-configured' | 'appointment-inactive';
  providerResponseCode?: number;
}

export class ReminderDeliveryError extends Error {
  constructor(message: string, public readonly responseCode?: number) {
    super(message);
    this.name = 'ReminderDeliveryError';
  }
}

export async function sendAppointmentReminder(appointmentId: string, idempotencyKey: string): Promise<ReminderDeliveryResult> {
  const secret = process.env.WHATSAPP_INTERNAL_SECRET;
  if (!secret) throw new ReminderDeliveryError('Integração interna de WhatsApp não configurada.');

  const token = jwt.sign({}, secret, {
    algorithm: 'HS256', expiresIn: '30s', audience: 'whatsapp-notifications', issuer: 'scheduling-service',
  });
  let response: Response;
  try {
    response = await fetch(`${process.env.SETTINGS_SERVICE_URL || 'http://localhost:3006'}/internal/whatsapp/reminders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId, idempotencyKey }),
      signal: AbortSignal.timeout(12000),
      redirect: 'error',
    });
  } catch {
    throw new ReminderDeliveryError('Não foi possível conectar ao provedor WhatsApp.');
  }

  if (!response.ok) {
    await response.body?.cancel();
    throw new ReminderDeliveryError('O provedor WhatsApp recusou o envio.', response.status);
  }

  let result: ReminderDeliveryResult;
  try {
    result = await response.json() as ReminderDeliveryResult;
  } catch {
    throw new ReminderDeliveryError('A integração WhatsApp retornou uma resposta inválida.', response.status);
  }
  if (typeof result.sent !== 'boolean') {
    throw new ReminderDeliveryError('A integração WhatsApp retornou uma resposta inválida.', response.status);
  }
  return result;
}
