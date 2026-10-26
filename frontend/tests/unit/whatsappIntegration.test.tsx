import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminApi } from '../../src/services/adminApi';

// Mock the api module
vi.mock('../../src/services/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from '../../src/services/api';

describe('WhatsApp Integration API types and functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getWhatsAppIntegration', () => {
    it('calls correct endpoint', async () => {
      const mockResponse = {
        data: {
          integration: {
            provider: 'WAME',
            wameApiKeyConfigured: true,
            zapsterApiTokenConfigured: false,
            zapsterInstanceId: null,
          },
        },
      };
      (api.get as vi.Mock).mockResolvedValue(mockResponse);

      const result = await adminApi.getWhatsAppIntegration();

      expect(api.get).toHaveBeenCalledWith('/api/admin/whatsapp-integration');
      expect(result).toEqual(mockResponse.data.integration);
    });

    it('returns correct type structure for WAME', async () => {
      const mockResponse = {
        data: {
          integration: {
            provider: 'WAME',
            wameApiKeyConfigured: true,
            zapsterApiTokenConfigured: false,
            zapsterInstanceId: null,
          },
        },
      };
      (api.get as vi.Mock).mockResolvedValue(mockResponse);

      const result = await adminApi.getWhatsAppIntegration();

      expect(result.provider).toBe('WAME');
      expect(result.wameApiKeyConfigured).toBe(true);
      expect(result.zapsterApiTokenConfigured).toBe(false);
      expect(result.zapsterInstanceId).toBeNull();
    });

    it('returns correct type structure for ZAPSTER', async () => {
      const mockResponse = {
        data: {
          integration: {
            provider: 'ZAPSTER',
            wameApiKeyConfigured: false,
            zapsterApiTokenConfigured: true,
            zapsterInstanceId: 'instance-123',
          },
        },
      };
      (api.get as vi.Mock).mockResolvedValue(mockResponse);

      const result = await adminApi.getWhatsAppIntegration();

      expect(result.provider).toBe('ZAPSTER');
      expect(result.wameApiKeyConfigured).toBe(false);
      expect(result.zapsterApiTokenConfigured).toBe(true);
      expect(result.zapsterInstanceId).toBe('instance-123');
    });

    it('returns correct type structure for disabled', async () => {
      const mockResponse = {
        data: {
          integration: {
            provider: null,
            wameApiKeyConfigured: false,
            zapsterApiTokenConfigured: false,
            zapsterInstanceId: null,
          },
        },
      };
      (api.get as vi.Mock).mockResolvedValue(mockResponse);

      const result = await adminApi.getWhatsAppIntegration();

      expect(result.provider).toBeNull();
      expect(result.wameApiKeyConfigured).toBe(false);
      expect(result.zapsterApiTokenConfigured).toBe(false);
      expect(result.zapsterInstanceId).toBeNull();
    });
  });

  describe('updateWhatsAppIntegration', () => {
    it('calls correct endpoint with WAME payload', async () => {
      const mockResponse = {
        data: {
          integration: {
            provider: 'WAME',
            wameApiKeyConfigured: true,
            zapsterApiTokenConfigured: false,
            zapsterInstanceId: null,
          },
        },
      };
      (api.put as vi.Mock).mockResolvedValue(mockResponse);

      const payload = {
        provider: 'WAME' as const,
        wameApiKey: 'test-api-key',
      };
      const result = await adminApi.updateWhatsAppIntegration(payload);

      expect(api.put).toHaveBeenCalledWith('/api/admin/whatsapp-integration', payload);
      expect(result.provider).toBe('WAME');
    });

    it('calls correct endpoint with ZAPSTER payload', async () => {
      const mockResponse = {
        data: {
          integration: {
            provider: 'ZAPSTER',
            wameApiKeyConfigured: false,
            zapsterApiTokenConfigured: true,
            zapsterInstanceId: 'instance-123',
          },
        },
      };
      (api.put as vi.Mock).mockResolvedValue(mockResponse);

      const payload = {
        provider: 'ZAPSTER' as const,
        zapsterApiToken: 'bearer-token',
        zapsterInstanceId: 'instance-123',
      };
      const result = await adminApi.updateWhatsAppIntegration(payload);

      expect(api.put).toHaveBeenCalledWith('/api/admin/whatsapp-integration', payload);
      expect(result.provider).toBe('ZAPSTER');
      expect(result.zapsterInstanceId).toBe('instance-123');
    });

    it('calls correct endpoint with null provider to disable', async () => {
      const mockResponse = {
        data: {
          integration: {
            provider: null,
            wameApiKeyConfigured: false,
            zapsterApiTokenConfigured: false,
            zapsterInstanceId: null,
          },
        },
      };
      (api.put as vi.Mock).mockResolvedValue(mockResponse);

      const payload = { provider: null as const };
      const result = await adminApi.updateWhatsAppIntegration(payload);

      expect(api.put).toHaveBeenCalledWith('/api/admin/whatsapp-integration', payload);
      expect(result.provider).toBeNull();
    });

    it('allows empty secret fields to preserve existing values', async () => {
      const mockResponse = {
        data: {
          integration: {
            provider: 'WAME',
            wameApiKeyConfigured: true,
            zapsterApiTokenConfigured: false,
            zapsterInstanceId: null,
          },
        },
      };
      (api.put as vi.Mock).mockResolvedValue(mockResponse);

      // Empty string for secret means "keep existing" per contract
      const payload = {
        provider: 'WAME' as const,
        wameApiKey: '',
      };
      const result = await adminApi.updateWhatsAppIntegration(payload);

      expect(api.put).toHaveBeenCalledWith('/api/admin/whatsapp-integration', payload);
      expect(result.wameApiKeyConfigured).toBe(true);
    });
  });
});