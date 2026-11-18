import { ServerUnaryCall, sendUnaryData } from '@grpc/grpc-js';
import jwt from 'jsonwebtoken';
import { resolveTenantContextBySlug, runWithTenantContext } from '@barbershop/tenant-context';
import prisma from '../../../infrastructure/database/prisma.js';
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

async function withTenant<T>(call: ServerUnaryCall<any, any>, adminOnly: boolean, action: () => Promise<T>): Promise<T> {
  const context = await resolveTenantContextBySlug(call.metadata.get('x-shop-slug')[0], prisma);
  if (!context) throw new Error('ShopNotFound');

  if (adminOnly) {
    const authorization = call.metadata.get('authorization')[0];
    const token = typeof authorization === 'string' ? authorization.replace(/^Bearer\s+/i, '') : '';
    if (!token) throw new Error('Unauthorized');
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production') as { sub: string };
    const membership = await prisma.tenantMembership.findUnique({
      where: { tenantId_userId: { tenantId: context.tenantId, userId: payload.sub } },
    });
    if (!membership || membership.role === 'STAFF') throw new Error('ShopAccessDenied');
  }

  return runWithTenantContext(context, action);
}

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
      const services = await withTenant(_call, false, () => this.listActive.execute());
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
      const service = await withTenant(call, false, () => this.getById.execute(call.request.id));
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
      const service = await withTenant(call, true, () => this.create.execute({
        name,
        description: description || null,
        priceCents,
        slotMin,
        active,
      }));
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
      const service = await withTenant(call, true, () => this.update.execute({
        id,
        name: name || undefined,
        description: description || undefined,
        priceCents,
        slotMin,
        active,
      }));
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
      await withTenant(call, true, () => this.deleteUseCase.execute(call.request.id));
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
      const service = await withTenant(call, true, async () => {
        await this.toggleActive.execute(call.request.id, call.request.active);
        return this.getById.execute(call.request.id);
      });
      callback(null, { service: toProtoService(service) });
    } catch (error) {
      callback(error as Error, null);
    }
  };
}
