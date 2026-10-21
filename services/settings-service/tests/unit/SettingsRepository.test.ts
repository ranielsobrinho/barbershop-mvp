import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockFindFirst, mockCreate, mockUpdate } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock('../../src/infrastructure/database/prisma.js', () => ({
  default: {
    settings: {
      findFirst: mockFindFirst,
      create: mockCreate,
      update: mockUpdate,
    },
  },
}));

import { PrismaSettingsRepository } from '../../src/infrastructure/repositories/PrismaSettingsRepository.js';

describe('PrismaSettingsRepository', () => {
  let repo: PrismaSettingsRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new PrismaSettingsRepository();
  });

  describe('get', () => {
    it('retorna configurações existentes', async () => {
      const existing = { id: 'default', minNoticeHours: 5, maxDaysAhead: 90, heroText: 'Bem-vindo', heroImageUrl: 'https://example.com/img.jpg' };
      mockFindFirst.mockResolvedValue(existing);

      const result = await repo.get();

      expect(mockFindFirst).toHaveBeenCalled();
      expect(result).toEqual(existing);
    });

    it('cria configurações padrão quando não existem (minNoticeHours=2, maxDaysAhead=60)', async () => {
      mockFindFirst.mockResolvedValueOnce(null);
      const created = { id: 'default', minNoticeHours: 2, maxDaysAhead: 60, heroText: null, heroImageUrl: null };
      mockCreate.mockResolvedValue(created);

      const result = await repo.get();

      expect(mockFindFirst).toHaveBeenCalled();
      expect(mockCreate).toHaveBeenCalledWith({
        data: { id: 'default', minNoticeHours: 2, maxDaysAhead: 60, heroText: null, heroImageUrl: null },
      });
      expect(result.minNoticeHours).toBe(2);
      expect(result.maxDaysAhead).toBe(60);
      expect(result.heroText).toBeNull();
      expect(result.heroImageUrl).toBeNull();
    });

    it('retorna heroText e heroImageUrl como null por padrão', async () => {
      mockFindFirst.mockResolvedValueOnce(null);
      const created = { id: 'default', minNoticeHours: 2, maxDaysAhead: 60, heroText: null, heroImageUrl: null };
      mockCreate.mockResolvedValue(created);

      const result = await repo.get();

      expect(result.heroText).toBeNull();
      expect(result.heroImageUrl).toBeNull();
    });
  });

  describe('update', () => {
    it('atualiza apenas minNoticeHours', async () => {
      const current = { id: 'default', minNoticeHours: 2, maxDaysAhead: 60, heroText: null, heroImageUrl: null };
      const updated = { ...current, minNoticeHours: 10 };
      mockFindFirst.mockResolvedValue(current);
      mockUpdate.mockResolvedValue(updated);

      const result = await repo.update({ minNoticeHours: 10 });

      expect(mockUpdate).toHaveBeenCalledWith({ where: { id: 'default' }, data: { minNoticeHours: 10 } });
      expect(result.minNoticeHours).toBe(10);
      expect(result.maxDaysAhead).toBe(60);
    });

    it('atualiza apenas maxDaysAhead', async () => {
      const current = { id: 'default', minNoticeHours: 2, maxDaysAhead: 60, heroText: null, heroImageUrl: null };
      const updated = { ...current, maxDaysAhead: 30 };
      mockFindFirst.mockResolvedValue(current);
      mockUpdate.mockResolvedValue(updated);

      const result = await repo.update({ maxDaysAhead: 30 });

      expect(result.maxDaysAhead).toBe(30);
      expect(result.minNoticeHours).toBe(2);
    });

    it('atualiza heroText e heroImageUrl', async () => {
      const current = { id: 'default', minNoticeHours: 2, maxDaysAhead: 60, heroText: null, heroImageUrl: null };
      const updated = { ...current, heroText: 'Novo texto', heroImageUrl: 'https://example.com/nova.jpg' };
      mockFindFirst.mockResolvedValue(current);
      mockUpdate.mockResolvedValue(updated);

      const result = await repo.update({ heroText: 'Novo texto', heroImageUrl: 'https://example.com/nova.jpg' });

      expect(result.heroText).toBe('Novo texto');
      expect(result.heroImageUrl).toBe('https://example.com/nova.jpg');
    });

    it('permite definir heroText como null', async () => {
      const current = { id: 'default', minNoticeHours: 2, maxDaysAhead: 60, heroText: 'Antigo', heroImageUrl: 'https://example.com/antiga.jpg' };
      const updated = { ...current, heroText: null };
      mockFindFirst.mockResolvedValue(current);
      mockUpdate.mockResolvedValue(updated);

      const result = await repo.update({ heroText: null });

      expect(result.heroText).toBeNull();
    });

    it('permite definir heroImageUrl como null', async () => {
      const current = { id: 'default', minNoticeHours: 2, maxDaysAhead: 60, heroText: 'Texto', heroImageUrl: 'https://example.com/antiga.jpg' };
      const updated = { ...current, heroImageUrl: null };
      mockFindFirst.mockResolvedValue(current);
      mockUpdate.mockResolvedValue(updated);

      const result = await repo.update({ heroImageUrl: null });

      expect(result.heroImageUrl).toBeNull();
    });
  });
});
