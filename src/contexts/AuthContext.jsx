import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(() => {
    return localStorage.getItem('cifras-app-offline') === 'true';
  });

  const enableOfflineMode = () => {
    setIsOfflineMode(true);
    localStorage.setItem('cifras-app-offline', 'true');
  };

  const disableOfflineMode = () => {
    setIsOfflineMode(false);
    localStorage.removeItem('cifras-app-offline');
  };

  useEffect(() => {
    // Buscar a sessão inicial do Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
          disableOfflineMode(); // If they log in, exit offline mode
      }
      setLoading(false);
    }).catch(err => {
      console.error('Erro ao buscar sessão:', err);
      setLoading(false);
    });

    // Escutar por mudanças no estado de autenticação (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
          disableOfflineMode();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user,
    loading,
    isOfflineMode,
    enableOfflineMode,
    disableOfflineMode
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
