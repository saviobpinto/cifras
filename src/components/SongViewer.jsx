import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { parseChordPro, transposeNote } from '../lib/music';
import { useSongs } from '../contexts/SongContext';
import ChordTooltip from './ChordTooltip';
import { useAuth } from '../contexts/AuthContext';

function SongViewer() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const songId = searchParams.get('id');
    const setlistId = searchParams.get('setlistId');
    const { getSong, updateSong, currentSong, setlists, songs, addToSetlist } = useSongs();
    const { t } = useTranslation();
    const { isPremium } = useAuth();

    const [viewerSongs, setViewerSongs] = useState([]);
    const [activeSongIndex, setActiveSongIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [pauseTimeRemaining, setPauseTimeRemaining] = useState(0);
    const [showSettings, setShowSettings] = useState(false);

    const scrollContainerRef = useRef(null);
    const lineRefs = useRef({});
    const triggeredPauses = useRef(new Set());
    const scrollTimeRef = useRef(0);

    // Context Navigation State
    const [prevSongId, setPrevSongId] = useState(null);
    const [nextSongId, setNextSongId] = useState(null);

    // Modal State
    const [showSetlistModal, setShowSetlistModal] = useState(false);

    const navigateToSong = useCallback((targetId, autoPlay = false) => {
        if (!targetId) return;
        // Reset scroll
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
        setIsPlaying(false);
        const url = `/song/viewer?id=${targetId}${setlistId ? `&setlistId=${setlistId}` : ''}${autoPlay ? '&autoPlay=true' : ''}`;
        navigate(url, { state: location.state });
    }, [navigate, setlistId, location]);

    const scrollToSong = useCallback((index) => {
        if (index < 0 || index >= viewerSongs.length) return;
        const el = document.getElementById(`song-wrapper-${index}`);
        if (el && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: el.offsetTop - 20,
                behavior: 'smooth'
            });
            setActiveSongIndex(index);
        }
    }, [viewerSongs]);

    // Initial Load & Navigation Logic
    useEffect(() => {
        let loadedSong = null;
        if (songId) {
            loadedSong = getSong(songId);
        } else {
            loadedSong = currentSong;
        }

        if (loadedSong) {
            let list = [];
            const setlist = setlists.find(s => s.id === setlistId);
            if (setlist && setlist.continuousScroll) {
                const currentIndex = setlist.songs.indexOf(loadedSong.id);
                if (currentIndex !== -1) {
                    const subsequentIds = setlist.songs.slice(currentIndex);
                    list = subsequentIds.map(id => getSong(id)).filter(Boolean);
                } else {
                    list = [loadedSong];
                }
            } else {
                list = [loadedSong];
            }

            setViewerSongs(list.map(s => ({
                ...s,
                scrollSpeed: s.scrollSpeed || 1,
                transposition: s.transposition || 0,
                fontSize: s.fontSize || 14,
                parsedLines: parseChordPro(s.content)
            })));

            // Determine Next/Prev IDs for the context navigation (based on the FULL setlist or library)
            let contextSongs = [];
            if (setlistId) {
                const setlist = setlists.find(s => s.id === setlistId);
                if (setlist) {
                    contextSongs = setlist.songs.map(id => songs.find(s => s.id === id)).filter(Boolean);
                }
            } else {
                contextSongs = songs;
            }

            if (contextSongs.length > 0) {
                const currentIndex = contextSongs.findIndex(s => s.id === loadedSong.id);
                if (currentIndex !== -1) {
                    const prev = contextSongs[currentIndex - 1];
                    const next = contextSongs[currentIndex + 1];
                    setPrevSongId(prev ? prev.id : null);
                    setNextSongId(next ? next.id : null);
                }
            }

            // AutoPlay check
            const autoPlayParam = searchParams.get('autoPlay');
            if (autoPlayParam === 'true') {
                setIsPlaying(true);
            }
        }
    }, [songId, setlistId, currentSong, getSong, setlists, songs, searchParams]);

    // Reset scroll when songId changes
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
        setActiveSongIndex(0);
    }, [songId]);

    // Reset scroll timer when songId, activeSongIndex or isPlaying changes
    useEffect(() => {
        scrollTimeRef.current = 0;
    }, [songId, activeSongIndex, isPlaying]);

    // Update song setting helper
    const updateSongSetting = useCallback((id, key, value) => {
        setViewerSongs(prev => prev.map(s => {
            if (s.id === id) {
                const updated = { ...s, [key]: value };
                updateSong(id, { [key]: value });
                return updated;
            }
            return s;
        }));
    }, [updateSong]);

    const activeSong = viewerSongs[activeSongIndex];

    // Scroll listener to update activeSongIndex as viewport changes
    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current || viewerSongs.length <= 1) return;
        const container = scrollContainerRef.current;
        const scrollTop = container.scrollTop;

        let currentActiveIndex = 0;
        for (let i = 0; i < viewerSongs.length; i++) {
            const el = document.getElementById(`song-wrapper-${i}`);
            if (el) {
                if (el.offsetTop <= scrollTop + container.clientHeight / 2) {
                    currentActiveIndex = i;
                }
            }
        }

        if (currentActiveIndex !== activeSongIndex) {
            setActiveSongIndex(currentActiveIndex);
        }
    }, [viewerSongs, activeSongIndex]);

    // Auto-scroll logic
    const scrollAccumulator = useRef(0);

    useEffect(() => {
        let intervalId;
        if (isPlaying && scrollContainerRef.current) {
            const currentSpeed = activeSong ? activeSong.scrollSpeed : 1;
            intervalId = setInterval(() => {
                // If we are in a pause, just decrement the timer
                if (pauseTimeRemaining > 0) {
                    setPauseTimeRemaining(prev => Math.max(0, prev - 50)); // We run every 50ms
                    return;
                }

                const container = scrollContainerRef.current;
                const scrollTop = container.scrollTop;

                // Check for pause points
                if (activeSong && lineRefs.current) {
                    const parsedLines = activeSong.parsedLines;
                    for (let i = 0; i < parsedLines.length; i++) {
                        const line = parsedLines[i];
                        if (line.pause > 0 && !triggeredPauses.current.has(`${activeSongIndex}-${i}`)) {
                            const element = lineRefs.current[`${activeSongIndex}-${i}`];
                            if (element) {
                                // Calculate position relative to container top
                                if (element.offsetTop <= scrollTop + 5) {
                                    setPauseTimeRemaining(line.pause * 1000);
                                    triggeredPauses.current.add(`${activeSongIndex}-${i}`);
                                    return; // Don't scroll this frame
                                }
                            }
                        }
                    }
                }

                scrollAccumulator.current += 1 * currentSpeed;
                if (scrollAccumulator.current >= 1) {
                    const pixelsToScroll = Math.floor(scrollAccumulator.current);
                    container.scrollTop += pixelsToScroll;
                    scrollAccumulator.current -= pixelsToScroll;
                }

                // If continuousScroll is active, auto-scrolling moves past boundaries naturally.
                // But we still need to check if we hit the very end of the entire setlist wrapper.
                scrollTimeRef.current += 50;
                const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 5;
                const setlist = setlists.find(s => s.id === setlistId);
                // Transition to the next page only if it's the last song in viewerSongs and we have a nextSongId
                if (isAtBottom && setlist?.continuousScroll && nextSongId && activeSongIndex === viewerSongs.length - 1 && scrollTimeRef.current > 3000) {
                    clearInterval(intervalId);
                    navigateToSong(nextSongId, true);
                }
            }, 50);
        } else {
            scrollAccumulator.current = 0; // Reset accumulator when stopped
            if (!isPlaying) {
                triggeredPauses.current.clear(); // Clear pauses so they can re-trigger next time
                setPauseTimeRemaining(0);
            }
        }
        return () => clearInterval(intervalId);
    }, [isPlaying, activeSong, activeSongIndex, pauseTimeRemaining, setlistId, setlists, nextSongId, navigateToSong, viewerSongs.length]);

    const togglePlay = () => {
        setIsPlaying(prev => {
            const next = !prev;
            if (next) {
                setShowSettings(false);
            }
            return next;
        });
    };

    const handleTranspose = (amount) => {
        if (!activeSong) return;
        const newTransposition = (activeSong.transposition || 0) + amount;
        updateSongSetting(activeSong.id, 'transposition', newTransposition);
    };

    const handleNextSong = useCallback(() => {
        const nextIndex = activeSongIndex + 1;
        if (nextIndex < viewerSongs.length) {
            scrollToSong(nextIndex);
        } else if (nextSongId) {
            navigateToSong(nextSongId);
        }
    }, [activeSongIndex, viewerSongs.length, nextSongId, scrollToSong, navigateToSong]);

    const handlePrevSong = useCallback(() => {
        const prevIndex = activeSongIndex - 1;
        if (prevIndex >= 0) {
            scrollToSong(prevIndex);
        } else if (prevSongId) {
            navigateToSong(prevSongId);
        }
    }, [activeSongIndex, prevSongId, scrollToSong, navigateToSong]);

    // --- SWIPE LOGIC ---
    const touchStart = useRef(null);
    const touchEnd = useRef(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        touchEnd.current = null;
        touchStart.current = e.targetTouches[0].clientX;
    }

    const onTouchMove = (e) => {
        touchEnd.current = e.targetTouches[0].clientX;
    }

    const onTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;

        const distance = touchStart.current - touchEnd.current;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            handleNextSong();
        }
        if (isRightSwipe) {
            handlePrevSong();
        }
    }

    const currentKey = activeSong?.key ? transposeNote(activeSong.key, activeSong.transposition || 0) : '?';

    if (viewerSongs.length === 0) {
        return <div className="p-10 text-center text-slate-500">Loading song...</div>;
    }

    return (
        <div
            className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display antialiased h-screen w-full overflow-hidden flex flex-col relative selection:bg-primary selection:text-white"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Setlist Modal */}
            {showSetlistModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-lg">{t('dashboard.addToSetlist')}</h3>
                        </div>
                        <div className="p-2 max-h-60 overflow-y-auto">
                            {setlists.length === 0 ? (
                                <p className="p-4 text-center text-slate-500 text-sm">{t('dashboard.noSetlistsYet')}</p>
                            ) : (
                                setlists.map(list => (
                                    <button
                                        key={list.id}
                                        onClick={() => {
                                            addToSetlist(list.id, activeSong.id);
                                            setShowSetlistModal(false);
                                        }}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between group"
                                    >
                                        <span className="font-medium">{list.title}</span>
                                        {list.songs.includes(activeSong.id) && <span className="text-primary material-symbols-outlined text-sm">check</span>}
                                    </button>
                                ))
                            )}
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-black/20 text-right">
                            <button onClick={() => setShowSetlistModal(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">{t('dashboard.cancel')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="flex-none z-20 w-full bg-surface-dark/90 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between">
                <button onClick={() => navigate(location.state?.from || (setlistId ? `/setlist/${setlistId}` : '/library'))} className="flex items-center justify-center size-10 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex-1 flex flex-col items-center justify-center mx-2 overflow-hidden">
                    <h1 className="text-slate-900 dark:text-white text-lg font-bold truncate leading-tight">{activeSong.title}</h1>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium">{activeSong.artist}</span>
                        {activeSong.key && (
                            <>
                                <span className="size-0.5 rounded-full bg-slate-500"></span>
                                <span>Orig: {activeSong.key}</span>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    {!isPremium && (
                        <button onClick={() => navigate('/settings')} className="mr-1 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all active:scale-95 shadow-sm shadow-amber-500/20">
                            <span className="material-symbols-outlined text-[12px] font-bold fill-1">workspace_premium</span>
                            Premium
                        </button>
                    )}
                    <Link to={`/song/edit/${activeSong.id}${setlistId ? `?setlistId=${setlistId}` : ''}`} className="flex items-center justify-center size-10 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                    </Link>
                    <button onClick={() => setShowSetlistModal(true)} className="flex items-center justify-center size-10 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[20px]">playlist_add</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 relative w-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-primary/5 to-transparent z-10 pointer-events-none opacity-50"></div>
                <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-primary/5 to-transparent z-10 pointer-events-none opacity-50"></div>

                {/* Navigation Overlay Buttons (Desktop/Tablet preferred, but works on mobile too) */}
                {prevSongId && (
                    <button
                        onClick={handlePrevSong}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 size-12 rounded-full bg-black/10 dark:bg-white/5 backdrop-blur hover:bg-primary/20 text-slate-400 hover:text-primary flex items-center justify-center transition-all hidden md:flex"
                    >
                        <span className="material-symbols-outlined text-3xl">chevron_left</span>
                    </button>
                )}
                {nextSongId && (
                    <button
                        onClick={handleNextSong}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 size-12 rounded-full bg-black/10 dark:bg-white/5 backdrop-blur hover:bg-primary/20 text-slate-400 hover:text-primary flex items-center justify-center transition-all hidden md:flex"
                    >
                        <span className="material-symbols-outlined text-3xl">chevron_right</span>
                    </button>
                )}

                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    onClick={() => { if (isPlaying) setIsPlaying(false); }}
                    className="h-full overflow-y-auto no-scrollbar scroll-mask-bottom px-6 py-8 pb-32 font-mono"
                >
                    {viewerSongs.map((vs, songIdx) => {
                        const hasLyricsText = (line) => line.segments?.some(segment => segment.lyrics && segment.lyrics.trim() !== '');

                        return (
                            <div
                                key={vs.id}
                                id={`song-wrapper-${songIdx}`}
                                style={{ fontSize: `${vs.fontSize || 14}px` }}
                                className={cn("last:mb-0", viewerSongs.length > 1 ? "mb-10" : "mb-20")}
                            >
                                {/* Top padding / Spacer for each song */}
                                {songIdx === 0 ? (
                                    <div className="h-[30vh] md:h-[40vh] w-full shrink-0 flex flex-col justify-end pb-8 border-b border-dashed border-slate-200 dark:border-slate-800 mb-8">
                                        <div className="max-w-xl mx-auto w-full px-4">
                                            <span className="text-xs font-bold uppercase tracking-wider text-primary">{t('dashboard.songOf', { index: songIdx + 1, total: viewerSongs.length })}</span>
                                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{vs.title}</h2>
                                            <p className="text-sm text-slate-500 font-medium">{vs.artist}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="pt-8 pb-4 border-b border-dashed border-slate-200 dark:border-slate-800 mb-6">
                                        <div className="max-w-xl mx-auto w-full px-4">
                                            <span className="text-xs font-bold uppercase tracking-wider text-primary">{t('dashboard.songOf', { index: songIdx + 1, total: viewerSongs.length })}</span>
                                            <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">{vs.title}</h2>
                                            <p className="text-xs text-slate-500 font-medium">{vs.artist}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="max-w-xl mx-auto">
                                    {vs.parsedLines.map((line, i) => {
                                        if (line.type === 'section') {
                                            return (
                                                <p
                                                    key={i}
                                                    ref={el => lineRefs.current[`${songIdx}-${i}`] = el}
                                                    className="mt-8 mb-4 text-primary/80 font-bold text-xs uppercase tracking-widest font-sans bg-slate-100 dark:bg-white/5 inline-block px-2 py-1 rounded"
                                                >
                                                    {line.label} {line.pause > 0 && <span className="ml-2 text-[10px] opacity-60">({line.pause}s pause)</span>}
                                                </p>
                                            );
                                        }

                                        if (line.type === 'lyrics') {
                                            return (
                                                <p
                                                    key={i}
                                                    ref={el => lineRefs.current[`${songIdx}-${i}`] = el}
                                                    className="mb-2 whitespace-pre-wrap text-slate-900 dark:text-slate-100"
                                                >
                                                    {line.content} {line.pause > 0 && <span className="ml-2 text-[10px] text-primary/60">(pause {line.pause}s)</span>}
                                                </p>
                                            );
                                        }

                                        const lineHasLyrics = hasLyricsText(line);

                                        return (
                                            <div
                                                key={i}
                                                ref={el => lineRefs.current[`${songIdx}-${i}`] = el}
                                                className={`whitespace-pre-wrap break-words ${lineHasLyrics ? 'mt-2 mb-4 leading-[2.5]' : 'mt-4 mb-2 leading-normal'}`}
                                            >
                                                {line.pause > 0 && <div className="text-[10px] text-primary/60 mb-1 opacity-60">(pause {line.pause}s)</div>}
                                                {line.segments.map((segment, j) => {
                                                    const transposedChord = segment.chord
                                                        ? transposeNote(segment.chord, vs.transposition || 0)
                                                        : null;

                                                    const segmentLyrics = segment.lyrics || '';

                                                    if (!lineHasLyrics) {
                                                        return (
                                                            <React.Fragment key={j}>
                                                                {transposedChord && (
                                                                    <ChordTooltip chordName={transposedChord}>
                                                                        <span className="text-primary font-bold">{transposedChord}</span>
                                                                    </ChordTooltip>
                                                                )}
                                                                <span className="text-slate-900 dark:text-slate-100">{segmentLyrics}</span>
                                                            </React.Fragment>
                                                        );
                                                    }

                                                    return (
                                                        <React.Fragment key={j}>
                                                            {transposedChord && (
                                                                <span className="relative inline-block w-0 h-0 align-baseline">
                                                                    <span className="absolute left-0 bottom-0 -translate-y-[1.25em] text-primary font-bold text-[0.9em] leading-none whitespace-nowrap">
                                                                        <ChordTooltip chordName={transposedChord}>
                                                                            {transposedChord}
                                                                        </ChordTooltip>
                                                                    </span>
                                                                </span>
                                                            )}
                                                            <span className="text-slate-900 dark:text-slate-100">{segmentLyrics}</span>
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}

                                    <div className={cn("text-center text-slate-500 text-sm", songIdx === viewerSongs.length - 1 ? "h-48 py-10" : "py-4")}>Fim de "{vs.title}"</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* Footer Controls Container */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-30 pointer-events-none flex flex-col items-end gap-3 pb-safe">
                {/* Settings Panel */}
                <div className={cn(
                    "absolute bottom-20 left-4 right-4 transition-all duration-300 ease-in-out pointer-events-auto",
                    showSettings 
                        ? "opacity-100 scale-100 translate-y-0" 
                        : "opacity-0 scale-95 translate-y-4 pointer-events-none"
                )}>
                    <div className="bg-white dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl p-4 flex flex-col gap-4 backdrop-blur-xl bg-opacity-95 dark:bg-opacity-95">
                        {/* Navigation Bar for Mobile */}
                        <div className="flex items-center justify-between md:hidden pb-2 border-b border-slate-100 dark:border-white/5">
                            <button disabled={!prevSongId && activeSongIndex === 0} onClick={handlePrevSong} className="p-2 text-slate-400 disabled:opacity-20 hover:text-primary">
                                <span className="material-symbols-outlined">skip_previous</span>
                            </button>
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{setlistId ? 'Setlist' : 'Library'}</span>
                            <button disabled={!nextSongId && activeSongIndex === viewerSongs.length - 1} onClick={handleNextSong} className="p-2 text-slate-400 disabled:opacity-20 hover:text-primary">
                                <span className="material-symbols-outlined">skip_next</span>
                            </button>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            {/* Key Transpose */}
                            <div className="flex items-center bg-slate-100 dark:bg-background-dark rounded-lg p-1 border border-slate-200 dark:border-white/5 w-full justify-between">
                                <button
                                    onClick={() => handleTranspose(-1)}
                                    className="size-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-xl">remove</span>
                                </button>
                                <div className="flex flex-col items-center w-14">
                                    <span className="text-xs text-slate-500 font-medium uppercase">Key</span>
                                    <span className="text-slate-900 dark:text-white font-bold text-base leading-none">
                                        {currentKey}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleTranspose(1)}
                                    className="size-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-xl">add</span>
                                </button>
                            </div>
                        </div>

                        {/* Speed Control */}
                        <div className="flex items-center gap-3 px-1 pb-1 pt-1 duration-300">
                            <span className="material-symbols-outlined text-slate-500 text-lg">speed</span>
                            <div className="relative flex-1 h-8 flex items-center group">
                                <input
                                    type="range"
                                    min="0.1"
                                    max="3"
                                    step="0.1"
                                    value={activeSong?.scrollSpeed || 1}
                                    onChange={(e) => updateSongSetting(activeSong.id, 'scrollSpeed', parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>
                            <span className="text-slate-900 dark:text-white font-medium w-8 text-right tabular-nums">{activeSong?.scrollSpeed || 1}x</span>
                        </div>

                        {/* Font Size Control */}
                        <div className="flex items-center gap-3 px-1 pb-1 pt-1 duration-300">
                            <span className="material-symbols-outlined text-slate-500 text-lg">format_size</span>
                            <div className="relative flex-1 h-8 flex items-center group">
                                <input
                                    type="range"
                                    min="12"
                                    max="32"
                                    step="1"
                                    value={activeSong?.fontSize || 14}
                                    onChange={(e) => updateSongSetting(activeSong.id, 'fontSize', parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>
                            <span className="text-slate-900 dark:text-white font-medium w-8 text-right tabular-nums">{activeSong?.fontSize || 14}px</span>
                        </div>
                    </div>
                </div>

                {/* Controls Group */}
                <div className="flex items-center gap-2 pointer-events-auto flex-shrink-0">
                    {/* Settings Toggle Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowSettings(prev => !prev);
                        }}
                        className={cn(
                            "size-12 rounded-full flex items-center justify-center transition-all duration-300 pointer-events-auto cursor-pointer",
                            isPlaying
                                ? "scale-0 opacity-0 pointer-events-none w-0"
                                : "scale-100 opacity-100 w-12",
                            showSettings
                                ? "ios-assistive-touch-active"
                                : "ios-assistive-touch"
                        )}
                    >
                        <span className={cn(
                            "material-symbols-outlined text-2xl transition-transform duration-300",
                            showSettings && "rotate-90"
                        )}>
                            tune
                        </span>
                    </button>

                    {/* Play/Pause FAB */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            togglePlay();
                        }}
                        className={cn(
                            "size-14 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 pointer-events-auto flex-shrink-0 cursor-pointer ios-assistive-touch",
                            isPlaying 
                                ? "scale-0 opacity-0 pointer-events-none w-0" 
                                : "scale-100 opacity-100 w-14"
                        )}
                    >
                        <span className="material-symbols-outlined text-3xl font-bold fill-current">
                            play_arrow
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SongViewer;
