export const APPOINTMENT_STATUSES = [
    'AGUARDANDO_CONFIRMACAO',
    'CONFIRMADO',
    'CANCELADO',
    'REAGENDADO',
];
/** Status que ocupam o horário na agenda. */
export const OCCUPYING_STATUSES = [
    'AGUARDANDO_CONFIRMACAO',
    'CONFIRMADO',
    'REAGENDADO',
];
export function isStatus(value) {
    return APPOINTMENT_STATUSES.includes(value);
}
//# sourceMappingURL=AppointmentStatus.js.map