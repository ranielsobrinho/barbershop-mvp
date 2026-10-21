import { describe, it, expect, vi } from 'vitest';
import { ConflictChecker } from '../../src/domain/services/ConflictChecker';
import { ConflictError } from '../../src/domain/errors/DomainError';
import { IAppointmentRepository } from '../../src/domain/repositories/IAppointmentRepository';
import { Appointment } from '../../src/domain/entities/Appointment';

function makeAppt(start: Date, end: Date, status: any = 'CONFIRMADO', id = 'x'): Appointment {
  return new Appointment(id, 'svc', 'Cliente', '11999999999', start, end, 3000, status, null, new Date(), new Date());
}

describe('ConflictChecker', () => {
  const start = new Date('2026-10-20T09:00:00Z');
  const end = new Date('2026-10-20T09:30:00Z');

  it('lança ConflictError se há agendamento confirmado sobreposto', async () => {
    const repo: IAppointmentRepository = {
      findConflicting: vi.fn().mockResolvedValue([makeAppt(start, end)]),
    } as any;
    const checker = new ConflictChecker(repo);
    await expect(checker.assertNoConflict(start, end)).rejects.toThrow(ConflictError);
  });

  it('lança ConflictError para status aguardando confirmação (ocupa horário)', async () => {
    const repo: IAppointmentRepository = {
      findConflicting: vi.fn().mockResolvedValue([makeAppt(start, end, 'AGUARDANDO_CONFIRMACAO')]),
    } as any;
    const checker = new ConflictChecker(repo);
    await expect(checker.assertNoConflict(start, end)).rejects.toThrow(ConflictError);
  });

  it('não lança erro se não há conflito', async () => {
    const repo: IAppointmentRepository = {
      findConflicting: vi.fn().mockResolvedValue([]),
    } as any;
    const checker = new ConflictChecker(repo);
    await expect(checker.assertNoConflict(start, end)).resolves.toBeUndefined();
  });

  it('cancelado não bloqueia (findConflicting já filtra por status ocupante)', async () => {
    const repo: IAppointmentRepository = {
      findConflicting: vi.fn().mockResolvedValue([
        makeAppt(start, end, 'CANCELADO'),
      ]),
    } as any;
    const checker = new ConflictChecker(repo);
    // status CANCELADO não ocupa → não gera conflito
    await expect(checker.assertNoConflict(start, end)).resolves.toBeUndefined();
  });

  it('passa excludeId para o repositório (reagendar não conflita consigo mesmo)', async () => {
    const repo: IAppointmentRepository = {
      findConflicting: vi.fn().mockResolvedValue([]),
    } as any;
    const checker = new ConflictChecker(repo);
    await checker.assertNoConflict(start, end, 'appt-1');
    expect(repo.findConflicting).toHaveBeenCalledWith(start, end, 'appt-1');
  });
});
