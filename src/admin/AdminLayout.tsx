import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, FolderOpen, BarChart3, Menu, X, Warehouse, LogOut, Settings as SettingsIcon, Image as ImageIcon } from 'lucide-react'; // Importar ImageIcon para banners
import { useState } from 'react';
import { authService } from '../services/auth.service';

// Layout principal do painel administrativo
// Contém sidebar com navegação e área de conteúdo

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Menu de navegação do painel
  const menuItems = [
    {
      path: '/admin',
      icon: LayoutDashboard,
      label: 'Dashboard',
      exact: true,
    },
    {
      path: '/admin/produtos',
      icon: Package,
      label: 'Produtos',
      exact: false,
    },
    {
      path: '/admin/estoque',
      icon: Warehouse,
      label: 'Estoque',
      exact: false,
    },
    {
      path: '/admin/categorias',
      icon: FolderOpen,
      label: 'Categorias',
      exact: false,
    },
    {
      path: '/admin/banners', // Novo item de menu
      icon: ImageIcon, // Usar ImageIcon
      label: 'Banners',
      exact: false,
    },
    {
      path: '/admin/relatorios',
      icon: BarChart3,
      label: 'Relatórios',
      exact: false,
    },
    {
      path: '/admin/configuracoes',
      icon: SettingsIcon,
      label: 'Configurações',
      exact: true,
    },
  ];

  // Verificar se rota está ativa
  const isActive = (path: string, exact: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-black text-white p-3 shadow-lg"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-black text-white flex flex-col fixed h-screen z-40 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo/Header */}
        <div className="p-6 border-b border-white/10">
          <h1 className="font-serif text-2xl font-bold">Pollyana Admin</h1>
          <p className="text-white/60 text-sm mt-1">Painel Administrativo</p>
        </div>

        {/* Menu de navegação */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      active
                        ? 'bg-white text-black'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Links para voltar ao site público e logout */}
        <div className="p-4 border-t border-white/10">
          <Link
            to="/"
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors mb-2"
          >
            ← Voltar ao site
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors w-full text-left"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Área de conteúdo principal */}
      <main className="flex-1 lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}