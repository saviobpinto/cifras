
// Mapping of genres to visual assets (gradients and icons)
const GENRE_ASSETS = {
    'Rock': { gradient: 'from-red-900 to-slate-900', icon: 'electric_guitar' }, // hypothetical icon, fallback to music_note if not exists. using generic mat symbols
    'Pop': { gradient: 'from-pink-500 to-purple-600', icon: 'star' },
    'Hip-Hop': { gradient: 'from-yellow-400 to-orange-500', icon: 'mic' },
    'Rap': { gradient: 'from-orange-600 to-red-600', icon: 'mic_external_on' },
    'R&B': { gradient: 'from-purple-700 to-indigo-900', icon: 'piano' },
    'Soul': { gradient: 'from-rose-400 to-orange-300', icon: 'favorite' },
    'Funk': { gradient: 'from-fuchsia-600 to-purple-600', icon: 'speaker' },
    'Jazz': { gradient: 'from-slate-800 to-yellow-700', icon: 'piano' }, // Saxophone not always avail, piano is safe
    'Blues': { gradient: 'from-blue-900 to-slate-800', icon: 'music_note' },
    'Classical': { gradient: 'from-slate-700 to-slate-500', icon: 'history_edu' }, // Classic feel
    'Opera': { gradient: 'from-red-800 to-yellow-900', icon: 'theater_comedy' },
    'Country': { gradient: 'from-amber-700 to-yellow-600', icon: 'landscape' }, // Acoustic feel
    'Folk': { gradient: 'from-emerald-700 to-teal-600', icon: 'forest' },
    'Electronic': { gradient: 'from-cyan-500 to-blue-600', icon: 'settings_input_component' },
    'House': { gradient: 'from-violet-600 to-indigo-600', icon: 'house' },
    'Techno': { gradient: 'from-slate-900 to-green-500', icon: 'memory' },
    'Trance': { gradient: 'from-blue-400 to-purple-500', icon: 'waves' },
    'Reggae': { gradient: 'from-green-600 to-yellow-500', icon: 'sunny' },
    'Ska': { gradient: 'from-yellow-400 to-black', icon: 'grid_view' }, // Checkered pattern vibes? Gradient is hard for patterns
    'Metal': { gradient: 'from-slate-900 to-red-900', icon: 'skull' }, // Skull might not exist, maybe 'warning' or 'flash_on'
    'Punk': { gradient: 'from-rose-600 to-slate-900', icon: 'flash_on' },
    'Gospel': { gradient: 'from-blue-300 to-white', icon: 'church' },
    'Latin': { gradient: 'from-red-600 to-yellow-500', icon: 'local_fire_department' },
    'Afrobeat': { gradient: 'from-orange-700 to-green-700', icon: 'public' },
    'World': { gradient: 'from-teal-600 to-lime-600', icon: 'public' },
    'Ambient': { gradient: 'from-slate-300 to-blue-200', icon: 'cloud' },
    'Industrial': { gradient: 'from-slate-600 to-stone-700', icon: 'factory' },
    'Soundtrack': { gradient: 'from-purple-900 to-slate-900', icon: 'movie' },
    'Disco': { gradient: 'from-pink-500 to-yellow-500', icon: 'light_mode' }, // Disco ball vibe
    'Dance': { gradient: 'from-indigo-500 to-purple-500', icon: 'celebration' },
    'Trap': { gradient: 'from-slate-900 to-indigo-500', icon: 'graphic_eq' },
    'Grime': { gradient: 'from-stone-800 to-slate-600', icon: 'mic_none' },
    'Flamenco': { gradient: 'from-red-700 to-orange-600', icon: 'palette' },
    'Salsa': { gradient: 'from-red-500 to-orange-500', icon: 'local_bar' },
    'Samba': { gradient: 'from-green-500 to-yellow-400', icon: 'celebration' },
    'K-pop': { gradient: 'from-pink-400 to-cyan-400', icon: 'favorite' },
    'J-pop': { gradient: 'from-red-400 to-pink-300', icon: 'star_half' },
    'Indie': { gradient: 'from-lime-600 to-emerald-600', icon: 'nature_people' },
    'Alternative': { gradient: 'from-stone-600 to-stone-400', icon: 'adjust' },
    'Experimental': { gradient: 'from-fuchsia-800 to-slate-900', icon: 'science' },
    'MPB': { gradient: 'from-green-600 to-yellow-400', icon: 'queue_music' }, // Brazil colors
};

const DEFAULT_ASSET = { gradient: 'from-slate-700 to-slate-900', icon: 'music_note' };

export function getGenreAsset(genre) {
    if (!genre) return DEFAULT_ASSET;
    return GENRE_ASSETS[genre] || DEFAULT_ASSET;
}
