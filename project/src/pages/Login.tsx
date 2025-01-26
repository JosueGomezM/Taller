import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useConnection } from '../contexts/ConnectionContext';
import { Sun, Moon } from 'lucide-react';
import Logo from '../components/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isOnline } = useConnection();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);

      // Validaciones básicas
      if (!email.trim() || !password.trim()) {
        throw new Error('Por favor ingrese su correo y contraseña');
      }

      // Verificar conexión
      if (!isOnline) {
        throw new Error('No hay conexión a internet. Por favor verifique su conexión e intente de nuevo.');
      }

      await signIn(email, password);
      
      // Redirigir al usuario
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Error de inicio de sesión:', err);
      
      // Manejar errores específicos
      if (err.name === 'AuthRetryableFetchError') {
        setError('Error de conexión. Por favor verifique su conexión a internet e intente de nuevo.');
      } else if (err.message?.includes('Invalid login credentials')) {
        setError('Credenciales inválidas. Por favor verifique su correo y contraseña.');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('El correo electrónico no ha sido confirmado. Por favor contacte al administrador.');
      } else {
        setError(err.message || 'Error al iniciar sesión. Por favor intente de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url(https://vlvdykzznjdnfcsutloc.supabase.co/storage/v1/object/sign/Imagenes/Fondo%20app%20taller.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJJbWFnZW5lcy9Gb25kbyBhcHAgdGFsbGVyLmpwZyIsImlhdCI6MTczNjcwMzg1OCwiZXhwIjoxNzY4MjM5ODU4fQ.r2ZtcPMO09j1xUrGuf9-M41EuWGtZpdx2XLXKtcbxL4&t=2025-01-12T17%3A43%3A38.584Z)'
      }}
    >
      <div className="absolute inset-0 backdrop-blur-sm bg-black/30"></div>

      <div className="relative max-w-md w-full mx-auto">
        <div className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-white/20">
          <div className="px-8 pt-8 pb-4">
            <div className="flex justify-center">
              <Logo className="h-24 w-auto" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold text-white">
              Sistema de Gestión de Taller
            </h2>
            <p className="mt-2 text-center text-sm text-gray-200">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <div className="px-8 pb-8">
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="sr-only">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none relative block w-full px-4 py-3 border border-white/20 placeholder-gray-400 text-white bg-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 text-sm backdrop-blur-sm"
                    placeholder="Correo electrónico"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none relative block w-full px-4 py-3 border border-white/20 placeholder-gray-400 text-white bg-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 text-sm backdrop-blur-sm"
                    placeholder="Contraseña"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || !isOnline}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600/90 hover:bg-blue-700/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 backdrop-blur-sm"
                >
                  {loading ? (
                    <>
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                      </span>
                      Iniciando sesión...
                    </>
                  ) : !isOnline ? (
                    'Sin conexión'
                  ) : (
                    'Iniciar sesión'
                  )}
                </button>
              </div>
            </form>

            <button
              onClick={toggleTheme}
              className="mt-6 w-full flex items-center justify-center px-4 py-2 text-sm text-gray-300 hover:text-white border border-white/20 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 mr-2" />
              ) : (
                <Moon className="w-4 h-4 mr-2" />
              )}
              {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}