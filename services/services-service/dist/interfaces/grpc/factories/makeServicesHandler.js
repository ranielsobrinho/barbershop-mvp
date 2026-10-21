import { ServicesHandler } from '../handlers/ServicesHandler.js';
import { ListActiveServicesUseCase } from '../../../usecases/ListActiveServicesUseCase.js';
import { GetServiceByIdUseCase } from '../../../usecases/GetServiceByIdUseCase.js';
import { CreateServiceUseCase } from '../../../usecases/CreateServiceUseCase.js';
import { UpdateServiceUseCase } from '../../../usecases/UpdateServiceUseCase.js';
import { DeleteServiceUseCase } from '../../../usecases/DeleteServiceUseCase.js';
import { ToggleServiceActiveUseCase } from '../../../usecases/ToggleServiceActiveUseCase.js';
import { PrismaServiceRepository } from '../../../infrastructure/repositories/PrismaServiceRepository.js';
export function makeServicesHandler() {
    const repository = new PrismaServiceRepository();
    return new ServicesHandler(new ListActiveServicesUseCase(repository), new GetServiceByIdUseCase(repository), new CreateServiceUseCase(repository), new UpdateServiceUseCase(repository), new DeleteServiceUseCase(repository), new ToggleServiceActiveUseCase(repository));
}
//# sourceMappingURL=makeServicesHandler.js.map