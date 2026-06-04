with open('/Users/saviobpinto/Documents/workspace/cifras/src/contexts/SongContext.jsx', 'r') as f:
    content = f.read()

# Add imports
if "import { supabase }" not in content:
    content = content.replace(
        "import { get, set } from 'idb-keyval';",
        "import { get, set } from 'idb-keyval';\nimport { supabase } from '../lib/supabase';\nimport { useAuth } from './AuthContext';"
    )

# Add useAuth to SongProvider
if "const { session, isOfflineMode } = useAuth();" not in content:
    content = content.replace(
        "export function SongProvider({ children }) {\n    const [songs, setSongs] = useState([DEFAULT_SONG]);",
        "export function SongProvider({ children }) {\n    const { session, isOfflineMode } = useAuth();\n    const [songs, setSongs] = useState([DEFAULT_SONG]);"
    )

with open('/Users/saviobpinto/Documents/workspace/cifras/src/contexts/SongContext.jsx', 'w') as f:
    f.write(content)
