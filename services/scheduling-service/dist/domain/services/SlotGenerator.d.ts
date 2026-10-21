import { BusinessHoursSnapshot } from '../repositories/IBusinessHoursRepository.js';
export interface RawSlot {
    startMinutes: number;
    endMinutes: number;
}
/**
 * Gera os slots brutos de um dia a partir do expediente e do slot do serviço.
 * Horários são oferecidos de slot em slot a partir da abertura.
 * O serviço ocupa exatamente um slot (slotMin).
 */
export declare class SlotGenerator {
    generate(businessHours: BusinessHoursSnapshot, slotMin: number): RawSlot[];
    toMinutes(hhmm: string): number;
}
