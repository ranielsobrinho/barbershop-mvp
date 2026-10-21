export class Appointment {
    id;
    serviceId;
    customerName;
    customerPhone;
    startsAt;
    endsAt;
    priceCents;
    status;
    previousStartsAt;
    createdAt;
    updatedAt;
    constructor(id, serviceId, customerName, customerPhone, startsAt, endsAt, priceCents, status, previousStartsAt, createdAt, updatedAt) {
        this.id = id;
        this.serviceId = serviceId;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
        this.priceCents = priceCents;
        this.status = status;
        this.previousStartsAt = previousStartsAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    static create(serviceId, customerName, customerPhone, startsAt, endsAt, priceCents, status = 'AGUARDANDO_CONFIRMACAO') {
        const now = new Date();
        return new Appointment(crypto.randomUUID(), serviceId, customerName, customerPhone, startsAt, endsAt, priceCents, status, null, now, now);
    }
    confirm() {
        return new Appointment(this.id, this.serviceId, this.customerName, this.customerPhone, this.startsAt, this.endsAt, this.priceCents, 'CONFIRMADO', this.previousStartsAt, this.createdAt, new Date());
    }
    cancel() {
        return new Appointment(this.id, this.serviceId, this.customerName, this.customerPhone, this.startsAt, this.endsAt, this.priceCents, 'CANCELADO', this.previousStartsAt, this.createdAt, new Date());
    }
    reschedule(newStartsAt, newEndsAt) {
        return new Appointment(this.id, this.serviceId, this.customerName, this.customerPhone, newStartsAt, newEndsAt, this.priceCents, 'REAGENDADO', this.startsAt, this.createdAt, new Date());
    }
    occupiesSlot() {
        return ['AGUARDANDO_CONFIRMACAO', 'CONFIRMADO', 'REAGENDADO'].includes(this.status);
    }
}
//# sourceMappingURL=Appointment.js.map