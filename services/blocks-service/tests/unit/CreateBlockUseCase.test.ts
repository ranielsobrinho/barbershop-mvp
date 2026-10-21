import { describe, it, expect, beforeEach } from 'vitest';
import { CreateBlockUseCase } from '../../src/usecases/CreateBlockUseCase.js';
import { Block } from '../../src/domain/entities/Block.js';
import { ValidationError } from '../../src/domain/errors/DomainError.js';
import { IBlockRepository } from '../../src/domain/repositories/IBlockRepository.js';
import { IAppointmentRepository } from '../../src/domain/repositories/IAppointmentRepository.js';

class MockBlockRepository implements IBlockRepository {
  private blocks: Map<string, Block> = new Map();

  async findAll(): Promise<Block[]> {
    return Array.from(this.blocks.values());
  }

  async findByPeriod(start: Date, end: Date): Promise<Block[]> {
    return Array.from(this.blocks.values()).filter(
      b => b.startsAt < end && b.endsAt > start
    );
  }

  async create(block: Block): Promise<Block> {
    this.blocks.set(block.id, block);
    return block;
  }

  async delete(id: string): Promise<void> {
    this.blocks.delete(id);
  }

  addBlock(block: Block) {
    this.blocks.set(block.id, block);
  }
}

class MockAppointmentRepository implements IAppointmentRepository {
  private appointments: Array<{ id: string; startsAt: Date; endsAt: Date }> = [];

  async findByPeriod(start: Date, end: Date): Promise<Array<{ id: string; startsAt: Date; endsAt: Date }>> {
    return this.appointments.filter(a => a.startsAt < end && a.endsAt > start);
  }

  addAppointment(appointment: { id: string; startsAt: Date; endsAt: Date }) {
    this.appointments.push(appointment);
  }
}

describe('CreateBlockUseCase', () => {
  let useCase: CreateBlockUseCase;
  let blockRepo: MockBlockRepository;
  let appointmentRepo: MockAppointmentRepository;

  beforeEach(() => {
    blockRepo = new MockBlockRepository();
    appointmentRepo = new MockAppointmentRepository();
    useCase = new CreateBlockUseCase(blockRepo, appointmentRepo);
  });

  it('cria bloqueio válido', async () => {
    const startsAt = new Date('2025-01-15T09:00:00');
    const endsAt = new Date('2025-01-15T12:00:00');
    const result = await useCase.execute({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), reason: 'Manutenção' });

    expect(result.block).toBeInstanceOf(Block);
    expect(result.block.startsAt).toEqual(startsAt);
    expect(result.block.endsAt).toEqual(endsAt);
    expect(result.block.reason).toBe('Manutenção');
    expect(result.affectedAppointments).toEqual([]);
  });

  it('lança ValidationError para data inicial inválida', async () => {
    await expect(useCase.execute({ startsAt: 'invalid', endsAt: '2025-01-15T12:00:00' }))
      .rejects.toThrow(ValidationError);
  });

  it('lança ValidationError para data final inválida', async () => {
    await expect(useCase.execute({ startsAt: '2025-01-15T09:00:00', endsAt: 'invalid' }))
      .rejects.toThrow(ValidationError);
  });

  it('lança ValidationError quando data final é anterior à inicial', async () => {
    const startsAt = new Date('2025-01-15T12:00:00');
    const endsAt = new Date('2025-01-15T09:00:00');
    await expect(useCase.execute({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() }))
      .rejects.toThrow(ValidationError);
  });

  it('lança ValidationError quando data final é igual à inicial', async () => {
    const startsAt = new Date('2025-01-15T09:00:00');
    const endsAt = new Date('2025-01-15T09:00:00');
    await expect(useCase.execute({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() }))
      .rejects.toThrow(ValidationError);
  });

  it('retorna agendamentos afetados quando há conflito', async () => {
    const startsAt = new Date('2025-01-15T09:00:00');
    const endsAt = new Date('2025-01-15T12:00:00');
    appointmentRepo.addAppointment({ id: 'apt-1', startsAt: new Date('2025-01-15T10:00:00'), endsAt: new Date('2025-01-15T11:00:00') });
    appointmentRepo.addAppointment({ id: 'apt-2', startsAt: new Date('2025-01-15T13:00:00'), endsAt: new Date('2025-01-15T14:00:00') }); // fora do período

    const result = await useCase.execute({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() });

    expect(result.affectedAppointments).toHaveLength(1);
    expect(result.affectedAppointments[0].id).toBe('apt-1');
  });

  it('não retorna agendamentos afetados quando skipConflictCheck é true', async () => {
    const startsAt = new Date('2025-01-15T09:00:00');
    const endsAt = new Date('2025-01-15T12:00:00');
    appointmentRepo.addAppointment({ id: 'apt-1', startsAt: new Date('2025-01-15T10:00:00'), endsAt: new Date('2025-01-15T11:00:00') });

    const result = await useCase.execute(
      { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() },
      { skipConflictCheck: true }
    );

    expect(result.affectedAppointments).toEqual([]);
  });

  it('trim no reason', async () => {
    const startsAt = new Date('2025-01-15T09:00:00');
    const endsAt = new Date('2025-01-15T12:00:00');
    const result = await useCase.execute({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), reason: '  Manutenção  ' });

    expect(result.block.reason).toBe('Manutenção');
  });

  it('reason undefined vira null', async () => {
    const startsAt = new Date('2025-01-15T09:00:00');
    const endsAt = new Date('2025-01-15T12:00:00');
    const result = await useCase.execute({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() });

    expect(result.block.reason).toBeNull();
  });
});
