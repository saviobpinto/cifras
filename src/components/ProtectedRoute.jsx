import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children }) {
    const { session, loading, isOfflineMode } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark text-primary font-bold">Carregando...</div>;
    }

    if (!session && !isOfflineMode) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;
