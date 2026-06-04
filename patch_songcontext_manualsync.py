import re

with open('/Users/saviobpinto/Documents/workspace/cifras/src/contexts/SongContext.jsx', 'r') as f:
    content = f.read()

# We need to insert syncProgress state
sync_state = """    const [isCloudSynced, setIsCloudSynced] = useState(false);
    const [syncProgress, setSyncProgress] = useState({ isSyncing: false, progress: 0, statusText: '' });"""

content = content.replace("    const [isCloudSynced, setIsCloudSynced] = useState(false);", sync_state)

# The new manualSync function to replace startBatchUpload and fetchFromCloud completely
manual_sync_logic = """
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
                    const payload = chunk.map(s => ({
                        id: s.id,
                        user_id: session.user.id,
                        data: s,
                        deleted: false,
                        updated_at: new Date().toISOString()
                    }));
                    await supabase.from('cifras_songs').upsert(payload, { onConflict: 'id' }).catch(console.error);
                    
                    uploadedCount += chunk.length;
                    const progress = 50 + Math.floor((uploadedCount / totalUploads) * 45); // up to 95%
                    setSyncProgress({ isSyncing: true, progress, statusText: `Enviando ${uploadedCount} de ${totalUploads} itens...` });
                }

                // Upload Setlists
                for (let i = 0; i < localOnlySetlists.length; i += chunkSize) {
                    const chunk = localOnlySetlists.slice(i, i + chunkSize);
                    const payload = chunk.map(s => ({
                        id: s.id,
                        user_id: session.user.id,
                        data: s,
                        deleted: false,
                        updated_at: new Date().toISOString()
                    }));
                    await supabase.from('cifras_setlists').upsert(payload, { onConflict: 'id' }).catch(console.error);
                    
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
            setSyncProgress({ isSyncing: true, progress: 100, statusText: 'Erro na sincronização.' });
            setTimeout(() => {
                setSyncProgress({ isSyncing: false, progress: 0, statusText: '' });
            }, 3000);
        }
    };
"""

# Replace startBatchUpload and fetchFromCloud
pattern = re.compile(r'const startBatchUpload = async \(localSongs, localSetlists\) => \{.*?\n    \}, \[isLoaded, session, isOfflineMode\]\);', re.DOTALL)
content = pattern.sub(manual_sync_logic.strip(), content)

# We must also ensure `syncProgress` and `manualSync` are returned by SongContext.Provider
provider_pattern = re.compile(r'    return \(\n        <SongContext.Provider value=\{\{', re.DOTALL)
provider_replacement = """    return (
        <SongContext.Provider value={{
            syncProgress,
            manualSync,"""

content = provider_pattern.sub(provider_replacement, content)

# Also, in importData, we used to call startBatchUpload(songsToAdd, setlistsToAdd). We should just call manualSync() now, or remove it and let user click manualSync.
# Let's remove startBatchUpload call from importData.
content = content.replace("""            if (songsToAdd.length > 0 || setlistsToAdd.length > 0) {
                startBatchUpload(songsToAdd, setlistsToAdd);
            }""", "")

with open('/Users/saviobpinto/Documents/workspace/cifras/src/contexts/SongContext.jsx', 'w') as f:
    f.write(content)

