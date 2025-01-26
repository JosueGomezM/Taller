import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Las variables de entorno de Supabase no están configuradas correctamente');
}

// Configuración optimizada del cliente de Supabase
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key) => {
        try {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        } catch (error) {
          console.error('Error reading from localStorage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.error('Error writing to localStorage:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing from localStorage:', error);
        }
      }
    }
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'mechanical-workshop-system',
      'Cache-Control': 'no-cache',
      'Keep-Alive': 'timeout=5, max=1000'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

// Sistema de caché en memoria optimizado
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos por defecto
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;
const PING_INTERVAL = 30000; // 30 segundos
const AUTH_REFRESH_INTERVAL = 4 * 60 * 1000; // 4 minutos

let pingTimer: number | null = null;
let authRefreshTimer: number | null = null;
let isBackgrounded = false;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();

interface CacheOptions {
  duration?: number;
  forceRefresh?: boolean;
}

// Función para reintentar operaciones
async function retryOperation<T>(
  operation: () => Promise<T>,
  attempts: number = RETRY_ATTEMPTS,
  delay: number = RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (attempts <= 1) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryOperation(operation, attempts - 1, delay * 2);
  }
}

// Función para verificar y refrescar la sesión
async function refreshSession() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('No hay sesión activa');
      return false;
    }

    // Si el token expira en menos de 5 minutos, refrescarlo
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
    const fiveMinutes = 5 * 60 * 1000;
    
    if (Date.now() + fiveMinutes >= expiresAt) {
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Error refreshing session:', error);
        return false;
      }
      return !!newSession;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking session:', error);
    return false;
  }
}

// Función para verificar la conexión
async function checkConnection(): Promise<boolean> {
  try {
    // Primero verificar la sesión
    const sessionValid = await refreshSession();
    if (!sessionValid) {
      return false;
    }

    // Luego verificar la conexión a la base de datos
    const { data, error } = await supabase.from('system_settings').select('key').limit(1);
    return !error && data !== null;
  } catch {
    return false;
  }
}

// Función para mantener la conexión activa
async function keepConnectionAlive() {
  if (isBackgrounded) {
    const isConnected = await checkConnection();
    if (!isConnected) {
      console.log('Reconectando con Supabase...');
      await retryOperation(checkConnection);
    }
  }
}

// Iniciar el sistema de ping y refresh de autenticación
function startMaintenanceSystems() {
  // Sistema de ping
  if (!pingTimer) {
    pingTimer = window.setInterval(keepConnectionAlive, PING_INTERVAL);
  }

  // Sistema de refresh de autenticación
  if (!authRefreshTimer) {
    authRefreshTimer = window.setInterval(refreshSession, AUTH_REFRESH_INTERVAL);
  }
  
  // Manejar cambios de visibilidad
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Manejar eventos de conexión
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
}

// Detener los sistemas de mantenimiento
function stopMaintenanceSystems() {
  if (pingTimer) {
    clearInterval(pingTimer);
    pingTimer = null;
  }

  if (authRefreshTimer) {
    clearInterval(authRefreshTimer);
    authRefreshTimer = null;
  }

  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
}

// Manejadores de eventos
function handleVisibilityChange() {
  isBackgrounded = document.visibilityState === 'hidden';
  if (!isBackgrounded) {
    // Verificar conexión y sesión inmediatamente al volver
    keepConnectionAlive();
    refreshSession();
  }
}

function handleOnline() {
  console.log('Conexión restaurada, verificando Supabase...');
  keepConnectionAlive();
  refreshSession();
}

function handleOffline() {
  console.log('Conexión perdida, esperando reconexión...');
}

export async function fetchWithCache<T>(
  key: string,
  fetchFn: () => Promise<{ data: T; error: any }>,
  options: CacheOptions = {}
): Promise<{ data: T; error: any }> {
  const {
    duration = CACHE_DURATION,
    forceRefresh = false
  } = options;

  const now = Date.now();
  const cached = cache.get(key);

  // Si hay datos en caché y no están expirados y no se fuerza el refresco
  if (!forceRefresh && cached && now < cached.expiresAt) {
    return { data: cached.data, error: null };
  }

  try {
    const result = await retryOperation(async () => {
      const response = await fetchFn();
      if (response.error) throw response.error;
      return response;
    });
    
    if (result.data) {
      cache.set(key, {
        data: result.data,
        timestamp: now,
        expiresAt: now + duration
      });
    }
    
    return result;
  } catch (error) {
    console.error(`Error fetching data for key ${key}:`, error);
    
    // Si hay un error pero tenemos datos en caché, los devolvemos como fallback
    if (cached) {
      console.log(`Using cached data as fallback for key ${key}`);
      return { data: cached.data, error: null };
    }
    
    return { data: null, error };
  }
}

// Función para limpiar la caché
export function clearCache() {
  cache.clear();
}

// Función para verificar si hay una sesión activa
export async function hasActiveSession(): Promise<boolean> {
  return refreshSession();
}

// Manejador de visibilidad de la página
let visibilityChangeHandler: (() => void) | null = null;

export function setupVisibilityChangeHandler(handler: () => void) {
  // Remover el manejador anterior si existe
  if (visibilityChangeHandler) {
    document.removeEventListener('visibilitychange', visibilityChangeHandler);
  }

  // Configurar el nuevo manejador
  visibilityChangeHandler = () => {
    if (document.visibilityState === 'visible') {
      handler();
    }
  };

  document.addEventListener('visibilitychange', visibilityChangeHandler);
}

// Función para remover el manejador de visibilidad
export function removeVisibilityChangeHandler() {
  if (visibilityChangeHandler) {
    document.removeEventListener('visibilitychange', visibilityChangeHandler);
    visibilityChangeHandler = null;
  }
}

// Iniciar los sistemas de mantenimiento automáticamente
startMaintenanceSystems();

// Limpiar los sistemas cuando el módulo se desmonta
window.addEventListener('unload', () => {
  stopMaintenanceSystems();
});