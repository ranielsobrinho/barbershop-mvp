export class Service {
    id;
    name;
    description;
    priceCents;
    slotMin;
    active;
    createdAt;
    updatedAt;
    constructor(id, name, description, priceCents, slotMin, active, createdAt, updatedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.priceCents = priceCents;
        this.slotMin = slotMin;
        this.active = active;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    static create(name, priceCents, slotMin, description = null, active = true) {
        const now = new Date();
        return new Service(crypto.randomUUID(), name.trim(), description?.trim() ?? null, priceCents, slotMin, active, now, now);
    }
    update(name, description, priceCents, slotMin, active) {
        return new Service(this.id, name !== undefined ? name.trim() : this.name, description !== undefined ? (description?.trim() ?? null) : this.description, priceCents !== undefined ? priceCents : this.priceCents, slotMin !== undefined ? slotMin : this.slotMin, active !== undefined ? active : this.active, this.createdAt, new Date());
    }
}
//# sourceMappingURL=Service.js.map