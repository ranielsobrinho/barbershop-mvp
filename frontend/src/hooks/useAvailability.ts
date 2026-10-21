import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../services/publicApi';

export function useAvailability(date: string | null, serviceId: string | null) {
  return useQuery({
    queryKey: ['availability', date, serviceId],
    queryFn: () => publicApi.getAvailability(date!, serviceId!),
    enabled: !!date && !!serviceId,
    staleTime: 10 * 1000,
  });
}
