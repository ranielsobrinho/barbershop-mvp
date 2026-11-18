import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../services/publicApi';

export function useAvailability(date: string | null, serviceId: string | null, barberId: string | null = 'barber_seu_carlos') {
  return useQuery({
    queryKey: ['availability', date, serviceId, barberId],
    queryFn: () => publicApi.getAvailability(date!, serviceId!, barberId!),
    enabled: !!date && !!serviceId && !!barberId,
    staleTime: 10 * 1000,
  });
}
