import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Hero } from '../../components/public/Hero';
import { ServicesList } from '../../components/public/ServicesList';
import { BookingForm } from '../../components/public/BookingForm';
import { Spinner } from '../../components/ui/Spinner';
import { publicApi, Appointment } from '../../services/publicApi';
import { ConfirmationPage } from './ConfirmationPage';

export function HomePage() {
  const [confirmed, setConfirmed] = useState<Appointment | null>(null);
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: publicApi.getSettings,
    staleTime: 10 * 60 * 1000,
  });
  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: publicApi.getServices,
  });

  if (confirmed) {
    return <ConfirmationPage appointment={confirmed} onNew={() => setConfirmed(null)} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Hero settings={settings} />

      {/* Serviços */}
      <section className="max-w-2xl mx-auto px-4 py-10" id="servicos">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Nossos serviços</h2>
        <p className="text-gray-500 mb-6">Escolha o serviço ideal para você</p>
        {isLoading ? <Spinner /> : <ServicesList services={services || []} />}
      </section>

      {/* Formulário de agendamento */}
      <section className="max-w-2xl mx-auto px-4 pb-16" id="agendar">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Agende seu horário</h2>
        <p className="text-gray-500 mb-6">Menos de 1 minuto para agendar</p>
        <BookingForm onConfirmed={setConfirmed} />
      </section>

      {/* Rodapé */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p className="font-semibold text-white mb-1">Seu Carlos Barbearia</p>
        <p>© {new Date().getFullYear()} · Todos os direitos reservados</p>
      </footer>
    </div>
  );
}
