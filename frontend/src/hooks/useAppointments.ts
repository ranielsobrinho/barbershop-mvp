import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/adminApi';

export function useAppointmentsByMonth(month: string) {
  return useQuery({
    queryKey: ['appointments', month],
    queryFn: () => adminApi.listAppointments(month),
    enabled: !!month,
  });
}

export function useUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useReschedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newStartsAt }: { id: string; newStartsAt: string }) => adminApi.reschedule(id, newStartsAt),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useAppointmentReminder(appointmentId: string | null) {
  return useQuery({
    queryKey: ['appointment-reminder', appointmentId],
    queryFn: () => adminApi.getAppointmentReminder(appointmentId!),
    enabled: !!appointmentId,
  });
}

export function useRetryAppointmentReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (appointmentId: string) => adminApi.retryAppointmentReminder(appointmentId),
    onSuccess: (_reminder, appointmentId) =>
      qc.invalidateQueries({ queryKey: ['appointment-reminder', appointmentId] }),
  });
}
