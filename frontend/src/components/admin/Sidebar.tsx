import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../hooks/useSettings';

const links = [
  { to: '/admin', label: 'Agenda', icon: '📅', end: true },
  { to: '/admin/servicos', label: 'Serviços', icon: '✂️' },
  { to: '/admin/bloqueios', label: 'Bloqueios', icon: '🚫' },
  { to: '/admin/configuracoes', label: 'Configurações', icon: '⚙️' },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: settings } = useSettings();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <aside className="bg-gray-900 text-white w-full lg:w-64 lg:h-screen lg:min-h-screen lg:sticky lg:top-0 flex lg:flex-col">
      <div className="p-4 lg:p-5 border-b border-gray-800 flex items-center gap-3 flex-1 lg:flex-none">
        <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center font-bold">S</div>
        <div className="hidden lg:block">
          <p className="font-bold text-sm">{settings?.companyName || 'Seu Carlos Barbearia'}</p>
          <p className="text-gray-400 text-xs">{user?.email}</p>
        </div>
      </div>

      <nav className="flex lg:flex-col gap-1 p-2 lg:p-3 flex-1 overflow-x-auto">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span>{l.icon}</span>
            <span className="lg:inline">{l.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-2 lg:p-3 border-t border-gray-800">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition">
          <span>🚪</span>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
