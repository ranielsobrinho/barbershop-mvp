import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from './services/publicApi';
import { LoginPage } from './pages/admin/LoginPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { CalendarPage } from './pages/admin/CalendarPage';
import { ServicesPage } from './pages/admin/ServicesPage';
import { BlocksPage } from './pages/admin/BlocksPage';
import { SettingsPage } from './pages/admin/SettingsPage';

export function App() {
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: publicApi.getSettings });
  useEffect(() => {
    document.title = `${settings?.companyName || 'Seu Carlos Barbearia'} · Painel`;
  }, [settings?.companyName]);

  return (
    <Routes>
      {/* O site público agora é a página estática em / (scroll-craft). */}
      <Route path="/" element={<Navigate to="/admin" replace />} />

      {/* Admin */}
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminLayout><CalendarPage /></AdminLayout>} />
      <Route path="/admin/servicos" element={<AdminLayout><ServicesPage /></AdminLayout>} />
      <Route path="/admin/bloqueios" element={<AdminLayout><BlocksPage /></AdminLayout>} />
      <Route path="/admin/configuracoes" element={<AdminLayout><SettingsPage /></AdminLayout>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
