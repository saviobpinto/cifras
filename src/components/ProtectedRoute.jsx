import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children }) {
    const { session, loading, isOfflineMode } = useAuth();
    const [timedOut, setTimedOut] = React.useState(false);

    // Verifica se a URL contém parâmetros de retorno do OAuth do Supabase
    const isOAuthCallback = window.location.hash && (
        window.location.hash.includes('access_token=') || 
        window.location.hash.includes('recovery_token=')
    );

    // Timeout de segurança de 5 segundos para o processamento do callback
    useEffect(() => {
        if (isOAuthCallback && !session) {
            const timer = setTimeout(() => {
                setTimedOut(true);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isOAuthCallback, session]);

    // Limpa o hash de access_token da URL assim que o login for concluído
    useEffect(() => {
        if (session && window.location.hash) {
            window.history.replaceState(
                null, 
                document.title, 
                window.location.pathname + window.location.search
            );
        }
    }, [session]);

    // Só exibe carregando se a sessão ainda não existir E estiver carregando ou no callback (e não tiver dado timeout)
    if (!session && (loading || (isOAuthCallback && !timedOut))) {
        return <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark text-primary font-bold">Carregando...</div>;
    }

    if (!session && !isOfflineMode) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;
