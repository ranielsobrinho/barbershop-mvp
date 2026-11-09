import { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings';
import { useBusinessHours, useUpdateBusinessHours } from '../../hooks/useBusinessHours';
import { useWhatsAppIntegration, useUpdateWhatsAppIntegration } from '../../hooks/useWhatsAppIntegration';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { WEEKDAYS_FULL } from '../../utils/date';
import type { BusinessHours, WhatsAppIntegration, WhatsAppIntegrationUpdate } from '../../services/adminApi';
import { useToast } from '../../contexts/ToastContext';

const DEFAULT_WHATSAPP_MESSAGES = {
  awaitingConfirmation: 'Olá, {nome}! Recebemos seu agendamento de {servico} para {data} às {hora}. Estamos aguardando confirmação.',
  confirmed: 'Olá, {nome}! Seu agendamento de {servico} para {data} às {hora} foi confirmado.',
  cancelled: 'Olá, {nome}. Seu agendamento de {servico} para {data} às {hora} foi cancelado.',
  rescheduled: 'Olá, {nome}! Seu agendamento de {servico} foi reagendado. Novo horário: {data} às {hora}. Horário anterior: {horario_anterior}.',
  reminder: 'Olá, {nome}! Lembrete: seu agendamento de {servico} está marcado para {data}, às {hora}. Esperamos você!',
};

export function SettingsPage() {
  const { showToast } = useToast();
  const { data: settings, isLoading: settingsLoading, error: settingsLoadError } = useSettings();
  const updateSettings = useUpdateSettings();
  const { data: hours = [], isLoading: hoursLoading, error: hoursLoadError } = useBusinessHours();
  const updateHours = useUpdateBusinessHours();
  const { data: whatsapp, isLoading: whatsappLoading, isError: whatsappLoadError } = useWhatsAppIntegration();
  const updateWhatsApp = useUpdateWhatsAppIntegration();

  const [minNotice, setMinNotice] = useState(2);
  const [maxDays, setMaxDays] = useState(60);
  const [companyName, setCompanyName] = useState('');
  const [heroText, setHeroText] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [hoursDraft, setHoursDraft] = useState<BusinessHours[]>([]);

  // WhatsApp state
  const [waProvider, setWaProvider] = useState<WhatsAppIntegration['provider']>(null);
  const [wameApiKey, setWameApiKey] = useState('');
  const [zapsterApiToken, setZapsterApiToken] = useState('');
  const [zapsterInstanceId, setZapsterInstanceId] = useState('');
  const [messageAwaitingConfirmation, setMessageAwaitingConfirmation] = useState(DEFAULT_WHATSAPP_MESSAGES.awaitingConfirmation);
  const [messageConfirmed, setMessageConfirmed] = useState(DEFAULT_WHATSAPP_MESSAGES.confirmed);
  const [messageCancelled, setMessageCancelled] = useState(DEFAULT_WHATSAPP_MESSAGES.cancelled);
  const [messageRescheduled, setMessageRescheduled] = useState(DEFAULT_WHATSAPP_MESSAGES.rescheduled);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHoursBefore, setReminderHoursBefore] = useState(24);
  const [messageReminder, setMessageReminder] = useState(DEFAULT_WHATSAPP_MESSAGES.reminder);
  const [showWhatsAppVariables, setShowWhatsAppVariables] = useState(false);

  useEffect(() => {
    if (settingsLoadError) showToast('Erro ao carregar as configurações.', 'error');
  }, [settingsLoadError, showToast]);

  useEffect(() => {
    if (hoursLoadError) showToast('Erro ao carregar o horário de funcionamento.', 'error');
  }, [hoursLoadError, showToast]);

  useEffect(() => {
    if (whatsappLoadError) showToast('Erro ao carregar a integração WhatsApp.', 'error');
  }, [whatsappLoadError, showToast]);

  useEffect(() => {
    if (settings) {
      setMinNotice(settings.minNoticeHours);
      setMaxDays(settings.maxDaysAhead);
      setCompanyName(settings.companyName || '');
      setHeroText(settings.heroText || '');
      setHeroImage(settings.heroImageUrl || '');
    }
  }, [settings]);

  useEffect(() => {
    if (hours.length > 0) setHoursDraft(hours);
  }, [hours]);

  useEffect(() => {
    if (whatsapp) {
      setWaProvider(whatsapp.provider);
      // Secrets start empty - never pre-filled
      setWameApiKey('');
      setZapsterApiToken('');
      setZapsterInstanceId(whatsapp.zapsterInstanceId || '');
      setMessageAwaitingConfirmation(whatsapp.messageAwaitingConfirmation || DEFAULT_WHATSAPP_MESSAGES.awaitingConfirmation);
      setMessageConfirmed(whatsapp.messageConfirmed || DEFAULT_WHATSAPP_MESSAGES.confirmed);
      setMessageCancelled(whatsapp.messageCancelled || DEFAULT_WHATSAPP_MESSAGES.cancelled);
      setMessageRescheduled(whatsapp.messageRescheduled || DEFAULT_WHATSAPP_MESSAGES.rescheduled);
      setReminderEnabled(whatsapp.reminderEnabled ?? false);
      setReminderHoursBefore(whatsapp.reminderHoursBefore ?? 24);
      setMessageReminder(whatsapp.messageReminder || DEFAULT_WHATSAPP_MESSAGES.reminder);
    }
  }, [whatsapp]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings.mutateAsync({
        minNoticeHours: minNotice,
        maxDaysAhead: maxDays,
        companyName: companyName.trim(),
        heroText: heroText || null,
        heroImageUrl: heroImage || null,
      });
      showToast('Configurações salvas com sucesso.');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao salvar configurações';
      showToast(message, 'error');
    }
  };

  const handleSaveHours = async () => {
    try {
      await updateHours.mutateAsync(hoursDraft.map(h => ({
        weekday: h.weekday, opensAt: h.opensAt, closesAt: h.closesAt,
        breakStart: h.breakStart, breakEnd: h.breakEnd, active: h.active,
      })));
      showToast('Horário de funcionamento salvo com sucesso.');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao salvar horário de funcionamento';
      showToast(message, 'error');
    }
  };

  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (waProvider === 'WAME' && !wameApiKey.trim() && !whatsapp?.wameApiKeyConfigured) {
      const message = 'API Key da instância Wame é obrigatória';
      showToast(message, 'error');
      return;
    }
    if (waProvider === 'ZAPSTER') {
      if (!zapsterApiToken.trim() && !whatsapp?.zapsterApiTokenConfigured) {
        const message = 'Bearer token Zapster é obrigatório';
        showToast(message, 'error');
        return;
      }
      if (!zapsterInstanceId.trim() && !whatsapp?.zapsterInstanceId) {
        const message = 'Instance ID Zapster é obrigatório';
        showToast(message, 'error');
        return;
      }
    }
    if (reminderEnabled && waProvider === null) {
      const message = 'Configure um provedor WhatsApp antes de ativar os lembretes.';
      showToast(message, 'error');
      return;
    }
    if (!Number.isInteger(reminderHoursBefore) || reminderHoursBefore < 1 || reminderHoursBefore > 168) {
      const message = 'O lembrete deve ser configurado entre 1 e 168 horas antes.';
      showToast(message, 'error');
      return;
    }

    try {
      const payload: WhatsAppIntegrationUpdate = {
        provider: waProvider,
        messageAwaitingConfirmation,
        messageConfirmed,
        messageCancelled,
        messageRescheduled,
        reminderEnabled,
        reminderHoursBefore,
        messageReminder,
      };
      if (waProvider === 'WAME' && wameApiKey.trim()) payload.wameApiKey = wameApiKey.trim();
      if (waProvider === 'ZAPSTER') {
        if (zapsterApiToken.trim()) payload.zapsterApiToken = zapsterApiToken.trim();
        if (zapsterInstanceId.trim()) payload.zapsterInstanceId = zapsterInstanceId.trim();
      }
      await updateWhatsApp.mutateAsync(payload);
      // Clear secret fields after successful save
      setWameApiKey('');
      setZapsterApiToken('');
      showToast('Integração WhatsApp salva com sucesso.');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao salvar integração WhatsApp';
      showToast(message, 'error');
    }
  };

  const updateDraft = (weekday: number, field: keyof BusinessHours, value: any) => {
    setHoursDraft(prev => prev.map(h => h.weekday === weekday ? { ...h, [field]: value } : h));
  };

  const isWhatsAppLoading = whatsappLoading || whatsappLoadError || updateWhatsApp.isPending;

  if (settingsLoading || hoursLoading || whatsappLoading) return <Spinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configurações</h1>

      {/* Expediente */}
      <section className="card mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Horário de funcionamento</h2>
        <p className="text-sm text-gray-500 mb-4">Define a disponibilidade exibida ao cliente</p>

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

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <label htmlFor="company-name" className="label">Nome da empresa</label>
            <input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="input-field" maxLength={100} required />
          </div>
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

      {/* Integração WhatsApp */}
      <section className="card mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Integração WhatsApp</h2>
        <p className="text-sm text-gray-500 mb-4">
          Configure o provedor para envio automático de mensagens em novos agendamentos, confirmação, cancelamento e reagendamento.
        </p>

        <form onSubmit={handleSaveWhatsApp} className="space-y-4">
          <fieldset className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <legend className="font-medium text-gray-900 px-1">Mensagens por etapa do agendamento</legend>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-gray-500">Use variáveis para preencher os dados do agendamento. Campo vazio usa a mensagem padrão.</p>
              <button type="button" className="btn-secondary px-3 py-1.5 text-sm" onClick={() => setShowWhatsAppVariables(true)} aria-haspopup="dialog">
                Ver variáveis
              </button>
            </div>
            <div>
              <label htmlFor="wa-message-awaiting" className="label">Aguardando confirmação</label>
              <textarea id="wa-message-awaiting" value={messageAwaitingConfirmation} onChange={(e) => setMessageAwaitingConfirmation(e.target.value)} className="input-field" rows={3} maxLength={2000} disabled={isWhatsAppLoading} placeholder={DEFAULT_WHATSAPP_MESSAGES.awaitingConfirmation} />
            </div>
            <div>
              <label htmlFor="wa-message-confirmed" className="label">Confirmado</label>
              <textarea id="wa-message-confirmed" value={messageConfirmed} onChange={(e) => setMessageConfirmed(e.target.value)} className="input-field" rows={3} maxLength={2000} disabled={isWhatsAppLoading} placeholder={DEFAULT_WHATSAPP_MESSAGES.confirmed} />
            </div>
            <div>
              <label htmlFor="wa-message-cancelled" className="label">Cancelado</label>
              <textarea id="wa-message-cancelled" value={messageCancelled} onChange={(e) => setMessageCancelled(e.target.value)} className="input-field" rows={3} maxLength={2000} disabled={isWhatsAppLoading} placeholder={DEFAULT_WHATSAPP_MESSAGES.cancelled} />
            </div>
            <div>
              <label htmlFor="wa-message-rescheduled" className="label">Reagendado</label>
              <textarea id="wa-message-rescheduled" value={messageRescheduled} onChange={(e) => setMessageRescheduled(e.target.value)} className="input-field" rows={3} maxLength={2000} disabled={isWhatsAppLoading} placeholder={DEFAULT_WHATSAPP_MESSAGES.rescheduled} />
            </div>
          </fieldset>

          <fieldset className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <legend className="font-medium text-gray-900 px-1">Lembrete automático</legend>
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                id="wa-reminder-enabled"
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="mt-1 h-4 w-4 rounded"
                disabled={isWhatsAppLoading}
              />
              <span>Enviar um lembrete por WhatsApp antes do agendamento</span>
            </label>
            <div>
              <label htmlFor="wa-reminder-hours" className="label">Antecedência (horas)</label>
              <input
                id="wa-reminder-hours"
                type="number"
                min={1}
                max={168}
                step={1}
                value={reminderHoursBefore}
                onChange={(e) => setReminderHoursBefore(Number(e.target.value))}
                className="input-field max-w-xs"
                disabled={isWhatsAppLoading}
              />
              <p className="text-xs text-gray-500 mt-1">O padrão é 24 horas. Se o agendamento for feito com menos antecedência, o lembrete será enviado assim que possível.</p>
            </div>
            <div>
              <label htmlFor="wa-message-reminder" className="label">Texto do lembrete</label>
              <textarea
                id="wa-message-reminder"
                value={messageReminder}
                onChange={(e) => setMessageReminder(e.target.value)}
                className="input-field"
                rows={3}
                maxLength={2000}
                disabled={isWhatsAppLoading}
                placeholder={DEFAULT_WHATSAPP_MESSAGES.reminder}
              />
              <p className="text-xs text-gray-500 mt-1">Deixe vazio para usar a mensagem padrão. O envio fica desativado se o provedor WhatsApp não estiver configurado.</p>
            </div>
          </fieldset>

          <div>
            <label htmlFor="wa-provider" className="label">Provedor</label>
            <select
              id="wa-provider"
              value={waProvider || ''}
              onChange={(e) => setWaProvider(e.target.value as WhatsAppIntegration['provider'] || null)}
              className="input-field"
              disabled={isWhatsAppLoading}
            >
              <option value="">Desativado</option>
              <option value="WAME">Wame</option>
              <option value="ZAPSTER">Zapster</option>
            </select>
          </div>

          {waProvider === 'WAME' && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="font-medium text-gray-900">Configuração Wame</h3>
              <div>
                <label htmlFor="wame-api-key" className="label">API Key da instância</label>
                <input
                  id="wame-api-key"
                  type="password"
                  value={wameApiKey}
                  onChange={(e) => setWameApiKey(e.target.value)}
                  className="input-field"
                  placeholder={whatsapp?.wameApiKeyConfigured ? '•••••••• (deixe vazio para manter a atual)' : 'Insira a API Key'}
                  disabled={isWhatsAppLoading}
                  autoComplete="new-password"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {whatsapp?.wameApiKeyConfigured
                    ? 'API Key já configurada. Deixe vazio para manter a credencial atual; preencha para substituir.'
                    : 'Nenhuma API Key configurada. Preencha para ativar.'}
                </p>
              </div>
            </div>
          )}

          {waProvider === 'ZAPSTER' && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="font-medium text-gray-900">Configuração Zapster</h3>
              <div>
                <label htmlFor="zapster-api-token" className="label">Bearer token</label>
                <input
                  id="zapster-api-token"
                  type="password"
                  value={zapsterApiToken}
                  onChange={(e) => setZapsterApiToken(e.target.value)}
                  className="input-field"
                  placeholder={whatsapp?.zapsterApiTokenConfigured ? '•••••••• (deixe vazio para manter o atual)' : 'Insira o Bearer token'}
                  disabled={isWhatsAppLoading}
                  autoComplete="new-password"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {whatsapp?.zapsterApiTokenConfigured
                    ? 'Bearer token já configurado. Deixe vazio para manter a credencial atual; preencha para substituir.'
                    : 'Nenhum token configurado. Preencha para ativar.'}
                </p>
              </div>
              <div>
                <label htmlFor="zapster-instance-id" className="label">Instance ID</label>
                <input
                  id="zapster-instance-id"
                  type="text"
                  value={zapsterInstanceId}
                  onChange={(e) => setZapsterInstanceId(e.target.value)}
                  className="input-field"
                  placeholder={whatsapp?.zapsterInstanceId ? `Atual: ${whatsapp.zapsterInstanceId}` : 'Insira o Instance ID'}
                  disabled={isWhatsAppLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {whatsapp?.zapsterInstanceId
                    ? `Instance ID atual: ${whatsapp.zapsterInstanceId}. Deixe vazio para manter; preencha para alterar.`
                    : 'Nenhum Instance ID configurado. Preencha para ativar.'}
                </p>
              </div>
            </div>
          )}

          {waProvider === null && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center text-gray-500">
              Integração WhatsApp desativada. Selecione um provedor acima para configurar.
            </div>
          )}

          <button type="submit" className="btn-primary w-full sm:w-auto" disabled={isWhatsAppLoading}>
            {updateWhatsApp.isPending ? 'Salvando...' : 'Salvar integração WhatsApp'}
          </button>
        </form>
      </section>
      <Modal open={showWhatsAppVariables} onClose={() => setShowWhatsAppVariables(false)} title="Variáveis das mensagens WhatsApp">
        <p className="text-sm text-gray-600 mb-4">Escreva a variável exatamente como aparece abaixo. Ela será substituída pelos dados do agendamento antes do envio.</p>
        <dl className="divide-y divide-gray-100">
          {[
            ['{nome}', 'Nome do cliente registrado no agendamento.'],
            ['{servico}', 'Nome do serviço escolhido.'],
            ['{data}', 'Data do agendamento no fuso de Fortaleza.'],
            ['{hora}', 'Horário do agendamento no fuso de Fortaleza.'],
            ['{valor}', 'Preço do serviço formatado em reais.'],
            ['{horario_anterior}', 'Data e hora anteriores, preenchidas ao reagendar; caso contrário, aparece “não informado”.'],
          ].map(([variable, description]) => (
            <div key={variable} className="grid grid-cols-1 gap-3 py-3 sm:grid-cols-[10rem_1fr]">
              <dt><code className="rounded bg-gray-100 px-2 py-1 text-sm font-semibold text-gray-800">{variable}</code></dt>
              <dd className="m-0 text-sm text-gray-600">{description}</dd>
            </div>
          ))}
        </dl>
        <button type="button" className="btn-primary mt-5 w-full sm:w-auto" onClick={() => setShowWhatsAppVariables(false)}>Fechar</button>
      </Modal>
    </div>
  );
}
