import { BusinessHoursController } from '../controllers/BusinessHoursController.js';
import { PrismaBusinessHoursRepository } from '../../../infrastructure/repositories/PrismaBusinessHoursRepository.js';
export function makeBusinessHoursController(): BusinessHoursController {
  return new BusinessHoursController(new PrismaBusinessHoursRepository());
}
