export const APPOINTMENT_STATUSES = [
  'AGUARDANDO_CONFIRMACAO',
  'CONFIRMADO',
  'CANCELADO',
  'REAGENDADO',
] as const;

export type AppointmentStatusValue = (typeof APPOINTMENT_STATUSES)[number];

/** Status que ocupam o horário na agenda. */
export const OCCUPYING_STATUSES: AppointmentStatusValue[] = [
  'AGUARDANDO_CONFIRMACAO',
  'CONFIRMADO',
  'REAGENDADO',
];

export function isStatus(value: string): value is AppointmentStatusValue {
  return (APPOINTMENT_STATUSES as readonly string[]).includes(value);
}
