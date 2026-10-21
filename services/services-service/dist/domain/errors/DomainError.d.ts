export declare class DomainError extends Error {
    readonly code: string;
    readonly statusCode: number;
    constructor(message: string, code: string, statusCode?: number);
}
export declare class ServiceNotFoundError extends DomainError {
    constructor(id: string);
}
export declare class ServiceHasAppointmentsError extends DomainError {
    constructor(id: string);
}
export declare class ValidationError extends DomainError {
    constructor(message: string);
}
//# sourceMappingURL=DomainError.d.ts.map