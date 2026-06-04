import re

with open('/Users/saviobpinto/Documents/workspace/cifras/src/contexts/SongContext.jsx', 'r') as f:
    content = f.read()

content = content.replace("const { session } = useAuth();", "const { session, isOfflineMode } = useAuth();")

fetchFromCloudRegex = re.compile(r'useEffect\(\(\) => \{\n\s*async function fetchFromCloud\(\) \{.*?\}, \[isLoaded, session\]\);', re.DOTALL)

newFetchLogic = """
    const startBatchUpload = async (localSongs, localSetlists) => {
        if (!session?.user) return;
        console.log("Iniciando batch upload de", localSongs.length, "músicas");
        
        const chunkSize = 500;
        for (let i = 0; i < localSongs.length; i += chunkSize) {
            const chunk = localSongs.slice(i, i + chunkSize);
            const payload = chunk.map(s => ({
                id: s.id,
                user_id: session.user.id,
                data: s,
                deleted: false,
                updated_at: new Date().toISOString()
            }));
            await supabase.from('cifras_songs').upsert(payload, { onConflict: 'id' }).catch(console.error);
        }

        if (localSetlists.length > 0) {
            const setlistPayload = localSetlists.map(s => ({
                id: s.id,
                user_id: session.user.id,
                data: s,
                deleted: false,
                updated_at: new Date().toISOString()
            }));
            await supabase.from('cifras_setlists').upsert(setlistPayload, { onConflict: 'id' }).catch(console.error);
        }
        console.log("Batch upload concluído!");
    };

    const syncRowToCloud = async (table, id, data, deleted = false) => {
        if (!isCloudSynced || !session?.user || isOfflineMode) return;
        try {
            await supabase.from(table).upsert({
                id: id,
                user_id: session.user.id,
                data: data || {},
                deleted: deleted,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
        } catch (err) {
            console.error(`Erro ao sincronizar ${table}:`, err);
        }
    };

    useEffect(() => {
        async function fetchFromCloud() {
            if (!session?.user || isOfflineMode) {
                setIsCloudSynced(true);
                return;
            }
            try {
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

                if (allCloudSongs.length > 0) {
                    const validSongs = allCloudSongs.filter(s => !s.deleted).map(s => s.data);
                    if (validSongs.length > 0) {
                        setSongs(validSongs);
                        await set('cifras-app-songs', validSongs).catch(console.error);
                    }
                } else if (songs.length > 1 || (songs.length === 1 && songs[0].id !== '1')) {
                    startBatchUpload(songs, setlists);
                }

                if (allCloudSetlists.length > 0) {
                    const validSetlists = allCloudSetlists.filter(s => !s.deleted).map(s => s.data);
                    if (validSetlists.length > 0) {
                        setSetlists(validSetlists);
                        await set('cifras-app-setlists', validSetlists).catch(console.error);
                    }
                }
            } catch (err) {
                console.error("Cloud fetch error", err);
            } finally {
                setIsCloudSynced(true);
            }
        }
        
        if (isLoaded) {
            fetchFromCloud();
        }
    }, [isLoaded, session, isOfflineMode]);
"""
content = fetchFromCloudRegex.sub(newFetchLogic.strip(), content)


syncTimeoutRegex = re.compile(r'const syncTimeout = useRef\(null\);\n\s*useEffect\(\(\) => \{.*?\}, \[songs, setlists, isLoaded, isCloudSynced, session\]\);', re.DOTALL)
newSyncTimeout = """
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
"""
content = syncTimeoutRegex.sub(newSyncTimeout.strip(), content)

content = content.replace("""    const addSong = (songData) => {
        const newSong = {
            fontSize: 14,
            ...songData,
            id: uuidv4(),
            lastEdited: new Date().toISOString()
        };
        setSongs([newSong, ...songs]);
        return newSong.id;
    };""", """    const addSong = (songData) => {
        const newSong = {
            fontSize: 14,
            ...songData,
            id: uuidv4(),
            lastEdited: new Date().toISOString()
        };
        setSongs([newSong, ...songs]);
        syncRowToCloud('cifras_songs', newSong.id, newSong, false);
        return newSong.id;
    };""")

content = content.replace("""    const updateSong = (id, songData) => {
        setSongs(songs.map(song =>
            song.id === id ? { ...song, ...songData, lastEdited: new Date().toISOString() } : song
        ));
    };""", """    const updateSong = (id, songData) => {
        setSongs(songs.map(song => {
            if (song.id === id) {
                const updated = { ...song, ...songData, lastEdited: new Date().toISOString() };
                syncRowToCloud('cifras_songs', id, updated, false);
                return updated;
            }
            return song;
        }));
    };""")

content = content.replace("""    const deleteSong = (id) => {
        setSongs(songs.filter(song => song.id !== id));
        // Also remove from all setlists to maintain integrity
        setSetlists(setlists.map(list => ({
            ...list,
            songs: list.songs.filter(songId => songId !== id)
        })));
    };""", """    const deleteSong = (id) => {
        setSongs(songs.filter(song => song.id !== id));
        syncRowToCloud('cifras_songs', id, null, true);
        
        setSetlists(prevSetlists => {
            return prevSetlists.map(list => {
                if (list.songs.includes(id)) {
                    const newList = {
                        ...list,
                        songs: list.songs.filter(songId => songId !== id)
                    };
                    syncRowToCloud('cifras_setlists', list.id, newList, false);
                    return newList;
                }
                return list;
            });
        });
    };""")

content = content.replace("""    const addSetlist = (title) => {
        const newSetlist = {
            id: uuidv4(),
            title,
            date: new Date().toISOString(),
            songs: []
        };
        setSetlists([newSetlist, ...setlists]);
    };""", """    const addSetlist = (title) => {
        const newSetlist = {
            id: uuidv4(),
            title,
            date: new Date().toISOString(),
            songs: []
        };
        setSetlists([newSetlist, ...setlists]);
        syncRowToCloud('cifras_setlists', newSetlist.id, newSetlist, false);
    };""")

content = content.replace("""    const deleteSetlist = (id) => {
        setSetlists(setlists.filter(s => s.id !== id));
    };""", """    const deleteSetlist = (id) => {
        setSetlists(setlists.filter(s => s.id !== id));
        syncRowToCloud('cifras_setlists', id, null, true);
    };""")

content = content.replace("""    const updateSetlist = (id, title) => {
        setSetlists(setlists.map(s => {
            if (s.id === id) {
                return { ...s, title };
            }
            return s;
        }));
    };""", """    const updateSetlist = (id, title) => {
        setSetlists(setlists.map(s => {
            if (s.id === id) {
                const updated = { ...s, title };
                syncRowToCloud('cifras_setlists', id, updated, false);
                return updated;
            }
            return s;
        }));
    };""")

content = content.replace("""    const addToSetlist = (setlistId, songId) => {
        setSetlists(setlists.map(s => {
            if (s.id === setlistId) {
                if (s.songs.includes(songId)) return s; // Prevent duplicates
                return { ...s, songs: [...s.songs, songId] };
            }
            return s;
        }));
    };""", """    const addToSetlist = (setlistId, songId) => {
        setSetlists(setlists.map(s => {
            if (s.id === setlistId) {
                if (s.songs.includes(songId)) return s; // Prevent duplicates
                const updated = { ...s, songs: [...s.songs, songId] };
                syncRowToCloud('cifras_setlists', setlistId, updated, false);
                return updated;
            }
            return s;
        }));
    };""")

content = content.replace("""    const removeFromSetlist = (setlistId, songId) => {
        setSetlists(setlists.map(s => {
            if (s.id === setlistId) {
                return { ...s, songs: s.songs.filter(id => id !== songId) };
            }
            return s;
        }));
    };""", """    const removeFromSetlist = (setlistId, songId) => {
        setSetlists(setlists.map(s => {
            if (s.id === setlistId) {
                const updated = { ...s, songs: s.songs.filter(id => id !== songId) };
                syncRowToCloud('cifras_setlists', setlistId, updated, false);
                return updated;
            }
            return s;
        }));
    };""")

content = content.replace("""    const reorderSetlist = (setlistId, newOrder) => {
        setSetlists(setlists.map(s => {
            if (s.id === setlistId) {
                return { ...s, songs: newOrder };
            }
            return s;
        }));
    };""", """    const reorderSetlist = (setlistId, newOrder) => {
        setSetlists(setlists.map(s => {
            if (s.id === setlistId) {
                const updated = { ...s, songs: newOrder };
                syncRowToCloud('cifras_setlists', setlistId, updated, false);
                return updated;
            }
            return s;
        }));
    };""")

with open('/Users/saviobpinto/Documents/workspace/cifras/src/contexts/SongContext.jsx', 'w') as f:
    f.write(content)
