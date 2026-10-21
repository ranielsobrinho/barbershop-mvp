// Shared TypeScript types for frontend and backend

export type AppointmentStatus = 
  | 'AGUARDANDO_CONFIRMACAO' 
  | 'CONFIRMADO' 
  | 'CANCELADO' 
  | 'REAGENDADO';

export interface Service {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  slotMin: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  startsAt: string; // ISO 8601
  endsAt: string;   // ISO 8601
  priceCents: number;
  status: AppointmentStatus;
  previousStartsAt: string | null;
  createdAt: string;
  updatedAt: string;
  service?: Service;
}

export interface BusinessHours {
  id: string;
  weekday: number; // 0=Sun ... 6=Sat
  opensAt: string; // HH:mm
  closesAt: string; // HH:mm
  breakStart: string | null; // HH:mm
  breakEnd: string | null; // HH:mm
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Block {
  id: string;
  startsAt: string; // ISO 8601
  endsAt: string;   // ISO 8601
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  id: string;
  minNoticeHours: number;
  maxDaysAhead: number;
  heroText: string | null;
  heroImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  start: string; // HH:mm
  end: string;   // HH:mm
}

// API Request/Response types
export interface AvailabilityRequest {
  date: string; // YYYY-MM-DD
  serviceId: string;
}

export interface AvailabilityResponse {
  slots: TimeSlot[];
}

export interface BlockedDatesRequest {
  month: string; // YYYY-MM
}

export interface BlockedDatesResponse {
  dates: string[]; // YYYY-MM-DD
}

export interface CreateAppointmentRequest {
  serviceId: string;
  customerName: string;
  customerPhone: string;
  startsAt: string; // ISO 8601
  website?: string; // honeypot field (anti-abuse): must be empty
}

export interface CreateAppointmentResponse {
  appointment: Appointment;
}

export interface AppointmentsByMonthRequest {
  month: string; // YYYY-MM
}

export interface AppointmentsByMonthResponse {
  appointments: Appointment[];
}

export interface UpdateAppointmentStatusRequest {
  id: string;
  status: AppointmentStatus;
}

export interface RescheduleAppointmentRequest {
  id: string;
  newStartsAt: string; // ISO 8601
}

export interface CreateBlockRequest {
  startsAt: string; // ISO 8601
  endsAt: string;   // ISO 8601
  reason?: string;
}

export interface UpdateBusinessHoursRequest {
  hours: BusinessHoursInput[];
}

export interface BusinessHoursInput {
  weekday: number;
  opensAt: string;
  closesAt: string;
  breakStart: string | null;
  breakEnd: string | null;
  active: boolean;
}

export interface UpdateSettingsRequest {
  minNoticeHours: number;
  maxDaysAhead: number;
  heroText: string | null;
  heroImageUrl: string | null;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

export interface JWTPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

// Form validation types
export interface BookingFormData {
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  customerName: string;
  customerPhone: string;
}
