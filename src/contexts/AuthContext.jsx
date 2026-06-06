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

  // Estado da assinatura Premium (lido do cache local ao iniciar)
  const [isPremium, setIsPremium] = useState(() => {
    return localStorage.getItem('cifras-app-premium-mock') === 'true' || 
           localStorage.getItem('cifras-app-premium-supabase') === 'true';
  });

  const enableOfflineMode = () => {
    setIsOfflineMode(true);
    localStorage.setItem('cifras-app-offline', 'true');
  };

  const disableOfflineMode = () => {
    setIsOfflineMode(false);
    localStorage.removeItem('cifras-app-offline');
  };

  // Função para simular assinatura para testes locais
  const togglePremiumMock = () => {
    setIsPremium(prev => {
      const next = !prev;
      localStorage.setItem('cifras-app-premium-mock', next ? 'true' : 'false');
      localStorage.setItem('cifras-app-premium-supabase', next ? 'true' : 'false');
      return next;
    });
  };

  // Carregar dados de assinatura
  const fetchProfile = async (currentUser) => {
    if (!currentUser) {
      setIsPremium(
        localStorage.getItem('cifras-app-premium-mock') === 'true' || 
        localStorage.getItem('cifras-app-premium-supabase') === 'true'
      );
      return;
    }

    try {
      // 1. Tentar ler da tabela de perfis no Supabase
      const { data, error } = await supabase
        .from('cifras_profiles')
        .select('is_premium')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (data && data.is_premium !== undefined) {
        setIsPremium(!!data.is_premium);
        localStorage.setItem('cifras-app-premium-supabase', data.is_premium ? 'true' : 'false');
        return;
      }
    } catch (e) {
      console.warn("Tabela de perfis não encontrada. Utilizando fallback.", e);
    }

    // 2. Fallback para os metadados do usuário (Supabase Auth metadata)
    const metadataPremium = currentUser.user_metadata?.is_premium;
    if (metadataPremium !== undefined) {
      setIsPremium(!!metadataPremium);
      localStorage.setItem('cifras-app-premium-supabase', metadataPremium ? 'true' : 'false');
      return;
    }

    // 3. Fallback final para o mock do localStorage
    const mockVal = localStorage.getItem('cifras-app-premium-mock') === 'true';
    setIsPremium(mockVal);
  };

  useEffect(() => {
    // Buscar a sessão inicial do Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
          disableOfflineMode(); // If they log in, exit offline mode
          localStorage.setItem('cifras-registered', 'true');
          fetchProfile(session.user);
      } else {
          setLoading(false);
      }
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
          localStorage.setItem('cifras-registered', 'true');
          fetchProfile(session.user);
      } else {
          setIsPremium(
            localStorage.getItem('cifras-app-premium-mock') === 'true' || 
            localStorage.getItem('cifras-app-premium-supabase') === 'true'
          );
          setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Assim que terminar o fetchProfile, define loading como false
  useEffect(() => {
    if (session?.user) {
      fetchProfile(session.user).finally(() => setLoading(false));
    }
  }, [session]);

  const value = {
    session,
    user,
    loading,
    isPremium,
    togglePremiumMock,
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
