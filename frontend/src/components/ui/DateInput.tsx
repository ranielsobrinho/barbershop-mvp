import { useRef } from 'react';
import { formatDateInput, maskDateInput, parseDateInput } from '../../utils/dateInput';

interface DateInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  minDate?: string;
  'aria-label'?: string;
}

function cursorPositionForDigitCount(value: string, digitCount: number, skipSeparator: boolean): number {
  if (digitCount <= 0) return 0;

  let seen = 0;
  let position = 0;
  while (position < value.length && seen < digitCount) {
    if (/\d/.test(value[position])) seen++;
    position++;
  }
  if (skipSeparator) {
    while (position < value.length && value[position] === '/') position++;
  }
  return position;
}

export function DateInput({
  id,
  value,
  onChange,
  className = 'input-field',
  placeholder = 'DD/MM/AAAA',
  minDate,
  ...ariaProps
}: DateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const inputLabel = ariaProps['aria-label'] || 'Data';

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const rawValue = input.value;
    const rawCursor = input.selectionStart ?? rawValue.length;
    const digitsBeforeCursor = rawValue.slice(0, rawCursor).replace(/\D/g, '').length;
    const maskedValue = maskDateInput(rawValue);
    const inputType = (event.nativeEvent as InputEvent).inputType || '';
    const isDeletion = inputType.startsWith('delete');

    onChange(maskedValue);
    requestAnimationFrame(() => {
      if (document.activeElement !== inputRef.current) return;
      const position = cursorPositionForDigitCount(maskedValue, digitsBeforeCursor, !isDeletion);
      inputRef.current?.setSelectionRange(position, position);
    });
  };

  const openCalendarPicker = () => {
    const picker = pickerRef.current;
    if (!picker) return;

    try {
      if (typeof picker.showPicker === 'function') {
        picker.showPicker();
        return;
      }
    } catch {
      // Fall back to the native input click if showPicker is unavailable or blocked.
    }
    picker.click();
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={10}
        value={value}
        onChange={handleChange}
        className={`${className} pr-12`}
        placeholder={placeholder}
        aria-label={inputLabel}
        aria-invalid={value.length > 0 && !parseDateInput(value)}
      />
      <button
        type="button"
        onClick={openCalendarPicker}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-primary-700 rounded-lg transition"
        aria-label={`Escolher ${inputLabel.toLowerCase()} no calendário`}
        title="Escolher data no calendário"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
          <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
          <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01" strokeLinecap="round" />
        </svg>
      </button>
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        value={parseDateInput(value) || ''}
        min={minDate}
        onChange={(event) => onChange(formatDateInput(event.currentTarget.value))}
      />
    </div>
  );
}
