import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsPage } from '../../src/pages/admin/SettingsPage';
const mocks = vi.hoisted(() => ({ save: vi.fn(), failed: false }));
vi.mock('../../src/hooks/useSettings', () => ({ useSettings: () => ({}), useUpdateSettings: () => ({}) }));
const hours: never[] = [];
vi.mock('../../src/hooks/useBusinessHours', () => ({ useBusinessHours: () => ({ data: hours }), useUpdateBusinessHours: () => ({}) }));
const integration = { provider: 'WAME', wameApiKeyConfigured: true, zapsterApiTokenConfigured: false, zapsterInstanceId: null };
vi.mock('../../src/hooks/useWhatsAppIntegration', () => ({
  useWhatsAppIntegration: () => ({ data: mocks.failed ? undefined : integration, isError: mocks.failed }),
  useUpdateWhatsAppIntegration: () => ({ mutateAsync: mocks.save, isPending: false }),
}));
beforeEach(() => { mocks.save.mockReset().mockResolvedValue(integration); mocks.failed = false; });
describe('WhatsApp settings form', () => {
  it('preserves saved credentials when the field is blank', async () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar integração WhatsApp' }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith({ provider: 'WAME' }));
  });
  it('requires credentials for an unconfigured provider', () => {
    render(<SettingsPage />);
    fireEvent.change(screen.getByLabelText('Provedor'), { target: { value: 'ZAPSTER' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar integração WhatsApp' }));
    expect(screen.getByText('Bearer token Zapster é obrigatório')).toBeInTheDocument();
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('prevents saving after a failed load', () => {
    mocks.failed = true;
    render(<SettingsPage />);
    expect(screen.getByRole('button', { name: 'Salvar integração WhatsApp' })).toBeDisabled();
  });
});
