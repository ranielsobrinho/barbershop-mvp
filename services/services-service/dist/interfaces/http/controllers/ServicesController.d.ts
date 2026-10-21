import { FastifyRequest, FastifyReply } from 'fastify';
import { ListActiveServicesUseCase } from '../../../usecases/ListActiveServicesUseCase.js';
import { GetServiceByIdUseCase } from '../../../usecases/GetServiceByIdUseCase.js';
import { CreateServiceUseCase } from '../../../usecases/CreateServiceUseCase.js';
import { UpdateServiceUseCase } from '../../../usecases/UpdateServiceUseCase.js';
import { DeleteServiceUseCase } from '../../../usecases/DeleteServiceUseCase.js';
import { ToggleServiceActiveUseCase } from '../../../usecases/ToggleServiceActiveUseCase.js';
export declare class ServicesController {
    private readonly listActiveUseCase;
    private readonly getByIdUseCase;
    private readonly createUseCase;
    private readonly updateUseCase;
    private readonly deleteUseCase;
    private readonly toggleActiveUseCase;
    constructor(listActiveUseCase: ListActiveServicesUseCase, getByIdUseCase: GetServiceByIdUseCase, createUseCase: CreateServiceUseCase, updateUseCase: UpdateServiceUseCase, deleteUseCase: DeleteServiceUseCase, toggleActiveUseCase: ToggleServiceActiveUseCase);
    list(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    getById(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    create(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    update(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    delete(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    toggleActive(request: FastifyRequest, reply: FastifyReply): Promise<void>;
}
//# sourceMappingURL=ServicesController.d.ts.map