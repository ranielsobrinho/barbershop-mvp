export declare class Phone {
    readonly value: string;
    private constructor();
    static create(raw: string): Phone;
    format(): string;
}
export declare class PhoneValidationError extends Error {
    constructor();
}
