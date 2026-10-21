import { Server } from '@grpc/grpc-js';
import { ServicesServiceService } from './generated/services.js';
export function buildGrpcServer(handler) {
    const server = new Server();
    server.addService(ServicesServiceService, {
        listActiveServices: handler.listActiveServices.bind(handler),
        getServiceById: handler.getServiceById.bind(handler),
        createService: handler.createService.bind(handler),
        updateService: handler.updateService.bind(handler),
        deleteService: handler.deleteService.bind(handler),
        toggleServiceActive: handler.toggleServiceActive.bind(handler),
    });
    return server;
}
//# sourceMappingURL=server.js.map