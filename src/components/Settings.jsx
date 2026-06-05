import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSongs } from '../contexts/SongContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Static import removed to lazily load huge dataset
// import { ipadSongs } from '../data/ipadSongs';

function Settings() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { songs, theme, toggleTheme, importSongs, clearAllSongs, keepAwake, toggleKeepAwake, exportSetlists, importData, setlists, syncProgress, manualSync } = useSongs();
    const { t, i18n } = useTranslation();
    const { user, isPremium } = useAuth();
    const isDark = theme === 'dark';

    const handleVerifySubscription = async (showFeedback = true) => {
        if (!user) return;
        if (showFeedback) setImportMessage("Verificando pagamento...");
        try {
            const { data, error } = await supabase.functions.invoke('mercado-pago-webhook', {
                body: { userId: user.id }
            });
            if (error) throw error;
            if (data && data.isPremium) {
                if (showFeedback) {
                    alert("Assinatura Premium ativada com sucesso! Obrigado pelo apoio.");
                }
                window.location.reload();
            } else {
                if (showFeedback) {
                    alert(data?.message || "Nenhum pagamento aprovado foi encontrado. Se você acabou de pagar por Pix, aguarde alguns segundos e clique novamente.");
                }
            }
        } catch (err) {
            console.error("Erro ao verificar assinatura:", err);
            if (showFeedback) {
                alert("Erro ao conectar com o servidor para verificação.");
            }
        } finally {
            if (showFeedback) setImportMessage("");
        }
    };

    // Auto-verify if returning from checkout
    useEffect(() => {
        const paymentParam = searchParams.get('payment');
        if (paymentParam && user && !isPremium) {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('payment');
            setSearchParams(newParams);
            handleVerifySubscription(false);
        }
    }, [searchParams, user, isPremium]);

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const [importMessage, setImportMessage] = useState('');
    const [showExportModal, setShowExportModal] = useState(false);
    const [selectedSetlists, setSelectedSetlists] = useState([]);
    const fileInputRef = useRef(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = importData(event.target.result);
            if (result.success) {
                setImportMessage(`Backup importado com sucesso! ${result.count} setlist(s) adicionados.`);
            } else {
                setImportMessage("Erro ao importar: " + result.error);
            }
            setTimeout(() => setImportMessage(''), 3000);
        };
        reader.readAsText(file);
        e.target.value = null;
    };

    const handleImportIpad = async () => {
        if (!isPremium && songs.length >= 30) {
            alert("A versão gratuita é limitada a 30 músicas na biblioteca. Assine o plano Premium para ter músicas ilimitadas!");
            navigate('/settings?upgrade=true');
            return;
        }
        setImportMessage("Baixando catálogo...");
        try {
            const catalogUrl = 'https://dl.dropboxusercontent.com/scl/fi/dof1r50506a7fbqckkt7e/ipadSongs.json?rlkey=b0rgqpdplf9la82az7ddzwtzp';
            const response = await fetch(catalogUrl);
            if (!response.ok) throw new Error('Falha ao baixar catálogo');
            let data = await response.json();

            if (!isPremium) {
                // Seleciona 30 músicas de forma aleatória do catálogo
                const shuffled = [...data].sort(() => 0.5 - Math.random());
                const maxImportCount = Math.max(0, 30 - songs.length);
                data = shuffled.slice(0, maxImportCount);

                if (data.length === 0) {
                    alert("Sua biblioteca já atingiu o limite de 30 músicas.");
                    setImportMessage("");
                    return;
                }
                alert(`Como usuário gratuito, apenas ${data.length} músicas aleatórias do catálogo foram importadas para respeitar o limite de 30 músicas.`);
            }

            importSongs(data);
            setImportMessage("Catálogo importado com sucesso!");
        } catch (error) {
            console.error(error);
            setImportMessage("Erro ao importar o catálogo");
        }
        setTimeout(() => setImportMessage(''), 3000);
    };

    const handleSubscribeMercadoPago = async () => {
        if (!user) {
            alert("Você precisa estar logado para assinar o plano Premium.");
            navigate('/login');
            return;
        }
        
        setImportMessage("Gerando pagamento...");
        try {
            // Chama a Edge Function no Supabase para gerar a preferência de pagamento
            const { data, error } = await supabase.functions.invoke('create-preference', {
                body: { userId: user.id, email: user.email }
            });
            
            if (error) throw error;
            if (data && data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                throw new Error("Resposta inválida do servidor");
            }
        } catch (err) {
            console.error("Erro ao gerar link de pagamento:", err);
            alert("Erro ao conectar com o Mercado Pago. Tente novamente mais tarde.");
        } finally {
            setImportMessage("");
        }
    };

    const handleClearAll = () => {
        clearAllSongs();
        setImportMessage("Toda a biblioteca foi apagada.");
        setTimeout(() => setImportMessage(''), 3000);
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col antialiased">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="px-4 h-14 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="flex items-center text-primary active:opacity-70 transition-opacity">
                        <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
                        <span className="ml-1 text-base font-medium">{t('settings.home')}</span>
                    </button>
                    <div className="flex flex-col items-center">
                        <h1 className="text-lg font-bold leading-tight">{t('settings.title')}</h1>
                        <span className="text-[10px] text-slate-400 font-mono">v1.4 (PWA)</span>
                    </div>
                    <button onClick={() => navigate(-1)} className="text-primary font-medium text-base active:opacity-70 transition-opacity">{t('settings.done')}</button>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto pb-24">
                <div className="max-w-md mx-auto w-full px-4 pt-6 space-y-8">

                    <section className="bg-gradient-to-br from-slate-900 to-indigo-950 dark:from-slate-800 dark:to-indigo-950/40 rounded-2xl p-5 border border-amber-500/20 shadow-xl relative overflow-hidden text-white">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -translate-y-8 translate-x-8"></div>
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-extrabold tracking-wider uppercase text-amber-400 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[20px] text-amber-400 fill-1">workspace_premium</span>
                                    Assinatura Premium
                                </h3>
                                {isPremium && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500 text-white">
                                        Ativo
                                    </span>
                                )}
                            </div>

                            {isPremium ? (
                                <div className="space-y-3">
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        Parabéns! Você tem acesso ilimitado a todas as funcionalidades: backup em nuvem, músicas ilimitadas na biblioteca e acesso offline.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        Libere o potencial completo do aplicativo de cifras e melhore suas apresentações:
                                    </p>
                                    <ul className="text-xs text-slate-300/80 space-y-1.5 list-disc list-inside">
                                        <li>Músicas ilimitadas na biblioteca</li>
                                        <li>Backup e sincronização em nuvem automáticos</li>
                                        <li>Acesso offline total sem internet</li>
                                        <li>Importação de catálogo com mais de 30mil cifras</li>
                                    </ul>

                                    <div className="pt-2 border-t border-white/10 flex flex-col gap-3">
                                        {/* Botão Oficial Mercado Pago */}
                                        <button 
                                            onClick={handleSubscribeMercadoPago}
                                            disabled={importMessage === "Gerando pagamento..." || importMessage === "Verificando pagamento..."}
                                            className="w-full bg-primary hover:bg-primary-light disabled:opacity-75 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-1.5"
                                        >
                                            Assinar por R$ 29,90 (pagamento único)
                                        </button>

                                        {/* Botão de Verificação Manual */}
                                        <button
                                            onClick={() => handleVerifySubscription(true)}
                                            disabled={importMessage === "Gerando pagamento..." || importMessage === "Verificando pagamento..."}
                                            className="w-full bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold text-xs transition-all border border-white/10 flex items-center justify-center gap-1.5"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">sync</span>
                                            Já Paguei? Verificar Assinatura
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* General Settings Group */}
                    <section>
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-2">{t('settings.general')}</h3>
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700/50 divide-y divide-slate-200 dark:divide-slate-700/50">
                            {/* Appearance */}
                            <div onClick={toggleTheme} className="flex items-center justify-between p-4 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500">
                                        <span className="material-symbols-outlined text-xl">dark_mode</span>
                                    </div>
                                    <span className="font-medium text-base">{t('settings.appearance')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400">
                                    <span className="text-sm">{isDark ? t('settings.dark') : t('settings.light')}</span>
                                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                                </div>
                            </div>

                            {/* Keep Awake */}
                            <div className="flex items-center justify-between p-4" onClick={toggleKeepAwake}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                                        <span className="material-symbols-outlined text-xl">wb_sunny</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-base">{t('settings.keepScreenAwake')}</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{t('settings.keepScreenAwakeDesc')}</span>
                                    </div>
                                </div>
                                {/* Toggle Switch */}
                                <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
                                    <input className="sr-only peer" type="checkbox" checked={keepAwake} readOnly />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                </label>
                            </div>
                            {/* Language Selector */}
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                        <span className="material-symbols-outlined text-xl">language</span>
                                    </div>
                                    <span className="font-medium text-base">{t('settings.language')}</span>
                                </div>
                                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                                    <button
                                        onClick={() => changeLanguage('en')}
                                        className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${i18n.language.startsWith('en') ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    >
                                        EN
                                    </button>
                                    <button
                                        onClick={() => changeLanguage('pt')}
                                        className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${i18n.language.startsWith('pt') ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    >
                                        PT
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Database Settings Group */}
                    <section>
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-2">{t('settings.data')}</h3>
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700/50 divide-y divide-slate-200 dark:divide-slate-700/50">

                            {/* Sincronização Manual */}
                            <div className="flex flex-col p-4 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/20">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-xl">sync</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                                                {t('settings.sync')}
                                                {!isPremium && <span className="material-symbols-outlined text-amber-500 text-xs fill-1">lock</span>}
                                            </span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">{t('settings.syncDesc')}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (!isPremium) {
                                                alert("A sincronização em nuvem (backup) é uma funcionalidade exclusiva para assinantes Premium.");
                                                return;
                                            }
                                            manualSync();
                                        }}
                                        disabled={syncProgress?.isSyncing}
                                        className="bg-primary hover:bg-primary-light disabled:opacity-50 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
                                    >
                                        {syncProgress?.isSyncing ? t('settings.syncing') : t('settings.syncBtn')}
                                    </button>
                                </div>
                                {syncProgress?.isSyncing && (
                                    <div className="mt-4 flex flex-col gap-1 w-full animate-fade-in">
                                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            <span>{syncProgress.statusText}</span>
                                            <span>{syncProgress.progress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${syncProgress.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Export Backup */}
                            <div onClick={() => {
                                if (!isPremium) {
                                    alert("A exportação de backups é uma funcionalidade exclusiva para assinantes Premium.");
                                    return;
                                }
                                setShowExportModal(true);
                            }} className="flex items-center justify-between p-4 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                        <span className="material-symbols-outlined text-xl">upload</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-base text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors flex items-center gap-1.5">
                                            {t('settings.exportBackup')}
                                            {!isPremium && <span className="material-symbols-outlined text-amber-500 text-xs">lock</span>}
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{t('settings.exportBackupDesc')}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Import Backup */}
                            <div onClick={() => {
                                if (!isPremium) {
                                    alert("A importação de backups é uma funcionalidade exclusiva para assinantes Premium.");
                                    return;
                                }
                                fileInputRef.current?.click();
                            }} className="flex items-center justify-between p-4 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-500">
                                        <span className="material-symbols-outlined text-xl">file_download</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-base text-slate-900 dark:text-white group-hover:text-cyan-500 transition-colors flex items-center gap-1.5">
                                            {t('settings.importBackup')}
                                            {!isPremium && <span className="material-symbols-outlined text-amber-500 text-xs">lock</span>}
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{t('settings.importBackupDesc')}</span>
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    accept=".json"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </div>

                            {/* Import iPad Catalog */}
                            <div onClick={handleImportIpad} className="flex items-center justify-between p-4 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
                                        <span className="material-symbols-outlined text-xl">library_music</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-base text-slate-900 dark:text-white group-hover:text-purple-500 transition-colors">{t('settings.importCatalog')}</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{t('settings.importCatalogDesc')}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Clear All Songs */}
                            <div onClick={handleClearAll} className="flex items-center justify-between p-4 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                                        <span className="material-symbols-outlined text-xl">delete_sweep</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-base text-red-600 dark:text-red-400 group-hover:text-red-500 transition-colors">{t('settings.clearLibrary')}</span>
                                        <span className="text-xs text-red-500/70 dark:text-red-400/70">{t('settings.clearLibraryDesc')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Account Settings Group */}
                    <section>
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-2">{t('settings.account')}</h3>
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700/50 divide-y divide-slate-200 dark:divide-slate-700/50">
                            {/* Logout */}
                            <div
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    navigate('/login');
                                }}
                                className="flex items-center justify-between p-4 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                                        <span className="material-symbols-outlined text-xl">logout</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-base text-red-600 dark:text-red-400 group-hover:text-red-500 transition-colors">{t('settings.logout')}</span>
                                        <span className="text-xs text-red-500/70 dark:text-red-400/70">{t('settings.logoutDesc')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
            {importMessage && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 px-4 py-2 rounded-full shadow-lg z-[100] animate-fade-in text-sm font-medium whitespace-nowrap">
                    {importMessage}
                </div>
            )}

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-surface-light dark:bg-surface-dark w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-slide-up flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-surface-light dark:bg-surface-dark">
                            <h3 className="font-bold text-lg">Exportar Backup</h3>
                            <button onClick={() => setShowExportModal(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto min-h-[50px] no-scrollbar">
                            {setlists.length === 0 ? (
                                <p className="text-sm text-slate-500">Nenhum setlist encontrado.</p>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" onClick={() => {
                                        if (selectedSetlists.length === setlists.length) setSelectedSetlists([]);
                                        else setSelectedSetlists(setlists.map(s => s.id));
                                    }}>
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedSetlists.length === setlists.length ? 'bg-primary border-primary' : 'border-slate-400'}`}>
                                            {selectedSetlists.length === setlists.length && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                                        </div>
                                        <span className="font-bold text-sm">Selecionar Todos</span>
                                    </div>
                                    <div className="h-px bg-slate-200 dark:bg-slate-700 w-full my-2"></div>
                                    {setlists.map(sl => (
                                        <div key={sl.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" onClick={() => {
                                            if (selectedSetlists.includes(sl.id)) setSelectedSetlists(prev => prev.filter(id => id !== sl.id));
                                            else setSelectedSetlists(prev => [...prev, sl.id]);
                                        }}>
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedSetlists.includes(sl.id) ? 'bg-primary border-primary' : 'border-slate-400'}`}>
                                                {selectedSetlists.includes(sl.id) && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{sl.title}</span>
                                                <span className="text-xs text-slate-500">{sl.songs.length} músicas</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-border-light dark:border-border-dark flex flex-col gap-3">
                            <button
                                onClick={() => { exportSetlists(); setShowExportModal(false); }}
                                className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white py-3 rounded-xl font-bold transition-all text-sm"
                            >
                                Exportar Tudo (Biblioteca Completa)
                            </button>
                            <button
                                disabled={selectedSetlists.length === 0 && setlists.length > 0}
                                onClick={() => { exportSetlists(selectedSetlists); setShowExportModal(false); }}
                                className="w-full bg-primary hover:bg-primary-light text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 text-sm"
                            >
                                Exportar Selecionados ({selectedSetlists.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Settings;
