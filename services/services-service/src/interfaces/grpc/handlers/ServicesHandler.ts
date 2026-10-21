import { ServerUnaryCall, sendUnaryData } from '@grpc/grpc-js';
import { ListActiveServicesUseCase } from '../../../usecases/ListActiveServicesUseCase.js';
import { GetServiceByIdUseCase } from '../../../usecases/GetServiceByIdUseCase.js';
import { CreateServiceUseCase } from '../../../usecases/CreateServiceUseCase.js';
import { UpdateServiceUseCase } from '../../../usecases/UpdateServiceUseCase.js';
import { DeleteServiceUseCase } from '../../../usecases/DeleteServiceUseCase.js';
import { ToggleServiceActiveUseCase } from '../../../usecases/ToggleServiceActiveUseCase.js';
import { 
  ListActiveServicesRequest, ListActiveServicesResponse,
  GetServiceByIdRequest, GetServiceByIdResponse,
  CreateServiceRequest, CreateServiceResponse,
  UpdateServiceRequest, UpdateServiceResponse,
  DeleteServiceRequest, DeleteServiceResponse,
  ToggleServiceActiveRequest, ToggleServiceActiveResponse,
  Service as ProtoService
} from '../generated/services.js';

function toProtoService(service: any): ProtoService {
  return {
    id: service.id,
    name: service.name,
    description: service.description ?? '',
    priceCents: service.priceCents,
    slotMin: service.slotMin,
    active: service.active,
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  };
}

export class ServicesHandler {
  constructor(
    private readonly listActive: ListActiveServicesUseCase,
    private readonly getById: GetServiceByIdUseCase,
    private readonly create: CreateServiceUseCase,
    private readonly update: UpdateServiceUseCase,
    private readonly deleteUseCase: DeleteServiceUseCase,
    private readonly toggleActive: ToggleServiceActiveUseCase
  ) {}

  listActiveServices = async (
    _call: ServerUnaryCall<ListActiveServicesRequest, ListActiveServicesResponse>,
    callback: sendUnaryData<ListActiveServicesResponse>
  ): Promise<void> => {
    try {
      const services = await this.listActive.execute();
      callback(null, { services: services.map(toProtoService) });
    } catch (error) {
      callback(error as Error, null);
    }
  };

  getServiceById = async (
    call: ServerUnaryCall<GetServiceByIdRequest, GetServiceByIdResponse>,
    callback: sendUnaryData<GetServiceByIdResponse>
  ): Promise<void> => {
    try {
      const service = await this.getById.execute(call.request.id);
      callback(null, { service: toProtoService(service) });
    } catch (error) {
      callback(error as Error, null);
    }
  };

  createService = async (
    call: ServerUnaryCall<CreateServiceRequest, CreateServiceResponse>,
    callback: sendUnaryData<CreateServiceResponse>
  ): Promise<void> => {
    try {
      const { name, description, priceCents, slotMin, active } = call.request;
      const service = await this.create.execute({
        name,
        description: description || null,
        priceCents,
        slotMin,
        active,
      });
      callback(null, { service: toProtoService(service) });
    } catch (error) {
      callback(error as Error, null);
    }
  };

  updateService = async (
    call: ServerUnaryCall<UpdateServiceRequest, UpdateServiceResponse>,
    callback: sendUnaryData<UpdateServiceResponse>
  ): Promise<void> => {
    try {
      const { id, name, description, priceCents, slotMin, active } = call.request;
      const service = await this.update.execute({
        id,
        name: name || undefined,
        description: description || undefined,
        priceCents,
        slotMin,
        active,
      });
      callback(null, { service: toProtoService(service) });
    } catch (error) {
      callback(error as Error, null);
    }
  };

  deleteService = async (
    call: ServerUnaryCall<DeleteServiceRequest, DeleteServiceResponse>,
    callback: sendUnaryData<DeleteServiceResponse>
  ): Promise<void> => {
    try {
      await this.deleteUseCase.execute(call.request.id);
      callback(null, { success: true });
    } catch (error) {
      callback(error as Error, null);
    }
  };

  toggleServiceActive = async (
    call: ServerUnaryCall<ToggleServiceActiveRequest, ToggleServiceActiveResponse>,
    callback: sendUnaryData<ToggleServiceActiveResponse>
  ): Promise<void> => {
    try {
      await this.toggleActive.execute(call.request.id, call.request.active);
      const service = await this.getById.execute(call.request.id);
      callback(null, { service: toProtoService(service) });
    } catch (error) {
      callback(error as Error, null);
    }
  };
}
