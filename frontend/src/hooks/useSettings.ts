import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, Settings } from '../services/adminApi';

export function useSettings() {
  return useQuery({ queryKey: ['settings'], queryFn: adminApi.getSettings });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Settings>) => adminApi.updateSettings(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}
