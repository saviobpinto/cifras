import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSongs } from '../contexts/SongContext';

// Static import removed to lazily load huge dataset
// import { ipadSongs } from '../data/ipadSongs';

function Settings() {
    const navigate = useNavigate();
    const { theme, toggleTheme, importSongs, clearAllSongs, keepAwake, toggleKeepAwake, exportSetlists, importData } = useSongs();
    const { t, i18n } = useTranslation();
    const isDark = theme === 'dark';

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const [importMessage, setImportMessage] = useState('');
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
        setImportMessage("Baixando catálogo...");
        try {
            const response = await fetch('/ipadSongs.json');
            if (!response.ok) throw new Error('Falha ao baixar catálogo');
            const data = await response.json();
            importSongs(data);
            setImportMessage("Catálogo importado com sucesso!");
        } catch (error) {
            console.error(error);
            setImportMessage("Erro ao importar o catálogo");
        }
        setTimeout(() => setImportMessage(''), 3000);
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
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-2">Dados</h3>
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700/50 divide-y divide-slate-200 dark:divide-slate-700/50">
                            {/* Export Backup */}
                            <div onClick={exportSetlists} className="flex items-center justify-between p-4 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                        <span className="material-symbols-outlined text-xl">upload</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-base text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">Exportar Backup</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">Salvar setlists e músicas em um arquivo</span>
                                    </div>
                                </div>
                            </div>
                            {/* Import Backup */}
                            <div onClick={() => fileInputRef.current?.click()} className="flex items-center justify-between p-4 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-500">
                                        <span className="material-symbols-outlined text-xl">file_download</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-base text-slate-900 dark:text-white group-hover:text-cyan-500 transition-colors">Importar Backup</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">Restaurar de um arquivo salvo anteriormente</span>
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
                                        <span className="font-medium text-base text-slate-900 dark:text-white group-hover:text-purple-500 transition-colors">Importar Catálogo</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">Importar biblioteca de cifras</span>
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
                                        <span className="font-medium text-base text-red-600 dark:text-red-400 group-hover:text-red-500 transition-colors">Apagar Toda a Biblioteca</span>
                                        <span className="text-xs text-red-500/70 dark:text-red-400/70">Zera todas as músicas para re-importação</span>
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
        </div>
    );
}

export default Settings;
