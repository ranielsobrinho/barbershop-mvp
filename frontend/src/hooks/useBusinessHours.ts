import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, BusinessHours } from '../services/adminApi';

export function useBusinessHours(barberId = 'barber_seu_carlos') {
  return useQuery({ queryKey: ['business-hours', barberId], queryFn: () => adminApi.getBusinessHours(barberId) });
}

export function useUpdateBusinessHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { barberId: string; hours: Partial<BusinessHours>[] }) => adminApi.updateBusinessHours(input.barberId, input.hours),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-hours'] }),
  });
}
