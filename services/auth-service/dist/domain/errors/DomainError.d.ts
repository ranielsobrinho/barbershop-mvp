export declare class DomainError extends Error {
    readonly code: string;
    readonly statusCode: number;
    constructor(message: string, code: string, statusCode?: number);
}
export declare class InvalidCredentialsError extends DomainError {
    constructor();
}
export declare class UserNotFoundError extends DomainError {
    constructor(identifier: string);
}
export declare class TokenExpiredError extends DomainError {
    constructor();
}
export declare class TokenInvalidError extends DomainError {
    constructor();
}
//# sourceMappingURL=DomainError.d.ts.map