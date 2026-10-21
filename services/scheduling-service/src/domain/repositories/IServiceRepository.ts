export interface ServiceSnapshot {
  id: string;
  name: string;
  priceCents: number;
  slotMin: number;
  active: boolean;
}

export interface IServiceRepository {
  findById(id: string): Promise<ServiceSnapshot | null>;
}
