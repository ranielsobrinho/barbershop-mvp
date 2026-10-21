import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { type CallOptions, type ChannelCredentials, Client, type ClientOptions, type ClientUnaryCall, type handleUnaryCall, type Metadata, type ServiceError, type UntypedServiceImplementation } from "@grpc/grpc-js";
import { Service } from "./services.js";
export declare const protobufPackage = "barbershop.scheduling";
export declare const protobufFileName = "scheduling.proto";
export declare enum AppointmentStatus {
    AGUARDANDO_CONFIRMACAO = 0,
    CONFIRMADO = 1,
    CANCELADO = 2,
    REAGENDADO = 3,
    UNRECOGNIZED = -1
}
export declare function appointmentStatusFromJSON(object: any): AppointmentStatus;
export declare function appointmentStatusToJSON(object: AppointmentStatus): string;
export interface TimeSlot {
    start: string;
    end: string;
}
export interface Appointment {
    id: string;
    serviceId: string;
    customerName: string;
    customerPhone: string;
    startsAt: string;
    endsAt: string;
    priceCents: number;
    status: AppointmentStatus;
    previousStartsAt: string;
    createdAt: string;
    updatedAt: string;
    service: Service | undefined;
}
export interface GetAvailabilityRequest {
    /** YYYY-MM-DD */
    date: string;
    serviceId: string;
}
export interface GetAvailabilityResponse {
    slots: TimeSlot[];
}
export interface GetBlockedDatesRequest {
    /** YYYY-MM */
    month: string;
}
export interface GetBlockedDatesResponse {
    /** YYYY-MM-DD */
    dates: string[];
}
export interface CreateAppointmentRequest {
    serviceId: string;
    customerName: string;
    customerPhone: string;
    /** ISO 8601 */
    startsAt: string;
}
export interface CreateAppointmentResponse {
    appointment: Appointment | undefined;
}
export interface GetAppointmentsByMonthRequest {
    /** YYYY-MM */
    month: string;
}
export interface GetAppointmentsByMonthResponse {
    appointments: Appointment[];
}
export interface UpdateAppointmentStatusRequest {
    id: string;
    status: AppointmentStatus;
}
export interface UpdateAppointmentStatusResponse {
    appointment: Appointment | undefined;
}
export interface RescheduleAppointmentRequest {
    id: string;
    newStartsAt: string;
}
export interface RescheduleAppointmentResponse {
    appointment: Appointment | undefined;
}
export interface CreateManualAppointmentRequest {
    serviceId: string;
    customerName: string;
    customerPhone: string;
    startsAt: string;
}
export interface CreateManualAppointmentResponse {
    appointment: Appointment | undefined;
}
export declare const TimeSlot: MessageFns<TimeSlot>;
export declare const Appointment: MessageFns<Appointment>;
export declare const GetAvailabilityRequest: MessageFns<GetAvailabilityRequest>;
export declare const GetAvailabilityResponse: MessageFns<GetAvailabilityResponse>;
export declare const GetBlockedDatesRequest: MessageFns<GetBlockedDatesRequest>;
export declare const GetBlockedDatesResponse: MessageFns<GetBlockedDatesResponse>;
export declare const CreateAppointmentRequest: MessageFns<CreateAppointmentRequest>;
export declare const CreateAppointmentResponse: MessageFns<CreateAppointmentResponse>;
export declare const GetAppointmentsByMonthRequest: MessageFns<GetAppointmentsByMonthRequest>;
export declare const GetAppointmentsByMonthResponse: MessageFns<GetAppointmentsByMonthResponse>;
export declare const UpdateAppointmentStatusRequest: MessageFns<UpdateAppointmentStatusRequest>;
export declare const UpdateAppointmentStatusResponse: MessageFns<UpdateAppointmentStatusResponse>;
export declare const RescheduleAppointmentRequest: MessageFns<RescheduleAppointmentRequest>;
export declare const RescheduleAppointmentResponse: MessageFns<RescheduleAppointmentResponse>;
export declare const CreateManualAppointmentRequest: MessageFns<CreateManualAppointmentRequest>;
export declare const CreateManualAppointmentResponse: MessageFns<CreateManualAppointmentResponse>;
export type SchedulingServiceService = typeof SchedulingServiceService;
export declare const SchedulingServiceService: {
    readonly getAvailability: {
        readonly path: "/barbershop.scheduling.SchedulingService/GetAvailability";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetAvailabilityRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetAvailabilityRequest;
        readonly responseSerialize: (value: GetAvailabilityResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetAvailabilityResponse;
    };
    readonly getBlockedDates: {
        readonly path: "/barbershop.scheduling.SchedulingService/GetBlockedDates";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetBlockedDatesRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetBlockedDatesRequest;
        readonly responseSerialize: (value: GetBlockedDatesResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetBlockedDatesResponse;
    };
    readonly createAppointment: {
        readonly path: "/barbershop.scheduling.SchedulingService/CreateAppointment";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: CreateAppointmentRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => CreateAppointmentRequest;
        readonly responseSerialize: (value: CreateAppointmentResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => CreateAppointmentResponse;
    };
    readonly getAppointmentsByMonth: {
        readonly path: "/barbershop.scheduling.SchedulingService/GetAppointmentsByMonth";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: GetAppointmentsByMonthRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => GetAppointmentsByMonthRequest;
        readonly responseSerialize: (value: GetAppointmentsByMonthResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => GetAppointmentsByMonthResponse;
    };
    readonly updateAppointmentStatus: {
        readonly path: "/barbershop.scheduling.SchedulingService/UpdateAppointmentStatus";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: UpdateAppointmentStatusRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => UpdateAppointmentStatusRequest;
        readonly responseSerialize: (value: UpdateAppointmentStatusResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => UpdateAppointmentStatusResponse;
    };
    readonly rescheduleAppointment: {
        readonly path: "/barbershop.scheduling.SchedulingService/RescheduleAppointment";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: RescheduleAppointmentRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => RescheduleAppointmentRequest;
        readonly responseSerialize: (value: RescheduleAppointmentResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => RescheduleAppointmentResponse;
    };
    readonly createManualAppointment: {
        readonly path: "/barbershop.scheduling.SchedulingService/CreateManualAppointment";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: CreateManualAppointmentRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => CreateManualAppointmentRequest;
        readonly responseSerialize: (value: CreateManualAppointmentResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => CreateManualAppointmentResponse;
    };
};
export interface SchedulingServiceServer extends UntypedServiceImplementation {
    getAvailability: handleUnaryCall<GetAvailabilityRequest, GetAvailabilityResponse>;
    getBlockedDates: handleUnaryCall<GetBlockedDatesRequest, GetBlockedDatesResponse>;
    createAppointment: handleUnaryCall<CreateAppointmentRequest, CreateAppointmentResponse>;
    getAppointmentsByMonth: handleUnaryCall<GetAppointmentsByMonthRequest, GetAppointmentsByMonthResponse>;
    updateAppointmentStatus: handleUnaryCall<UpdateAppointmentStatusRequest, UpdateAppointmentStatusResponse>;
    rescheduleAppointment: handleUnaryCall<RescheduleAppointmentRequest, RescheduleAppointmentResponse>;
    createManualAppointment: handleUnaryCall<CreateManualAppointmentRequest, CreateManualAppointmentResponse>;
}
export interface SchedulingServiceClient extends Client {
    getAvailability(request: GetAvailabilityRequest, callback: (error: ServiceError | null, response: GetAvailabilityResponse) => void): ClientUnaryCall;
    getAvailability(request: GetAvailabilityRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetAvailabilityResponse) => void): ClientUnaryCall;
    getAvailability(request: GetAvailabilityRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetAvailabilityResponse) => void): ClientUnaryCall;
    getBlockedDates(request: GetBlockedDatesRequest, callback: (error: ServiceError | null, response: GetBlockedDatesResponse) => void): ClientUnaryCall;
    getBlockedDates(request: GetBlockedDatesRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetBlockedDatesResponse) => void): ClientUnaryCall;
    getBlockedDates(request: GetBlockedDatesRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetBlockedDatesResponse) => void): ClientUnaryCall;
    createAppointment(request: CreateAppointmentRequest, callback: (error: ServiceError | null, response: CreateAppointmentResponse) => void): ClientUnaryCall;
    createAppointment(request: CreateAppointmentRequest, metadata: Metadata, callback: (error: ServiceError | null, response: CreateAppointmentResponse) => void): ClientUnaryCall;
    createAppointment(request: CreateAppointmentRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: CreateAppointmentResponse) => void): ClientUnaryCall;
    getAppointmentsByMonth(request: GetAppointmentsByMonthRequest, callback: (error: ServiceError | null, response: GetAppointmentsByMonthResponse) => void): ClientUnaryCall;
    getAppointmentsByMonth(request: GetAppointmentsByMonthRequest, metadata: Metadata, callback: (error: ServiceError | null, response: GetAppointmentsByMonthResponse) => void): ClientUnaryCall;
    getAppointmentsByMonth(request: GetAppointmentsByMonthRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: GetAppointmentsByMonthResponse) => void): ClientUnaryCall;
    updateAppointmentStatus(request: UpdateAppointmentStatusRequest, callback: (error: ServiceError | null, response: UpdateAppointmentStatusResponse) => void): ClientUnaryCall;
    updateAppointmentStatus(request: UpdateAppointmentStatusRequest, metadata: Metadata, callback: (error: ServiceError | null, response: UpdateAppointmentStatusResponse) => void): ClientUnaryCall;
    updateAppointmentStatus(request: UpdateAppointmentStatusRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: UpdateAppointmentStatusResponse) => void): ClientUnaryCall;
    rescheduleAppointment(request: RescheduleAppointmentRequest, callback: (error: ServiceError | null, response: RescheduleAppointmentResponse) => void): ClientUnaryCall;
    rescheduleAppointment(request: RescheduleAppointmentRequest, metadata: Metadata, callback: (error: ServiceError | null, response: RescheduleAppointmentResponse) => void): ClientUnaryCall;
    rescheduleAppointment(request: RescheduleAppointmentRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: RescheduleAppointmentResponse) => void): ClientUnaryCall;
    createManualAppointment(request: CreateManualAppointmentRequest, callback: (error: ServiceError | null, response: CreateManualAppointmentResponse) => void): ClientUnaryCall;
    createManualAppointment(request: CreateManualAppointmentRequest, metadata: Metadata, callback: (error: ServiceError | null, response: CreateManualAppointmentResponse) => void): ClientUnaryCall;
    createManualAppointment(request: CreateManualAppointmentRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: CreateManualAppointmentResponse) => void): ClientUnaryCall;
}
export declare const SchedulingServiceClient: {
    new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): SchedulingServiceClient;
    service: typeof SchedulingServiceService;
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
