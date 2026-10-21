export class Service {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly priceCents: number,
    public readonly slotMin: number,
    public readonly active: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    name: string,
    priceCents: number,
    slotMin: number,
    description: string | null = null,
    active: boolean = true
  ): Service {
    const now = new Date();
    return new Service(
      crypto.randomUUID(),
      name.trim(),
      description?.trim() ?? null,
      priceCents,
      slotMin,
      active,
      now,
      now
    );
  }

  update(
    name?: string,
    description?: string | null,
    priceCents?: number,
    slotMin?: number,
    active?: boolean
  ): Service {
    return new Service(
      this.id,
      name !== undefined ? name.trim() : this.name,
      description !== undefined ? (description?.trim() ?? null) : this.description,
      priceCents !== undefined ? priceCents : this.priceCents,
      slotMin !== undefined ? slotMin : this.slotMin,
      active !== undefined ? active : this.active,
      this.createdAt,
      new Date()
    );
  }
}
