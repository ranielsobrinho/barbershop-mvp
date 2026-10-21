import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/adminApi';

export function useBlocks(month?: string) {
  return useQuery({
    queryKey: ['blocks', month ?? 'all'],
    queryFn: () => adminApi.listBlocks(month),
  });
}

export function useCreateBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { startsAt: string; endsAt: string; reason?: string; confirmed?: boolean }) =>
      adminApi.createBlock(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blocks'] }),
  });
}

export function useDeleteBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteBlock(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blocks'] }),
  });
}
