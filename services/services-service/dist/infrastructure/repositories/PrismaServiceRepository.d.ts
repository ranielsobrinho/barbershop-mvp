import { IServiceRepository } from '../../domain/repositories/IServiceRepository.js';
import { Service } from '../../domain/entities/Service.js';
export declare class PrismaServiceRepository implements IServiceRepository {
    findAll(activeOnly?: boolean): Promise<Service[]>;
    findById(id: string): Promise<Service | null>;
    create(service: Service): Promise<Service>;
    update(service: Service): Promise<Service>;
    delete(id: string): Promise<void>;
    hasAppointments(id: string): Promise<boolean>;
}
//# sourceMappingURL=PrismaServiceRepository.d.ts.map