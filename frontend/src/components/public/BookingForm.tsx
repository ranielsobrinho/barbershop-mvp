import { useState, useMemo, useRef, useLayoutEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '../../hooks/useServices';
import { useAvailability } from '../../hooks/useAvailability';
import { useBlockedDates } from '../../hooks/useBlockedDates';
import { publicApi, Service, Appointment } from '../../services/publicApi';
import { ServicesList } from './ServicesList';
import { Spinner } from '../ui/Spinner';
import { ErrorAlert } from '../ui/ErrorAlert';
import { maskPhone, isValidPhone, mapCursorPosition, createCursorCancellationToken, correctCursorPosition } from '../../utils/phone';
import { formatMoney } from '../../utils/money';
import {
  format, parseISO, startOfDay, isAfter, addMonths, subMonths,
  startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, toDateString, monthString, WEEKDAYS_SHORT, MONTHS,
} from '../../utils/date';

const bookingSchema = z.object({
  customerName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(80),
  customerPhone: z.string().refine(isValidPhone, 'Telefone inválido. Use (11) 9XXXX-XXXX'),
});

type BookingForm = z.infer<typeof bookingSchema>;

interface Props {
  onConfirmed: (appointment: Appointment) => void;
}

interface PendingCursor {
  rawValue: string;
  rawCursorPos: number;
  maskedValue: string;
}

export function BookingForm({ onConfirmed }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState('');

  const queryClient = useQueryClient();

  // Ref for phone input to preserve cursor position during masking
  const phoneInputRef = useRef<HTMLInputElement>(null);
  
  // Refs para controle de cursor assíncrono
  const pendingCursorRef = useRef<PendingCursor | null>(null);
  const cursorTokenRef = useRef<ReturnType<typeof createCursorCancellationToken> | null>(null);
  
  // Ref to track previous raw value for cursor position calculation
  const prevRawValueRef = useRef<string>('');

  const { data: services, isLoading: servicesLoading } = useServices();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const monthStr = monthString(currentMonth);
  const { data: blockedDates = [] } = useBlockedDates(monthStr);

  const dateStr = selectedDate ? toDateString(selectedDate) : null;
  const { data: slots, isLoading: slotsLoading } = useAvailability(dateStr, serviceId);

  const selectedService = services?.find(s => s.id === serviceId) || null;

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  }, [currentMonth]);

  const today = startOfDay(new Date());
  const canGoPrev = isAfter(currentMonth, startOfMonth(today));

  const isDayDisabled = (day: Date): boolean => {
    if (isSameDay(day, today) || isAfter(day, today)) {
      return blockedDates.includes(toDateString(day));
    }
    return true;
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookingForm>({ resolver: zodResolver(bookingSchema), defaultValues: { customerName: '', customerPhone: '' } });

  const phoneValue = watch('customerPhone');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const rawCursorPos = e.target.selectionStart ?? 0;

    // Calculate correct cursor position based on previous raw value
    // Uses correctCursorPosition utility to avoid flawed heuristic
    const prevRawValue = prevRawValueRef.current;
    const correctedCursorPos = correctCursorPosition(prevRawValue, rawValue, rawCursorPos);
    
    prevRawValueRef.current = rawValue;

    const masked = maskPhone(rawValue);
    setValue('customerPhone', masked, { shouldValidate: true });

    // Cancela qualquer restauração de cursor pendente
    if (cursorTokenRef.current) {
      cursorTokenRef.current.cancelled = true;
    }
    
    // Cria novo token para esta mudança
    const token = createCursorCancellationToken();
    cursorTokenRef.current = token;

    // Armazena rawValue, correctedCursorPos e maskedValue para uso no useLayoutEffect
    pendingCursorRef.current = { rawValue, rawCursorPos: correctedCursorPos, maskedValue: masked };
  };

  // useLayoutEffect para restaurar cursor sincronamente após o render
  // Evita stale async cursor work e garante que o input está focado
  useLayoutEffect(() => {
    const pending = pendingCursorRef.current;
    const token = cursorTokenRef.current;
    const input = phoneInputRef.current;

    if (!pending || !input || !token) return;

    // Só restaura se o input ainda estiver focado (usuário está digitando)
    if (document.activeElement !== input) {
      pendingCursorRef.current = null;
      return;
    }

    // Verifica se não foi cancelado por uma mudança posterior
    if (token.cancelled) {
      pendingCursorRef.current = null;
      return;
    }

    // Calcula a posição correta do cursor na string mascarada
    const { rawValue, rawCursorPos, maskedValue } = pending;
    const newCursorPos = mapCursorPosition(rawValue, rawCursorPos, maskedValue);

    // Clamp para range válido
    const clampedPos = Math.min(Math.max(0, newCursorPos), maskedValue.length);
    
    // Só define se ainda focado e não cancelado
    if (document.activeElement === input && !token.cancelled) {
      input.setSelectionRange(clampedPos, clampedPos);
    }

    pendingCursorRef.current = null;
  }, [phoneValue]); // Re-executa quando phoneValue muda (após setValue)

  const onSubmit = async (data: BookingForm) => {
    if (!serviceId || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Instante em America/Fortaleza (UTC-3) explícito, independente do fuso do navegador
      const dateStrLocal = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      const startsAt = new Date(`${dateStrLocal}T${selectedTime}:00-03:00`);

      const appointment = await publicApi.createAppointment({
        serviceId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        startsAt: startsAt.toISOString(),
        website: honeypot,
      });
      // Invalidate availability so other users/tabs see the slot as taken
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      onConfirmed(appointment);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao agendar. Tente novamente.';
      setSubmitError(msg);
      if (err.response?.status === 409) {
        // Horário foi ocupado — volta para seleção de horário
        setStep(2);
        setSelectedTime(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (servicesLoading) return <Spinner />;

  const stepTitle = ['Escolha o serviço', 'Escolha a data', 'Escolha o horário', 'Seus dados'][step - 1];

  return (
    <div className="card">
      {/* Progresso */}
      <div className="flex gap-1 mb-5" aria-label={`Etapa ${step} de 4`}>
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-primary-600' : 'bg-gray-200'}`} />
        ))}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-4">{stepTitle}</h3>

      {/* Etapa 1: Serviço */}
      {step === 1 && (
        <div>
          <ServicesList services={services || []} selectedId={serviceId ?? undefined} onSelect={(id) => { setServiceId(id); setStep(2); }} selectable />
        </div>
      )}

      {/* Etapa 2: Data */}
      {step === 2 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} disabled={!canGoPrev}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30" aria-label="Mês anterior">‹</button>
            <span className="font-semibold text-gray-900">{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
            <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 rounded-lg hover:bg-gray-100" aria-label="Próximo mês">›</button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs text-gray-400 font-medium">
            {WEEKDAYS_SHORT.map((w) => <div key={w}>{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((day, i) => {
              const disabled = isDayDisabled(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, today);
              return (
                <div key={i} className={i === 0 ? `col-start-${((day.getDay() || 7) % 7) + 1}` : ''}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => { setSelectedDate(day); setSelectedTime(null); setStep(3); }}
                    className={`w-full aspect-square rounded-xl text-sm font-medium flex items-center justify-center transition
                      ${isSelected ? 'bg-primary-600 text-white' : ''}
                      ${disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-primary-50'}
                      ${isToday && !isSelected ? 'ring-1 ring-primary-400' : ''}`}
                    aria-label={format(day, "dd 'de' MMMM", { locale: undefined })}
                  >
                    {day.getDate()}
                  </button>
                </div>
              );
            })}
          </div>
          <button type="button" onClick={() => setStep(1)} className="btn-secondary mt-4 w-full">← Voltar</button>
        </div>
      )}

      {/* Etapa 3: Horário */}
      {step === 3 && (
        <div>
          <p className="text-sm text-gray-500 mb-3">{selectedDate && format(selectedDate, "dd/MM/yyyy")}</p>
          {slotsLoading && <Spinner label="Carregando horários..." />}
          {!slotsLoading && slots && slots.length === 0 && (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">Nenhum horário disponível para este dia. Escolha outra data.</p>
              <button type="button" onClick={() => setStep(2)} className="btn-secondary w-full">Escolher outra data</button>
            </div>
          )}
          {!slotsLoading && slots && slots.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto" role="radiogroup">
              {slots.map((slot) => (
                <button
                  key={slot.start}
                  type="button"
                  onClick={() => { setSelectedTime(slot.start); setStep(4); }}
                  className={`py-3 rounded-xl border text-sm font-medium transition
                    ${selectedTime === slot.start
                      ? 'border-primary-600 bg-primary-600 text-white'
                      : 'border-gray-200 text-gray-700 hover:border-primary-400 hover:bg-primary-50'}`}
                  role="radio"
                  aria-checked={selectedTime === slot.start}
                >
                  {slot.start}
                </button>
              ))}
            </div>
          )}
          {!slotsLoading && slots && slots.length > 0 && (
            <button type="button" onClick={() => setStep(2)} className="btn-secondary mt-4 w-full">← Voltar</button>
          )}
        </div>
      )}

      {/* Etapa 4: Dados + Confirmação */}
      {step === 4 && (
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Resumo */}
          {selectedService && selectedDate && selectedTime && (
            <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 mb-4 text-sm">
              <p className="font-semibold text-primary-900">{selectedService.name}</p>
              <p className="text-primary-700">{format(selectedDate, "dd 'de' MMMM 'de' yyyy")}</p>
              <p className="text-primary-700">Às {selectedTime} · {selectedService.slotMin} min</p>
              <p className="text-lg font-bold text-primary-900 mt-1">{formatMoney(selectedService.priceCents)}</p>
            </div>
          )}

          <ErrorAlert message={submitError} />

          <div className="space-y-4">
            <div>
              <label htmlFor="customerName" className="label">Nome *</label>
              <input id="customerName" {...register('customerName')} className="input-field" placeholder="Seu nome completo" autoComplete="name" />
              {errors.customerName && <p className="text-red-600 text-xs mt-1">{errors.customerName.message}</p>}
            </div>
            <div>
              <label htmlFor="customerPhone" className="label">Telefone (WhatsApp) *</label>
              <input 
                id="customerPhone" 
                ref={phoneInputRef} 
                value={phoneValue || ''} 
                onChange={handlePhoneChange} 
                className="input-field" 
                placeholder="(11) 99999-9999" 
                inputMode="tel" 
                autoComplete="tel" 
              />
              {errors.customerPhone && <p className="text-red-600 text-xs mt-1">{errors.customerPhone.message}</p>}
            </div>

            {/* Honeypot anti-abuso: invisível para humanos e leitores de tela */}
            <div className="absolute left-[-9999px] opacity-0" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input id="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </div>

            {/* LGPD */}
            <p className="text-xs text-gray-500 leading-relaxed">
              Seus dados (nome e telefone) são usados <strong>apenas para o agendamento</strong>.
              Retenção limitada a 12 meses. Para solicitar exclusão, entre em contato pelo WhatsApp da barbearia.
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => setStep(3)} className="btn-secondary flex-1" disabled={submitting}>← Voltar</button>
            <button type="submit" className="btn-primary flex-1" disabled={submitting}>
              {submitting ? 'Agendando...' : 'Confirmar agendamento'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}