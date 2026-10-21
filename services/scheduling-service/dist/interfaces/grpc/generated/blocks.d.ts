import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { type CallOptions, type ChannelCredentials, Client, type ClientOptions, type ClientUnaryCall, type handleUnaryCall, type Metadata, type ServiceError, type UntypedServiceImplementation } from "@grpc/grpc-js";
export declare const protobufPackage = "barbershop.blocks";
export declare const protobufFileName = "blocks.proto";
export interface Block {
    id: string;
    startsAt: string;
    endsAt: string;
    reason: string;
    createdAt: string;
    updatedAt: string;
}
export interface ListBlocksRequest {
    /** YYYY-MM (optional) */
    month: string;
}
export interface ListBlocksResponse {
    blocks: Block[];
}
export interface CreateBlockRequest {
    startsAt: string;
    endsAt: string;
    reason: string;
}
export interface CreateBlockResponse {
    block: Block | undefined;
}
export interface DeleteBlockRequest {
    id: string;
}
export interface DeleteBlockResponse {
    success: boolean;
}
export interface CheckBlockConflictsRequest {
    startsAt: string;
    endsAt: string;
}
export interface CheckBlockConflictsResponse {
    hasConflict: boolean;
    conflictingBlocks: Block[];
}
export declare const Block: MessageFns<Block>;
export declare const ListBlocksRequest: MessageFns<ListBlocksRequest>;
export declare const ListBlocksResponse: MessageFns<ListBlocksResponse>;
export declare const CreateBlockRequest: MessageFns<CreateBlockRequest>;
export declare const CreateBlockResponse: MessageFns<CreateBlockResponse>;
export declare const DeleteBlockRequest: MessageFns<DeleteBlockRequest>;
export declare const DeleteBlockResponse: MessageFns<DeleteBlockResponse>;
export declare const CheckBlockConflictsRequest: MessageFns<CheckBlockConflictsRequest>;
export declare const CheckBlockConflictsResponse: MessageFns<CheckBlockConflictsResponse>;
export type BlocksServiceService = typeof BlocksServiceService;
export declare const BlocksServiceService: {
    readonly listBlocks: {
        readonly path: "/barbershop.blocks.BlocksService/ListBlocks";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: ListBlocksRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => ListBlocksRequest;
        readonly responseSerialize: (value: ListBlocksResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => ListBlocksResponse;
    };
    readonly createBlock: {
        readonly path: "/barbershop.blocks.BlocksService/CreateBlock";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: CreateBlockRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => CreateBlockRequest;
        readonly responseSerialize: (value: CreateBlockResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => CreateBlockResponse;
    };
    readonly deleteBlock: {
        readonly path: "/barbershop.blocks.BlocksService/DeleteBlock";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: DeleteBlockRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => DeleteBlockRequest;
        readonly responseSerialize: (value: DeleteBlockResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => DeleteBlockResponse;
    };
    readonly checkBlockConflicts: {
        readonly path: "/barbershop.blocks.BlocksService/CheckBlockConflicts";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: CheckBlockConflictsRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => CheckBlockConflictsRequest;
        readonly responseSerialize: (value: CheckBlockConflictsResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => CheckBlockConflictsResponse;
    };
};
export interface BlocksServiceServer extends UntypedServiceImplementation {
    listBlocks: handleUnaryCall<ListBlocksRequest, ListBlocksResponse>;
    createBlock: handleUnaryCall<CreateBlockRequest, CreateBlockResponse>;
    deleteBlock: handleUnaryCall<DeleteBlockRequest, DeleteBlockResponse>;
    checkBlockConflicts: handleUnaryCall<CheckBlockConflictsRequest, CheckBlockConflictsResponse>;
}
export interface BlocksServiceClient extends Client {
    listBlocks(request: ListBlocksRequest, callback: (error: ServiceError | null, response: ListBlocksResponse) => void): ClientUnaryCall;
    listBlocks(request: ListBlocksRequest, metadata: Metadata, callback: (error: ServiceError | null, response: ListBlocksResponse) => void): ClientUnaryCall;
    listBlocks(request: ListBlocksRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: ListBlocksResponse) => void): ClientUnaryCall;
    createBlock(request: CreateBlockRequest, callback: (error: ServiceError | null, response: CreateBlockResponse) => void): ClientUnaryCall;
    createBlock(request: CreateBlockRequest, metadata: Metadata, callback: (error: ServiceError | null, response: CreateBlockResponse) => void): ClientUnaryCall;
    createBlock(request: CreateBlockRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: CreateBlockResponse) => void): ClientUnaryCall;
    deleteBlock(request: DeleteBlockRequest, callback: (error: ServiceError | null, response: DeleteBlockResponse) => void): ClientUnaryCall;
    deleteBlock(request: DeleteBlockRequest, metadata: Metadata, callback: (error: ServiceError | null, response: DeleteBlockResponse) => void): ClientUnaryCall;
    deleteBlock(request: DeleteBlockRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: DeleteBlockResponse) => void): ClientUnaryCall;
    checkBlockConflicts(request: CheckBlockConflictsRequest, callback: (error: ServiceError | null, response: CheckBlockConflictsResponse) => void): ClientUnaryCall;
    checkBlockConflicts(request: CheckBlockConflictsRequest, metadata: Metadata, callback: (error: ServiceError | null, response: CheckBlockConflictsResponse) => void): ClientUnaryCall;
    checkBlockConflicts(request: CheckBlockConflictsRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: CheckBlockConflictsResponse) => void): ClientUnaryCall;
}
export declare const BlocksServiceClient: {
    new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): BlocksServiceClient;
    service: typeof BlocksServiceService;
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
