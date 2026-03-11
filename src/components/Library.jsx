import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSongs } from '../contexts/SongContext';
import { transposeNote } from '../lib/music';

function Library() {
    const navigate = useNavigate();
    const { songs } = useSongs();
    const [searchQuery, setSearchQuery] = useState('');
    const { t } = useTranslation();

    useEffect(() => {
        const savedScroll = sessionStorage.getItem('library-scroll');
        if (savedScroll) {
            window.scrollTo(0, parseInt(savedScroll, 10));
        }
    }, [songs]); // Re-run when songs load to ensure content is there

    const handleSongClick = () => {
        sessionStorage.setItem('library-scroll', window.scrollY.toString());
    };

    const filteredSongs = songs.filter(song => {
        const query = searchQuery.toLowerCase();
        return (
            song.title.toLowerCase().includes(query) ||
            song.artist.toLowerCase().includes(query) ||
            song.content.toLowerCase().includes(query)
        );
    }).sort((a, b) => a.title.localeCompare(b.title));

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col antialiased">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-4">
                <button onClick={() => navigate('/dashboard')} className="flex items-center justify-center size-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold">{t('library.title')}</h1>
                    <p className="text-xs text-slate-500">{t('library.songsCount', { count: songs.length })}</p>
                </div>
                <Link to="/song/new" className="flex items-center justify-center size-10 rounded-full bg-primary hover:bg-primary-dark text-white transition-colors shadow-lg shadow-primary/30">
                    <span className="material-symbols-outlined">add</span>
                </Link>
            </header>

            {/* Search Bar */}
            <div className="px-4 py-3 sticky top-[65px] z-10 bg-background-light dark:bg-background-dark">
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined">search</span>
                    <input
                        type="text"
                        placeholder={t('library.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all font-medium"
                        autoFocus
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    )}
                </div>
            </div>

            <main className="flex-1 p-4 pb-24 max-w-2xl mx-auto w-full">
                {filteredSongs.length > 0 ? (
                    <div className="space-y-3">
                        {filteredSongs.map(song => (
                            <Link
                                key={song.id}
                                to={`/song/viewer?id=${song.id}`}
                                onClick={handleSongClick}
                                state={{ from: '/library' }}
                                className="group flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/50 transition-all active:scale-[0.99]"
                            >
                                {/* Key Badge */}
                                <div className="flex flex-col items-center justify-center size-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-bold text-sm shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    {song.key ? transposeNote(song.key, song.transposition || 0) : '?'}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold truncate text-slate-900 dark:text-white">{song.title}</h4>
                                    <p className="text-xs text-slate-500">{song.artist}</p>
                                </div>

                                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        {songs.length === 0 ? (
                            <>
                                <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                    <span className="material-symbols-outlined text-4xl">music_note</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('library.noSongsYet')}</h3>
                                <p className="text-slate-500 mb-6 max-w-xs mx-auto">{t('library.startBuilding')}</p>
                                <Link to="/song/new" className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-primary/25">
                                    <span className="material-symbols-outlined">add</span>
                                    {t('library.addSong')}
                                </Link>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">search_off</span>
                                <p className="text-slate-500">{t('library.noMatches', { query: searchQuery })}</p>
                            </>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

export default Library;
