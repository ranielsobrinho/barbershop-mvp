import { STATUS_LABELS, STATUS_COLORS } from '../../utils/constants';

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
