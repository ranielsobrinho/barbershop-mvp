import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { DateInput } from '../ui/DateInput';
import { StatusBadge } from '../ui/Badge';
import { useUpdateStatus, useReschedule, useAppointmentReminder, useRetryAppointmentReminder } from '../../hooks/useAppointments';
import { formatMoney } from '../../utils/money';
import { formatBusinessFullDate, formatBusinessTime, getBusinessCalendarDate, toDateString } from '../../utils/date';
import { parseDateInput } from '../../utils/dateInput';
import { STATUS_LABELS } from '../../utils/constants';
import { useToast } from '../../contexts/ToastContext';
import type { Appointment } from '../../services/publicApi';

interface Props {
  appointment: Appointment | null;
  onClose: () => void;
}

export function AppointmentDetailModal({ appointment, onClose }: Props) {
  const { showToast } = useToast();
  const updateStatus = useUpdateStatus();
  const reschedule = useReschedule();
  const reminderQuery = useAppointmentReminder(appointment?.id ?? null);
  const retryReminder = useRetryAppointmentReminder();
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const newDateIso = parseDateInput(newDate);
  const minDate = toDateString(getBusinessCalendarDate(new Date()));

  useEffect(() => {
    if (reminderQuery.isError) showToast('Não foi possível carregar o status do lembrete.', 'error');
  }, [reminderQuery.isError, showToast]);

  if (!appointment) return null;

  const digits = appointment.customerPhone.replace(/\D/g, '');
  const whatsappLink = digits.length >= 10
    ? `https://wa.me/55${digits}?text=${encodeURIComponent(`Olá ${appointment.customerName}, sobre seu agendamento...`)}`
    : null;

  const handleStatus = async (status: string) => {
    setError(null);
    try {
      await updateStatus.mutateAsync({ id: appointment.id, status });
      showToast(`Status do agendamento atualizado: ${STATUS_LABELS[status] || status}.`);
      onClose();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao alterar status';
      setError(message);
      showToast(message, 'error');
    }
  };

  const handleReschedule = async () => {
    if (!newDateIso || !newTime || newDateIso < minDate) {
      const message = 'Informe uma data válida a partir de hoje no formato DD/MM/AAAA e um horário.';
      setError(message);
      showToast(message, 'error');
      return;
    }
    setError(null);
    try {
      const d = new Date(`${newDateIso}T${newTime}:00-03:00`);
      await reschedule.mutateAsync({ id: appointment.id, newStartsAt: d.toISOString() });
      showToast('Agendamento reagendado com sucesso.');
      onClose();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao reagendar';
      setError(message);
      showToast(message, 'error');
    }
  };

  const handleRetryReminder = async () => {
    if (!appointment) return;
    setReminderError(null);
    try {
      await retryReminder.mutateAsync(appointment.id);
      showToast('Nova tentativa de envio do lembrete agendada.');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Não foi possível agendar uma nova tentativa.';
      setReminderError(message);
      showToast(message, 'error');
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

        <section className="rounded-xl border border-gray-200 p-4 space-y-2" aria-label="Lembrete do agendamento">
          <h4 className="font-semibold text-gray-900">Lembrete por WhatsApp</h4>
          {reminderQuery.isLoading && <p className="text-sm text-gray-500">Carregando status do lembrete…</p>}
          {reminderQuery.isError && <p className="text-sm text-red-700">Não foi possível carregar o status do lembrete.</p>}
          {!reminderQuery.isLoading && !reminderQuery.isError && !reminderQuery.data && (
            <p className="text-sm text-gray-500">Nenhum lembrete foi agendado para este horário.</p>
          )}
          {reminderQuery.data && (
            <>
              <p className="text-sm text-gray-700">
                {({ PENDING: 'Agendado', PROCESSING: 'Enviando', SENT: 'Enviado', FAILED: 'Falha no envio', CANCELLED: 'Cancelado' } as const)[reminderQuery.data.status]}
                {' · '}{formatBusinessFullDate(reminderQuery.data.scheduledAt)} às {formatBusinessTime(reminderQuery.data.scheduledAt)}
              </p>
              {reminderQuery.data.status === 'FAILED' && (
                <>
                  <p className="text-xs text-red-700">{reminderQuery.data.lastError || 'O envio falhou.'} ({reminderQuery.data.attemptCount} tentativas)</p>
                  <button type="button" onClick={handleRetryReminder} disabled={retryReminder.isPending} className="btn-secondary text-sm">
                    {retryReminder.isPending ? 'Agendando nova tentativa…' : 'Tentar envio novamente'}
                  </button>
                </>
              )}
              {reminderQuery.data.status === 'SENT' && reminderQuery.data.providerResponseCode && (
                <p className="text-xs text-gray-500">Resposta do provedor: HTTP {reminderQuery.data.providerResponseCode}</p>
              )}
            </>
          )}
          {reminderError && <p role="alert" className="text-sm text-red-700">{reminderError}</p>}
        </section>

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
