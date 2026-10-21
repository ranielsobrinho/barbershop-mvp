/**
 * Gera os slots brutos de um dia a partir do expediente e do slot do serviço.
 * Horários são oferecidos de slot em slot a partir da abertura.
 * O serviço ocupa exatamente um slot (slotMin).
 */
export class SlotGenerator {
    generate(businessHours, slotMin) {
        if (!businessHours.active)
            return [];
        const openMin = this.toMinutes(businessHours.opensAt);
        const closeMin = this.toMinutes(businessHours.closesAt);
        const breakStart = businessHours.breakStart ? this.toMinutes(businessHours.breakStart) : null;
        const breakEnd = businessHours.breakEnd ? this.toMinutes(businessHours.breakEnd) : null;
        if (closeMin <= openMin)
            return [];
        const slots = [];
        for (let start = openMin; start + slotMin <= closeMin; start += slotMin) {
            const end = start + slotMin;
            // Não pode cruzar o intervalo de almoço
            if (breakStart !== null && breakEnd !== null && start < breakEnd && end > breakStart) {
                continue;
            }
            slots.push({ startMinutes: start, endMinutes: end });
        }
        return slots;
    }
    toMinutes(hhmm) {
        const [h, m] = hhmm.split(':').map(Number);
        return h * 60 + m;
    }
}
//# sourceMappingURL=SlotGenerator.js.map