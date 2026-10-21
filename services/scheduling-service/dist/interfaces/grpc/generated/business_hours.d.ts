import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { type CallOptions, type ChannelCredentials, Client, type ClientOptions, type ClientUnaryCall, type handleUnaryCall, type Metadata, type ServiceError, type UntypedServiceImplementation } from "@grpc/grpc-js";
export declare const protobufPackage = "barbershop.business_hours";
export declare const protobufFileName = "business_hours.proto";
export interface BusinessHours {
    id: string;
    /** 0=Sun ... 6=Sat */
    weekday: number;
    /** HH:mm */
    opensAt: string;
    /** HH:mm */
    closesAt: string;
    /** HH:mm */
    breakStart: string;
    /** HH:mm */
    breakEnd: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface GetBusinessHoursRequest {
}
export interface GetBusinessHoursResponse {
    hours: BusinessHours[];
}
export interface UpdateBusinessHoursRequest {
    hours: BusinessHoursInput[];
}
export interface BusinessHoursInput {
    weekday: number;
    opensAt: string;
    closesAt: string;
    breakStart: string;
    breakEnd: string;
    active: boolean;
}
export interface UpdateBusinessHoursResponse {
    hours: BusinessHours[];
}
export declare const BusinessHours: MessageFns<BusinessHours>;
export declare const GetBusinessHoursRequest: MessageFns<GetBusinessHoursRequest>;
export declare const GetBusinessHoursResponse: MessageFns<GetBusinessHoursResponse>;
export declare const UpdateBusinessHoursRequest: MessageFns<UpdateBusinessHoursRequest>;
export declare const BusinessHoursInput: MessageFns<BusinessHoursInput>;
export declare const UpdateBusinessHoursResponse: MessageFns<UpdateBusinessHoursResponse>;
export type BusinessHoursServiceService = typeof BusinessHoursServiceService;
export declare const BusinessHoursServiceService: {
    readonly getBusinessHours: {
        readonly path: "/barbershop.business_hours.BusinessHoursService/GetBusinessHours";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetBusinessHoursRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetBusinessHoursRequest;
        readonly responseSerialize: (value: GetBusinessHoursResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetBusinessHoursResponse;
    };
    readonly updateBusinessHours: {
        readonly path: "/barbershop.business_hours.BusinessHoursService/UpdateBusinessHours";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: UpdateBusinessHoursRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => UpdateBusinessHoursRequest;
        readonly responseSerialize: (value: UpdateBusinessHoursResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => UpdateBusinessHoursResponse;
    };
};
export interface BusinessHoursServiceServer extends UntypedServiceImplementation {
    getBusinessHours: handleUnaryCall<GetBusinessHoursRequest, GetBusinessHoursResponse>;
    updateBusinessHours: handleUnaryCall<UpdateBusinessHoursRequest, UpdateBusinessHoursResponse>;
}
export interface BusinessHoursServiceClient extends Client {
    getBusinessHours(request: GetBusinessHoursRequest, callback: (error: ServiceError | null, response: GetBusinessHoursResponse) => void): ClientUnaryCall;
    getBusinessHours(request: GetBusinessHoursRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetBusinessHoursResponse) => void): ClientUnaryCall;
    getBusinessHours(request: GetBusinessHoursRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetBusinessHoursResponse) => void): ClientUnaryCall;
    updateBusinessHours(request: UpdateBusinessHoursRequest, callback: (error: ServiceError | null, response: UpdateBusinessHoursResponse) => void): ClientUnaryCall;
    updateBusinessHours(request: UpdateBusinessHoursRequest, metadata: Metadata, callback: (error: ServiceError | null, response: UpdateBusinessHoursResponse) => void): ClientUnaryCall;
    updateBusinessHours(request: UpdateBusinessHoursRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: UpdateBusinessHoursResponse) => void): ClientUnaryCall;
}
export declare const BusinessHoursServiceClient: {
    new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): BusinessHoursServiceClient;
    service: typeof BusinessHoursServiceService;
    serviceName: string;
};
type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;
export type DeepPartial<T> = T extends Builtin ? T : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> : T extends {} ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : Partial<T>;
type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P : P & {
    [K in keyof P]: Exact<P[K], I[K]>;
} & {
    [K in Exclude<keyof I, KeysOfUnion<P>>]: never;
};
export interface MessageFns<T> {
    encode(message: T, writer?: BinaryWriter): BinaryWriter;
    decode(input: BinaryReader | Uint8Array, length?: number): T;
    fromJSON(object: any): T;
    toJSON(message: T): unknown;
    create<I extends Exact<DeepPartial<T>, I>>(base?: I): T;
    fromPartial<I extends Exact<DeepPartial<T>, I>>(object: I): T;
}
export {};
