import { ServerUnaryCall, sendUnaryData } from '@grpc/grpc-js';
import { ValidateTokenUseCase } from '../../../usecases/ValidateTokenUseCase.js';
import { GetUserByIdUseCase } from '../../../usecases/GetUserByIdUseCase.js';
import { 
  ValidateTokenRequest, 
  ValidateTokenResponse,
  GetUserByIdRequest,
  GetUserByIdResponse
} from '../generated/auth.js';

export class AuthHandler {
  constructor(
    private readonly validateTokenUseCase: ValidateTokenUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase
  ) {}

  validateToken = async (
    call: ServerUnaryCall<ValidateTokenRequest, ValidateTokenResponse>,
    callback: sendUnaryData<ValidateTokenResponse>
  ): Promise<void> => {
    try {
      const { token } = call.request;
      const result = await this.validateTokenUseCase.execute({ token });
      
      callback(null, {
        valid: result.valid,
        userId: result.userId,
        email: result.email,
      });
    } catch (error) {
      callback(error as Error, null);
    }
  };

  getUserById = async (
    call: ServerUnaryCall<GetUserByIdRequest, GetUserByIdResponse>,
    callback: sendUnaryData<GetUserByIdResponse>
  ): Promise<void> => {
    try {
      const { userId } = call.request;
      const result = await this.getUserByIdUseCase.execute({ userId });
      
      callback(null, {
        id: result.id,
        email: result.email,
      });
    } catch (error) {
      callback(error as Error, null);
    }
  };
}
