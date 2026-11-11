import { describe, expect, it, vi } from 'vitest';
import { CreateAppointmentUseCase } from '../../src/usecases/CreateAppointmentUseCase.js';

describe('CreateAppointmentUseCase customer identity', () => {
  it('upserts by normalized phone and keeps the booking name and phone snapshot', async () => {
    const customerUpsert = vi.fn().mockResolvedValue({ id: 'customer-1' });
    const appointmentCreate = vi.fn().mockImplementation(async ({ data }) => ({
      ...data,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }));
    const tx = {
      appointment: { findMany: vi.fn().mockResolvedValue([]), create: appointmentCreate },
      block: { findMany: vi.fn().mockResolvedValue([]) },
      customer: { upsert: customerUpsert },
    };
    const appointmentRepo = {
      countByPhone: vi.fn().mockResolvedValue(0),
      withSlotLock: vi.fn((_startsAt: Date, callback: (transaction: any) => Promise<any>) => callback(tx)),
    };
    const serviceRepo = {
      findById: vi.fn().mockResolvedValue({ id: 'service-1', active: true, slotMin: 30, priceCents: 4000 }),
    };
    const settingsRepo = { get: vi.fn().mockResolvedValue({ minNoticeHours: 0, maxDaysAhead: 60 }) };
    const availability = { assertBookable: vi.fn().mockResolvedValue(undefined) };
    const useCase = new CreateAppointmentUseCase(
      appointmentRepo as any,
      serviceRepo as any,
      settingsRepo as any,
      availability as any,
    );
    const startsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const appointment = await useCase.execute({
      serviceId: 'service-1',
      customerName: '  Rita Souza  ',
      customerPhone: '+55 (85) 91234-5678',
      startsAt,
    });

    expect(appointment.customerName).toBe('Rita Souza');
    expect(appointment.customerPhone).toBe('85912345678');
    expect(customerUpsert).toHaveBeenCalledWith({
      where: { phone: '85912345678' },
      update: { name: 'Rita Souza' },
      create: { name: 'Rita Souza', phone: '85912345678' },
      select: { id: true },
    });
    expect(appointmentCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        customerId: 'customer-1',
        customerName: 'Rita Souza',
        customerPhone: '85912345678',
      }),
    }));
  });
});
