import { SettingsController } from '../controllers/SettingsController.js';
import { PrismaSettingsRepository } from '../../../infrastructure/repositories/PrismaSettingsRepository.js';
export function makeSettingsController() {
    return new SettingsController(new PrismaSettingsRepository());
}
//# sourceMappingURL=makeSettingsController.js.map