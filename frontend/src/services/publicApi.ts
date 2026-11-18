import { api } from './api';

export interface Service {
  id: string; name: string; description: string | null;
  priceCents: number; slotMin: number; active: boolean;
}
export interface Barber { id: string; name: string; }
export interface TimeSlot { start: string; end: string; }
export interface Appointment {
  id: string; serviceId: string; barberId: string; barberName?: string | null; customerName: string; customerPhone: string;
  startsAt: string; endsAt: string; priceCents: number;
  status: string; previousStartsAt: string | null;
  service?: Service;
}

export const publicApi = {
  getBarbers: async (): Promise<Barber[]> => {
    const { data } = await api.get('/api/barbers');
    return data.barbers;
  },
  getServices: async (): Promise<Service[]> => {
    const { data } = await api.get('/api/services');
    return data.services;
  },

  getAvailability: async (date: string, serviceId: string, barberId: string): Promise<TimeSlot[]> => {
    const { data } = await api.get('/api/availability', { params: { date, serviceId, barberId } });
    return data.slots;
  },

  getBlockedDates: async (month: string): Promise<string[]> => {
    const { data } = await api.get('/api/blocked-dates', { params: { month } });
    return data.dates;
  },

  createAppointment: async (payload: {
    serviceId: string; barberId: string; customerName: string; customerPhone: string;
    startsAt: string; website?: string;
  }): Promise<Appointment> => {
    const { data } = await api.post('/api/appointments', payload);
    return data.appointment;
  },

  getSettings: async () => {
    const { data } = await api.get('/api/settings');
    return data.settings;
  },
};
