import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useConnection } from '../contexts/ConnectionContext';
import { Truck, Wrench, History, LogOut, Sun, Moon, MessageSquare } from 'lucide-react';
import { Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import Logo from './Logo';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isOnline } = useConnection();
  const location = useLocation();
  const navigate = useNavigate();

  // Prevenir navegación si hay cambios sin guardar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const forms = document.querySelectorAll('form');
      for (const form of forms) {
        if (form.checkValidity() === false) {
          e.preventDefault();
          e.returnValue = '';
          return;
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  if (user?.role === 'mechanic' && location.pathname !== '/repairs') {
    return <Navigate to="/repairs" />;
  }

  const menuItems = user?.role === 'admin' ? [
    { icon: Truck, label: 'Panel de Control', path: '/' },
    { icon: MessageSquare, label: 'Comentarios Pendientes', path: '/pending-comments' },
    { icon: Wrench, label: 'Reparaciones', path: '/repairs' },
    { icon: History, label: 'Historial', path: '/history' },
  ] : [
    { icon: Wrench, label: 'Reparaciones', path: '/repairs' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-100 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white dark:bg-dark-50 shadow-xl flex flex-col border-r border-gray-200 dark:border-white/5">
        {/* Logo y perfil */}
        <div className="p-6 border-b border-gray-200 dark:border-white/5">
          <div className="flex justify-center mb-6">
            <Logo className="h-20 w-auto" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {user?.full_name}
            </h2>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
              {user?.role === 'admin' ? 'Administrador' : 'Mecánico'}
            </span>
          </div>
        </div>
        
        {/* Navegación */}
        <nav className="flex-1 py-6 px-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 dark:bg-dark-100 dark:text-white' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-200 hover:text-gray-900 dark:hover:text-white'
                } ${!isOnline ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <Icon className={`w-5 h-5 mr-3 ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-500'
                }`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer del sidebar */}
        <div className="p-4 border-t border-gray-200 dark:border-white/5 space-y-2">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        {/* Header con botón de tema */}
        <div className="bg-white dark:bg-dark-50 shadow-md px-8 py-4 flex justify-between items-center border-b border-gray-200 dark:border-white/5">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
          </h1>
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
        
        <div className="p-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}