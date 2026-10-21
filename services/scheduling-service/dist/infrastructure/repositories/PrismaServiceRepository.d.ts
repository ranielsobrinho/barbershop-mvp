import { IServiceRepository, ServiceSnapshot } from '../../domain/repositories/IServiceRepository.js';
export declare class PrismaServiceRepository implements IServiceRepository {
    findById(id: string): Promise<ServiceSnapshot | null>;
}
