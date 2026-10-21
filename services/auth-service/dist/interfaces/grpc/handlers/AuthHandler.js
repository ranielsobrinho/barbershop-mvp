export class AuthHandler {
    validateTokenUseCase;
    getUserByIdUseCase;
    constructor(validateTokenUseCase, getUserByIdUseCase) {
        this.validateTokenUseCase = validateTokenUseCase;
        this.getUserByIdUseCase = getUserByIdUseCase;
    }
    validateToken = async (call, callback) => {
        try {
            const { token } = call.request;
            const result = await this.validateTokenUseCase.execute({ token });
            callback(null, {
                valid: result.valid,
                userId: result.userId,
                email: result.email,
            });
        }
        catch (error) {
            callback(error, null);
        }
    };
    getUserById = async (call, callback) => {
        try {
            const { userId } = call.request;
            const result = await this.getUserByIdUseCase.execute({ userId });
            callback(null, {
                id: result.id,
                email: result.email,
            });
        }
        catch (error) {
            callback(error, null);
        }
    };
}
//# sourceMappingURL=AuthHandler.js.map