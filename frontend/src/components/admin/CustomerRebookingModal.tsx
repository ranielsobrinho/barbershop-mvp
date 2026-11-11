import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServices } from '../../hooks/useServices';
import { useAvailability } from '../../hooks/useAvailability';
import { publicApi } from '../../services/publicApi';
import { Spinner } from '../ui/Spinner';
import { formatMoney } from '../../utils/money';
import { getBusinessCalendarDate, toDateString } from '../../utils/date';
import { useToast } from '../../contexts/ToastContext';

interface Props {
  customer: { id: string; name: string; phone: string };
  initialServiceId: string | null;
  onClose: () => void;
}

export function CustomerRebookingModal({ customer, initialServiceId, onClose }: Props) {
  const [serviceId, setServiceId] = useState(initialServiceId ?? '');
  const [date, setDate] = useState(() => toDateString(getBusinessCalendarDate(new Date())));
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);
  const { data: services = [], isLoading: loadingServices } = useServices();
  const availability = useAvailability(date, serviceId || null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const submit = async () => {
    if (!serviceId || !date || !time) return;
    setSaving(true);
    try {
      await publicApi.createAppointment({
        serviceId,
        customerName: customer.name,
        customerPhone: customer.phone,
        startsAt: new Date(`${date}T${time}:00-03:00`).toISOString(),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customer', customer.id] }),
        queryClient.invalidateQueries({ queryKey: ['customers'] }),
        queryClient.invalidateQueries({ queryKey: ['availability'] }),
      ]);
      showToast('Novo agendamento criado com sucesso.');
      onClose();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Não foi possível criar o agendamento.', 'error');
      if (error.response?.status === 409) void availability.refetch();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="rebooking-title" className="card w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 id="rebooking-title" className="text-xl font-bold text-gray-900">Agendar novamente</h2>
            <p className="text-sm text-gray-500">Novo horário para {customer.name}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Fechar">×</button>
        </div>

        {loadingServices ? <Spinner label="Carregando serviços..." /> : (
          <div className="space-y-4">
            <div>
              <label htmlFor="rebooking-service" className="label">Serviço</label>
              <select id="rebooking-service" className="input-field" value={serviceId} onChange={(event) => { setServiceId(event.target.value); setTime(''); }}>
                <option value="">Selecione um serviço</option>
                {services.filter((service) => service.active).map((service) => (
                  <option key={service.id} value={service.id}>{service.name} · {formatMoney(service.priceCents)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="rebooking-date" className="label">Data</label>
              <input id="rebooking-date" type="date" className="input-field" min={toDateString(getBusinessCalendarDate(new Date()))} value={date} onChange={(event) => { setDate(event.target.value); setTime(''); }} />
            </div>
            <div>
              <span className="label">Horário disponível</span>
              {!serviceId ? <p className="text-sm text-gray-500">Selecione um serviço para consultar os horários.</p>
                : availability.isLoading ? <Spinner label="Consultando horários..." />
                  : availability.isError ? <p role="alert" className="text-sm text-red-700">Não foi possível consultar os horários.</p>
                    : availability.data?.length ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" role="group" aria-label="Horários disponíveis">
                        {availability.data.map((slot) => (
                          <button key={slot.start} type="button" aria-pressed={time === slot.start} onClick={() => setTime(slot.start)} className={`rounded-lg border px-3 py-2 text-sm ${time === slot.start ? 'border-primary-600 bg-primary-50 text-primary-800' : 'border-gray-200 hover:border-primary-400'}`}>
                            {slot.start}
                          </button>
                        ))}
                      </div>
                    ) : <p className="text-sm text-gray-500">Nenhum horário disponível nesta data.</p>}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
              <button type="button" onClick={submit} disabled={!serviceId || !date || !time || saving} className="btn-primary">
                {saving ? 'Agendando...' : 'Criar agendamento'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
