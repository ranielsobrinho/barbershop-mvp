function toProtoService(service) {
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
    listActive;
    getById;
    create;
    update;
    deleteUseCase;
    toggleActive;
    constructor(listActive, getById, create, update, deleteUseCase, toggleActive) {
        this.listActive = listActive;
        this.getById = getById;
        this.create = create;
        this.update = update;
        this.deleteUseCase = deleteUseCase;
        this.toggleActive = toggleActive;
    }
    listActiveServices = async (_call, callback) => {
        try {
            const services = await this.listActive.execute();
            callback(null, { services: services.map(toProtoService) });
        }
        catch (error) {
            callback(error, null);
        }
    };
    getServiceById = async (call, callback) => {
        try {
            const service = await this.getById.execute(call.request.id);
            callback(null, { service: toProtoService(service) });
        }
        catch (error) {
            callback(error, null);
        }
    };
    createService = async (call, callback) => {
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
        }
        catch (error) {
            callback(error, null);
        }
    };
    updateService = async (call, callback) => {
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
        }
        catch (error) {
            callback(error, null);
        }
    };
    deleteService = async (call, callback) => {
        try {
            await this.deleteUseCase.execute(call.request.id);
            callback(null, { success: true });
        }
        catch (error) {
            callback(error, null);
        }
    };
    toggleServiceActive = async (call, callback) => {
        try {
            await this.toggleActive.execute(call.request.id, call.request.active);
            const service = await this.getById.execute(call.request.id);
            callback(null, { service: toProtoService(service) });
        }
        catch (error) {
            callback(error, null);
        }
    };
}
//# sourceMappingURL=ServicesHandler.js.map