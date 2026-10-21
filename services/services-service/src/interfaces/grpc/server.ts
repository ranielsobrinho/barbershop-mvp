import { Server, ServerCredentials } from '@grpc/grpc-js';
import { ServicesHandler } from './handlers/ServicesHandler.js';
import { ServicesServiceService } from './generated/services.js';

export function buildGrpcServer(handler: ServicesHandler): Server {
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
