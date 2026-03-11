import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useSongs } from '../contexts/SongContext';
import { transposeNote } from '../lib/music';

function SetlistDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setlists, songs, reorderSetlist, deleteSetlist, removeFromSetlist, setCurrentSong, updateSetlist } = useSongs();

    useEffect(() => {
        const savedScroll = sessionStorage.getItem(`setlist-scroll-${id}`);
        if (savedScroll) {
            window.scrollTo(0, parseInt(savedScroll, 10));
        }
    }, [id]);

    const setlist = setlists.find(s => s.id === id);

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [newTitle, setNewTitle] = useState('');

    const handleEditTitle = () => {
        setNewTitle(setlist.title);
        setIsEditingTitle(true);
    };

    const handleSaveTitle = () => {
        if (newTitle.trim()) {
            updateSetlist(setlist.id, newTitle.trim());
        }
        setIsEditingTitle(false);
    };

    console.log('SetlistDetail Debug:', { id, setlist, allSongs: songs });

    if (!setlist) {
        return <div className="p-10 text-center">Setlist not found</div>;
    }

    // Get full song objects, filtering out any that might have been deleted
    const setlistSongs = setlist.songs
        .map(songId => {
            const found = songs.find(s => s.id === songId);
            if (!found) console.warn('Song not found for ID:', songId);
            return found;
        })
        .filter(Boolean);

    console.log('Mapped Setlist Songs:', setlistSongs);

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        if (sourceIndex === destinationIndex) return;

        const newSongOrder = Array.from(setlist.songs);
        const [removed] = newSongOrder.splice(sourceIndex, 1);
        newSongOrder.splice(destinationIndex, 0, removed);

        reorderSetlist(setlist.id, newSongOrder);
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this setlist?')) {
            deleteSetlist(setlist.id);
            navigate('/dashboard');
        }
    };

    const handlePlaySong = (song) => {
        sessionStorage.setItem(`setlist-scroll-${id}`, window.scrollY.toString());
        setCurrentSong(song);
        navigate(`/song/viewer?id=${song.id}&setlistId=${setlist.id}`, { state: { from: `/setlist/${id}` } });
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col antialiased">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-4">
                <button onClick={() => navigate('/dashboard')} className="flex items-center justify-center size-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex-1">
                    {isEditingTitle ? (
                        <div className="flex items-center gap-2 mb-1">
                            <input
                                type="text"
                                autoFocus
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                                className="bg-white dark:bg-slate-800 border border-primary text-slate-900 dark:text-white rounded px-2 py-1 flex-1 font-bold outline-none text-xl"
                            />
                            <button onClick={handleSaveTitle} className="text-primary hover:text-blue-500 flex items-center justify-center">
                                <span className="material-symbols-outlined">check</span>
                            </button>
                            <button onClick={() => setIsEditingTitle(false)} className="text-slate-500 hover:text-red-500 flex items-center justify-center">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 group">
                            <h1 className="text-xl font-bold">{setlist.title}</h1>
                            <button onClick={handleEditTitle} title="Rename Playlist" className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-primary flex items-center justify-center">
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                        </div>
                    )}
                    <p className="text-xs text-slate-500">{setlistSongs.length} Songs • {new Date(setlist.date).toLocaleDateString()}</p>
                </div>
                <button onClick={handleDelete} className="flex items-center justify-center size-10 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined">delete</span>
                </button>
            </header>

            <main className="flex-1 p-4 pb-24 max-w-2xl mx-auto w-full">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="setlist-songs">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="space-y-3"
                            >
                                {setlistSongs.map((song, index) => (
                                    <Draggable key={song.id} draggableId={song.id} index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`group flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-surface-dark border ${snapshot.isDragging ? 'border-primary shadow-lg scale-105 z-50' : 'border-slate-200 dark:border-slate-800'} transition-all`}
                                                style={provided.draggableProps.style}
                                            >
                                                {/* Drag Handle */}
                                                <div {...provided.dragHandleProps} className="text-slate-300 cursor-grab active:cursor-grabbing p-1">
                                                    <span className="material-symbols-outlined">drag_indicator</span>
                                                </div>


                                                {/* Song Info (Clickable to Play) */}
                                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handlePlaySong(song)}>
                                                    <h4 className="text-sm font-semibold truncate text-slate-900 dark:text-white">{song.title}</h4>
                                                    <p className="text-xs text-slate-500">{song.artist}</p>
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm(`Remove "${song.title}" from this setlist?`)) {
                                                            removeFromSetlist(setlist.id, song.id);
                                                        }
                                                    }}
                                                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                    title="Remove from setlist"
                                                >
                                                    <span className="material-symbols-outlined">remove_circle_outline</span>
                                                </button>

                                                <div className="text-xs font-mono text-slate-400">
                                                    {index + 1}
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                {setlistSongs.length === 0 && (
                    <div className="text-center py-10 text-slate-500">
                        <span className="material-symbols-outlined text-4xl mb-2 opacity-50">playlist_add</span>
                        <p>This setlist is empty.</p>
                        <p className="text-sm">Go to a song and click the playlist icon to add it here.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default SetlistDetail;
