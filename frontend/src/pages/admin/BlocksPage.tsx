import { useState } from 'react';
import { useBlocks, useCreateBlock, useDeleteBlock } from '../../hooks/useBlocks';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { Modal } from '../../components/ui/Modal';
import { format, parseISO, monthString, MONTHS, addMonths, subMonths, toDateString } from '../../utils/date';

export function BlocksPage() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const month = monthString(currentMonth);
  const { data: blocks = [], isLoading } = useBlocks(month);
  const createBlock = useCreateBlock();
  const deleteBlock = useDeleteBlock();

  const [mode, setMode] = useState<'day' | 'range' | 'hours' | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [affected, setAffected] = useState<any[] | null>(null);

  const openModal = (m: 'day' | 'range' | 'hours') => {
    setMode(m); setError(null); setAffected(null); setReason('');
    setDateFrom(toDateString(new Date())); setDateTo(toDateString(new Date()));
    setTimeFrom('14:00'); setTimeTo('16:00');
  };

  const handleSubmit = async (confirmed = false) => {
    setError(null);
    setAffected(null);
    try {
      // Offset explícito America/Fortaleza (UTC-3), independente do fuso do navegador
      let startsAt: string, endsAt: string;
      if (mode === 'hours' && dateFrom) {
        const s = new Date(`${dateFrom}T${timeFrom}:00-03:00`);
        const e = new Date(`${dateFrom}T${timeTo}:00-03:00`);
        if (e <= s) { setError('Horário final deve ser após o inicial'); return; }
        startsAt = s.toISOString(); endsAt = e.toISOString();
      } else if (mode === 'range') {
        const s = new Date(`${dateFrom}T00:00:00-03:00`);
        const e = new Date(`${dateTo || dateFrom}T23:59:59-03:00`);
        if (e < s) { setError('Data final deve ser após a inicial'); return; }
        startsAt = s.toISOString(); endsAt = e.toISOString();
      } else {
        const s = new Date(`${dateFrom}T00:00:00-03:00`);
        const e = new Date(`${dateFrom}T23:59:59-03:00`);
        startsAt = s.toISOString(); endsAt = e.toISOString();
      }

      const result = await createBlock.mutateAsync({ startsAt, endsAt, reason: reason || undefined, confirmed });
      if ((result as any).affectedAppointments?.length) {
        setAffected((result as any).affectedAppointments);
        return;
      }
      setMode(null);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setAffected(err.response.data.affectedAppointments || []);
        setError(err.response.data.message);
      } else {
        setError(err.response?.data?.message || 'Erro ao criar bloqueio');
      }
    }
  };

  const handleDelete = async (id: string) => {
    try { await deleteBlock.mutateAsync(id); } catch (err: any) { setError(err.response?.data?.message || 'Erro ao excluir'); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bloqueios</h1>
          <p className="text-sm text-gray-500">Bloqueie dias inteiros ou faixas de horário</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="btn-secondary py-2 px-4 text-sm">‹</button>
          <span className="font-semibold text-gray-900 min-w-32 text-center text-sm">{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="btn-secondary py-2 px-4 text-sm">›</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => openModal('day')} className="btn-primary py-2.5 px-4 text-sm">📅 Bloquear dia</button>
        <button onClick={() => openModal('range')} className="btn-secondary py-2.5 px-4 text-sm">📆 Bloquear período</button>
        <button onClick={() => openModal('hours')} className="btn-secondary py-2.5 px-4 text-sm">⏰ Bloquear horário</button>
      </div>

      <ErrorAlert message={error} />

      {isLoading ? <Spinner /> : (
        <div className="space-y-3">
          {blocks.length === 0 && <p className="text-gray-500 text-center py-8">Nenhum bloqueio neste mês.</p>}
          {blocks.map((b) => {
            const s = parseISO(b.startsAt);
            const e = parseISO(b.endsAt);
            const fullDay = (e.getTime() - s.getTime()) > 23 * 60 * 60 * 1000;
            return (
              <div key={b.id} className="card flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0">🚫</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">
                    {fullDay
                      ? format(s, 'dd/MM/yyyy')
                      : `${format(s, 'dd/MM/yyyy')} · ${format(s, 'HH:mm')}—${format(e, 'HH:mm')}`}
                  </p>
                  {b.reason && <p className="text-xs text-gray-500 truncate">{b.reason}</p>}
                </div>
                <button onClick={() => handleDelete(b.id)} disabled={deleteBlock.isPending}
                  className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
                  Remover
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal bloqueio */}
      <Modal open={!!mode} onClose={() => setMode(null)} title={
        mode === 'day' ? 'Bloquear dia' : mode === 'range' ? 'Bloquear período' : 'Bloquear horário'
      }>
        <div className="space-y-4">
          <ErrorAlert message={error} />

          {affected && affected.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-yellow-800 mb-2">
                ⚠️ {affected.length} agendamento(s) serão afetados:
              </p>
              <ul className="text-sm text-yellow-700 space-y-1 mb-3">
                {affected.map((a) => (
                  <li key={a.id}>• {a.customerName} — {format(parseISO(a.startsAt), 'dd/MM HH:mm')}</li>
                ))}
              </ul>
              <p className="text-xs text-yellow-600 mb-3">Confirme para criar o bloqueio. Você poderá cancelar os agendamentos depois pela agenda.</p>
              <button onClick={() => handleSubmit(true)} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium py-2.5 rounded-xl transition">
                Confirmar mesmo assim
              </button>
            </div>
          )}

          {(mode === 'day' || mode === 'hours') && (
            <div>
              <label htmlFor="blk-date" className="label">Data</label>
              <input id="blk-date" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field" />
            </div>
          )}

          {mode === 'range' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="blk-from" className="label">De</label>
                <input id="blk-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field" />
              </div>
              <div>
                <label htmlFor="blk-to" className="label">Até</label>
                <input id="blk-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field" />
              </div>
            </div>
          )}

          {mode === 'hours' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="blk-tf" className="label">Das</label>
                <input id="blk-tf" type="time" value={timeFrom} onChange={(e) => setTimeFrom(e.target.value)} className="input-field" />
              </div>
              <div>
                <label htmlFor="blk-tt" className="label">Às</label>
                <input id="blk-tt" type="time" value={timeTo} onChange={(e) => setTimeTo(e.target.value)} className="input-field" />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="blk-reason" className="label">Motivo (opcional)</label>
            <input id="blk-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="input-field" placeholder="Férias, consulta médica..." maxLength={200} />
          </div>

          {!affected && (
            <div className="flex gap-3 pt-2">
              <button onClick={() => setMode(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => handleSubmit()} disabled={createBlock.isPending} className="btn-primary flex-1">
                {createBlock.isPending ? 'Salvando...' : 'Bloquear'}
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
