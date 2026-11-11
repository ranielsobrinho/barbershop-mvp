import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../src/contexts/ToastContext';
import { CustomersPage } from '../../src/pages/admin/CustomersPage';
import { adminApi, type CustomerDetail, type CustomerSummary } from '../../src/services/adminApi';
import { publicApi } from '../../src/services/publicApi';

const customer: CustomerSummary = {
  id: 'customer-1',
  name: 'Rita Souza',
  phone: '85912345678',
  createdAt: '2026-10-01T10:00:00.000Z',
  visitCount: 2,
  lastVisit: '2026-11-01T12:00:00.000Z',
  nextAppointment: null,
};

const detail: CustomerDetail = {
  ...customer,
  nextAppointment: null,
  serviceTotals: [{ serviceName: 'Corte', count: 2, totalCents: 6000 }],
  rebookingServiceId: 'service-corte',
  appointments: [],
};

function renderCustomersPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider><CustomersPage /></ToastProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe('customer directory', () => {
  it('opens rebooking modal with service, date and available times', async () => {
    vi.spyOn(adminApi, 'listCustomers').mockResolvedValue([customer]);
    vi.spyOn(adminApi, 'getCustomer').mockResolvedValue(detail);
    vi.spyOn(publicApi, 'getServices').mockResolvedValue([{ id: 'service-corte', name: 'Corte', description: null, priceCents: 3000, slotMin: 30, active: true }]);
    vi.spyOn(publicApi, 'getAvailability').mockResolvedValue([{ start: '09:00', end: '09:30' }]);

    renderCustomersPage();
    fireEvent.click(await screen.findByRole('button', { name: /Rita Souza/ }));

    expect(await screen.findByText('Serviços realizados')).toBeInTheDocument();
    expect(screen.getByText('Corte · 2x')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Agendar novamente' }));
    expect(await screen.findByRole('dialog', { name: 'Agendar novamente' })).toBeInTheDocument();
    expect(await screen.findByLabelText('Serviço')).toHaveValue('service-corte');
    expect(screen.getByLabelText('Data')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: '09:00' })).toBeInTheDocument();
  });

  it('exports and erases personal data after confirmation', async () => {
    vi.spyOn(adminApi, 'listCustomers').mockResolvedValue([customer]);
    vi.spyOn(adminApi, 'getCustomer').mockResolvedValue(detail);
    const exportCustomer = vi.spyOn(adminApi, 'exportCustomer').mockResolvedValue();
    const eraseCustomer = vi.spyOn(adminApi, 'eraseCustomer').mockResolvedValue();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderCustomersPage();
    fireEvent.click(await screen.findByRole('button', { name: /Rita Souza/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Exportar dados' }));
    await waitFor(() => expect(exportCustomer).toHaveBeenCalledWith('customer-1'));

    fireEvent.click(screen.getByRole('button', { name: 'Excluir dados' }));
    await waitFor(() => expect(eraseCustomer).toHaveBeenCalledWith('customer-1'));
    expect(await screen.findByText('Dados de contato removidos; os registros do histórico foram mantidos sem nome e telefone.')).toBeInTheDocument();
  });
});
