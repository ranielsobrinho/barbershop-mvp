import { IBusinessHoursRepository, BusinessHoursSnapshot } from '../../domain/repositories/IBusinessHoursRepository.js';
export declare class PrismaBusinessHoursRepository implements IBusinessHoursRepository {
    findByWeekday(weekday: number): Promise<BusinessHoursSnapshot | null>;
    findAll(): Promise<BusinessHoursSnapshot[]>;
}
