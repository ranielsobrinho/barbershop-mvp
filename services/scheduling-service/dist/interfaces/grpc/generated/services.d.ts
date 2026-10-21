import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { type CallOptions, type ChannelCredentials, Client, type ClientOptions, type ClientUnaryCall, type handleUnaryCall, type Metadata, type ServiceError, type UntypedServiceImplementation } from "@grpc/grpc-js";
export declare const protobufPackage = "barbershop.services";
export declare const protobufFileName = "services.proto";
export interface Service {
    id: string;
    name: string;
    description: string;
    priceCents: number;
    slotMin: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface ListActiveServicesRequest {
}
export interface ListActiveServicesResponse {
    services: Service[];
}
export interface GetServiceByIdRequest {
    id: string;
}
export interface GetServiceByIdResponse {
    service: Service | undefined;
}
export interface CreateServiceRequest {
    name: string;
    description: string;
    priceCents: number;
    slotMin: number;
    active: boolean;
}
export interface CreateServiceResponse {
    service: Service | undefined;
}
export interface UpdateServiceRequest {
    id: string;
    name: string;
    description: string;
    priceCents: number;
    slotMin: number;
    active: boolean;
}
export interface UpdateServiceResponse {
    service: Service | undefined;
}
export interface DeleteServiceRequest {
    id: string;
}
export interface DeleteServiceResponse {
    success: boolean;
}
export interface ToggleServiceActiveRequest {
    id: string;
    active: boolean;
}
export interface ToggleServiceActiveResponse {
    service: Service | undefined;
}
export declare const Service: MessageFns<Service>;
export declare const ListActiveServicesRequest: MessageFns<ListActiveServicesRequest>;
export declare const ListActiveServicesResponse: MessageFns<ListActiveServicesResponse>;
export declare const GetServiceByIdRequest: MessageFns<GetServiceByIdRequest>;
export declare const GetServiceByIdResponse: MessageFns<GetServiceByIdResponse>;
export declare const CreateServiceRequest: MessageFns<CreateServiceRequest>;
export declare const CreateServiceResponse: MessageFns<CreateServiceResponse>;
export declare const UpdateServiceRequest: MessageFns<UpdateServiceRequest>;
export declare const UpdateServiceResponse: MessageFns<UpdateServiceResponse>;
export declare const DeleteServiceRequest: MessageFns<DeleteServiceRequest>;
export declare const DeleteServiceResponse: MessageFns<DeleteServiceResponse>;
export declare const ToggleServiceActiveRequest: MessageFns<ToggleServiceActiveRequest>;
export declare const ToggleServiceActiveResponse: MessageFns<ToggleServiceActiveResponse>;
export type ServicesServiceService = typeof ServicesServiceService;
export declare const ServicesServiceService: {
    readonly listActiveServices: {
        readonly path: "/barbershop.services.ServicesService/ListActiveServices";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: ListActiveServicesRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => ListActiveServicesRequest;
        readonly responseSerialize: (value: ListActiveServicesResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => ListActiveServicesResponse;
    };
    readonly getServiceById: {
        readonly path: "/barbershop.services.ServicesService/GetServiceById";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetServiceByIdRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetServiceByIdRequest;
        readonly responseSerialize: (value: GetServiceByIdResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetServiceByIdResponse;
    };
    readonly createService: {
        readonly path: "/barbershop.services.ServicesService/CreateService";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: CreateServiceRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => CreateServiceRequest;
        readonly responseSerialize: (value: CreateServiceResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => CreateServiceResponse;
    };
    readonly updateService: {
        readonly path: "/barbershop.services.ServicesService/UpdateService";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: UpdateServiceRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => UpdateServiceRequest;
        readonly responseSerialize: (value: UpdateServiceResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => UpdateServiceResponse;
    };
    readonly deleteService: {
        readonly path: "/barbershop.services.ServicesService/DeleteService";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: DeleteServiceRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => DeleteServiceRequest;
        readonly responseSerialize: (value: DeleteServiceResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => DeleteServiceResponse;
    };
    readonly toggleServiceActive: {
        readonly path: "/barbershop.services.ServicesService/ToggleServiceActive";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: ToggleServiceActiveRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => ToggleServiceActiveRequest;
        readonly responseSerialize: (value: ToggleServiceActiveResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => ToggleServiceActiveResponse;
    };
};
export interface ServicesServiceServer extends UntypedServiceImplementation {
    listActiveServices: handleUnaryCall<ListActiveServicesRequest, ListActiveServicesResponse>;
    getServiceById: handleUnaryCall<GetServiceByIdRequest, GetServiceByIdResponse>;
    createService: handleUnaryCall<CreateServiceRequest, CreateServiceResponse>;
    updateService: handleUnaryCall<UpdateServiceRequest, UpdateServiceResponse>;
    deleteService: handleUnaryCall<DeleteServiceRequest, DeleteServiceResponse>;
    toggleServiceActive: handleUnaryCall<ToggleServiceActiveRequest, ToggleServiceActiveResponse>;
}
export interface ServicesServiceClient extends Client {
    listActiveServices(request: ListActiveServicesRequest, callback: (error: ServiceError | null, response: ListActiveServicesResponse) => void): ClientUnaryCall;
    listActiveServices(request: ListActiveServicesRequest, metadata: Metadata, callback: (error: ServiceError | null, response: ListActiveServicesResponse) => void): ClientUnaryCall;
    listActiveServices(request: ListActiveServicesRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: ListActiveServicesResponse) => void): ClientUnaryCall;
    getServiceById(request: GetServiceByIdRequest, callback: (error: ServiceError | null, response: GetServiceByIdResponse) => void): ClientUnaryCall;
    getServiceById(request: GetServiceByIdRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetServiceByIdResponse) => void): ClientUnaryCall;
    getServiceById(request: GetServiceByIdRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetServiceByIdResponse) => void): ClientUnaryCall;
    createService(request: CreateServiceRequest, callback: (error: ServiceError | null, response: CreateServiceResponse) => void): ClientUnaryCall;
    createService(request: CreateServiceRequest, metadata: Metadata, callback: (error: ServiceError | null, response: CreateServiceResponse) => void): ClientUnaryCall;
    createService(request: CreateServiceRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: CreateServiceResponse) => void): ClientUnaryCall;
    updateService(request: UpdateServiceRequest, callback: (error: ServiceError | null, response: UpdateServiceResponse) => void): ClientUnaryCall;
    updateService(request: UpdateServiceRequest, metadata: Metadata, callback: (error: ServiceError | null, response: UpdateServiceResponse) => void): ClientUnaryCall;
    updateService(request: UpdateServiceRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: UpdateServiceResponse) => void): ClientUnaryCall;
    deleteService(request: DeleteServiceRequest, callback: (error: ServiceError | null, response: DeleteServiceResponse) => void): ClientUnaryCall;
    deleteService(request: DeleteServiceRequest, metadata: Metadata, callback: (error: ServiceError | null, response: DeleteServiceResponse) => void): ClientUnaryCall;
    deleteService(request: DeleteServiceRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: DeleteServiceResponse) => void): ClientUnaryCall;
    toggleServiceActive(request: ToggleServiceActiveRequest, callback: (error: ServiceError | null, response: ToggleServiceActiveResponse) => void): ClientUnaryCall;
    toggleServiceActive(request: ToggleServiceActiveRequest, metadata: Metadata, callback: (error: ServiceError | null, response: ToggleServiceActiveResponse) => void): ClientUnaryCall;
    toggleServiceActive(request: ToggleServiceActiveRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: ToggleServiceActiveResponse) => void): ClientUnaryCall;
}
export declare const ServicesServiceClient: {
    new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): ServicesServiceClient;
    service: typeof ServicesServiceService;
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
