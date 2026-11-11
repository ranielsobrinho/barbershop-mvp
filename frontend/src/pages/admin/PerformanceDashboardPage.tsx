import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Spinner } from '../../components/ui/Spinner';
import { DateInput } from '../../components/ui/DateInput';
import { adminApi, type DashboardBucket, type DashboardPeriod, type PerformanceDashboard } from '../../services/adminApi';
import { formatMoney } from '../../utils/money';
import { getBusinessCalendarDate, getBusinessMonthStart, toDateString } from '../../utils/date';
import { formatDateInput, parseDateInput } from '../../utils/dateInput';

function csvCell(value: string | number): string {
  let text = String(value);
  if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(data: PerformanceDashboard) {
  const rows: Array<Array<string | number>> = [
    ['Categoria', 'Métrica', 'Período atual', 'Período de comparação'],
    ['Período', 'Datas', `${data.period.from} a ${data.period.to}`, `${data.comparison.from} a ${data.comparison.to}`],
    ['Resumo', 'Agendamentos não cancelados', data.period.metrics.bookedCount, data.comparison.metrics.bookedCount],
    ['Resumo', 'Serviços concluídos', data.period.metrics.completedCount, data.comparison.metrics.completedCount],
    ['Resumo', 'Agendamentos cancelados', data.period.metrics.cancelledCount, data.comparison.metrics.cancelledCount],
    ['Resumo', 'Aguardando confirmação', data.period.metrics.awaitingConfirmationCount, data.comparison.metrics.awaitingConfirmationCount],
    ['Resumo', 'Valor de agendamentos não cancelados', formatMoney(data.period.metrics.bookedValueCents), formatMoney(data.comparison.metrics.bookedValueCents)],
    ['Resumo', 'Faturamento recebido', 'Não disponível: pagamentos não são registrados', 'Não disponível: pagamentos não são registrados'],
  ];
  const comparisonBuckets = (current: DashboardBucket[], previous: DashboardBucket[], category: string) => {
    const previousByLabel = new Map(previous.map((bucket) => [bucket.label, bucket.count]));
    current.forEach((bucket) => rows.push([category, bucket.label, bucket.count, previousByLabel.get(bucket.label) ?? 0]));
  };
  comparisonBuckets(data.period.weekdayBookings, data.comparison.weekdayBookings, 'Agendamentos por dia da semana');
  comparisonBuckets(data.period.hourlyBookings, data.comparison.hourlyBookings, 'Agendamentos por horário');
  const serviceNames = new Set([
    ...data.period.serviceMix.map((service) => service.serviceName),
    ...data.comparison.serviceMix.map((service) => service.serviceName),
  ]);
  const currentServices = new Map(data.period.serviceMix.map((service) => [service.serviceName, service.count]));
  const previousServices = new Map(data.comparison.serviceMix.map((service) => [service.serviceName, service.count]));
  serviceNames.forEach((name) => rows.push(['Serviços', name, currentServices.get(name) ?? 0, previousServices.get(name) ?? 0]));

  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `desempenho-${data.period.from}-${data.period.to}.csv`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function MetricCard({ title, value, previous, definition, money = false }: {
  title: string; value: number; previous: number; definition: string; money?: boolean;
}) {
  const delta = value - previous;
  const shownValue = money ? formatMoney(value) : value.toLocaleString('pt-BR');
  const shownDelta = money ? formatMoney(Math.abs(delta)) : Math.abs(delta).toLocaleString('pt-BR');
  const deltaText = delta === 0 ? 'igual ao período anterior' : `${delta > 0 ? '+' : '−'}${shownDelta} em relação ao período anterior`;
  return (
    <article className="card" title={definition}>
      <h2 className="text-sm font-medium text-gray-500">{title}</h2>
      <p className="mt-2 text-2xl font-bold text-gray-900">{shownValue}</p>
      <p className="mt-1 text-xs text-gray-500">{deltaText}</p>
      <p className="sr-only">Definição: {definition}</p>
    </article>
  );
}

function AccessibleBarChart({ title, description, current, previous, currentLabel, previousLabel }: {
  title: string; description: string; current: DashboardBucket[]; previous: DashboardBucket[];
  currentLabel: string; previousLabel: string;
}) {
  const previousByLabel = new Map(previous.map((bucket) => [bucket.label, bucket.count]));
  const max = Math.max(1, ...current.map((bucket) => bucket.count), ...previous.map((bucket) => bucket.count));
  const currentTotal = current.reduce((total, bucket) => total + bucket.count, 0);
  const previousTotal = previous.reduce((total, bucket) => total + bucket.count, 0);
  const busiest = current.reduce<DashboardBucket | null>((top, bucket) => !top || bucket.count > top.count ? bucket : top, null);
  const summary = `${currentTotal} agendamentos no período atual e ${previousTotal} no período de comparação.${busiest?.count ? ` Maior volume atual: ${busiest.label}, com ${busiest.count}.` : ' Sem agendamentos no período atual.'}`;
  return (
    <section className="card" aria-labelledby={`${title.replace(/\W/g, '-')}-title`}>
      <div className="mb-4">
        <h2 id={`${title.replace(/\W/g, '-')}-title`} className="font-bold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
      <div className="flex gap-4 text-xs text-gray-500 mb-3" aria-hidden="true">
        <span><i className="inline-block w-2.5 h-2.5 rounded-sm bg-primary-600 mr-1" />{currentLabel}</span>
        <span><i className="inline-block w-2.5 h-2.5 rounded-sm bg-gray-300 mr-1" />{previousLabel}</span>
      </div>
      <div role="img" aria-label={title} aria-describedby={`${title.replace(/\W/g, '-')}-summary`} className="space-y-2">
        {current.map((bucket) => {
          const earlier = previousByLabel.get(bucket.label) ?? 0;
          return (
            <div key={bucket.label} className="grid grid-cols-[3.5rem_minmax(0,1fr)_2rem] items-center gap-2 text-xs">
              <span className="text-gray-600">{bucket.label}</span>
              <span className="space-y-1">
                <span className="block h-2 rounded bg-primary-600" style={{ width: `${bucket.count ? Math.max(2, bucket.count / max * 100) : 0}%` }} />
                <span className="block h-2 rounded bg-gray-300" style={{ width: `${earlier ? Math.max(2, earlier / max * 100) : 0}%` }} />
              </span>
              <span className="text-right tabular-nums">{bucket.count}</span>
            </div>
          );
        })}
      </div>
      <p className="sr-only" id={`${title.replace(/\W/g, '-')}-summary`}>{summary} Comparação incluída em cada categoria.</p>
    </section>
  );
}

function ServiceMix({ current, previous, currentLabel, previousLabel }: {
  current: DashboardPeriod['serviceMix']; previous: DashboardPeriod['serviceMix']; currentLabel: string; previousLabel: string;
}) {
  const names = [...new Set([...current.map((item) => item.serviceName), ...previous.map((item) => item.serviceName)])];
  const a = new Map(current.map((item) => [item.serviceName, item.count]));
  const b = new Map(previous.map((item) => [item.serviceName, item.count]));
  const max = Math.max(1, ...current.map((item) => item.count), ...previous.map((item) => item.count));
  const totalCurrent = current.reduce((total, item) => total + item.count, 0);
  const totalPrevious = previous.reduce((total, item) => total + item.count, 0);
  return (
    <section className="card" aria-labelledby="service-mix-title">
      <h2 id="service-mix-title" className="font-bold text-gray-900">Serviços mais agendados</h2>
      <p className="text-xs text-gray-500 mt-1 mb-4">Todos os agendamentos no período, inclusive os cancelados.</p>
      {names.length ? <div role="img" aria-label={`Mix de serviços. ${totalCurrent} agendamentos no período atual e ${totalPrevious} no período de comparação. ${names.map((name) => `${name}: ${a.get(name) ?? 0} e ${b.get(name) ?? 0}`).join('; ')}.`} className="space-y-3">
        {names.map((name) => {
          const currentCount = a.get(name) ?? 0;
          const previousCount = b.get(name) ?? 0;
          return <div key={name}>
            <div className="flex justify-between gap-3 text-xs mb-1"><span className="truncate">{name}</span><span className="tabular-nums">{currentCount} / {previousCount}</span></div>
            <div className="space-y-1"><div className="h-2 rounded bg-primary-600" style={{ width: `${currentCount ? Math.max(2, currentCount / max * 100) : 0}%` }} /><div className="h-2 rounded bg-gray-300" style={{ width: `${previousCount ? Math.max(2, previousCount / max * 100) : 0}%` }} /></div>
          </div>;
        })}
      </div> : <p className="text-sm text-gray-500">Sem agendamentos para comparar.</p>}
      <p className="sr-only">Valores por serviço na ordem: {currentLabel}, depois {previousLabel}.</p>
    </section>
  );
}

export function PerformanceDashboardPage() {
  const today = toDateString(getBusinessCalendarDate(new Date()));
  const [from, setFrom] = useState(() => formatDateInput(toDateString(getBusinessMonthStart())));
  const [to, setTo] = useState(() => formatDateInput(today));
  const fromIso = parseDateInput(from);
  const toIso = parseDateInput(to);
  const dashboard = useQuery({
    queryKey: ['performance-dashboard', fromIso, toIso],
    queryFn: () => adminApi.getPerformanceDashboard(fromIso!, toIso!),
    enabled: Boolean(fromIso && toIso && fromIso <= toIso),
  });
  const data = dashboard.data;
  const periodLabel = data ? `${data.period.from} a ${data.period.to}` : '';
  const comparisonLabel = data ? `${data.comparison.from} a ${data.comparison.to}` : '';

  return (
    <div>
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-5 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Desempenho</h1>
          <p className="text-sm text-gray-500">Indicadores operacionais da barbearia · fuso {data?.timezone || 'America/Fortaleza'}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div><label htmlFor="dashboard-from" className="label">De (DD/MM/AAAA)</label><DateInput id="dashboard-from" value={from} onChange={setFrom} aria-label="Data inicial" /></div>
          <div><label htmlFor="dashboard-to" className="label">Até (DD/MM/AAAA)</label><DateInput id="dashboard-to" value={to} onChange={setTo} aria-label="Data final" /></div>
          <button type="button" disabled={!data} onClick={() => data && downloadCsv(data)} className="btn-secondary">Exportar CSV</button>
        </div>
      </header>

      {from && !fromIso ? <p role="alert" className="mb-4 text-sm text-red-700">Informe uma data inicial válida no formato DD/MM/AAAA.</p> : null}
      {to && !toIso ? <p role="alert" className="mb-4 text-sm text-red-700">Informe uma data final válida no formato DD/MM/AAAA.</p> : null}
      {fromIso && toIso && fromIso > toIso ? <p role="alert" className="mb-4 text-sm text-red-700">A data inicial deve ser anterior à data final.</p> : null}
      {dashboard.isLoading ? <Spinner label="Carregando desempenho..." /> : null}
      {dashboard.isError ? <p role="alert" className="card text-sm text-red-700">Não foi possível carregar os indicadores. Confira as datas e tente novamente.</p> : null}
      {data ? <>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-xs text-gray-500">
          <p>Período atual: <strong>{periodLabel}</strong></p><p>Comparação, mesmo número de dias: <strong>{comparisonLabel}</strong></p>
        </div>
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6" aria-label="Indicadores do período">
          <MetricCard title="Agendamentos" value={data.period.metrics.bookedCount} previous={data.comparison.metrics.bookedCount} definition={data.definitions.bookedCount} />
          <MetricCard title="Serviços concluídos" value={data.period.metrics.completedCount} previous={data.comparison.metrics.completedCount} definition={data.definitions.completedCount} />
          <MetricCard title="Cancelados" value={data.period.metrics.cancelledCount} previous={data.comparison.metrics.cancelledCount} definition={data.definitions.cancelledCount} />
          <MetricCard title="Aguardando confirmação" value={data.period.metrics.awaitingConfirmationCount} previous={data.comparison.metrics.awaitingConfirmationCount} definition={data.definitions.awaitingConfirmationCount} />
          <MetricCard title="Valor dos agendamentos" value={data.period.metrics.bookedValueCents} previous={data.comparison.metrics.bookedValueCents} definition={data.definitions.bookedValueCents} money />
        </section>
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-6">O valor exibido soma serviços não cancelados; não é faturamento recebido. O sistema ainda não registra pagamentos.</p>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
          <AccessibleBarChart title="Agendamentos por dia da semana" description={data.definitions.charts} current={data.period.weekdayBookings} previous={data.comparison.weekdayBookings} currentLabel={periodLabel} previousLabel={comparisonLabel} />
          <AccessibleBarChart title="Agendamentos por horário" description={data.definitions.charts} current={data.period.hourlyBookings} previous={data.comparison.hourlyBookings} currentLabel={periodLabel} previousLabel={comparisonLabel} />
          <ServiceMix current={data.period.serviceMix} previous={data.comparison.serviceMix} currentLabel={periodLabel} previousLabel={comparisonLabel} />
          <section className="card" aria-labelledby="definitions-title">
            <h2 id="definitions-title" className="font-bold text-gray-900 mb-3">Como ler os indicadores</h2>
            <dl className="space-y-3 text-sm">
              <div><dt className="font-medium">Agendamentos</dt><dd className="text-gray-500">{data.definitions.bookedCount}</dd></div>
              <div><dt className="font-medium">Serviços concluídos</dt><dd className="text-gray-500">{data.definitions.completedCount}</dd></div>
              <div><dt className="font-medium">Cancelados</dt><dd className="text-gray-500">{data.definitions.cancelledCount}</dd></div>
              <div><dt className="font-medium">Aguardando confirmação</dt><dd className="text-gray-500">{data.definitions.awaitingConfirmationCount}</dd></div>
              <div><dt className="font-medium">Valor dos agendamentos</dt><dd className="text-gray-500">{data.definitions.bookedValueCents}</dd></div>
              <div><dt className="font-medium">Distribuições</dt><dd className="text-gray-500">{data.definitions.charts}</dd></div>
            </dl>
          </section>
        </div>
      </> : null}
    </div>
  );
}
