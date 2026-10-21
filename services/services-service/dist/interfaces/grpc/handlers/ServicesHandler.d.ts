import { ServerUnaryCall, sendUnaryData } from '@grpc/grpc-js';
import { ListActiveServicesUseCase } from '../../../usecases/ListActiveServicesUseCase.js';
import { GetServiceByIdUseCase } from '../../../usecases/GetServiceByIdUseCase.js';
import { CreateServiceUseCase } from '../../../usecases/CreateServiceUseCase.js';
import { UpdateServiceUseCase } from '../../../usecases/UpdateServiceUseCase.js';
import { DeleteServiceUseCase } from '../../../usecases/DeleteServiceUseCase.js';
import { ToggleServiceActiveUseCase } from '../../../usecases/ToggleServiceActiveUseCase.js';
import { ListActiveServicesRequest, ListActiveServicesResponse, GetServiceByIdRequest, GetServiceByIdResponse, CreateServiceRequest, CreateServiceResponse, UpdateServiceRequest, UpdateServiceResponse, DeleteServiceRequest, DeleteServiceResponse, ToggleServiceActiveRequest, ToggleServiceActiveResponse } from '../generated/services.js';
export declare class ServicesHandler {
    private readonly listActive;
    private readonly getById;
    private readonly create;
    private readonly update;
    private readonly deleteUseCase;
    private readonly toggleActive;
    constructor(listActive: ListActiveServicesUseCase, getById: GetServiceByIdUseCase, create: CreateServiceUseCase, update: UpdateServiceUseCase, deleteUseCase: DeleteServiceUseCase, toggleActive: ToggleServiceActiveUseCase);
    listActiveServices: (_call: ServerUnaryCall<ListActiveServicesRequest, ListActiveServicesResponse>, callback: sendUnaryData<ListActiveServicesResponse>) => Promise<void>;
    getServiceById: (call: ServerUnaryCall<GetServiceByIdRequest, GetServiceByIdResponse>, callback: sendUnaryData<GetServiceByIdResponse>) => Promise<void>;
    createService: (call: ServerUnaryCall<CreateServiceRequest, CreateServiceResponse>, callback: sendUnaryData<CreateServiceResponse>) => Promise<void>;
    updateService: (call: ServerUnaryCall<UpdateServiceRequest, UpdateServiceResponse>, callback: sendUnaryData<UpdateServiceResponse>) => Promise<void>;
    deleteService: (call: ServerUnaryCall<DeleteServiceRequest, DeleteServiceResponse>, callback: sendUnaryData<DeleteServiceResponse>) => Promise<void>;
    toggleServiceActive: (call: ServerUnaryCall<ToggleServiceActiveRequest, ToggleServiceActiveResponse>, callback: sendUnaryData<ToggleServiceActiveResponse>) => Promise<void>;
}
//# sourceMappingURL=ServicesHandler.d.ts.map