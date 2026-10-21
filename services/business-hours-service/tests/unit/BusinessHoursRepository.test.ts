import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockFindMany, mockUpsert } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockUpsert: vi.fn(),
}));

vi.mock('../../src/infrastructure/database/prisma.js', () => ({
  default: {
    businessHours: {
      findMany: mockFindMany,
      upsert: mockUpsert,
    },
  },
}));

import { PrismaBusinessHoursRepository } from '../../src/infrastructure/repositories/PrismaBusinessHoursRepository.js';

describe('PrismaBusinessHoursRepository', () => {
  let repo: PrismaBusinessHoursRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new PrismaBusinessHoursRepository();
  });

  describe('findAll', () => {
    it('retorna horários ordenados por weekday', async () => {
      const rows = [
        { id: '1', weekday: 2, opensAt: '09:00', closesAt: '18:00', breakStart: '12:00', breakEnd: '13:00', active: true },
        { id: '2', weekday: 0, opensAt: '09:00', closesAt: '18:00', breakStart: null, breakEnd: null, active: false },
        { id: '3', weekday: 1, opensAt: '09:00', closesAt: '18:00', breakStart: '12:00', breakEnd: '13:00', active: true },
      ];
      mockFindMany.mockResolvedValue(rows);

      const result = await repo.findAll();

      expect(mockFindMany).toHaveBeenCalledWith({ orderBy: { weekday: 'asc' } });
      expect(result).toEqual(rows);
    });

    it('retorna array vazio quando não há horários', async () => {
      mockFindMany.mockResolvedValue([]);
      const result = await repo.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('upsert', () => {
    it('faz upsert com dados corretos', async () => {
      const input = {
        weekday: 1,
        opensAt: '09:00',
        closesAt: '18:00',
        breakStart: '12:00',
        breakEnd: '13:00',
        active: true,
      };
      const expected = { id: 'uuid-1', ...input };
      mockUpsert.mockResolvedValue(expected);

      const result = await repo.upsert(input);

      expect(mockUpsert).toHaveBeenCalledWith({
        where: { weekday: 1 },
        update: input,
        create: input,
      });
      expect(result).toEqual(expected);
    });

    it('aceita breakStart/breakEnd null', async () => {
      const input = {
        weekday: 0,
        opensAt: '09:00',
        closesAt: '18:00',
        breakStart: null,
        breakEnd: null,
        active: false,
      };
      const expected = { id: 'uuid-2', ...input };
      mockUpsert.mockResolvedValue(expected);

      const result = await repo.upsert(input);

      expect(result.breakStart).toBeNull();
      expect(result.breakEnd).toBeNull();
      expect(result.active).toBe(false);
    });
  });
});
