import type { Appointment } from '../../services/publicApi';
import { formatMoney } from '../../utils/money';
import { formatFullDate, formatTime, parseISO } from '../../utils/date';

interface Props {
  appointment: Appointment;
  onNew: () => void;
}

export function ConfirmationPage({ appointment, onNew }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="card max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Agendamento recebido!</h1>
        <p className="text-gray-500 mb-6">Você receberá a confirmação em breve.</p>

        <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Serviço</span>
            <span className="font-semibold text-gray-900">{appointment.service?.name || 'Serviço'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Data</span>
            <span className="font-semibold text-gray-900">{formatFullDate(appointment.startsAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Horário</span>
            <span className="font-semibold text-gray-900">{formatTime(appointment.startsAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Valor</span>
            <span className="font-semibold text-gray-900">{formatMoney(appointment.priceCents)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="text-gray-500">Status</span>
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
              Aguardando confirmação
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Guarde este horário. Em caso de dúvida, entre em contato com a barbearia.
        </p>

        <button onClick={onNew} className="btn-primary w-full mt-6">Fazer novo agendamento</button>
      </div>
    </div>
  );
}
