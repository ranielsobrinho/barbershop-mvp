import { useMemo } from 'react';
import { StatusBadge } from '../ui/Badge';
import { formatTime, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, MONTHS, WEEKDAYS_SHORT } from '../../utils/date';
import { STATUS_DOT } from '../../utils/constants';
import type { Appointment } from '../../services/publicApi';
import type { Block } from '../../services/adminApi';

interface Props {
  appointments: Appointment[];
  blocks: Block[];
  onAppointmentClick: (a: Appointment) => void;
}

export function MonthlyCalendar({ appointments, blocks, onAppointmentClick }: Props) {
  const today = new Date();

  const days = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    return eachDayOfInterval({ start, end });
  }, []);

  const getDayAppointments = (day: Date) =>
    appointments.filter((a) => isSameDay(parseISO(a.startsAt), day));

  const isDayBlocked = (day: Date) =>
    blocks.some((b) => {
      const s = new Date(b.startsAt);
      const e = new Date(b.endsAt);
      return day >= new Date(s.getFullYear(), s.getMonth(), s.getDate()) &&
             day <= new Date(e.getFullYear(), e.getMonth(), e.getDate());
    });

  const firstDayOffset = (days[0]?.getDay() || 0);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs text-gray-400 font-medium">
        {WEEKDAYS_SHORT.map((w) => <div key={w}>{w}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`e${i}`} />)}

        {days.map((day) => {
          const dayAppts = getDayAppointments(day);
          const blocked = isDayBlocked(day);
          const isToday = isSameDay(day, today);

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[90px] sm:min-h-[110px] border rounded-xl p-1.5 sm:p-2 transition ${
                blocked ? 'bg-red-50 border-red-200' : isToday ? 'bg-primary-50 border-primary-300' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs sm:text-sm font-semibold ${isToday ? 'text-primary-700' : 'text-gray-700'}`}>
                  {day.getDate()}
                </span>
                {blocked && <span className="text-xs" title="Dia bloqueado">🚫</span>}
              </div>

              <div className="space-y-1 overflow-y-auto max-h-20 sm:max-h-28">
                {dayAppts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onAppointmentClick(a)}
                    className={`w-full text-left text-[10px] sm:text-xs px-1.5 py-1 rounded-md border hover:opacity-80 transition flex items-center gap-1 ${
                      a.status === 'CANCELADO' ? 'bg-gray-50 text-gray-400 border-gray-200 line-through' :
                      'bg-white text-gray-700 border-gray-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[a.status] || 'bg-gray-400'}`} />
                    <span className="font-medium">{formatTime(a.startsAt)}</span>
                    <span className="truncate hidden sm:inline">{a.customerName}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Aguardando</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Confirmado</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Cancelado</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Reagendado</span>
        <span className="flex items-center gap-1">🚫 Dia bloqueado</span>
      </div>
    </div>
  );
}
