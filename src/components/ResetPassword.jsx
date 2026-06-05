import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [hasSession, setHasSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Ao clicar no link de recuperação de senha, o Supabase define a sessão na URL.
    // O SDK analisa a URL e armazena a sessão localmente.
    // Vamos verificar se a sessão foi estabelecida com sucesso.
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setHasSession(true);
        } else {
          setHasSession(false);
        }
      } catch (err) {
        console.error('Erro ao checar sessão de recuperação:', err);
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password.length < 6) {
      setErrorMsg('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      setSuccessMsg('Senha atualizada com sucesso! Você será redirecionado para o login...');
      setTimeout(() => {
        // Fazer signOut para limpar a sessão temporária de recuperação e exigir novo login
        supabase.auth.signOut().then(() => {
          navigate('/login', { replace: true });
        });
      }, 3000);
    } catch (error) {
      setErrorMsg(error.message || 'Erro ao redefinir a senha.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark font-display">
        <div className="text-slate-600 dark:text-slate-300">Verificando sessão de recuperação...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark py-12 px-4 sm:px-6 lg:px-8 font-display">
      <div className="max-w-md w-full space-y-8 bg-surface-light dark:bg-surface-dark p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
            Redefinir Senha
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
            Digite sua nova senha de acesso abaixo.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg text-sm text-center font-medium">
            {successMsg}
          </div>
        )}

        {!hasSession && !successMsg ? (
          <div className="text-center space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-4 rounded-lg text-sm leading-relaxed">
              O link de recuperação parece inválido ou expirou. Certifique-se de que clicou no link enviado para o seu e-mail recentemente.
            </div>
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-primary hover:opacity-80 transition-opacity"
            >
              Voltar para a página de Login
            </button>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleReset}>
            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nova Senha
                </label>
                <input
                  type="password"
                  required
                  disabled={loading || !!successMsg}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Mínimo de 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  required
                  disabled={loading || !!successMsg}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !!successMsg}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-primary hover:bg-primary-light focus:outline-none transition-colors ${(loading || !!successMsg) ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Aguarde...' : 'Redefinir Senha'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
