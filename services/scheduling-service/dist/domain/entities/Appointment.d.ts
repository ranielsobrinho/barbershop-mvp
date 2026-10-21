export type AppointmentStatus = 'AGUARDANDO_CONFIRMACAO' | 'CONFIRMADO' | 'CANCELADO' | 'REAGENDADO';
export declare class Appointment {
    readonly id: string;
    readonly serviceId: string;
    readonly customerName: string;
    readonly customerPhone: string;
    readonly startsAt: Date;
    readonly endsAt: Date;
    readonly priceCents: number;
    readonly status: AppointmentStatus;
    readonly previousStartsAt: Date | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    constructor(id: string, serviceId: string, customerName: string, customerPhone: string, startsAt: Date, endsAt: Date, priceCents: number, status: AppointmentStatus, previousStartsAt: Date | null, createdAt: Date, updatedAt: Date);
    static create(serviceId: string, customerName: string, customerPhone: string, startsAt: Date, endsAt: Date, priceCents: number, status?: AppointmentStatus): Appointment;
    confirm(): Appointment;
    cancel(): Appointment;
    reschedule(newStartsAt: Date, newEndsAt: Date): Appointment;
    occupiesSlot(): boolean;
}
