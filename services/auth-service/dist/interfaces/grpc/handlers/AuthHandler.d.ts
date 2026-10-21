import { ServerUnaryCall, sendUnaryData } from '@grpc/grpc-js';
import { ValidateTokenUseCase } from '../../../usecases/ValidateTokenUseCase.js';
import { GetUserByIdUseCase } from '../../../usecases/GetUserByIdUseCase.js';
import { ValidateTokenRequest, ValidateTokenResponse, GetUserByIdRequest, GetUserByIdResponse } from '../generated/auth.js';
export declare class AuthHandler {
    private readonly validateTokenUseCase;
    private readonly getUserByIdUseCase;
    constructor(validateTokenUseCase: ValidateTokenUseCase, getUserByIdUseCase: GetUserByIdUseCase);
    validateToken: (call: ServerUnaryCall<ValidateTokenRequest, ValidateTokenResponse>, callback: sendUnaryData<ValidateTokenResponse>) => Promise<void>;
    getUserById: (call: ServerUnaryCall<GetUserByIdRequest, GetUserByIdResponse>, callback: sendUnaryData<GetUserByIdResponse>) => Promise<void>;
}
//# sourceMappingURL=AuthHandler.d.ts.map