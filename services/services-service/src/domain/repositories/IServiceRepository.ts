import { Service } from '../entities/Service.js';

export interface IServiceRepository {
  findAll(activeOnly?: boolean): Promise<Service[]>;
  findById(id: string): Promise<Service | null>;
  create(service: Service): Promise<Service>;
  update(service: Service): Promise<Service>;
  delete(id: string): Promise<void>;
  hasAppointments(id: string): Promise<boolean>;
}
