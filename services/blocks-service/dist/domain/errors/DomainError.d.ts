export declare class DomainError extends Error {
    readonly code: string;
    readonly statusCode: number;
    constructor(message: string, code: string, statusCode?: number);
}
export declare class NotFoundError extends DomainError {
    constructor(resource: string, id?: string);
}
export declare class ValidationError extends DomainError {
    constructor(message: string);
}
export declare class ConflictError extends DomainError {
    constructor(message?: string);
}
