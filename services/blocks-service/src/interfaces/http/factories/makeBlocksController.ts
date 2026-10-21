import { BlocksController } from '../controllers/BlocksController.js';
import { ListBlocksUseCase } from '../../../usecases/ListBlocksUseCase.js';
import { CreateBlockUseCase } from '../../../usecases/CreateBlockUseCase.js';
import { DeleteBlockUseCase } from '../../../usecases/DeleteBlockUseCase.js';
import { PrismaBlockRepository } from '../../../infrastructure/repositories/PrismaBlockRepository.js';
import { PrismaAppointmentRepository } from '../../../infrastructure/repositories/PrismaAppointmentRepository.js';

export function makeBlocksController(): BlocksController {
  const blockRepo = new PrismaBlockRepository();
  const appointmentRepo = new PrismaAppointmentRepository();
  return new BlocksController(
    new ListBlocksUseCase(blockRepo),
    new CreateBlockUseCase(blockRepo, appointmentRepo),
    new DeleteBlockUseCase(blockRepo)
  );
}
