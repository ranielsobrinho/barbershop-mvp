import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, CustomerSummary } from '../../services/adminApi';
import { Spinner } from '../../components/ui/Spinner';
import { formatBusinessFullDate, formatBusinessTime } from '../../utils/date';
import { formatMoney } from '../../utils/money';
import { useToast } from '../../contexts/ToastContext';
import { CustomerRebookingModal } from '../../components/admin/CustomerRebookingModal';

const STATUS_LABELS: Record<string, string> = {
  AGUARDANDO_CONFIRMACAO: 'Aguardando confirmação',
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
  REAGENDADO: 'Reagendado',
};

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CustomerSummary | null>(null);
  const [erasing, setErasing] = useState(false);
  const [rebooking, setRebooking] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const customers = useQuery({
    queryKey: ['customers', search],
    queryFn: () => adminApi.listCustomers(search),
  });
  const detail = useQuery({
    queryKey: ['customer', selected?.id],
    queryFn: () => adminApi.getCustomer(selected!.id),
    enabled: !!selected,
  });

  const exportData = async () => {
    if (!selected) return;
    setExporting(true);
    try {
      await adminApi.exportCustomer(selected.id);
    } catch {
      showToast('Não foi possível exportar os dados deste cliente.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const eraseData = async () => {
    if (!selected || !window.confirm(`Excluir ${selected.name} e anonimizar os dados pessoais dos agendamentos históricos? Esta ação não pode ser desfeita.`)) return;
    setErasing(true);
    try {
      await adminApi.eraseCustomer(selected.id);
      setSelected(null);
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      showToast('Dados de contato removidos; os registros do histórico foram mantidos sem nome e telefone.');
    } catch {
      showToast('Não foi possível remover os dados deste cliente.', 'error');
    } finally {
      setErasing(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <p className="text-sm text-gray-500">Histórico de atendimentos e próximos agendamentos</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.9fr)] gap-6 items-start">
        <section className="card" aria-label="Lista de clientes">
          <label htmlFor="customer-search" className="label">Buscar por nome ou telefone</label>
          <input
            id="customer-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="input-field mb-4"
            placeholder="Ex.: Ana ou 85999990000"
          />
          {customers.isLoading ? <Spinner label="Carregando clientes..." /> : null}
          {customers.isError ? <p role="alert" className="text-sm text-red-700">Não foi possível carregar os clientes.</p> : null}
          {!customers.isLoading && !customers.isError && customers.data?.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">Nenhum cliente encontrado.</p>
          ) : null}
          <div className="divide-y divide-gray-100">
            {customers.data?.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => setSelected(customer)}
                aria-pressed={selected?.id === customer.id}
                className={`w-full text-left py-3 px-2 rounded-lg hover:bg-gray-50 ${selected?.id === customer.id ? 'bg-primary-50' : ''}`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-gray-900 truncate">{customer.name}</span>
                  <span className="text-xs text-gray-500 shrink-0">{customer.visitCount} visita(s)</span>
                </span>
                <span className="block text-sm text-gray-500">{customer.phone}</span>
                <span className="block text-xs text-gray-400 mt-1">
                  {customer.nextAppointment
                    ? `Próximo: ${formatBusinessFullDate(customer.nextAppointment.startsAt)} · ${customer.nextAppointment.serviceName}`
                    : customer.lastVisit ? `Última visita: ${formatBusinessFullDate(customer.lastVisit)}` : 'Sem visitas concluídas'}
                </span>
              </button>
            ))}
          </div>
          {(customers.data?.length ?? 0) === 100 && <p className="text-xs text-gray-400 mt-3">Exibindo os primeiros 100 resultados. Refine a busca.</p>}
        </section>

        <section className="card min-h-48" aria-label="Detalhes do cliente">
          {!selected ? <p className="text-sm text-gray-500">Selecione um cliente para ver o histórico.</p> : null}
          {selected && detail.isLoading ? <Spinner label="Carregando histórico..." /> : null}
          {selected && detail.isError ? <p role="alert" className="text-sm text-red-700">Não foi possível carregar o histórico.</p> : null}
          {detail.data && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{detail.data.name}</h2>
                  <p className="text-sm text-gray-500">{detail.data.phone}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={exportData} disabled={exporting} className="btn-secondary text-sm">{exporting ? 'Exportando...' : 'Exportar dados'}</button>
                  <button type="button" onClick={eraseData} disabled={erasing} className="btn-secondary text-sm text-red-700 border-red-200 hover:bg-red-50">
                    {erasing ? 'Removendo...' : 'Excluir dados'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Visitas confirmadas</p>
                  <p className="text-lg font-bold text-gray-900">{detail.data.visitCount}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Última visita</p>
                  <p className="text-sm font-semibold text-gray-900">{detail.data.lastVisit ? formatBusinessFullDate(detail.data.lastVisit) : '—'}</p>
                </div>
              </div>

              <button type="button" onClick={() => setRebooking(true)} className="btn-primary w-full mb-5">
                Agendar novamente
              </button>

              <h3 className="font-semibold text-gray-900 mb-2">Serviços realizados</h3>
              {detail.data.serviceTotals.length ? (
                <ul className="space-y-2 mb-5">
                  {detail.data.serviceTotals.map((item) => (
                    <li key={item.serviceName} className="flex justify-between gap-3 text-sm">
                      <span>{item.serviceName} · {item.count}x</span><span className="font-medium">{formatMoney(item.totalCents)}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-gray-500 mb-5">Ainda não há visitas confirmadas no histórico.</p>}

              <h3 className="font-semibold text-gray-900 mb-2">Histórico de agendamentos</h3>
              {detail.data.appointments.length ? (
                <ol className="space-y-3 max-h-[28rem] overflow-y-auto">
                  {detail.data.appointments.map((appointment) => (
                    <li key={appointment.id} className="border-l-2 border-primary-200 pl-3 py-1">
                      <p className="text-sm font-medium text-gray-900">{appointment.service.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatBusinessFullDate(appointment.startsAt)} às {formatBusinessTime(appointment.startsAt)}
                        {' · '}{STATUS_LABELS[appointment.status] || appointment.status}
                      </p>
                      <p className="text-xs text-gray-500">{formatMoney(appointment.priceCents)}</p>
                    </li>
                  ))}
                </ol>
              ) : <p className="text-sm text-gray-500">Nenhum agendamento encontrado.</p>}
            </>
          )}
        </section>
      </div>
      {rebooking && selected && detail.data ? (
        <CustomerRebookingModal
          customer={{ id: selected.id, name: detail.data.name, phone: detail.data.phone }}
          initialServiceId={detail.data.rebookingServiceId}
          onClose={() => setRebooking(false)}
        />
      ) : null}
    </div>
  );
}
