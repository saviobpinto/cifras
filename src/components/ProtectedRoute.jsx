import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children }) {
    const { session, loading, isOfflineMode } = useAuth();

    // Verifica se a URL contém parâmetros de retorno do OAuth do Supabase
    const isOAuthCallback = window.location.hash && (
        window.location.hash.includes('access_token=') || 
        window.location.hash.includes('recovery_token=')
    );

    if (loading || isOAuthCallback) {
        return <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark text-primary font-bold">Carregando...</div>;
    }

    if (!session && !isOfflineMode) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;
