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
  reminderEnabled: boolean;
  reminderHoursBefore: number;
  messageReminder: string | null;
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
  reminderEnabled?: boolean;
  reminderHoursBefore?: number;
  messageReminder?: string;
}

export type AppointmentReminderStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED' | 'CANCELLED';
export interface AppointmentReminder {
  id: string;
  status: AppointmentReminderStatus;
  scheduledAt: string;
  nextAttemptAt: string;
  attemptCount: number;
  lastAttemptAt: string | null;
  sentAt: string | null;
  providerResponseCode: number | null;
  lastError: string | null;
}

export interface CustomerSummary {
  id: string; name: string; phone: string; createdAt: string; visitCount: number;
  lastVisit: string | null;
  nextAppointment: { startsAt: string; serviceName: string } | null;
}
export type CustomerDetail = Omit<CustomerSummary, 'nextAppointment'> & {
  nextAppointment: (Appointment & { service: { id: string; name: string } }) | null;
  serviceTotals: Array<{ serviceName: string; count: number; totalCents: number }>;
  rebookingServiceId: string | null;
  appointments: Array<Appointment & { createdAt: string; service: { id: string; name: string } }>;
};

export interface DashboardBucket { label: string; count: number }
export interface DashboardServiceBucket { serviceName: string; count: number }
export interface DashboardPeriod {
  from: string; to: string;
  metrics: { bookedCount: number; completedCount: number; cancelledCount: number; awaitingConfirmationCount: number; bookedValueCents: number };
  weekdayBookings: DashboardBucket[];
  hourlyBookings: DashboardBucket[];
  serviceMix: DashboardServiceBucket[];
}
export interface PerformanceDashboard {
  timezone: string;
  period: DashboardPeriod;
  comparison: DashboardPeriod;
  definitions: Record<string, string>;
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
  getAppointmentReminder: async (appointmentId: string): Promise<AppointmentReminder | null> => {
    const { data } = await api.get(`/api/admin/appointments/${appointmentId}/reminder`);
    return data.reminder;
  },
  retryAppointmentReminder: async (appointmentId: string): Promise<AppointmentReminder> => {
    const { data } = await api.post(`/api/admin/appointments/${appointmentId}/reminder/retry`);
    return data.reminder;
  },
  listCustomers: async (q: string): Promise<CustomerSummary[]> => {
    const { data } = await api.get('/api/admin/customers', { params: q ? { q } : {} });
    return data.customers;
  },
  getCustomer: async (id: string): Promise<CustomerDetail> => {
    const { data } = await api.get(`/api/admin/customers/${id}`);
    return data.customer;
  },
  exportCustomer: async (id: string): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${api.defaults.baseURL || ''}/api/admin/customers/${encodeURIComponent(id)}/export`, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok || !response.body) throw new Error('Não foi possível exportar o CSV.');

    const filename = `cliente-${id}.csv`;
    const filePicker = (window as Window & {
      showSaveFilePicker?: (options: { suggestedName: string; types: Array<{ description: string; accept: Record<string, string[]> }> }) => Promise<{
        createWritable: () => Promise<WritableStream<Uint8Array>>;
      }>;
    }).showSaveFilePicker;

    if (filePicker) {
      const file = await filePicker({
        suggestedName: filename,
        types: [{ description: 'Arquivo CSV', accept: { 'text/csv': ['.csv'] } }],
      });
      await response.body.pipeTo(await file.createWritable());
      return;
    }

    const reader = response.body.getReader();
    const chunks: ArrayBuffer[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(Uint8Array.from(value).buffer as ArrayBuffer);
    }
    const url = URL.createObjectURL(new Blob(chunks, { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
  eraseCustomer: async (id: string): Promise<void> => {
    await api.delete(`/api/admin/customers/${id}`);
  },
  getPerformanceDashboard: async (from: string, to: string): Promise<PerformanceDashboard> => {
    const { data } = await api.get('/api/admin/dashboard/performance', { params: { from, to } });
    return data;
  },
};
