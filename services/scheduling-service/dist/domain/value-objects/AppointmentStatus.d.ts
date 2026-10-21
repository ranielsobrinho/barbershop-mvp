export declare const APPOINTMENT_STATUSES: readonly ["AGUARDANDO_CONFIRMACAO", "CONFIRMADO", "CANCELADO", "REAGENDADO"];
export type AppointmentStatusValue = (typeof APPOINTMENT_STATUSES)[number];
/** Status que ocupam o horário na agenda. */
export declare const OCCUPYING_STATUSES: AppointmentStatusValue[];
export declare function isStatus(value: string): value is AppointmentStatusValue;
