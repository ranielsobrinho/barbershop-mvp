import { BusinessHoursController } from '../controllers/BusinessHoursController.js';
import { PrismaBusinessHoursRepository } from '../../../infrastructure/repositories/PrismaBusinessHoursRepository.js';
export function makeBusinessHoursController() {
    return new BusinessHoursController(new PrismaBusinessHoursRepository());
}
//# sourceMappingURL=makeBusinessHoursController.js.map