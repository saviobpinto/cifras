import React, { useState, useEffect, useDeferredValue, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSongs } from '../contexts/SongContext';
import { useAuth } from '../contexts/AuthContext';

function Library() {
    const navigate = useNavigate();
    const { songs } = useSongs();
    const { isPremium } = useAuth();
    const [searchQuery, setSearchQuery] = useState(() => {
        return sessionStorage.getItem('library-search') || '';
    });
    const { t } = useTranslation();

    useEffect(() => {
        sessionStorage.setItem('library-search', searchQuery);
    }, [searchQuery]);

    useEffect(() => {
        const savedScroll = sessionStorage.getItem('library-scroll');
        if (savedScroll) {
            window.scrollTo(0, parseInt(savedScroll, 10));
        }
    }, [songs]); // Re-run when songs load to ensure content is there

    const handleSongClick = () => {
        sessionStorage.setItem('library-scroll', window.scrollY.toString());
    };

    const deferredQuery = useDeferredValue(searchQuery);
    const [displayCount, setDisplayCount] = useState(50);

    const filteredSongs = useMemo(() => {
        const query = deferredQuery.toLowerCase().trim();
        let results = songs;

        if (query) {
            results = songs.filter(song =>
                song.title.toLowerCase().includes(query) ||
                song.artist.toLowerCase().includes(query)
            );
        }

        // Only sort the necessary slice to avoid sorting 30k items whenever possible
        // Actually, if query is empty, songs might already be sorted.
        // Let's sort all results first by artist, then by title
        results = results.sort((a, b) => {
            const artistCompare = a.artist.localeCompare(b.artist);
            if (artistCompare !== 0) return artistCompare;
            return a.title.localeCompare(b.title);
        });
        
        return results;
    }, [songs, deferredQuery]);

    const displayedSongs = filteredSongs.slice(0, displayCount);

    // Reset display count when search changes
    useEffect(() => {
        setDisplayCount(50);
    }, [deferredQuery]);

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
                <div className="flex items-center gap-2">
                    {!isPremium && (
                        <button onClick={() => navigate('/settings')} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all active:scale-95 shadow-sm shadow-amber-500/20">
                            <span className="material-symbols-outlined text-[12px] font-bold fill-1">workspace_premium</span>
                            Premium
                        </button>
                    )}
                    <Link to="/song/new" className="flex items-center justify-center size-10 rounded-full bg-primary hover:bg-primary-dark text-white transition-colors shadow-lg shadow-primary/30">
                        <span className="material-symbols-outlined">add</span>
                    </Link>
                </div>
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
                {displayedSongs.length > 0 ? (
                    <div className="space-y-3">
                        {displayedSongs.map(song => (
                            <Link
                                key={song.id}
                                to={`/song/viewer?id=${song.id}`}
                                onClick={handleSongClick}
                                state={{ from: '/library' }}
                                className="group flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/50 transition-all active:scale-[0.99]"
                            >
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold truncate text-slate-900 dark:text-white">{song.title}</h4>
                                    <p className="text-xs text-slate-500">{song.artist}</p>
                                </div>

                                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
                            </Link>
                        ))}

                        {filteredSongs.length > displayedSongs.length && (
                            <button
                                onClick={() => setDisplayCount(c => c + 50)}
                                className="w-full py-3 mt-4 text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
                            >
                                Carregar mais...
                            </button>
                        )}
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
