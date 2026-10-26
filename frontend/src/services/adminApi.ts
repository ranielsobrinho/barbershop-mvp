import { api } from './api';
import type { Service, Appointment } from './publicApi';
export type { Service, Appointment };

export interface Block {
  id: string; startsAt: string; endsAt: string; reason: string | null;
}
export interface BusinessHours {
  id: string; weekday: number; opensAt: string; closesAt: string;
  breakStart: string | null; breakEnd: string | null; active: boolean;
}
export interface Settings {
  id: string; minNoticeHours: number; maxDaysAhead: number;
  companyName: string;
  heroText: string | null; heroImageUrl: string | null;
}

export type WhatsAppProvider = 'WAME' | 'ZAPSTER' | null;

export interface WhatsAppIntegration {
  provider: WhatsAppProvider;
  wameApiKeyConfigured: boolean;
  zapsterApiTokenConfigured: boolean;
  zapsterInstanceId: string | null;
  messageAwaitingConfirmation: string | null;
  messageConfirmed: string | null;
  messageCancelled: string | null;
  messageRescheduled: string | null;
}

export interface WhatsAppIntegrationUpdate {
  provider: WhatsAppProvider;
  wameApiKey?: string;
  zapsterApiToken?: string;
  zapsterInstanceId?: string;
  messageAwaitingConfirmation?: string;
  messageConfirmed?: string;
  messageCancelled?: string;
  messageRescheduled?: string;
}

export const adminApi = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('auth_token', data.token);
    return data;
  },
  logout: async () => {
    await api.post('/api/auth/logout');
    localStorage.removeItem('auth_token');
  },
  me: async () => {
    const { data } = await api.get('/api/auth/me');
    return data.user;
  },

  listServices: async (): Promise<Service[]> => {
    const { data } = await api.get('/api/services');
    return data.services;
  },
  createService: async (payload: Partial<Service>) => {
    const { data } = await api.post('/api/admin/services', payload);
    return data.service;
  },
  updateService: async (id: string, payload: Partial<Service>) => {
    const { data } = await api.put(`/api/admin/services/${id}`, payload);
    return data.service;
  },
  deleteService: async (id: string) => {
    await api.delete(`/api/admin/services/${id}`);
  },

  listAppointments: async (month: string): Promise<Appointment[]> => {
    const { data } = await api.get('/api/admin/appointments', { params: { month } });
    return data.appointments;
  },
  updateStatus: async (id: string, status: string) => {
    const { data } = await api.patch(`/api/admin/appointments/${id}/status`, { status });
    return data.appointment;
  },
  reschedule: async (id: string, newStartsAt: string) => {
    const { data } = await api.patch(`/api/admin/appointments/${id}/reschedule`, { newStartsAt });
    return data.appointment;
  },

  listBlocks: async (month?: string): Promise<Block[]> => {
    const { data } = await api.get('/api/admin/blocks', { params: month ? { month } : {} });
    return data.blocks;
  },
  createBlock: async (payload: { startsAt: string; endsAt: string; reason?: string; confirmed?: boolean }) => {
    const { data } = await api.post('/api/admin/blocks', payload);
    return data;
  },
  deleteBlock: async (id: string) => {
    await api.delete(`/api/admin/blocks/${id}`);
  },

  getBusinessHours: async (): Promise<BusinessHours[]> => {
    const { data } = await api.get('/api/admin/business-hours');
    return data.hours;
  },
  updateBusinessHours: async (hours: Partial<BusinessHours>[]) => {
    const { data } = await api.put('/api/admin/business-hours', { hours });
    return data.hours;
  },

  getSettings: async (): Promise<Settings> => {
    const { data } = await api.get('/api/admin/settings');
    return data.settings;
  },
  updateSettings: async (payload: Partial<Settings>) => {
    const { data } = await api.put('/api/admin/settings', payload);
    return data.settings;
  },

  getWhatsAppIntegration: async (): Promise<WhatsAppIntegration> => {
    const { data } = await api.get('/api/admin/whatsapp-integration');
    return data.integration;
  },
  updateWhatsAppIntegration: async (payload: WhatsAppIntegrationUpdate): Promise<WhatsAppIntegration> => {
    const { data } = await api.put('/api/admin/whatsapp-integration', payload);
    return data.integration;
  },
};
