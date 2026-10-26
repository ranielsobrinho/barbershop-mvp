import { SchedulingController } from '../controllers/SchedulingController.js';
import { GetAvailabilityUseCase } from '../../../usecases/GetAvailabilityUseCase.js';
import { CreateAppointmentUseCase } from '../../../usecases/CreateAppointmentUseCase.js';
import { GetAppointmentsByMonthUseCase } from '../../../usecases/GetAppointmentsByMonthUseCase.js';
import { GetBlockedDatesUseCase } from '../../../usecases/GetBlockedDatesUseCase.js';
import { UpdateAppointmentStatusUseCase } from '../../../usecases/UpdateAppointmentStatusUseCase.js';
import { RescheduleAppointmentUseCase } from '../../../usecases/RescheduleAppointmentUseCase.js';
import { GetAppointmentsByPhoneUseCase } from '../../../usecases/GetAppointmentsByPhoneUseCase.js';
import { AvailabilityService } from '../../../domain/services/AvailabilityService.js';
import { ConflictChecker } from '../../../domain/services/ConflictChecker.js';
import { PrismaAppointmentRepository } from '../../../infrastructure/repositories/PrismaAppointmentRepository.js';
import { PrismaServiceRepository } from '../../../infrastructure/repositories/PrismaServiceRepository.js';
import { PrismaBlockRepository } from '../../../infrastructure/repositories/PrismaBlockRepository.js';
import { PrismaBusinessHoursRepository } from '../../../infrastructure/repositories/PrismaBusinessHoursRepository.js';
import { PrismaSettingsRepository } from '../../../infrastructure/repositories/PrismaSettingsRepository.js';

export function makeSchedulingController(): SchedulingController {
  const appointmentRepo = new PrismaAppointmentRepository();
  const serviceRepo = new PrismaServiceRepository();
  const blockRepo = new PrismaBlockRepository();
  const businessHoursRepo = new PrismaBusinessHoursRepository();
  const settingsRepo = new PrismaSettingsRepository();

  const conflictChecker = new ConflictChecker(appointmentRepo);
  const availability = new AvailabilityService(businessHoursRepo, blockRepo, appointmentRepo, settingsRepo);

  return new SchedulingController(
    new GetAvailabilityUseCase(availability, serviceRepo),
    new CreateAppointmentUseCase(appointmentRepo, serviceRepo, settingsRepo, availability),
    new GetAppointmentsByMonthUseCase(appointmentRepo),
    new GetBlockedDatesUseCase(blockRepo),
    new UpdateAppointmentStatusUseCase(appointmentRepo, conflictChecker),
    new RescheduleAppointmentUseCase(appointmentRepo, serviceRepo, settingsRepo, availability),
    new GetAppointmentsByPhoneUseCase(appointmentRepo)
  );
}
