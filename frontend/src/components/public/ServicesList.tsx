import { formatMoney } from '../../utils/money';
import type { Service } from '../../services/publicApi';

interface Props {
  services: Service[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  selectable?: boolean;
}

export function ServicesList({ services, selectedId, onSelect, selectable = false }: Props) {
  if (services.length === 0) {
    return <p className="text-gray-500 text-center py-8">Nenhum serviço disponível no momento.</p>;
  }

  return (
    <div className="grid gap-3" role={selectable ? 'radiogroup' : 'list'}>
      {services.map((s) => {
        const isSelected = selectedId === s.id;
        const Wrapper = selectable ? 'button' : 'div';
        return (
          <Wrapper
            key={s.id}
            onClick={() => selectable && onSelect?.(s.id)}
            className={`card w-full text-left transition-all ${
              selectable ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500' : ''
            } ${isSelected ? 'border-primary-500 ring-2 ring-primary-200 bg-primary-50' : 'hover:border-gray-300'}`}
            role={selectable ? 'radio' : undefined}
            aria-checked={selectable ? isSelected : undefined}
            type={selectable ? 'button' : undefined}
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {selectable && (
                    <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${isSelected ? 'border-primary-600 bg-primary-600' : 'border-gray-300'}`}>
                      {isSelected && <span className="block w-full h-full rounded-full scale-50 bg-white" />}
                    </span>
                  )}
                  <h3 className="font-semibold text-gray-900">{s.name}</h3>
                </div>
                {s.description && <p className="text-sm text-gray-500 mt-1 ml-6">{s.description}</p>}
                <p className="text-xs text-gray-400 mt-1 ml-6">{s.slotMin} min</p>
              </div>
              <span className="text-lg font-bold text-primary-700 whitespace-nowrap">{formatMoney(s.priceCents)}</span>
            </div>
          </Wrapper>
        );
      })}
    </div>
  );
}
