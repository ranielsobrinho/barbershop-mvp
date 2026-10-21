import { Server } from '@grpc/grpc-js';
import { AuthServiceService } from './generated/auth.js';
export function buildGrpcServer(authHandler) {
    const server = new Server();
    server.addService(AuthServiceService, {
        validateToken: authHandler.validateToken.bind(authHandler),
        getUserById: authHandler.getUserById.bind(authHandler),
    });
    return server;
}
//# sourceMappingURL=server.js.map