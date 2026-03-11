import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useSongs } from '../contexts/SongContext';
import { formatChords } from '../lib/music';

const ALL_KEYS = [
    'C', 'Cm', 'C#', 'C#m', 'Db', 'Dbm', 'D', 'Dm', 'D#', 'D#m', 'Eb', 'Ebm',
    'E', 'Em', 'F', 'Fm', 'F#', 'F#m', 'Gb', 'Gbm', 'G', 'Gm', 'G#', 'G#m', 'Ab', 'Abm',
    'A', 'Am', 'A#', 'A#m', 'Bb', 'Bbm', 'B', 'Bm'
];

const GENRES = [
    'Afrobeat', 'Alternative', 'Ambient', 'Blues', 'Classical', 'Country', 'Dance', 'Disco',
    'Electronic', 'Experimental', 'Flamenco', 'Folk', 'Funk', 'Gospel', 'Grime', 'Hip-Hop',
    'House', 'Indie', 'Industrial', 'J-pop', 'Jazz', 'K-pop', 'Latin', 'Metal', 'MPB', 'Opera',
    'Pop', 'Punk', 'R&B', 'Rap', 'Reggae', 'Rock', 'Salsa', 'Samba', 'Ska', 'Soul',
    'Soundtrack', 'Techno', 'Trance', 'Trap', 'World'
];

function SongEditor() {
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID from URL if editing
    const [searchParams] = useSearchParams();
    const setlistId = searchParams.get('setlistId');
    const { addSong, updateSong, deleteSong, getSong } = useSongs();
    const { t } = useTranslation();
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        title: '',
        artist: '',
        genre: '',
        key: '',
        content: ''
    });

    const isEditing = !!id;

    useEffect(() => {
        if (isEditing) {
            const songToEdit = getSong(id);
            if (songToEdit) {
                setFormData({
                    title: songToEdit.title,
                    artist: songToEdit.artist,
                    genre: songToEdit.genre || '',
                    key: songToEdit.key || '',
                    content: songToEdit.content
                });
            }
        }
    }, [id, getSong, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        if (!formData.title || !formData.content) {
            alert(t('editor.validationError'));
            return;
        }

        const dataToSave = { ...formData };
        if (isEditing) {
            const originalSong = getSong(id);
            if (originalSong.key !== formData.key) {
                dataToSave.transposition = 0; // Reset transposition if base key changes
            }
            updateSong(id, dataToSave);
            // After saving, go back to the viewer for this song, preserving setlist context
            navigate(`/song/viewer?id=${id}${setlistId ? `&setlistId=${setlistId}` : ''}`);
        } else {
            addSong(dataToSave);
            // For new songs, if we came from no particular context, library is a good default
            navigate('/library');
        }
    };

    const insertTextToContent = (text) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        const val = formData.content;
        const newVal = val.substring(0, start) + text + val.substring(end);

        setFormData(prev => ({ ...prev, content: newVal }));

        setTimeout(() => {
            textarea.focus();
            if (text === '[]') {
                textarea.setSelectionRange(start + 1, start + 1);
            } else {
                textarea.setSelectionRange(start + text.length, start + text.length);
            }
        }, 0);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target.result;
            const fileName = file.name.replace(/\.[^/.]+$/, "");

            setFormData(prev => ({
                ...prev,
                content: result,
                title: prev.title || fileName
            }));
        };
        reader.readAsText(file);
        e.target.value = null;
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased overflow-hidden h-screen flex flex-col">
            {/* Top Navigation Bar */}
            <header className="flex-none bg-surface-dark/80 backdrop-blur-md border-b border-border-dark dark:border-border-dark/50 pt-12 pb-3 px-4 flex items-center justify-between z-20 sticky top-0">
                <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white text-base font-medium transition-colors">{t('editor.cancel')}</button>
                <h1 className="text-lg font-bold tracking-tight">{isEditing ? t('editor.editSong') : t('editor.addSong')}</h1>
                <button onClick={handleSave} className="text-primary font-bold text-base hover:text-primary-light transition-colors">{t('editor.save')}</button>
            </header>
            {/* Main Scrollable Content */}
            <main className="flex-1 overflow-y-auto no-scrollbar">
                <div className="px-4 py-6 space-y-6 max-w-lg mx-auto pb-24">
                    {/* Metadata Section */}
                    <div className="space-y-4">
                        {/* Song Title */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-400 ml-1">{t('editor.title')}</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                    <span className="material-symbols-outlined text-[20px]">music_note</span>
                                </div>
                                <input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full bg-surface-dark dark:bg-surface-dark border border-border-dark dark:border-border-dark rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                    placeholder={t('editor.titlePlaceholder')}
                                    type="text"
                                />
                            </div>
                        </div>
                        {/* Artist */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-400 ml-1">{t('editor.artist')}</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                    <span className="material-symbols-outlined text-[20px]">person</span>
                                </div>
                                <input
                                    name="artist"
                                    value={formData.artist}
                                    onChange={handleChange}
                                    className="w-full bg-surface-dark dark:bg-surface-dark border border-border-dark dark:border-border-dark rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                    placeholder={t('editor.artistPlaceholder')}
                                    type="text"
                                />
                            </div>
                        </div>
                        {/* Genre & Key Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-400 ml-1">{t('editor.genre')}</label>
                                <div className="relative">
                                    <select
                                        name="genre"
                                        value={formData.genre}
                                        onChange={handleChange}
                                        className="w-full bg-surface-dark dark:bg-surface-dark border border-border-dark dark:border-border-dark rounded-xl py-3 pl-3 pr-10 text-white focus:ring-2 focus:ring-primary focus:border-transparent appearance-none outline-none"
                                    >
                                        <option disabled value="">{t('editor.selectGenre')}</option>
                                        {GENRES.map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                                        <span className="material-symbols-outlined text-[20px]">expand_more</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-400 ml-1">{t('editor.key')}</label>
                                <div className="relative">
                                    <select
                                        name="key"
                                        value={formData.key}
                                        onChange={handleChange}
                                        className="w-full bg-surface-dark dark:bg-surface-dark border border-border-dark dark:border-border-dark rounded-xl py-3 pl-3 pr-10 text-white focus:ring-2 focus:ring-primary focus:border-transparent appearance-none outline-none"
                                    >
                                        <option disabled value="">{t('editor.key')}</option>
                                        {ALL_KEYS.map(k => (
                                            <option key={k} value={k}>{k}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                                        <span className="material-symbols-outlined text-[20px]">expand_more</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Editor Section */}
                    <div className="space-y-2 flex-1 flex flex-col min-h-[400px]">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-sm font-medium text-slate-400">{t('editor.lyricsChords')}</label>
                            <button
                                onClick={() => setFormData(p => ({ ...p, content: formatChords(p.content) }))}
                                className="text-xs text-primary font-bold hover:text-primary-light flex items-center gap-1 bg-primary/10 px-2 py-1 rounded"
                            >
                                <span className="material-symbols-outlined text-[14px]">auto_fix</span> {t('editor.autoFormat')}
                            </button>
                        </div>
                        <div className="relative flex-1 flex flex-col">
                            <textarea
                                ref={textareaRef}
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                className="flex-1 w-full h-full min-h-[400px] bg-surface-darker border border-border-dark dark:border-border-dark rounded-xl p-4 text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-mono text-base leading-relaxed resize-none"
                                placeholder={t('editor.contentPlaceholder')}
                            ></textarea>
                            {/* Floating Quick Action for empty state */}
                            <div className="absolute bottom-4 right-4">
                                <button onClick={() => fileInputRef.current?.click()} aria-label="Import" className="bg-surface-dark border border-border-dark hover:border-primary/50 text-slate-300 shadow-lg hover:shadow-primary/10 rounded-full p-3 transition-all flex items-center justify-center group">
                                    <span className="material-symbols-outlined group-hover:text-primary transition-colors">upload_file</span>
                                </button>
                                <input
                                    type="file"
                                    accept=".txt,.cifra,.md,.rtf"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Delete Section */}
                    {isEditing && (
                        <div className="pt-6 border-t border-border-dark">
                            <button
                                onClick={() => {
                                    if (confirm(t('editor.deleteConfirm'))) {
                                        deleteSong(id);
                                        // Redirect based on whether we were in a setlist or just library
                                        if (setlistId) {
                                            navigate(`/setlist/${setlistId}`);
                                        } else {
                                            navigate('/library');
                                        }
                                    }
                                }}
                                className="w-full py-3 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 font-bold transition-colors"
                            >
                                {t('editor.deleteSong')}
                            </button>
                        </div>
                    )}
                </div>
            </main>
            {/* Editor Toolbar (Sticky Bottom) */}
            <div className="flex-none bg-surface-dark border-t border-border-dark z-30 pb-safe">
                {/* Scrollable Toolbar */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 py-3">
                    <button
                        onMouseDown={(e) => { e.preventDefault(); insertTextToContent('[]'); }}
                        className="flex-shrink-0 h-10 px-4 bg-surface-darker hover:bg-slate-800 border border-border-dark rounded-lg text-slate-300 font-mono font-medium text-sm transition-colors flex items-center justify-center"
                    >
                        [ ]
                    </button>
                    <div className="w-px h-6 bg-border-dark mx-1 flex-shrink-0"></div>
                    <button
                        onMouseDown={(e) => { e.preventDefault(); insertTextToContent('#'); }}
                        aria-label="Sharp"
                        className="flex-shrink-0 h-10 w-10 bg-surface-darker hover:bg-slate-800 border border-border-dark rounded-lg text-slate-300 transition-colors flex items-center justify-center"
                    >
                        <span className="font-bold text-lg">♯</span>
                    </button>
                    <button
                        onMouseDown={(e) => { e.preventDefault(); insertTextToContent('b'); }}
                        aria-label="Flat"
                        className="flex-shrink-0 h-10 w-10 bg-surface-darker hover:bg-slate-800 border border-border-dark rounded-lg text-slate-300 transition-colors flex items-center justify-center"
                    >
                        <span className="font-bold text-lg">♭</span>
                    </button>
                    <button
                        onMouseDown={(e) => { e.preventDefault(); insertTextToContent('P{10}'); }}
                        aria-label="Pause"
                        className="flex-shrink-0 h-10 px-3 bg-surface-darker hover:bg-slate-800 border border-border-dark rounded-lg text-slate-300 transition-colors flex items-center justify-center"
                    >
                        <span className="font-bold text-sm">Pause</span>
                    </button>
                    <div className="w-px h-6 bg-border-dark mx-1 flex-shrink-0"></div>
                    {/* ... other helper buttons */}
                </div>
                {/* Safe area spacing for iOS home indicator */}
                <div className="h-6 w-full bg-surface-dark"></div>
            </div>
        </div>
    );
}

export default SongEditor;
