import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useSongs } from '../contexts/SongContext';


function Dashboard() {
    const { t } = useTranslation();
    const { songs, setlists, setCurrentSong, addSetlist, deleteSetlist } = useSongs();
    const navigate = useNavigate();
    const [isCreatingSetlist, setIsCreatingSetlist] = useState(false);
    const [newSetlistTitle, setNewSetlistTitle] = useState('');

    const handleOpenSong = (song) => {
        setCurrentSong(song);
        navigate(`/song/viewer?id=${song.id}`);
    };

    const handleCreateSetlist = (e) => {
        e.preventDefault();
        if (!newSetlistTitle.trim()) return;

        addSetlist(newSetlistTitle);
        setNewSetlistTitle('');
        setIsCreatingSetlist(false);
    };


    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased selection:bg-primary selection:text-white min-h-screen flex flex-col">
            <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-24">
                {/* Header */}
                <header className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center rounded-full size-10 border-2 border-primary bg-primary/10 text-primary font-bold text-sm">
                                <span className="material-symbols-outlined text-[20px]">person</span>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-none mb-1">{t('dashboard.welcome')},</p>
                                <h2 className="text-lg font-bold leading-none text-slate-900 dark:text-white">Músico</h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => navigate('/library')} className="flex items-center justify-center size-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
                                <span className="material-symbols-outlined">search</span>
                            </button>
                        </div>
                    </div>
                </header>
                {/* Main Content */}
                <main className="flex-1 flex flex-col gap-6 px-4 pt-6">
                    {/* Hero Action: Quick Create */}
                    <section>
                        <Link to="/song/new" className="w-full block group relative overflow-hidden rounded-xl bg-primary p-6 text-left shadow-lg shadow-primary/20 transition-transform active:scale-[0.98]">
                            <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12">
                                <span className="material-symbols-outlined text-[140px] text-white">playlist_add</span>
                            </div>
                            <div className="relative z-10 flex flex-col items-start gap-2">
                                <div className="rounded-full bg-white/20 p-2 text-white mb-2 backdrop-blur-sm">
                                    <span className="material-symbols-outlined block">add</span>
                                </div>
                                <h3 className="text-xl font-bold text-white">{t('dashboard.createNewSong')}</h3>
                                <p className="text-sm text-blue-100 font-medium">{t('dashboard.addToCollection')}</p>
                            </div>
                        </Link>
                    </section>

                    {/* My Setlists List */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('dashboard.mySetlists')}</h2>
                            {isCreatingSetlist ? (
                                <button onClick={() => setIsCreatingSetlist(false)} className="text-sm font-medium text-slate-500 hover:text-red-500">{t('dashboard.cancel')}</button>
                            ) : (
                                <button onClick={() => setIsCreatingSetlist(true)} className="flex items-center gap-1 text-sm font-semibold text-primary hover:text-blue-400">
                                    <span className="material-symbols-outlined text-[18px]">add</span> {t('dashboard.new')}
                                </button>
                            )}
                        </div>

                        {/* Inline Create Form */}
                        {isCreatingSetlist && (
                            <form onSubmit={handleCreateSetlist} className="mb-4 p-3 bg-white dark:bg-surface-dark rounded-xl border border-primary ring-1 ring-primary/20 animate-in fade-in slide-in-from-top-2">
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder={t('dashboard.setlistNamePlaceholder')}
                                    className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 outline-none font-bold mb-2"
                                    value={newSetlistTitle}
                                    onChange={(e) => setNewSetlistTitle(e.target.value)}
                                />
                                <div className="flex justify-end">
                                    <button type="submit" disabled={!newSetlistTitle.trim()} className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-bold disabled:opacity-50">{t('dashboard.create')}</button>
                                </div>
                            </form>
                        )}

                        <div className="flex flex-col gap-3">
                            {setlists.map(setlist => (
                                <Link to={`/setlist/${setlist.id}`} key={setlist.id} className="group flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 active:border-primary dark:active:border-primary transition-colors cursor-pointer relative">
                                    <div className="flex flex-col items-center justify-center size-12 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary shrink-0">
                                        <span className="text-xs font-bold leading-none">{new Date(setlist.date).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                                        <span className="text-lg font-bold leading-none">{new Date(setlist.date).getDate()}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">{setlist.title}</h4>
                                        <div className="flex items-center gap-3 mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">music_note</span> {setlist.songs.length} {t('dashboard.songs')}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Delete Action (Hidden by default, visible on hover/focus or could be in menu) */}
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (confirm(t('dashboard.deleteConfirmation'))) deleteSetlist(setlist.id);
                                        }}
                                        className="p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </Link>
                            ))}
                        </div>
                    </section>
                </main>
                {/* Bottom Navigation Bar */}
                <nav className="fixed bottom-0 w-full z-30 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#192233]/95 backdrop-blur-lg px-6 pb-6 pt-3">
                    <div className="flex items-center justify-between max-w-md mx-auto">
                        <NavLink to="/dashboard" className={({ isActive }) => `flex flex-1 flex-col items-center justify-end gap-1 ${isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'} transition-colors`}>
                            <span className={`material-symbols-outlined text-[28px] ${true ? 'filled' : ''}`}>dashboard</span>
                            <span className="text-[10px] font-bold tracking-wide">{t('dashboard.nav.dashboard')}</span>
                        </NavLink>
                        <NavLink to="/library" className="flex flex-1 flex-col items-center justify-end gap-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                            <span className="material-symbols-outlined text-[28px]">library_music</span>
                            <span className="text-[10px] font-medium tracking-wide">{t('dashboard.nav.library')}</span>
                        </NavLink>
                        <NavLink to="/settings" className="flex flex-1 flex-col items-center justify-end gap-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                            <span className="material-symbols-outlined text-[28px]">settings</span>
                            <span className="text-[10px] font-medium tracking-wide">{t('dashboard.nav.settings')}</span>
                        </NavLink>
                    </div>
                </nav>
            </div>
        </div>
    );
}

export default Dashboard;
