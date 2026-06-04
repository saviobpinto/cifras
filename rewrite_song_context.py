import re

# Read original backup
with open('/tmp/SongContext_backup.jsx', 'r') as f:
    content = f.read()

# Add useAuth import implicitly if not present, but it's probably present...
# Wait, let's just make the replacements carefully.

# 1. Update useAuth call
content = content.replace("const { session } = useAuth();", "const { session, isOfflineMode } = useAuth();")
if "isOfflineMode" not in content and "useAuth" in content:
    content = re.sub(r'const \{.*?\} = useAuth\(\);', 'const { session, isOfflineMode } = useAuth();', content)

# 2. Insert sync logic right after setIsLoaded(false)
sync_logic = """
    const [isCloudSynced, setIsCloudSynced] = useState(false);

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

# Insert it after setIsLoaded(false);
content = re.sub(
    r'(const \[isLoaded, setIsLoaded\] = useState\(false\);)',
    r'\1\n' + sync_logic,
    content
)

# 3. Replace saveSongsTimeout and saveSetlistsTimeout with single localSaveTimeout
local_save_logic = """
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

content = re.sub(
    r'const saveSongsTimeout = useRef\(null\);\n\s*useEffect\(\(\) => \{.*?\}, \[songs, isLoaded\]\);\n\n\s*const saveSetlistsTimeout = useRef\(null\);\n\s*useEffect\(\(\) => \{.*?\}, \[setlists, isLoaded\]\);',
    local_save_logic.strip(),
    content,
    flags=re.DOTALL
)

with open('/Users/saviobpinto/Documents/workspace/cifras/src/contexts/SongContext.jsx', 'w') as f:
    f.write(content)
