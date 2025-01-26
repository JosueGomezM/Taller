import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, fetchWithCache, setupVisibilityChangeHandler, removeVisibilityChangeHandler } from '../lib/supabase';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile } = await fetchWithCache(
          `user-${session.user.id}`,
          () => supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle(),
          { forceRefresh: true }
        );

        if (profile) {
          setUser(profile);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const handleAuthChange = async () => {
      try {
        await refreshUser();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    handleAuthChange();

    // Configurar el manejador de cambio de visibilidad
    setupVisibilityChangeHandler(refreshUser);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async () => {
      if (mounted) {
        await refreshUser();
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      removeVisibilityChangeHandler();
    };
  }, [refreshUser]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email: email.trim().toLowerCase(), 
        password 
      });
      
      if (error) {
        if (error.message === 'Invalid login credentials') {
          throw new Error('Credenciales inválidas. Por favor, verifica tu correo y contraseña.');
        }
        throw error;
      }
    } catch (error) {
      console.error('Error en signIn:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}