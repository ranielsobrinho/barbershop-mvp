import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { type CallOptions, type ChannelCredentials, Client, type ClientOptions, type ClientUnaryCall, type handleUnaryCall, type Metadata, type ServiceError, type UntypedServiceImplementation } from "@grpc/grpc-js";
export declare const protobufPackage = "barbershop.auth";
export declare const protobufFileName = "auth.proto";
export interface ValidateTokenRequest {
    token: string;
}
export interface ValidateTokenResponse {
    valid: boolean;
    userId: string;
    email: string;
}
export interface GetUserByIdRequest {
    userId: string;
}
export interface GetUserByIdResponse {
    id: string;
    email: string;
}
export declare const ValidateTokenRequest: MessageFns<ValidateTokenRequest>;
export declare const ValidateTokenResponse: MessageFns<ValidateTokenResponse>;
export declare const GetUserByIdRequest: MessageFns<GetUserByIdRequest>;
export declare const GetUserByIdResponse: MessageFns<GetUserByIdResponse>;
export type AuthServiceService = typeof AuthServiceService;
export declare const AuthServiceService: {
    readonly validateToken: {
        readonly path: "/barbershop.auth.AuthService/ValidateToken";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: ValidateTokenRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => ValidateTokenRequest;
        readonly responseSerialize: (value: ValidateTokenResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => ValidateTokenResponse;
    };
    readonly getUserById: {
        readonly path: "/barbershop.auth.AuthService/GetUserById";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetUserByIdRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetUserByIdRequest;
        readonly responseSerialize: (value: GetUserByIdResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetUserByIdResponse;
    };
};
export interface AuthServiceServer extends UntypedServiceImplementation {
    validateToken: handleUnaryCall<ValidateTokenRequest, ValidateTokenResponse>;
    getUserById: handleUnaryCall<GetUserByIdRequest, GetUserByIdResponse>;
}
export interface AuthServiceClient extends Client {
    validateToken(request: ValidateTokenRequest, callback: (error: ServiceError | null, response: ValidateTokenResponse) => void): ClientUnaryCall;
    validateToken(request: ValidateTokenRequest, metadata: Metadata, callback: (error: ServiceError | null, response: ValidateTokenResponse) => void): ClientUnaryCall;
    validateToken(request: ValidateTokenRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: ValidateTokenResponse) => void): ClientUnaryCall;
    getUserById(request: GetUserByIdRequest, callback: (error: ServiceError | null, response: GetUserByIdResponse) => void): ClientUnaryCall;
    getUserById(request: GetUserByIdRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetUserByIdResponse) => void): ClientUnaryCall;
    getUserById(request: GetUserByIdRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetUserByIdResponse) => void): ClientUnaryCall;
}
export declare const AuthServiceClient: {
    new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): AuthServiceClient;
    service: typeof AuthServiceService;
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
//# sourceMappingURL=auth.d.ts.map