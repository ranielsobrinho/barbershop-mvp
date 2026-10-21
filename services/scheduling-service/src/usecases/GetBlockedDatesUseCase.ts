import { IBlockRepository } from '../domain/repositories/IBlockRepository.js';
import { ValidationError } from '../domain/errors/DomainError.js';
import { format, parse, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

const TIMEZONE = 'America/Fortaleza';

export class GetBlockedDatesUseCase {
  constructor(private readonly blockRepo: IBlockRepository) {}

  /** Retorna datas (YYYY-MM-DD) totalmente bloqueadas do mês. */
  async execute(monthStr: string): Promise<string[]> {
    const match = /^(\d{4})-(\d{2})$/.exec(monthStr);
    if (!match) throw new ValidationError('Mês deve estar no formato YYYY-MM');

    const monthDate = parse(monthStr, 'yyyy-MM', new Date());
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);

    const blocks = await this.blockRepo.findByPeriod(start, end);
    if (blocks.length === 0) return [];

    const blockedDates = new Set<string>();
    for (const day of eachDayOfInterval({ start, end })) {
      const y = day.getFullYear();
      const mo = day.getMonth();
      const d = day.getDate();

      // Fronteiras do dia no fuso America/Fortaleza (independente da máquina)
      const dayStart = fromZonedTime(new Date(y, mo, d, 0, 0, 0, 0), TIMEZONE);
      const dayEnd = fromZonedTime(new Date(y, mo, d, 23, 59, 59, 999), TIMEZONE);

      const coversDay = blocks.some(b => b.startsAt <= dayStart && b.endsAt >= dayEnd);
      if (coversDay) {
        blockedDates.add(format(day, 'yyyy-MM-dd'));
      }
    }

    return [...blockedDates];
  }
}
