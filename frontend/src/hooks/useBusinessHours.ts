import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, BusinessHours } from '../services/adminApi';

export function useBusinessHours() {
  return useQuery({ queryKey: ['business-hours'], queryFn: adminApi.getBusinessHours });
}

export function useUpdateBusinessHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (hours: Partial<BusinessHours>[]) => adminApi.updateBusinessHours(hours),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-hours'] }),
  });
}
