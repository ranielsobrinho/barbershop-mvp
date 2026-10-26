import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isAfter, startOfDay, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export {
  format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, addMonths, subMonths, isAfter, startOfDay, formatDistanceToNow,
};

export const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const WEEKDAYS_FULL = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
export const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const BUSINESS_TIME_ZONE = 'America/Fortaleza';
const BUSINESS_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const BUSINESS_TIME_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  timeZone: BUSINESS_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function formatFullDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function formatTime(iso: string): string {
  return format(parseISO(iso), 'HH:mm');
}

export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function monthString(date: Date): string {
  return format(date, 'yyyy-MM');
}

/** Converts an instant to a local Date whose calendar fields are Fortaleza's business date. */
export function getBusinessCalendarDate(value: string | Date): Date {
  const instant = typeof value === 'string' ? parseISO(value) : value;
  const parts = BUSINESS_DATE_FORMATTER.formatToParts(instant);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);
  return new Date(year, month - 1, day);
}

/** Month selector initialized to the current month in the barbershop timezone. */
export function getBusinessMonthStart(now = new Date()): Date {
  const businessToday = getBusinessCalendarDate(now);
  return new Date(businessToday.getFullYear(), businessToday.getMonth(), 1);
}

export function formatBusinessTime(iso: string): string {
  return BUSINESS_TIME_FORMATTER.format(parseISO(iso));
}

export function formatBusinessFullDate(iso: string): string {
  return format(getBusinessCalendarDate(iso), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

/**
 * Builds the date grid for a calendar month. The week starts on Sunday, so
 * `firstDayOffset` is the number of empty cells before the month's first day.
 */
export function getMonthGrid(month: Date): { days: Date[]; firstDayOffset: number } {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  return { days, firstDayOffset: days[0]?.getDay() ?? 0 };
}

/**
 * Filters appointments that fall on a specific day.
 * @param day - Date to match (date only, time ignored)
 * @param appointments - Array of appointments with startsAt ISO string
 * @returns Appointments that occur on the given day
 */
export function getAppointmentsForDay<T extends { startsAt: string }>(day: Date, appointments: T[]): T[] {
  const calendarDate = format(day, 'yyyy-MM-dd');
  return appointments.filter((appointment) =>
    format(getBusinessCalendarDate(appointment.startsAt), 'yyyy-MM-dd') === calendarDate
  );
}

/** Checks block ranges using the same Fortaleza calendar date as appointments. */
export function isDayBlocked(day: Date, blocks: { startsAt: string; endsAt: string }[]): boolean {
  const calendarDate = format(day, 'yyyy-MM-dd');
  return blocks.some((block) => {
    const startDate = format(getBusinessCalendarDate(block.startsAt), 'yyyy-MM-dd');
    const endDate = format(getBusinessCalendarDate(block.endsAt), 'yyyy-MM-dd');
    return calendarDate >= startDate && calendarDate <= endDate;
  });
}
