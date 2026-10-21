export type AppointmentStatus = 
  | 'AGUARDANDO_CONFIRMACAO' 
  | 'CONFIRMADO' 
  | 'CANCELADO' 
  | 'REAGENDADO';

export class Appointment {
  constructor(
    public readonly id: string,
    public readonly serviceId: string,
    public readonly customerName: string,
    public readonly customerPhone: string,
    public readonly startsAt: Date,
    public readonly endsAt: Date,
    public readonly priceCents: number,
    public readonly status: AppointmentStatus,
    public readonly previousStartsAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    serviceId: string,
    customerName: string,
    customerPhone: string,
    startsAt: Date,
    endsAt: Date,
    priceCents: number,
    status: AppointmentStatus = 'AGUARDANDO_CONFIRMACAO'
  ): Appointment {
    const now = new Date();
    return new Appointment(
      crypto.randomUUID(),
      serviceId,
      customerName,
      customerPhone,
      startsAt,
      endsAt,
      priceCents,
      status,
      null,
      now,
      now
    );
  }

  confirm(): Appointment {
    return new Appointment(
      this.id, this.serviceId, this.customerName, this.customerPhone,
      this.startsAt, this.endsAt, this.priceCents,
      'CONFIRMADO', this.previousStartsAt,
      this.createdAt, new Date()
    );
  }

  cancel(): Appointment {
    return new Appointment(
      this.id, this.serviceId, this.customerName, this.customerPhone,
      this.startsAt, this.endsAt, this.priceCents,
      'CANCELADO', this.previousStartsAt,
      this.createdAt, new Date()
    );
  }

  reschedule(newStartsAt: Date, newEndsAt: Date): Appointment {
    return new Appointment(
      this.id, this.serviceId, this.customerName, this.customerPhone,
      newStartsAt, newEndsAt, this.priceCents,
      'REAGENDADO', this.startsAt,
      this.createdAt, new Date()
    );
  }

  occupiesSlot(): boolean {
    return ['AGUARDANDO_CONFIRMACAO', 'CONFIRMADO', 'REAGENDADO'].includes(this.status);
  }
}
