import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsPage } from '../../src/pages/admin/SettingsPage';
import { ToastProvider } from '../../src/contexts/ToastContext';
const mocks = vi.hoisted(() => ({ save: vi.fn(), failed: false }));
vi.mock('../../src/hooks/useSettings', () => ({ useSettings: () => ({}), useUpdateSettings: () => ({}) }));
const hours: never[] = [];
vi.mock('../../src/hooks/useBusinessHours', () => ({ useBusinessHours: () => ({ data: hours }), useUpdateBusinessHours: () => ({}) }));
const integration = {
  provider: 'WAME', wameApiKeyConfigured: true, zapsterApiTokenConfigured: false, zapsterInstanceId: null,
  messageAwaitingConfirmation: null, messageConfirmed: null, messageCancelled: null, messageRescheduled: null,
  reminderEnabled: false, reminderHoursBefore: 24, messageReminder: null,
};
vi.mock('../../src/hooks/useWhatsAppIntegration', () => ({
  useWhatsAppIntegration: () => ({ data: mocks.failed ? undefined : integration, isError: mocks.failed }),
  useUpdateWhatsAppIntegration: () => ({ mutateAsync: mocks.save, isPending: false }),
}));
beforeEach(() => { mocks.save.mockReset().mockResolvedValue(integration); mocks.failed = false; });
const renderSettings = () => render(<ToastProvider><SettingsPage /></ToastProvider>);
describe('WhatsApp settings form', () => {
  it('shows and saves default messages for every appointment phase', async () => {
    renderSettings();

    expect(screen.getByLabelText('Aguardando confirmação')).toHaveValue(
      'Olá, {nome}! Recebemos seu agendamento de {servico} para {data} às {hora}. Estamos aguardando confirmação.',
    );
    expect(screen.getByLabelText('Confirmado')).toHaveValue(
      'Olá, {nome}! Seu agendamento de {servico} para {data} às {hora} foi confirmado.',
    );
    expect(screen.getByLabelText('Cancelado')).toHaveValue(
      'Olá, {nome}. Seu agendamento de {servico} para {data} às {hora} foi cancelado.',
    );
    expect(screen.getByLabelText('Reagendado')).toHaveValue(
      'Olá, {nome}! Seu agendamento de {servico} foi reagendado. Novo horário: {data} às {hora}. Horário anterior: {horario_anterior}.',
    );
    expect(screen.getByLabelText('Texto do lembrete')).toHaveValue(
      'Olá, {nome}! Lembrete: seu agendamento de {servico} está marcado para {data}, às {hora}. Esperamos você!',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Salvar integração WhatsApp' }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith({
      provider: 'WAME',
      messageAwaitingConfirmation: 'Olá, {nome}! Recebemos seu agendamento de {servico} para {data} às {hora}. Estamos aguardando confirmação.',
      messageConfirmed: 'Olá, {nome}! Seu agendamento de {servico} para {data} às {hora} foi confirmado.',
      messageCancelled: 'Olá, {nome}. Seu agendamento de {servico} para {data} às {hora} foi cancelado.',
      messageRescheduled: 'Olá, {nome}! Seu agendamento de {servico} foi reagendado. Novo horário: {data} às {hora}. Horário anterior: {horario_anterior}.',
      reminderEnabled: false,
      reminderHoursBefore: 24,
      messageReminder: 'Olá, {nome}! Lembrete: seu agendamento de {servico} está marcado para {data}, às {hora}. Esperamos você!',
    }));
  });
  it('requires credentials for an unconfigured provider', () => {
    renderSettings();
    fireEvent.change(screen.getByLabelText('Provedor'), { target: { value: 'ZAPSTER' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar integração WhatsApp' }));
    expect(screen.getByText('Bearer token Zapster é obrigatório').closest('[role="alert"]')).toBeInTheDocument();
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('prevents saving after a failed load', () => {
    mocks.failed = true;
    renderSettings();
    expect(screen.getByRole('button', { name: 'Salvar integração WhatsApp' })).toBeDisabled();
  });
});
