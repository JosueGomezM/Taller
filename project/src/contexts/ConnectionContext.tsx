import React, { createContext, useContext, useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionContextType {
  isOnline: boolean;
  isReconnecting: boolean;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    let reconnectTimeout: number;
    let notificationTimeout: number;

    const handleOnline = () => {
      setIsOnline(true);
      setIsReconnecting(true);
      setShowNotification(true);
      
      // Ocultar la notificación después de 3 segundos
      notificationTimeout = window.setTimeout(() => {
        setShowNotification(false);
      }, 3000);

      // Simular un pequeño delay para la reconexión
      reconnectTimeout = window.setTimeout(() => {
        setIsReconnecting(false);
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar la conexión periódicamente
    const checkConnection = () => {
      fetch('/ping', { method: 'HEAD' })
        .then(() => {
          if (!isOnline) setIsOnline(true);
        })
        .catch(() => {
          if (isOnline) setIsOnline(false);
        });
    };

    const intervalId = window.setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.clearTimeout(reconnectTimeout);
      window.clearTimeout(notificationTimeout);
      window.clearInterval(intervalId);
    };
  }, [isOnline]);

  return (
    <ConnectionContext.Provider value={{ isOnline, isReconnecting }}>
      {children}
      {/* Notificación de estado de conexión */}
      {showNotification && (
        <div
          className={`fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all duration-300 ${
            isOnline
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
          style={{
            animation: 'slideIn 0.3s ease-out',
            zIndex: 9999
          }}
        >
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4" />
              {isReconnecting ? 'Reconectando...' : 'Conexión restaurada'}
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              Sin conexión
            </>
          )}
        </div>
      )}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
}