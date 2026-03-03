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
                "edit": "Edit"
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
                "nav": {
                    "dashboard": "Dashboard",
                    "library": "Library",
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
                "edit": "Editar"
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
                "nav": {
                    "dashboard": "Início",
                    "library": "Biblioteca",
                    "settings": "Configurações"
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
