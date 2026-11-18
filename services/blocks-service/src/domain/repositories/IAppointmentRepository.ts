export interface AffectedAppointment {
  id: string;
  customerName: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
}

export interface IAppointmentRepository {
  findByPeriod(start: Date, end: Date, barberId?: string): Promise<AffectedAppointment[]>;
}
