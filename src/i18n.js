import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translations
const resources = {
    en: {
        translation: {
            "settings": {
                "title": "Settings",
                "home": "Home",
                "done": "Done",
                "general": "General",
                "appearance": "Appearance",
                "dark": "Dark",
                "light": "Light",
                "notifications": "Notifications",
                "keepScreenAwake": "Keep Screen Awake",
                "keepScreenAwakeDesc": "Prevents lock during performance",
                "language": "Language",
                "profile": "Pro",
                "edit": "Edit",
                "data": "Data",
                "sync": "Sync local database with cloud",
                "syncDesc": "Performs smart data merge",
                "syncing": "Syncing...",
                "syncBtn": "Sync",
                "exportBackup": "Export Setlist",
                "exportBackupDesc": "Save setlists and songs to a file",
                "importBackup": "Import Setlist",
                "importBackupDesc": "Restore from a previously saved file",
                "importCatalog": "Import Catalog",
                "importCatalogDesc": "Import chords library",
                "clearLibrary": "Clear Entire Library",
                "clearLibraryDesc": "Resets all songs for re-importing",
                "account": "Account",
                "logout": "Log Out",
                "logoutDesc": "End the current session"
            },
            "login": {
                "welcomeBack": "Welcome Back",
                "subtitle": "Log in to access your setlists and chords.",
                "emailPlaceholder": "Email Address",
                "passwordPlaceholder": "Password",
                "forgotPassword": "Forgot Password?",
                "loginButton": "Log In",
                "orContinueWith": "Or continue with",
                "noAccount": "Don't have an account?",
                "signUp": "Sign up"
            },
            "dashboard": {
                "welcome": "Welcome",
                "musician": "Musician",
                "search": "Search",
                "createNewSong": "Create New Song",
                "addToCollection": "Add to your collection",
                "recentSongs": "Recent Songs",
                "seeAll": "See all",
                "noSongs": "No songs yet. Create one!",
                "mySetlists": "My Setlists",
                "new": "New",
                "songs": "Songs",
                "cancel": "Cancel",
                "create": "Create",
                "setlistNamePlaceholder": "Setlist Name (e.g. Wedding Gig)",
                "deleteConfirmation": "Delete this setlist?",
                "continuousScroll": "Continuous Scroll",
                "continuousScrollDesc": "Automatically scroll the next song when current ends",
                "addToSetlist": "Add to Setlist",
                "noSetlistsYet": "No setlists created yet.",
                "songOf": "Song {{index}} of {{total}}",
                "nav": {
                    "dashboard": "Dashboard",
                    "library": "Library",
                    "tuner": "Tuner",
                    "metronome": "Metronome",
                    "settings": "Settings"
                }
            },
            "editor": {
                "editSong": "Edit Song",
                "addSong": "Add Song",
                "cancel": "Cancel",
                "save": "Save",
                "title": "Title",
                "titlePlaceholder": "e.g., Wonderwall",
                "artist": "Artist",
                "artistPlaceholder": "e.g., Oasis",
                "genre": "Genre",
                "selectGenre": "Select...",
                "key": "Key",
                "lyricsChords": "Lyrics & Chords",
                "autoFormat": "Auto-Format",
                "contentPlaceholder": "Paste your song here...\n\n[Em]                 [G]\nToday is gonna be the day\n                [D]            [A]\nThat they're gonna throw it back to you",
                "deleteSong": "Delete Song",
                "deleteConfirm": "Are you sure you want to PERMANENTLY delete this song? This cannot be undone.",
                "validationError": "Please fill in at least Title and Content",
                "endOfSong": "End of Song"
            },
            "library": {
                "title": "Library",
                "songsCount": "{{count}} Songs",
                "searchPlaceholder": "Search songs, artists, lyrics...",
                "noSongsYet": "No songs yet",
                "startBuilding": "Start building your repertoire by adding your first song.",
                "addSong": "Add Song",
                "noMatches": "No matches found for \"{{query}}\""
            },
            "tuner": {
                "title": "Instrument Tuner",
                "start": "Start Tuner",
                "stop": "Stop Tuner",
                "allowMic": "Please allow microphone access to use the tuner.",
                "micPermissionError": "Microphone permission denied. Please check your browser settings.",
                "autoMode": "Auto",
                "manualMode": "Manual",
                "playTone": "Play Tone",
                "stopTone": "Stop Tone",
                "instrument": "Instrument",
                "guitar": "Guitar",
                "ukulele": "Ukulele",
                "bass": "Bass (4 Str)",
                "violin": "Violin",
                "inTune": "In Tune!",
                "flat": "Flat",
                "sharp": "Sharp"
            },
            "metronome": {
                "title": "Metronome",
                "start": "Start",
                "stop": "Stop",
                "bpm": "BPM",
                "tempo": "Tempo",
                "timeSignature": "Time Signature",
                "mute": "Mute",
                "sound": "Sound",
                "tapTempo": "Tap Tempo"
            }
        }
    },
    pt: {
        translation: {
            "settings": {
                "title": "Configurações",
                "home": "Início",
                "done": "Concluído",
                "general": "Geral",
                "appearance": "Aparência",
                "dark": "Escuro",
                "light": "Claro",
                "notifications": "Notificações",
                "keepScreenAwake": "Manter Tela Ligada",
                "keepScreenAwakeDesc": "Evita bloqueio durante a performance",
                "language": "Idioma",
                "profile": "Pro",
                "edit": "Editar",
                "data": "Dados",
                "sync": "Sincronizar base local com a nuvem",
                "syncDesc": "Faz o merge inteligente dos dados",
                "syncing": "Sincronizando...",
                "syncBtn": "Sincronizar",
                "exportBackup": "Exportar Setlist",
                "exportBackupDesc": "Salvar setlists e músicas em um arquivo",
                "importBackup": "Importar Setlist",
                "importBackupDesc": "Restaurar de um arquivo salvo anteriormente",
                "importCatalog": "Importar Catálogo",
                "importCatalogDesc": "Importar biblioteca de cifras",
                "clearLibrary": "Apagar Toda a Biblioteca",
                "clearLibraryDesc": "Zera todas as músicas para re-importação",
                "account": "Conta",
                "logout": "Sair",
                "logoutDesc": "Encerrar a sessão atual"
            },
            "login": {
                "welcomeBack": "Bem-vindo de volta",
                "subtitle": "Faça login para acessar seus setlists e cifras.",
                "emailPlaceholder": "Endereço de Email",
                "passwordPlaceholder": "Senha",
                "forgotPassword": "Esqueceu a senha?",
                "loginButton": "Entrar",
                "orContinueWith": "Ou continue com",
                "noAccount": "Não tem uma conta?",
                "signUp": "Cadastre-se"
            },
            "dashboard": {
                "welcome": "Seja bem vindo",
                "musician": "Músico",
                "search": "Buscar",
                "createNewSong": "Criar Nova Música",
                "addToCollection": "Adicione à sua coleção",
                "recentSongs": "Músicas Recentes",
                "seeAll": "Ver tudo",
                "noSongs": "Nenhuma música ainda. Crie uma!",
                "mySetlists": "Meus Setlists",
                "new": "Novo",
                "songs": "Músicas",
                "cancel": "Cancelar",
                "create": "Criar",
                "setlistNamePlaceholder": "Nome do Setlist (ex: Casamento)",
                "deleteConfirmation": "Excluir este setlist?",
                "continuousScroll": "Rolagem Contínua",
                "continuousScrollDesc": "Inicia a rolagem da próxima música automaticamente ao fim da anterior",
                "addToSetlist": "Adicionar ao Setlist",
                "noSetlistsYet": "Nenhum setlist criado ainda.",
                "songOf": "Música {{index}} de {{total}}",
                "nav": {
                    "dashboard": "Início",
                    "library": "Biblioteca",
                    "tuner": "Afinador",
                    "metronome": "Metrônomo",
                    "settings": "Ajustes"
                }
            },
            "editor": {
                "editSong": "Editar Música",
                "addSong": "Adicionar Música",
                "cancel": "Cancelar",
                "save": "Salvar",
                "title": "Título",
                "titlePlaceholder": "ex: Wonderwall",
                "artist": "Artista",
                "artistPlaceholder": "ex: Oasis",
                "genre": "Gênero",
                "selectGenre": "Selecione...",
                "key": "Tom",
                "lyricsChords": "Letra e Cifras",
                "autoFormat": "Auto-Formatar",
                "contentPlaceholder": "Cole sua música aqui...\n\n[Em]                 [G]\nToday is gonna be the day\n                [D]            [A]\nThat they're gonna throw it back to you",
                "deleteSong": "Excluir Música",
                "deleteConfirm": "Tem certeza que deseja apagar PERMANENTEMENTE esta música? Isso não pode ser desfeito.",
                "validationError": "Por favor, preencha pelo menos o Título e a Letra.",
                "endOfSong": "Fim da Música"
            },
            "library": {
                "title": "Biblioteca",
                "songsCount": "{{count}} Músicas",
                "searchPlaceholder": "Buscar músicas, artistas, letras...",
                "noSongsYet": "Nenhuma música ainda",
                "startBuilding": "Comece a construir seu repertório adicionando sua primeira música.",
                "addSong": "Nova Música",
                "noMatches": "Nenhum resultado para \"{{query}}\""
            },
            "tuner": {
                "title": "Afinador de Instrumentos",
                "start": "Iniciar Afinador",
                "stop": "Parar Afinador",
                "allowMic": "Por favor, permita o acesso ao microfone para usar o afinador.",
                "micPermissionError": "Acesso ao microfone negado. Verifique as configurações do navegador.",
                "autoMode": "Automático",
                "manualMode": "Manual",
                "playTone": "Ouvir Tom",
                "stopTone": "Parar Tom",
                "instrument": "Instrumento",
                "guitar": "Violão",
                "ukulele": "Ukulele",
                "bass": "Baixo (4 Cordas)",
                "violin": "Violino",
                "inTune": "Afinado!",
                "flat": "Abaixo",
                "sharp": "Acima"
            },
            "metronome": {
                "title": "Metrônomo",
                "start": "Iniciar",
                "stop": "Parar",
                "bpm": "BPM",
                "tempo": "Tempo",
                "timeSignature": "Compasso",
                "mute": "Silenciar",
                "sound": "Som",
                "tapTempo": "Tap Tempo"
            }
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false // react already safes from xss
        }
    });

export default i18n;
