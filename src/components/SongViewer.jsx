import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { parseChordPro, transposeNote } from '../lib/music';
import { useSongs } from '../contexts/SongContext';

function SongViewer() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const songId = searchParams.get('id');
    const setlistId = searchParams.get('setlistId');
    const { getSong, updateSong, currentSong, setlists, songs, addToSetlist } = useSongs();
    const { t } = useTranslation();

    const [song, setSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [scrollSpeed, setScrollSpeed] = useState(1);
    const [fontSize, setFontSize] = useState(14);
    const [pauseTimeRemaining, setPauseTimeRemaining] = useState(0);
    const scrollContainerRef = useRef(null);
    const lineRefs = useRef([]);
    const triggeredPauses = useRef(new Set());

    const [transpose, setTranspose] = useState(0);
    const [parsedLines, setParsedLines] = useState([]);

    // Context Navigation State
    const [prevSongId, setPrevSongId] = useState(null);
    const [nextSongId, setNextSongId] = useState(null);

    // Modal State
    const [showSetlistModal, setShowSetlistModal] = useState(false);

    // Initial Load & Navigation Logic
    useEffect(() => {
        let loadedSong = null;
        if (songId) {
            loadedSong = getSong(songId);
        } else {
            loadedSong = currentSong;
        }

        if (loadedSong) {
            setSong(loadedSong);
            setParsedLines(parseChordPro(loadedSong.content));

            // Settings
            if (loadedSong.scrollSpeed) setScrollSpeed(loadedSong.scrollSpeed);
            if (loadedSong.transposition) setTranspose(loadedSong.transposition);
            else setTranspose(0);
            if (loadedSong.fontSize) setFontSize(loadedSong.fontSize);
            else setFontSize(14);

            // Determine Next/Prev
            let contextSongs = [];
            if (setlistId) {
                const setlist = setlists.find(s => s.id === setlistId);
                if (setlist) {
                    contextSongs = setlist.songs.map(id => songs.find(s => s.id === id)).filter(Boolean);
                }
            } else {
                // If no setlist, use all songs (maybe filtered by recent? for now just all)
                // Defaulting to all songs might be confusing if user came from 'recent', but better than nothing
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
        }
    }, [songId, setlistId, currentSong, getSong, setlists, songs]);

    // Persist Speed Logic
    useEffect(() => {
        if (song && scrollSpeed !== song.scrollSpeed) {
            const timeout = setTimeout(() => {
                updateSong(song.id, { scrollSpeed });
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [scrollSpeed, song, updateSong]);

    // Persist Transposition Logic
    useEffect(() => {
        if (song && transpose !== (song.transposition || 0)) {
            const timeout = setTimeout(() => {
                updateSong(song.id, { transposition: transpose });
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [transpose, song, updateSong]);

    // Persist Font Size Logic
    useEffect(() => {
        if (song && fontSize !== (song.fontSize || 14)) {
            const timeout = setTimeout(() => {
                updateSong(song.id, { fontSize });
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [fontSize, song, updateSong]);

    // Auto-scroll logic
    const scrollAccumulator = useRef(0);

    useEffect(() => {
        let intervalId;
        if (isPlaying && scrollContainerRef.current) {
            intervalId = setInterval(() => {
                // If we are in a pause, just decrement the timer
                if (pauseTimeRemaining > 0) {
                    setPauseTimeRemaining(prev => Math.max(0, prev - 50)); // We run every 50ms
                    return;
                }

                const container = scrollContainerRef.current;
                const scrollTop = container.scrollTop;

                // Check for pause points
                if (lineRefs.current) {
                    for (let i = 0; i < parsedLines.length; i++) {
                        const line = parsedLines[i];
                        if (line.pause > 0 && !triggeredPauses.current.has(i)) {
                            const element = lineRefs.current[i];
                            if (element) {
                                // Calculate position relative to container top
                                // We use a small threshold because precision varies
                                if (element.offsetTop <= scrollTop + 5) {
                                    setPauseTimeRemaining(line.pause * 1000);
                                    triggeredPauses.current.add(i);
                                    return; // Don't scroll this frame
                                }
                            }
                        }
                    }
                }

                scrollAccumulator.current += 1 * scrollSpeed;
                if (scrollAccumulator.current >= 1) {
                    const pixelsToScroll = Math.floor(scrollAccumulator.current);
                    container.scrollTop += pixelsToScroll;
                    scrollAccumulator.current -= pixelsToScroll;
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
    }, [isPlaying, scrollSpeed, pauseTimeRemaining, parsedLines]);

    const togglePlay = () => setIsPlaying(!isPlaying);

    const handleTranspose = (amount) => {
        setTranspose(prev => prev + amount);
    };

    const navigateToSong = (targetId) => {
        if (!targetId) return;
        // Reset scroll
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
        setIsPlaying(false);
        const url = `/song/viewer?id=${targetId}${setlistId ? `&setlistId=${setlistId}` : ''}`;
        navigate(url);
    };

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

        if (isLeftSwipe && nextSongId) {
            navigateToSong(nextSongId);
        }
        if (isRightSwipe && prevSongId) {
            navigateToSong(prevSongId);
        }
    }

    const currentKey = song?.key ? transposeNote(song.key, transpose) : '?';

    if (!song) {
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
                            <h3 className="font-bold text-lg">Add to Setlist</h3>
                        </div>
                        <div className="p-2 max-h-60 overflow-y-auto">
                            {setlists.length === 0 ? (
                                <p className="p-4 text-center text-slate-500 text-sm">No setlists created yet.</p>
                            ) : (
                                setlists.map(list => (
                                    <button
                                        key={list.id}
                                        onClick={() => {
                                            addToSetlist(list.id, song.id);
                                            setShowSetlistModal(false);
                                        }}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between group"
                                    >
                                        <span className="font-medium">{list.title}</span>
                                        {list.songs.includes(song.id) && <span className="text-primary material-symbols-outlined text-sm">check</span>}
                                    </button>
                                ))
                            )}
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-black/20 text-right">
                            <button onClick={() => setShowSetlistModal(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="flex-none z-20 w-full bg-surface-dark/90 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between">
                <button onClick={() => navigate(setlistId ? `/setlist/${setlistId}` : '/dashboard')} className="flex items-center justify-center size-10 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex-1 flex flex-col items-center justify-center mx-2 overflow-hidden">
                    <h1 className="text-slate-900 dark:text-white text-lg font-bold truncate leading-tight">{song.title}</h1>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium">{song.artist}</span>
                        {song.key && (
                            <>
                                <span className="size-0.5 rounded-full bg-slate-500"></span>
                                <span>Orig: {song.key}</span>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Link to={`/song/edit/${song.id}${setlistId ? `?setlistId=${setlistId}` : ''}`} className="flex items-center justify-center size-10 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
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
                        onClick={() => navigateToSong(prevSongId)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 size-12 rounded-full bg-black/10 dark:bg-white/5 backdrop-blur hover:bg-primary/20 text-slate-400 hover:text-primary flex items-center justify-center transition-all hidden md:flex"
                    >
                        <span className="material-symbols-outlined text-3xl">chevron_left</span>
                    </button>
                )}
                {nextSongId && (
                    <button
                        onClick={() => navigateToSong(nextSongId)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 size-12 rounded-full bg-black/10 dark:bg-white/5 backdrop-blur hover:bg-primary/20 text-slate-400 hover:text-primary flex items-center justify-center transition-all hidden md:flex"
                    >
                        <span className="material-symbols-outlined text-3xl">chevron_right</span>
                    </button>
                )}

                <div
                    ref={scrollContainerRef}
                    onClick={() => { if (isPlaying) setIsPlaying(false); }}
                    className="h-full overflow-y-auto no-scrollbar scroll-mask-bottom px-6 py-8 pb-32 font-mono"
                    style={{ fontSize: `${fontSize}px` }}
                >
                    {/* Add a top padding so the song starts lower on the screen, giving time for intro */}
                    <div className="h-[30vh] md:h-[40vh] w-full shrink-0"></div>

                    {/* Render Parsed song */}
                    <div className="max-w-xl mx-auto">
                        {parsedLines.map((line, i) => {
                            if (line.type === 'section') {
                                return (
                                    <p
                                        key={i}
                                        ref={el => lineRefs.current[i] = el}
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
                                        ref={el => lineRefs.current[i] = el}
                                        className="mb-2 whitespace-pre-wrap text-slate-900 dark:text-slate-100"
                                    >
                                        {line.content} {line.pause > 0 && <span className="ml-2 text-[10px] text-primary/60">(pause {line.pause}s)</span>}
                                    </p>
                                );
                            }

                            // Render Line with Chords
                            const hasLyricsText = line.segments.some(segment => segment.lyrics && segment.lyrics.trim() !== '');

                            return (
                                <div
                                    key={i}
                                    ref={el => lineRefs.current[i] = el}
                                    className={`whitespace-pre-wrap break-words ${hasLyricsText ? 'mt-2 mb-4 leading-[2.5]' : 'mt-4 mb-2 leading-normal'}`}
                                >
                                    {line.pause > 0 && <div className="text-[10px] text-primary/60 mb-1 opacity-60">(pause {line.pause}s)</div>}
                                    {line.segments.map((segment, j) => {
                                        const transposedChord = segment.chord
                                            ? transposeNote(segment.chord, transpose)
                                            : null;

                                        const segmentLyrics = segment.lyrics || '';

                                        if (!hasLyricsText) {
                                            return (
                                                <React.Fragment key={j}>
                                                    {transposedChord && <span className="text-primary font-bold">{transposedChord}</span>}
                                                    <span className="text-slate-900 dark:text-slate-100">{segmentLyrics}</span>
                                                </React.Fragment>
                                            );
                                        }

                                        return (
                                            <React.Fragment key={j}>
                                                {transposedChord && (
                                                    <span className="relative inline-block w-0 h-0 align-baseline">
                                                        <span className="absolute left-0 bottom-0 -translate-y-[1.25em] text-primary font-bold text-[0.9em] leading-none whitespace-nowrap">
                                                            {transposedChord}
                                                        </span>
                                                    </span>
                                                )}
                                                {/* Render actual lyrics inline */}
                                                <span className="text-slate-900 dark:text-slate-100">{segmentLyrics}</span>
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            );
                        })}

                        <div className="h-48 text-center text-slate-500 text-sm py-10">{t('editor.endOfSong')}</div>
                    </div>
                </div>
            </main>

            {/* Footer Controls */}
            <div className={cn(
                "absolute left-4 right-4 z-30 transition-all duration-500 ease-in-out",
                isPlaying ? "-bottom-40 opacity-0 pointer-events-none" : "bottom-6 opacity-100"
            )}>
                <div className="bg-white dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl p-3 flex flex-col gap-4 backdrop-blur-xl bg-opacity-95 dark:bg-opacity-95">
                    {/* Navigation Bar for Mobile (Optional visual cue) */}
                    <div className="flex items-center justify-between md:hidden pb-2 border-b border-slate-100 dark:border-white/5">
                        <button disabled={!prevSongId} onClick={() => navigateToSong(prevSongId)} className="p-2 text-slate-400 disabled:opacity-20 hover:text-primary">
                            <span className="material-symbols-outlined">skip_previous</span>
                        </button>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{setlistId ? 'Setlist' : 'Library'}</span>
                        <button disabled={!nextSongId} onClick={() => navigateToSong(nextSongId)} className="p-2 text-slate-400 disabled:opacity-20 hover:text-primary">
                            <span className="material-symbols-outlined">skip_next</span>
                        </button>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        {/* Key Transpose */}
                        <div className="flex items-center bg-slate-100 dark:bg-background-dark rounded-lg p-1 border border-slate-200 dark:border-white/5">
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

                        {/* Auto Scroll Toggle */}
                        <button
                            onClick={togglePlay}
                            className={cn(
                                "flex-1 flex items-center justify-between px-4 h-12 rounded-lg shadow-lg transition-all group",
                                isPlaying ? "bg-primary text-white shadow-primary/20 active:bg-primary/90" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined fill-current">{isPlaying ? 'pause_circle' : 'play_circle'}</span>
                                <span className="font-bold">Auto-Scroll</span>
                            </div>
                            <span className={cn("text-xs font-medium px-2 py-0.5 rounded", isPlaying ? "bg-black/20 text-white/90" : "bg-black/10 text-slate-500")}>
                                {isPlaying ? 'ON' : 'OFF'}
                            </span>
                        </button>
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
                                value={scrollSpeed}
                                onChange={(e) => setScrollSpeed(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>
                        <span className="text-slate-900 dark:text-white font-medium w-8 text-right tabular-nums">{scrollSpeed}x</span>
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
                                value={fontSize}
                                onChange={(e) => setFontSize(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>
                        <span className="text-slate-900 dark:text-white font-medium w-8 text-right tabular-nums">{fontSize}px</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SongViewer;
