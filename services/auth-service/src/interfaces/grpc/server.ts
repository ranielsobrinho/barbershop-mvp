import { Server, ServerCredentials } from '@grpc/grpc-js';
import { AuthHandler } from './handlers/AuthHandler.js';
import { AuthServiceService } from './generated/auth.js';

export function buildGrpcServer(authHandler: AuthHandler): Server {
  const server = new Server();
  
  server.addService(AuthServiceService, {
    validateToken: authHandler.validateToken.bind(authHandler),
    getUserById: authHandler.getUserById.bind(authHandler),
  });

  return server;
}
