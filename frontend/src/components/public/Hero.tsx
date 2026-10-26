import type { Settings } from '../../services/adminApi';

interface HeroProps {
  settings?: Settings | null;
}

export function Hero({ settings }: HeroProps) {
  const heroText = settings?.heroText || 'Seu Carlos Barbearia — Tradição e estilo no seu corte';
  const companyName = settings?.companyName || 'Seu Carlos Barbearia';

  return (
    <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 text-white overflow-hidden">
      <div className="absolute inset-0 bg-black/20" />
      {settings?.heroImageUrl && (
        <img src={settings.heroImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
      )}
      <div className="relative max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-sm mb-6">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Agendamento online
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-4">
          {companyName}
        </h1>
        <p className="text-lg sm:text-xl text-primary-100 mb-8 max-w-md mx-auto">{heroText}</p>
        <a href="#agendar" className="btn-primary text-lg px-10 py-4 inline-flex">
          Agendar horário
        </a>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-white rounded-t-3xl" />
    </section>
  );
}
