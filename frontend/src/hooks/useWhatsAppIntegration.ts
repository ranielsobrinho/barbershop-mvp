import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, WhatsAppIntegrationUpdate } from '../services/adminApi';

export function useWhatsAppIntegration() {
  return useQuery({ queryKey: ['whatsapp-integration'], queryFn: adminApi.getWhatsAppIntegration });
}

export function useUpdateWhatsAppIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: WhatsAppIntegrationUpdate) => adminApi.updateWhatsAppIntegration(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['whatsapp-integration'] }),
  });
}