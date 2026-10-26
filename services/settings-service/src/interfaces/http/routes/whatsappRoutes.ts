import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../../infrastructure/database/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { emptyIntegration, integrationSchema, mergeIntegration, publicIntegration, sendMessage } from '../../../infrastructure/whatsapp/integration.js';

export async function whatsappRoutes(app: FastifyInstance) {
  app.get('/api/admin/whatsapp-integration', { preHandler: authMiddleware }, async () => {
    const config = await prisma.whatsAppIntegration.findUnique({ where: { id: 'default' } });
    return { integration: publicIntegration(config || emptyIntegration) };
  });
  app.put('/api/admin/whatsapp-integration', { preHandler: authMiddleware }, async (request, reply) => {
    const parsed = integrationSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
    const current = await prisma.whatsAppIntegration.findUnique({ where: { id: 'default' } });
    let next;
    try { next = mergeIntegration(current || emptyIntegration, parsed.data); }
    catch (error) { return reply.code(400).send({ message: (error as Error).message }); }
    const config = await prisma.whatsAppIntegration.upsert({
      where: { id: 'default' }, create: { id: 'default', ...next }, update: next,
    });
    return { integration: publicIntegration(config) };
  });

  // Internal service endpoint; deliberately not proxied by the gateway.
  app.post('/internal/whatsapp/appointments', async (request, reply) => {
    try {
      const secret = process.env.WHATSAPP_INTERNAL_SECRET;
      if (!secret) throw new Error('Missing secret');
      jwt.verify(request.headers.authorization?.replace(/^Bearer /, '') || '', secret, {
        algorithms: ['HS256'], audience: 'whatsapp-notifications', issuer: 'scheduling-service',
      });
    } catch { return reply.code(401).send({ message: 'Unauthorized' }); }
    const parsed = z.object({ appointmentId: z.string().min(1) }).strict().safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: 'Dados inválidos' });
    const config = await prisma.whatsAppIntegration.findUnique({ where: { id: 'default' } });
    if (!config?.provider) return { sent: false };
    const appointment = await prisma.appointment.findUnique({ where: { id: parsed.data.appointmentId }, include: { service: true } });
    if (!appointment) return reply.code(404).send({ message: 'Agendamento não encontrado' });
    const dateOptions: Intl.DateTimeFormatOptions = { timeZone: 'America/Fortaleza', dateStyle: 'short' };
    const timeOptions: Intl.DateTimeFormatOptions = { timeZone: 'America/Fortaleza', timeStyle: 'short' };
    const values: Record<string, string> = {
      nome: appointment.customerName,
      servico: appointment.service.name,
      data: new Intl.DateTimeFormat('pt-BR', dateOptions).format(appointment.startsAt),
      hora: new Intl.DateTimeFormat('pt-BR', timeOptions).format(appointment.startsAt),
      valor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(appointment.priceCents / 100),
      horario_anterior: appointment.previousStartsAt
        ? new Intl.DateTimeFormat('pt-BR', { ...dateOptions, ...timeOptions }).format(appointment.previousStartsAt)
        : 'não informado',
    };
    const defaultMessages = {
      AGUARDANDO_CONFIRMACAO: 'Olá, {nome}! Recebemos seu agendamento de {servico} para {data} às {hora}. Estamos aguardando confirmação.',
      CONFIRMADO: 'Olá, {nome}! Seu agendamento de {servico} para {data} às {hora} foi confirmado.',
      CANCELADO: 'Olá, {nome}. Seu agendamento de {servico} para {data} às {hora} foi cancelado.',
      REAGENDADO: 'Olá, {nome}! Seu agendamento de {servico} foi reagendado. Novo horário: {data} às {hora}. Horário anterior: {horario_anterior}.',
    };
    const messageByStatus = {
      AGUARDANDO_CONFIRMACAO: config.messageAwaitingConfirmation,
      CONFIRMADO: config.messageConfirmed,
      CANCELADO: config.messageCancelled,
      REAGENDADO: config.messageRescheduled,
    };
    const template = messageByStatus[appointment.status] || defaultMessages[appointment.status];
    const message = template.replace(/\{([a-z_]+)\}/g, (match, key: string) => values[key] ?? match);
    try {
      await sendMessage(config, appointment.customerPhone, message);
      return { sent: true };
    } catch {
      request.log.warn({ appointmentId: appointment.id, provider: config.provider }, 'WhatsApp delivery failed');
      return reply.code(502).send({ message: 'Falha no envio WhatsApp' });
    }
  });
}
