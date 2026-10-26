import { useState } from 'react';
import { MonthlyCalendar } from '../../components/admin/MonthlyCalendar';
import { AppointmentDetailModal } from '../../components/admin/AppointmentDetailModal';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { useAppointmentsByMonth } from '../../hooks/useAppointments';
import { useBlocks } from '../../hooks/useBlocks';
import { formatBusinessTime, getBusinessCalendarDate, getBusinessMonthStart, monthString, MONTHS, addMonths, subMonths } from '../../utils/date';
import type { Appointment } from '../../services/publicApi';

export function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => getBusinessMonthStart());
  const [selected, setSelected] = useState<Appointment | null>(null);
  const month = monthString(currentMonth);

  const { data: appointments = [], isLoading, error } = useAppointmentsByMonth(month);
  const { data: blocks = [] } = useBlocks(month);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-500">{appointments.length} agendamento(s) em {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="btn-secondary py-2 px-4" aria-label="Mês anterior">‹</button>
          <span className="font-semibold text-gray-900 min-w-40 text-center">{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="btn-secondary py-2 px-4" aria-label="Próximo mês">›</button>
        </div>
      </div>

      <ErrorAlert message={error ? 'Erro ao carregar agendamentos' : null} />

      {isLoading ? (
        <Spinner label="Carregando agenda..." />
      ) : (
        <div className="card">
          <MonthlyCalendar appointments={appointments} blocks={blocks} onAppointmentClick={setSelected} currentMonth={currentMonth} />
        </div>
      )}

      {/* Lista detalhada (mobile) */}
      {appointments.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Todos do mês</h2>
          <div className="space-y-2">
            {appointments.map((a) => {
              const startsAt = getBusinessCalendarDate(a.startsAt);
              return (
                <button key={a.id} onClick={() => setSelected(a)} className="card w-full text-left flex items-center gap-3 hover:border-gray-300 transition">
                  <div className="text-center min-w-14">
                    <p className="text-lg font-bold text-primary-700">{startsAt.getDate()}</p>
                    <p className="text-xs text-gray-400">{MONTHS[startsAt.getMonth()].slice(0, 3)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{a.customerName}</p>
                    <p className="text-sm text-gray-500 truncate">{a.service?.name} · {formatBusinessTime(a.startsAt)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <AppointmentDetailModal appointment={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
