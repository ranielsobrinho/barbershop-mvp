export declare class Money {
    readonly cents: number;
    private constructor();
    static fromCents(cents: number): Money;
    format(): string;
}
