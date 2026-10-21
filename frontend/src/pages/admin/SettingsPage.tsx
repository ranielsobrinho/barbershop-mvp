import { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings';
import { useBusinessHours, useUpdateBusinessHours } from '../../hooks/useBusinessHours';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { WEEKDAYS_FULL } from '../../utils/date';
import type { BusinessHours } from '../../services/adminApi';

export function SettingsPage() {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { data: hours = [], isLoading: hoursLoading } = useBusinessHours();
  const updateHours = useUpdateBusinessHours();

  const [minNotice, setMinNotice] = useState(2);
  const [maxDays, setMaxDays] = useState(60);
  const [heroText, setHeroText] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [savedSettings, setSavedSettings] = useState(false);
  const [savedHours, setSavedHours] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoursError, setHoursError] = useState<string | null>(null);
  const [hoursDraft, setHoursDraft] = useState<BusinessHours[]>([]);

  useEffect(() => {
    if (settings) {
      setMinNotice(settings.minNoticeHours);
      setMaxDays(settings.maxDaysAhead);
      setHeroText(settings.heroText || '');
      setHeroImage(settings.heroImageUrl || '');
    }
  }, [settings]);

  useEffect(() => {
    if (hours.length > 0) setHoursDraft(hours);
  }, [hours]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSavedSettings(false);
    try {
      await updateSettings.mutateAsync({
        minNoticeHours: minNotice,
        maxDaysAhead: maxDays,
        heroText: heroText || null,
        heroImageUrl: heroImage || null,
      });
      setSavedSettings(true);
      setTimeout(() => setSavedSettings(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar');
    }
  };

  const handleSaveHours = async () => {
    setHoursError(null); setSavedHours(false);
    try {
      await updateHours.mutateAsync(hoursDraft.map(h => ({
        weekday: h.weekday, opensAt: h.opensAt, closesAt: h.closesAt,
        breakStart: h.breakStart, breakEnd: h.breakEnd, active: h.active,
      })));
      setSavedHours(true);
      setTimeout(() => setSavedHours(false), 3000);
    } catch (err: any) {
      setHoursError(err.response?.data?.message || 'Erro ao salvar');
    }
  };

  const updateDraft = (weekday: number, field: keyof BusinessHours, value: any) => {
    setHoursDraft(prev => prev.map(h => h.weekday === weekday ? { ...h, [field]: value } : h));
  };

  if (settingsLoading || hoursLoading) return <Spinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configurações</h1>

      {/* Expediente */}
      <section className="card mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Horário de funcionamento</h2>
        <p className="text-sm text-gray-500 mb-4">Define a disponibilidade exibida ao cliente</p>
        <ErrorAlert message={hoursError} />
        {savedHours && <div className="bg-green-50 text-green-700 text-sm rounded-xl px-4 py-3 mb-3">✓ Expediente salvo com sucesso</div>}

        <div className="space-y-3">
          {[...hoursDraft].sort((a, b) => a.weekday - b.weekday).map((h) => (
            <div key={h.weekday} className={`flex flex-wrap items-center gap-2 sm:gap-3 p-3 rounded-xl border ${h.active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200'}`}>
              <label className="flex items-center gap-2 min-w-32 sm:min-w-36">
                <input type="checkbox" checked={h.active} onChange={(e) => updateDraft(h.weekday, 'active', e.target.checked)} className="w-4 h-4 rounded" />
                <span className={`text-sm font-medium ${h.active ? 'text-gray-900' : 'text-gray-400'}`}>{WEEKDAYS_FULL[h.weekday]}</span>
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <input type="time" value={h.opensAt} onChange={(e) => updateDraft(h.weekday, 'opensAt', e.target.value)} disabled={!h.active} className="input-field w-28 text-sm py-2" aria-label={`Abertura ${WEEKDAYS_FULL[h.weekday]}`} />
                <span className="text-gray-400 text-sm">—</span>
                <input type="time" value={h.closesAt} onChange={(e) => updateDraft(h.weekday, 'closesAt', e.target.value)} disabled={!h.active} className="input-field w-28 text-sm py-2" aria-label={`Fechamento ${WEEKDAYS_FULL[h.weekday]}`} />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400">Almoço:</span>
                <input type="time" value={h.breakStart || ''} onChange={(e) => updateDraft(h.weekday, 'breakStart', e.target.value || null)} disabled={!h.active} className="input-field w-24 text-sm py-2" aria-label={`Início almoço ${WEEKDAYS_FULL[h.weekday]}`} />
                <span className="text-gray-400 text-sm">—</span>
                <input type="time" value={h.breakEnd || ''} onChange={(e) => updateDraft(h.weekday, 'breakEnd', e.target.value || null)} disabled={!h.active} className="input-field w-24 text-sm py-2" aria-label={`Fim almoço ${WEEKDAYS_FULL[h.weekday]}`} />
              </div>
            </div>
          ))}
        </div>
        <button onClick={handleSaveHours} disabled={updateHours.isPending} className="btn-primary mt-4 w-full sm:w-auto">
          {updateHours.isPending ? 'Salvando...' : 'Salvar expediente'}
        </button>
      </section>

      {/* Configurações gerais */}
      <section className="card mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Regras de agendamento</h2>
        <ErrorAlert message={error} />
        {savedSettings && <div className="bg-green-50 text-green-700 text-sm rounded-xl px-4 py-3 mb-3">✓ Configurações salvas</div>}

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="min-notice" className="label">Antecedência mínima (horas)</label>
              <input id="min-notice" type="number" min={0} max={72} value={minNotice} onChange={(e) => setMinNotice(parseInt(e.target.value) || 0)} className="input-field" />
            </div>
            <div>
              <label htmlFor="max-days" className="label">Janela máxima (dias)</label>
              <input id="max-days" type="number" min={1} max={365} value={maxDays} onChange={(e) => setMaxDays(parseInt(e.target.value) || 1)} className="input-field" />
            </div>
          </div>

          <div>
            <label htmlFor="hero-text" className="label">Texto do hero</label>
            <textarea id="hero-text" value={heroText} onChange={(e) => setHeroText(e.target.value)} className="input-field" rows={2} maxLength={500} placeholder="Seu Carlos Barbearia — Tradição e estilo no seu corte" />
          </div>
          <div>
            <label htmlFor="hero-image" className="label">URL da imagem do hero</label>
            <input id="hero-image" type="url" value={heroImage} onChange={(e) => setHeroImage(e.target.value)} className="input-field" placeholder="https://..." />
          </div>

          <button type="submit" className="btn-primary w-full sm:w-auto" disabled={updateSettings.isPending}>
            {updateSettings.isPending ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </form>
      </section>
    </div>
  );
}
