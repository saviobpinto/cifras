import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import NoSleep from 'nosleep.js';
import { get, set } from 'idb-keyval';

const SongContext = createContext();

export function useSongs() {
    return useContext(SongContext);
}

const DEFAULT_SONG = {
    id: '1',
    title: 'Wonderwall',
    artist: 'Oasis',
    genre: 'Rock',
    key: 'Em',
    bpm: 90,
    capo: 2,
    content: `[Verse 1]
[Em7]Today is [G]gonna be the day
That they're [Dsus4]gonna throw it back to [A7sus4]you
[Em7]By now you [G]should've somehow
Realized [Dsus4]what you gotta [A7sus4]do
[Em7]I don't believe that [G]anybody
[Dsus4]Feels the way I [A7sus4]do about you [Cadd9]now [Dsus4] [A7sus4]

[Verse 2]
[Em7]Backbeat, the [G]word is on the street
That the [Dsus4]fire in your heart is [A7sus4]out
[Em7]I'm sure you've [G]heard it all before
But you [Dsus4]never really had a [A7sus4]doubt
[Em7]I don't believe that [G]anybody
[Dsus4]Feels the way I [A7sus4]do about you [Em7]now

[Chorus]
And [Cadd9]all the roads we [Dsus4]have to walk are [Em7]winding
And [Cadd9]all the lights that [Dsus4]lead us there are [Em7]blinding
[Cadd9]There are many [Dsus4]things that I
Would [G]like to [G/F#]say to [Em7]you but I [Dsus4]don't know [A7sus4]how

[Outro]
I said [Cadd9]maybe [Em7] [G]
You're gonna be the one that [Em7]saves me [Cadd9]
And after [Em7]all [G]
You're my [Em7]wonderwall [Cadd9] [Em7] [G] [Em7]`,
    fontSize: 14,
    lastEdited: new Date().toISOString()
};

export function SongProvider({ children }) {
    const [songs, setSongs] = useState([DEFAULT_SONG]);

    const [setlists, setSetlists] = useState([
        { id: 'demo', title: 'Friday Gig', date: new Date().toISOString(), songs: ['1'] }
    ]);

    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const savedSongs = await get('cifras-app-songs');
                if (savedSongs) setSongs(savedSongs);
                const savedSetlists = await get('cifras-app-setlists');
                if (savedSetlists) setSetlists(savedSetlists);
            } catch (err) {
                console.error("IDB load error", err);
            } finally {
                setIsLoaded(true);
            }
        }
        loadData();
    }, []);

    const [currentSong, setCurrentSong] = useState(null);

    // Theme State
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('cifras-app-theme') || 'light';
    });

    // Keep Awake State
    const [keepAwake, setKeepAwake] = useState(() => {
        const val = localStorage.getItem('cifras-app-keep-awake');
        return val ? JSON.parse(val) : true;
    });

    const saveSongsTimeout = useRef(null);
    useEffect(() => {
        if (isLoaded) {
            if (saveSongsTimeout.current) clearTimeout(saveSongsTimeout.current);
            saveSongsTimeout.current = setTimeout(() => {
                set('cifras-app-songs', songs).catch(err => console.error("IDB save error", err));
            }, 1000);
        }
        return () => { if (saveSongsTimeout.current) clearTimeout(saveSongsTimeout.current); };
    }, [songs, isLoaded]);

    const saveSetlistsTimeout = useRef(null);
    useEffect(() => {
        if (isLoaded) {
            if (saveSetlistsTimeout.current) clearTimeout(saveSetlistsTimeout.current);
            saveSetlistsTimeout.current = setTimeout(() => {
                set('cifras-app-setlists', setlists).catch(err => console.error("IDB save error", err));
            }, 1000);
        }
        return () => { if (saveSetlistsTimeout.current) clearTimeout(saveSetlistsTimeout.current); };
    }, [setlists, isLoaded]);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('cifras-app-theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('cifras-app-keep-awake', JSON.stringify(keepAwake));
    }, [keepAwake]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const noSleepRef = useRef(new NoSleep());

    const toggleKeepAwake = () => {
        setKeepAwake(prev => {
            const next = !prev;
            if (next) {
                noSleepRef.current.enable();
            } else {
                noSleepRef.current.disable();
            }
            return next;
        });
    };

    // Wake Lock Logic - Global listener to enable NoSleep on first interaction if `keepAwake` is true
    useEffect(() => {
        let isEnabled = noSleepRef.current?.isEnabled;

        const handleInteraction = () => {
            if (keepAwake && !noSleepRef.current.isEnabled) {
                try {
                    noSleepRef.current.enable();
                } catch (e) {
                    console.error("NoSleep enable failed", e);
                }
            }
        };

        if (keepAwake) {
            // Attach to multiple interaction types on window to ensure iOS catches it
            window.addEventListener('click', handleInteraction);
            window.addEventListener('touchstart', handleInteraction);
            window.addEventListener('touchend', handleInteraction);

            // Try to enable it immediately just in case we are already in an interaction context
            if (!noSleepRef.current.isEnabled) {
                try { noSleepRef.current.enable(); } catch (e) { }
            }
        } else {
            if (noSleepRef.current.isEnabled) {
                noSleepRef.current.disable();
            }
        }

        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('touchend', handleInteraction);
        };
    }, [keepAwake]);

    // Ensure it's disabled when component unmounts
    useEffect(() => {
        return () => {
            if (noSleepRef.current && noSleepRef.current.isEnabled) {
                noSleepRef.current.disable();
            }
        };
    }, []);

    // Song Functions
    const addSong = (songData) => {
        const newSong = {
            fontSize: 14,
            ...songData,
            id: uuidv4(),
            lastEdited: new Date().toISOString()
        };
        setSongs([newSong, ...songs]);
        return newSong.id;
    };

    const updateSong = (id, songData) => {
        setSongs(songs.map(song =>
            song.id === id ? { ...song, ...songData, lastEdited: new Date().toISOString() } : song
        ));
    };

    const deleteSong = (id) => {
        setSongs(songs.filter(song => song.id !== id));
        // Also remove from all setlists to maintain integrity
        setSetlists(setlists.map(list => ({
            ...list,
            songs: list.songs.filter(songId => songId !== id)
        })));
    };

    const getSong = (id) => {
        return songs.find(song => song.id === id);
    };

    const importSongs = (newSongs) => {
        // Simple merge, no duplicates check for now, or we can check by title/artist
        const songsToAdd = newSongs.map(s => ({
            fontSize: 14,
            ...s,
            id: uuidv4(),
            lastEdited: new Date().toISOString()
        }));
        setSongs(prev => [...songsToAdd, ...prev]);
    };

    const clearAllSongs = () => {
        setSongs([]);
        // Also clear setlists when deleting all songs
        setSetlists([]);
    };

    // Setlist Functions
    const addSetlist = (title) => {
        const newSetlist = {
            id: uuidv4(),
            title,
            date: new Date().toISOString(),
            songs: []
        };
        setSetlists([newSetlist, ...setlists]);
    };

    const deleteSetlist = (id) => {
        setSetlists(setlists.filter(s => s.id !== id));
    };

    const updateSetlist = (id, title) => {
        setSetlists(setlists.map(s => {
            if (s.id === id) {
                return { ...s, title };
            }
            return s;
        }));
    };

    const addToSetlist = (setlistId, songId) => {
        setSetlists(setlists.map(s => {
            if (s.id === setlistId) {
                if (s.songs.includes(songId)) return s; // Prevent duplicates
                return { ...s, songs: [...s.songs, songId] };
            }
            return s;
        }));
    };

    const removeFromSetlist = (setlistId, songId) => {
        setSetlists(setlists.map(s => {
            if (s.id === setlistId) {
                return { ...s, songs: s.songs.filter(id => id !== songId) };
            }
            return s;
        }));
    };

    const reorderSetlist = (setlistId, newOrder) => {
        setSetlists(setlists.map(s => {
            if (s.id === setlistId) {
                return { ...s, songs: newOrder };
            }
            return s;
        }));
    };

    const exportSetlists = (selectedSetlistIds = null) => {
        let exportSetlistsData = setlists;
        let exportSongsData = songs;

        if (selectedSetlistIds && selectedSetlistIds.length > 0) {
            exportSetlistsData = setlists.filter(s => selectedSetlistIds.includes(s.id));
            const songIds = new Set();
            exportSetlistsData.forEach(sl => sl.songs.forEach(id => songIds.add(id)));
            exportSongsData = songs.filter(s => songIds.has(s.id));
        }

        const payload = {
            version: 1,
            type: 'cifras-backup',
            setlists: exportSetlistsData,
            songs: exportSongsData
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cifras_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const importData = (jsonData) => {
        try {
            const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            if (parsed.type !== 'cifras-backup') {
                throw new Error("Formato de arquivo inválido.");
            }

            const existingSongIds = new Set(songs.map(s => s.id));
            const existingSetlistIds = new Set(setlists.map(s => s.id));

            const songsToAdd = (parsed.songs || []).filter(s => !existingSongIds.has(s.id));
            const setlistsToAdd = (parsed.setlists || []).filter(s => !existingSetlistIds.has(s.id));

            if (songsToAdd.length > 0) {
                setSongs(prev => [...songsToAdd, ...prev]);
            }
            if (setlistsToAdd.length > 0) {
                setSetlists(prev => [...setlistsToAdd, ...prev]);
            }

            return { success: true, count: setlistsToAdd.length };
        } catch (e) {
            console.error("Failed to import", e);
            return { success: false, error: e.message };
        }
    };

    return (
        <SongContext.Provider value={{
            songs,
            currentSong,
            setCurrentSong,
            addSong,
            updateSong,
            deleteSong,
            clearAllSongs,
            getSong,
            importSongs,
            setlists,
            addSetlist,
            updateSetlist,
            deleteSetlist,
            addToSetlist,
            removeFromSetlist,
            reorderSetlist,
            exportSetlists,
            importData,
            theme,
            toggleTheme,
            keepAwake,
            toggleKeepAwake
        }}>
            {children}
        </SongContext.Provider>
    );
}
