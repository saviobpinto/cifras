import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useSongs } from '../contexts/SongContext';
import { useAuth } from '../contexts/AuthContext';

const calculateSetlistDuration = (setlist, allSongs) => {
    let totalSeconds = 0;
    setlist.songs.forEach(songId => {
        const song = allSongs.find(s => s.id === songId);
        if (song && song.content) {
            const numLines = song.content.split('\n').length;
            const fontSize = song.fontSize || 14;
            const scrollSpeed = song.scrollSpeed || 1;
            
            let pauseSeconds = 0;
            const pauseMatches = song.content.match(/P\{(\d+)\}/g);
            if (pauseMatches) {
                pauseMatches.forEach(m => {
                    const sec = parseInt(m.match(/\d+/)[0], 10);
                    if (!isNaN(sec)) pauseSeconds += sec;
                });
            }

            const estimatedHeight = (numLines * fontSize * 1.5) + 400; 
            const speedPxPerSec = 20 * scrollSpeed;
            
            totalSeconds += (estimatedHeight / speedPxPerSec) + pauseSeconds;
        }
    });
    
    if (totalSeconds === 0) return '0m';
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.ceil((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};

function Dashboard() {
    const { t } = useTranslation();
    const { songs, setlists, setCurrentSong, addSetlist, deleteSetlist, reorderSetlists } = useSongs();
    const { user, isOfflineMode, isPremium } = useAuth();
    const navigate = useNavigate();
    const [showHelpModal, setShowHelpModal] = useState(false);

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        if (sourceIndex === destinationIndex) return;

        const newSetlistOrder = Array.from(setlists);
        const [removed] = newSetlistOrder.splice(sourceIndex, 1);
        newSetlistOrder.splice(destinationIndex, 0, removed);

        reorderSetlists(newSetlistOrder);
    };

    const displayName = isOfflineMode 
        ? t('dashboard.musician') 
        : (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || t('dashboard.musician'));
        
    const avatarUrl = !isOfflineMode && (user?.user_metadata?.avatar_url || user?.user_metadata?.picture);
    const [isCreatingSetlist, setIsCreatingSetlist] = useState(false);
    const [newSetlistTitle, setNewSetlistTitle] = useState('');

    const handleOpenSong = (song) => {
        setCurrentSong(song);
        navigate(`/song/viewer?id=${song.id}`);
    };

    const handleCreateSetlist = (e) => {
        e.preventDefault();
        if (!newSetlistTitle.trim()) return;

        addSetlist(newSetlistTitle);
        setNewSetlistTitle('');
        setIsCreatingSetlist(false);
    };


    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased selection:bg-primary selection:text-white min-h-screen flex flex-col">
            <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-24">
                {/* Header */}
                <header className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={displayName} className="rounded-full size-10 border-2 border-primary object-cover" />
                            ) : (
                                <div className="flex items-center justify-center rounded-full size-10 border-2 border-primary bg-primary/10 text-primary font-bold text-sm">
                                    <span className="material-symbols-outlined text-[20px]">person</span>
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-none mb-1">{t('dashboard.welcome')},</p>
                                <h2 className="text-lg font-bold leading-none text-slate-900 dark:text-white">{displayName}</h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {!isPremium && (
                                <button onClick={() => navigate('/settings')} className="mr-1 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all active:scale-95 shadow-sm shadow-amber-500/20">
                                    <span className="material-symbols-outlined text-[12px] font-bold fill-1">workspace_premium</span>
                                    Premium
                                </button>
                            )}
                            <button onClick={() => navigate('/library')} className="flex items-center justify-center size-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
                                <span className="material-symbols-outlined">search</span>
                            </button>
                            <button onClick={() => setShowHelpModal(true)} className="flex items-center justify-center size-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
                                <span className="material-symbols-outlined">help</span>
                            </button>
                        </div>
                    </div>
                </header>
                {/* Main Content */}
                <main className="flex-1 flex flex-col gap-6 px-4 pt-6">
                    {/* Hero Action: Quick Create */}
                    <section>
                        <Link to="/song/new" className="w-full block group relative overflow-hidden rounded-xl bg-primary p-6 text-left shadow-lg shadow-primary/20 transition-transform active:scale-[0.98]">
                            <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12">
                                <span className="material-symbols-outlined text-[140px] text-white">playlist_add</span>
                            </div>
                            <div className="relative z-10 flex flex-col items-start gap-2">
                                <div className="rounded-full bg-white/20 p-2 text-white mb-2 backdrop-blur-sm">
                                    <span className="material-symbols-outlined block">add</span>
                                </div>
                                <h3 className="text-xl font-bold text-white">{t('dashboard.createNewSong')}</h3>
                                <p className="text-sm text-blue-100 font-medium">{t('dashboard.addToCollection')}</p>
                            </div>
                        </Link>
                    </section>

                    {/* My Setlists List */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('dashboard.mySetlists')}</h2>
                            {isCreatingSetlist ? (
                                <button onClick={() => setIsCreatingSetlist(false)} className="text-sm font-medium text-slate-500 hover:text-red-500">{t('dashboard.cancel')}</button>
                            ) : (
                                <button onClick={() => setIsCreatingSetlist(true)} className="flex items-center gap-1 text-sm font-semibold text-primary hover:text-blue-400">
                                    <span className="material-symbols-outlined text-[18px]">add</span> {t('dashboard.new')}
                                </button>
                            )}
                        </div>

                        {/* Inline Create Form */}
                        {isCreatingSetlist && (
                            <form onSubmit={handleCreateSetlist} className="mb-4 p-3 bg-white dark:bg-surface-dark rounded-xl border border-primary ring-1 ring-primary/20 animate-in fade-in slide-in-from-top-2">
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder={t('dashboard.setlistNamePlaceholder')}
                                    className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 outline-none font-bold mb-2"
                                    value={newSetlistTitle}
                                    onChange={(e) => setNewSetlistTitle(e.target.value)}
                                />
                                <div className="flex justify-end">
                                    <button type="submit" disabled={!newSetlistTitle.trim()} className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-bold disabled:opacity-50">{t('dashboard.create')}</button>
                                </div>
                            </form>
                        )}

                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="setlists-list">
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="flex flex-col gap-3"
                                    >
                                        {setlists.map((setlist, index) => (
                                            <Draggable key={setlist.id} draggableId={setlist.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        style={provided.draggableProps.style}
                                                        className={`group flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-surface-dark border ${snapshot.isDragging ? 'border-primary shadow-lg scale-105 z-50' : 'border-slate-200 dark:border-slate-800'} active:border-primary dark:active:border-primary transition-all relative`}
                                                    >
                                                        {/* Drag Handle */}
                                                        <div {...provided.dragHandleProps} className="text-slate-300 cursor-grab active:cursor-grabbing p-1 -ml-2">
                                                            <span className="material-symbols-outlined">drag_indicator</span>
                                                        </div>

                                                        {/* Clickable Card Content */}
                                                        <div className="flex-1 min-w-0 px-1 cursor-pointer" onClick={() => navigate(`/setlist/${setlist.id}`)}>
                                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{setlist.title}</h4>
                                                            <div className="flex items-center gap-3 mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                                <span className="flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-[12px]">music_note</span> {setlist.songs.length} {t('dashboard.songs')}
                                                                </span>
                                                                <span className="flex items-center gap-1 ml-2">
                                                                    <span className="material-symbols-outlined text-[12px]">schedule</span> {calculateSetlistDuration(setlist, songs)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Delete Action */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (confirm(t('dashboard.deleteConfirmation'))) deleteSetlist(setlist.id);
                                                            }}
                                                            className="p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                                                        >
                                                            <span className="material-symbols-outlined">delete</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </section>
                </main>
                {/* Bottom Navigation Bar */}
                <nav className="fixed bottom-0 w-full z-30 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#192233]/95 backdrop-blur-lg px-6 pb-6 pt-3">
                    <div className="flex items-center justify-between max-w-md mx-auto">
                        <NavLink to="/dashboard" className={({ isActive }) => `flex flex-1 flex-col items-center justify-end gap-1 ${isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'} transition-colors`}>
                            <span className={`material-symbols-outlined text-[28px] ${true ? 'filled' : ''}`}>dashboard</span>
                            <span className="text-[10px] font-bold tracking-wide">{t('dashboard.nav.dashboard')}</span>
                        </NavLink>
                        <NavLink to="/library" className="flex flex-1 flex-col items-center justify-end gap-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                            <span className="material-symbols-outlined text-[28px]">library_music</span>
                            <span className="text-[10px] font-medium tracking-wide">{t('dashboard.nav.library')}</span>
                        </NavLink>
                        <NavLink to="/tuner" className="flex flex-1 flex-col items-center justify-end gap-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                            <span className="material-symbols-outlined text-[28px]">tune</span>
                            <span className="text-[10px] font-medium tracking-wide">{t('dashboard.nav.tuner')}</span>
                        </NavLink>
                        <NavLink to="/metronome" className="flex flex-1 flex-col items-center justify-end gap-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                            <span className="material-symbols-outlined text-[28px]">av_timer</span>
                            <span className="text-[10px] font-medium tracking-wide">{t('dashboard.nav.metronome')}</span>
                        </NavLink>
                        <NavLink to="/settings" className="flex flex-1 flex-col items-center justify-end gap-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                            <span className="material-symbols-outlined text-[28px]">settings</span>
                            <span className="text-[10px] font-medium tracking-wide">{t('dashboard.nav.settings')}</span>
                        </NavLink>
                    </div>
                </nav>
                {/* Help PWA Modal */}
                {showHelpModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 text-left border border-slate-200 dark:border-slate-800">
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                                <h3 className="font-extrabold text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                                    <span className="material-symbols-outlined text-primary">install_mobile</span>
                                    Usar como App Nativo
                                </h3>
                                <button onClick={() => setShowHelpModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            
                            <div className="p-5 space-y-5 text-sm overflow-y-auto max-h-[70vh]">
                                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    O **Meu Setlist** é um Progressive Web App (PWA). Você pode instalá-lo no celular sem precisar de lojas de aplicativos. Ele funcionará offline e com tela cheia.
                                </p>

                                <div className="space-y-3">
                                    <h4 className="font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[18px] text-indigo-500">phone_iphone</span>
                                        No iPhone & iPad (Safari)
                                    </h4>
                                    <ol className="list-decimal list-inside space-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                        <li>Abra o site no navegador **Safari**.</li>
                                        <li>Toque no botão de **Compartilhar** <span className="material-symbols-outlined text-[14px] align-middle">share</span> (quadrado com seta para cima).</li>
                                        <li>Role para baixo e selecione **"Adicionar à Tela de Início"** <span className="material-symbols-outlined text-[14px] align-middle">add_box</span>.</li>
                                        <li>Toque em **"Adicionar"** no canto superior direito.</li>
                                    </ol>
                                </div>

                                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                                    <h4 className="font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[18px] text-emerald-500">phone_android</span>
                                        No Android (Chrome)
                                    </h4>
                                    <ol className="list-decimal list-inside space-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                        <li>Abra o site no navegador **Chrome**.</li>
                                        <li>Toque nos **três pontinhos** <span className="material-symbols-outlined text-[14px] align-middle">more_vert</span> no canto superior direito.</li>
                                        <li>Toque em **"Instalar aplicativo"** ou **"Adicionar à tela inicial"** <span className="material-symbols-outlined text-[14px] align-middle">install_mobile</span>.</li>
                                        <li>Confirme a instalação na tela seguinte.</li>
                                    </ol>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-black/20 text-right border-t border-slate-100 dark:border-slate-800/60">
                                <button 
                                    onClick={() => setShowHelpModal(false)} 
                                    className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-extrabold shadow"
                                >
                                    Entendi
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
