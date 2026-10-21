import { FastifyRequest, FastifyReply } from 'fastify';
import { LoginUseCase } from '../../../usecases/LoginUseCase.js';
export declare class AuthController {
    private readonly loginUseCase;
    constructor(loginUseCase: LoginUseCase);
    login(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    logout(_request: FastifyRequest, reply: FastifyReply): Promise<void>;
    me(request: FastifyRequest, reply: FastifyReply): Promise<void>;
}
//# sourceMappingURL=AuthController.d.ts.map