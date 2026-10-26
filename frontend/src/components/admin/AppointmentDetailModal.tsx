import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { DateInput } from '../ui/DateInput';
import { StatusBadge } from '../ui/Badge';
import { useUpdateStatus, useReschedule } from '../../hooks/useAppointments';
import { formatMoney } from '../../utils/money';
import { formatBusinessFullDate, formatBusinessTime, getBusinessCalendarDate, toDateString } from '../../utils/date';
import { parseDateInput } from '../../utils/dateInput';
import { STATUS_LABELS } from '../../utils/constants';
import type { Appointment } from '../../services/publicApi';

interface Props {
  appointment: Appointment | null;
  onClose: () => void;
}

export function AppointmentDetailModal({ appointment, onClose }: Props) {
  const updateStatus = useUpdateStatus();
  const reschedule = useReschedule();
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const newDateIso = parseDateInput(newDate);
  const minDate = toDateString(getBusinessCalendarDate(new Date()));

  if (!appointment) return null;

  const digits = appointment.customerPhone.replace(/\D/g, '');
  const whatsappLink = digits.length >= 10
    ? `https://wa.me/55${digits}?text=${encodeURIComponent(`Olá ${appointment.customerName}, sobre seu agendamento...`)}`
    : null;

  const handleStatus = async (status: string) => {
    setError(null);
    try {
      await updateStatus.mutateAsync({ id: appointment.id, status });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao alterar status');
    }
  };

  const handleReschedule = async () => {
    if (!newDateIso || !newTime || newDateIso < minDate) {
      setError('Informe uma data válida a partir de hoje no formato DD/MM/AAAA e um horário.');
      return;
    }
    setError(null);
    try {
      const d = new Date(`${newDateIso}T${newTime}:00-03:00`);
      await reschedule.mutateAsync({ id: appointment.id, newStartsAt: d.toISOString() });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao reagendar');
    }
  };

  return (
    <Modal open={!!appointment} onClose={onClose} title="Detalhes do agendamento">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{appointment.customerName}</h3>
          <StatusBadge status={appointment.status} />
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Serviço</span>
            <span className="font-medium">{appointment.service?.name || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Data</span>
            <span className="font-medium">{formatBusinessFullDate(appointment.startsAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Horário</span>
            <span className="font-medium">{formatBusinessTime(appointment.startsAt)} — {formatBusinessTime(appointment.endsAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Valor</span>
            <span className="font-bold">{formatMoney(appointment.priceCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Telefone</span>
            <span className="font-medium">{appointment.customerPhone}</span>
          </div>
          {appointment.previousStartsAt && (
            <div className="flex justify-between">
              <span className="text-gray-500">Horário anterior</span>
              <span className="font-medium text-gray-400 line-through">{formatBusinessTime(appointment.previousStartsAt)}</span>
            </div>
          )}
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

        {/* Ações */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Alterar status</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleStatus(key)}
                disabled={appointment.status === key || updateStatus.isPending}
                className="btn-secondary text-xs py-2.5 disabled:opacity-40"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Reagendar */}
        <div className="border-t pt-4">
          {!showReschedule ? (
            <button onClick={() => setShowReschedule(true)} className="btn-secondary w-full text-sm">
              📅 Reagendar
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Novo horário</p>
              <div className="grid grid-cols-2 gap-2">
                <DateInput
                  id="appointment-reschedule-date"
                  value={newDate}
                  onChange={setNewDate}
                  className="input-field text-sm"
                  minDate={minDate}
                  aria-label="Nova data (DD/MM/AAAA)"
                />
                <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="input-field text-sm" aria-label="Novo horário" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowReschedule(false)} className="btn-secondary flex-1 text-sm">Cancelar</button>
                <button onClick={handleReschedule} disabled={!newDateIso || newDateIso < minDate || !newTime || reschedule.isPending} className="btn-primary flex-1 text-sm">
                  {reschedule.isPending ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          )}
        </div>

        {whatsappLink && (
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
            className="block text-center bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition text-sm">
            💬 Abrir WhatsApp
          </a>
        )}
      </div>
    </Modal>
  );
}
