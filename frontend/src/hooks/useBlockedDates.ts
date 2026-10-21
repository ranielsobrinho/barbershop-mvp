import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../services/publicApi';

export function useBlockedDates(month: string) {
  return useQuery({
    queryKey: ['blocked-dates', month],
    queryFn: () => publicApi.getBlockedDates(month),
    staleTime: 60 * 1000,
  });
}
