import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../services/publicApi';

export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: publicApi.getServices,
    staleTime: 5 * 60 * 1000,
  });
}
