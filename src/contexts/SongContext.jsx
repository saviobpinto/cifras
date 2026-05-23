import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import NoSleep from 'nosleep.js';
import { get, set } from 'idb-keyval';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

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
    const { session, isOfflineMode } = useAuth();
    const [songs, setSongs] = useState([DEFAULT_SONG]);

    const [setlists, setSetlists] = useState([
        { id: 'demo', title: 'Friday Gig', date: new Date().toISOString(), songs: ['1'] }
    ]);

    const [isLoaded, setIsLoaded] = useState(false);

    const [isCloudSynced, setIsCloudSynced] = useState(false);
    const [syncProgress, setSyncProgress] = useState({ isSyncing: false, progress: 0, statusText: '' });

    const manualSync = async () => {
        if (!session?.user || isOfflineMode) return;
        
        setSyncProgress({ isSyncing: true, progress: 0, statusText: 'Iniciando sincronização...' });
        
        try {
            setSyncProgress({ isSyncing: true, progress: 10, statusText: 'Baixando músicas da nuvem...' });
            let allCloudSongs = [];
            let from = 0;
            let limit = 1000;
            while (true) {
                const { data, error } = await supabase
                    .from('cifras_songs')
                    .select('id, data, deleted')
                    .eq('user_id', session.user.id)
                    .range(from, from + limit - 1);
                if (error) throw error;
                if (data && data.length > 0) {
                    allCloudSongs.push(...data);
                    from += limit;
                    if (data.length < limit) break;
                } else {
                    break;
                }
            }

            setSyncProgress({ isSyncing: true, progress: 30, statusText: 'Baixando setlists da nuvem...' });
            let allCloudSetlists = [];
            from = 0;
            while (true) {
                const { data, error } = await supabase
                    .from('cifras_setlists')
                    .select('id, data, deleted')
                    .eq('user_id', session.user.id)
                    .range(from, from + limit - 1);
                if (error) throw error;
                if (data && data.length > 0) {
                    allCloudSetlists.push(...data);
                    from += limit;
                    if (data.length < limit) break;
                } else {
                    break;
                }
            }

            setSyncProgress({ isSyncing: true, progress: 40, statusText: 'Mesclando dados...' });
            
            // Merge Songs
            let validCloudSongs = allCloudSongs.filter(s => !s.deleted).map(s => s.data);
            let cloudMap = new Map(validCloudSongs.map(s => [s.id, s]));
            let mergedSongsMap = new Map();
            songs.forEach(s => mergedSongsMap.set(s.id, s));
            validCloudSongs.forEach(s => mergedSongsMap.set(s.id, s));
            let mergedSongs = Array.from(mergedSongsMap.values());
            let localOnlySongs = songs.filter(s => !cloudMap.has(s.id));
            // ignorar música default (id 1) se ela for a única
            if (localOnlySongs.length === 1 && localOnlySongs[0].id === '1') {
                localOnlySongs = [];
            }

            // Merge Setlists
            let validCloudSetlists = allCloudSetlists.filter(s => !s.deleted).map(s => s.data);
            let cloudSetlistsMap = new Map(validCloudSetlists.map(s => [s.id, s]));
            let mergedSetlistsMap = new Map();
            setlists.forEach(s => mergedSetlistsMap.set(s.id, s));
            validCloudSetlists.forEach(s => mergedSetlistsMap.set(s.id, s));
            let mergedSetlists = Array.from(mergedSetlistsMap.values());
            let localOnlySetlists = setlists.filter(s => !cloudSetlistsMap.has(s.id));

            if (mergedSongs.length > 0) {
                setSongs(mergedSongs);
                await set('cifras-app-songs', mergedSongs).catch(console.error);
            }
            if (mergedSetlists.length > 0) {
                setSetlists(mergedSetlists);
                await set('cifras-app-setlists', mergedSetlists).catch(console.error);
            }

            // Upload Local Only
            const totalUploads = localOnlySongs.length + localOnlySetlists.length;
            if (totalUploads > 0) {
                setSyncProgress({ isSyncing: true, progress: 50, statusText: `Enviando ${totalUploads} itens locais para a nuvem...` });
                
                const chunkSize = 500;
                let uploadedCount = 0;
                
                // Upload Songs
                for (let i = 0; i < localOnlySongs.length; i += chunkSize) {
                    const chunk = localOnlySongs.slice(i, i + chunkSize);
                    const sanitizedChunk = JSON.parse(JSON.stringify(chunk).replace(/\\u0000/g, ''));
                    
                    const payload = sanitizedChunk.map(s => ({
                        id: s.id,
                        user_id: session.user.id,
                        data: s,
                        deleted: false,
                        updated_at: new Date().toISOString()
                    }));
                    const { error } = await supabase.from('cifras_songs').upsert(payload, { onConflict: 'id' });
                    if (error) console.error(error);
                    
                    uploadedCount += chunk.length;
                    const progress = 50 + Math.floor((uploadedCount / totalUploads) * 45); // up to 95%
                    setSyncProgress({ isSyncing: true, progress, statusText: `Enviando ${uploadedCount} de ${totalUploads} itens...` });
                }

                // Upload Setlists
                for (let i = 0; i < localOnlySetlists.length; i += chunkSize) {
                    const chunk = localOnlySetlists.slice(i, i + chunkSize);
                    const sanitizedChunk = JSON.parse(JSON.stringify(chunk).replace(/\\u0000/g, ''));
                    
                    const payload = sanitizedChunk.map(s => ({
                        id: s.id,
                        user_id: session.user.id,
                        data: s,
                        deleted: false,
                        updated_at: new Date().toISOString()
                    }));
                    const { error } = await supabase.from('cifras_setlists').upsert(payload, { onConflict: 'id' });
                    if (error) console.error(error);
                    
                    uploadedCount += chunk.length;
                    const progress = 50 + Math.floor((uploadedCount / totalUploads) * 45); // up to 95%
                    setSyncProgress({ isSyncing: true, progress, statusText: `Enviando ${uploadedCount} de ${totalUploads} itens...` });
                }
            }

            setSyncProgress({ isSyncing: true, progress: 100, statusText: 'Sincronização concluída!' });
            setIsCloudSynced(true);
            
            // Hide after 3 seconds
            setTimeout(() => {
                setSyncProgress({ isSyncing: false, progress: 0, statusText: '' });
            }, 3000);

        } catch (err) {
            console.error("Manual sync error", err);
            setSyncProgress({ isSyncing: true, progress: 100, statusText: `Erro: ${err.message || 'Falha na conexão'}` });
            setTimeout(() => {
                setSyncProgress({ isSyncing: false, progress: 0, statusText: '' });
            }, 5000);
        }
    };

    const syncRowToCloud = async (table, id, data, deleted = false) => {
        if (!isCloudSynced || !session?.user || isOfflineMode) return;
        try {
            // Remove null bytes that break postgresql JSONB
            let safeData = data || {};
            if (safeData) {
                safeData = JSON.parse(JSON.stringify(safeData).replace(/\\u0000/g, ''));
            }

            await supabase.from(table).upsert({
                id: id,
                user_id: session.user.id,
                data: safeData,
                deleted: deleted,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
        } catch (err) {
            console.error(`Erro ao sincronizar ${table}:`, err);
        }
    };

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

    const localSaveTimeout = useRef(null);
    useEffect(() => {
        if (isLoaded) {
            if (localSaveTimeout.current) clearTimeout(localSaveTimeout.current);
            localSaveTimeout.current = setTimeout(async () => {
                await set('cifras-app-songs', songs).catch(console.error);
                await set('cifras-app-setlists', setlists).catch(console.error);
            }, 1000);
        }
        return () => { if (localSaveTimeout.current) clearTimeout(localSaveTimeout.current); };
    }, [songs, setlists, isLoaded]);

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
        syncRowToCloud('cifras_songs', newSong.id, newSong, false);
        return newSong.id;
    };

    const updateSong = (id, songData) => {
        setSongs(songs.map(song => {
            if (String(song.id) === String(id)) {
                const updated = { ...song, ...songData, lastEdited: new Date().toISOString() };
                syncRowToCloud('cifras_songs', song.id, updated, false);
                return updated;
            }
            return song;
        }));
    };

    const deleteSong = (id) => {
        setSongs(songs.filter(song => String(song.id) !== String(id)));
        syncRowToCloud('cifras_songs', id, null, true);
        
        setSetlists(prevSetlists => {
            return prevSetlists.map(list => {
                if (list.songs.some(songId => String(songId) === String(id))) {
                    const newList = {
                        ...list,
                        songs: list.songs.filter(songId => String(songId) !== String(id))
                    };
                    syncRowToCloud('cifras_setlists', list.id, newList, false);
                    return newList;
                }
                return list;
            });
        });
    };

    const getSong = (id) => {
        return songs.find(song => String(song.id) === String(id));
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
        syncRowToCloud('cifras_setlists', newSetlist.id, newSetlist, false);
    };

    const deleteSetlist = (id) => {
        setSetlists(setlists.filter(s => s.id !== id));
        syncRowToCloud('cifras_setlists', id, null, true);
    };

    const updateSetlist = (id, title) => {
        setSetlists(setlists.map(s => {
            if (s.id === id) {
                const updated = { ...s, title };
                syncRowToCloud('cifras_setlists', id, updated, false);
                return updated;
            }
            return s;
        }));
    };

    const addToSetlist = (setlistId, songId) => {
        setSetlists(setlists.map(s => {
            if (s.id === setlistId) {
                if (s.songs.includes(songId)) return s; // Prevent duplicates
                const updated = { ...s, songs: [...s.songs, songId] };
                syncRowToCloud('cifras_setlists', setlistId, updated, false);
                return updated;
            }
            return s;
        }));
    };

    const removeFromSetlist = (setlistId, songId) => {
        setSetlists(setlists.map(s => {
            if (s.id === setlistId) {
                const updated = { ...s, songs: s.songs.filter(id => id !== songId) };
                syncRowToCloud('cifras_setlists', setlistId, updated, false);
                return updated;
            }
            return s;
        }));
    };

    const reorderSetlist = (setlistId, newOrder) => {
        setSetlists(setlists.map(s => {
            if (s.id === setlistId) {
                const updated = { ...s, songs: newOrder };
                syncRowToCloud('cifras_setlists', setlistId, updated, false);
                return updated;
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
            syncProgress,
            manualSync,
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
