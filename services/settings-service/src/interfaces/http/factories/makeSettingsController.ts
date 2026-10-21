import { SettingsController } from '../controllers/SettingsController.js';
import { PrismaSettingsRepository } from '../../../infrastructure/repositories/PrismaSettingsRepository.js';
export function makeSettingsController(): SettingsController {
  return new SettingsController(new PrismaSettingsRepository());
}
