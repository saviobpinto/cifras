import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Instrument configurations
const INSTRUMENTS = [
    {
        id: 'guitar',
        nameKey: 'tuner.guitar',
        icon: 'music_note',
        strings: [
            { label: '6E', note: 'E', frequency: 82.41, midi: 40 },
            { label: '5A', note: 'A', frequency: 110.00, midi: 45 },
            { label: '4D', note: 'D', frequency: 146.83, midi: 50 },
            { label: '3G', note: 'G', frequency: 196.00, midi: 55 },
            { label: '2B', note: 'B', frequency: 246.94, midi: 59 },
            { label: '1E', note: 'E', frequency: 329.63, midi: 64 }
        ].reverse() // Order strings: 1E (top/high) to 6E (bottom/low)
    },
    {
        id: 'ukulele',
        nameKey: 'tuner.ukulele',
        icon: 'filter_hdr', // Represents mini stringed
        strings: [
            { label: '4G', note: 'G', frequency: 392.00, midi: 67 },
            { label: '3C', note: 'C', frequency: 261.63, midi: 60 },
            { label: '2E', note: 'E', frequency: 329.63, midi: 64 },
            { label: '1A', note: 'A', frequency: 440.00, midi: 69 }
        ].reverse()
    },
    {
        id: 'bass',
        nameKey: 'tuner.bass',
        icon: 'speaker',
        strings: [
            { label: '4E', note: 'E', frequency: 41.20, midi: 28 },
            { label: '3A', note: 'A', frequency: 55.00, midi: 33 },
            { label: '2D', note: 'D', frequency: 73.42, midi: 38 },
            { label: '1G', note: 'G', frequency: 98.00, midi: 43 }
        ].reverse()
    },
    {
        id: 'violin',
        nameKey: 'tuner.violin',
        icon: 'gesture',
        strings: [
            { label: '4G', note: 'G', frequency: 196.00, midi: 55 },
            { label: '3D', note: 'D', frequency: 293.66, midi: 62 },
            { label: '2A', note: 'A', frequency: 440.00, midi: 69 },
            { label: '1E', note: 'E', frequency: 659.25, midi: 76 }
        ].reverse()
    }
];

// Note name lists
const NOTE_NAMES_EN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_NAMES_PT = ['Dó', 'Dó#', 'Ré', 'Ré#', 'Mi', 'Fá', 'Fá#', 'Sol', 'Sol#', 'Lá', 'Lá#', 'Si'];

function Tuner() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isPt = i18n.language.startsWith('pt');
    const noteNames = isPt ? NOTE_NAMES_PT : NOTE_NAMES_EN;

    // App state
    const [selectedInstrument, setSelectedInstrument] = useState(INSTRUMENTS[0]);
    const [isActive, setIsActive] = useState(false);
    const [isAutoMode, setIsAutoMode] = useState(true);
    const [selectedStringIndex, setSelectedStringIndex] = useState(0); // For manual mode
    const [micError, setMicError] = useState(null);

    // Live tuning values
    const [detectedFreq, setDetectedFreq] = useState(0);
    const [detectedNote, setDetectedNote] = useState('-');
    const [centsDeviation, setCentsDeviation] = useState(0);
    const [isPlayToneActive, setIsPlayToneActive] = useState(false);

    // Audio Ref variables
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const streamRef = useRef(null);
    const animationFrameRef = useRef(null);
    const biquadFilterRef = useRef(null);

    // Tone Generator Refs
    const toneContextRef = useRef(null);
    const oscillatorRef = useRef(null);
    const gainNodeRef = useRef(null);

    // Safe cleanup on unmount
    useEffect(() => {
        return () => {
            stopAudio();
            stopTone();
        };
    }, []);

    // Change instrument -> reset string selection
    const handleInstrumentChange = (inst) => {
        setSelectedInstrument(inst);
        setSelectedStringIndex(0);
        stopTone();
    };

    // Toggle tuner capture
    const toggleTuner = () => {
        if (isActive) {
            stopAudio();
        } else {
            stopTone(); // Ensure oscillator stops
            startAudio();
        }
    };

    // Start Audio capture and pitch detection loop
    const startAudio = async () => {
        setMicError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                },
                video: false
            });

            streamRef.current = stream;
            
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;

            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 2048;
            analyserRef.current = analyser;

            // Low-pass filter to clean up high-frequency harmonics (especially for guitar fundamental frequency)
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            // Cut off around 800Hz to cover high E (329Hz) and violin high E (659Hz) but block high harmonics
            filter.frequency.setValueAtTime(800, audioCtx.currentTime);
            biquadFilterRef.current = filter;

            source.connect(filter);
            filter.connect(analyser);

            setIsActive(true);
            
            // Start detection loop
            const bufferLength = analyser.fftSize;
            const dataBuffer = new Float32Array(bufferLength);
            
            const detect = () => {
                if (!analyserRef.current) return;
                
                analyserRef.current.getFloatTimeDomainData(dataBuffer);
                const freq = autoCorrelate(dataBuffer, audioCtx.sampleRate);

                if (freq !== -1 && freq > 20 && freq < 2000) {
                    setDetectedFreq(freq);
                    processFrequency(freq);
                }
                
                animationFrameRef.current = requestAnimationFrame(detect);
            };

            detect();

        } catch (err) {
            console.error("Erro ao acessar microfone:", err);
            setMicError(t('tuner.micPermissionError'));
            setIsActive(false);
        }
    };

    const stopAudio = () => {
        setIsActive(false);
        setDetectedFreq(0);
        setDetectedNote('-');
        setCentsDeviation(0);

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        analyserRef.current = null;
        biquadFilterRef.current = null;
    };

    // Auto-correlation algorithm for pitch detection
    const autoCorrelate = (buffer, sampleRate) => {
        const SIZE = buffer.length;
        let sum = 0;
        for (let i = 0; i < SIZE; i++) {
            sum += buffer[i] * buffer[i];
        }
        
        const rms = Math.sqrt(sum / SIZE);
        if (rms < 0.008) { // Silence threshold
            return -1;
        }

        // Clip/trim the signal boundaries
        let r1 = 0;
        let r2 = SIZE - 1;
        const thres = 0.2;
        for (let i = 0; i < SIZE / 2; i++) {
            if (Math.abs(buffer[i]) < thres) {
                r1 = i;
                break;
            }
        }
        for (let i = SIZE - 1; i >= SIZE / 2; i--) {
            if (Math.abs(buffer[i]) < thres) {
                r2 = i;
                break;
            }
        }

        const sliced = buffer.slice(r1, r2);
        const len = sliced.length;

        // Autocorrelation
        const c = new Float32Array(len);
        for (let i = 0; i < len; i++) {
            for (let j = 0; j < len - i; j++) {
                c[i] = c[i] + sliced[j] * sliced[j + i];
            }
        }

        // Find the first peak
        let d = 0;
        while (c[d] > c[d + 1]) d++;
        let maxval = -1;
        let maxpos = -1;
        for (let i = d; i < len / 2; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }

        let T0 = maxpos;

        // Parabolic interpolation for high precision
        if (T0 > 0 && T0 < len - 1) {
            const x1 = c[T0 - 1];
            const x2 = c[T0];
            const x3 = c[T0 + 1];
            const a = (x1 + x3 - 2 * x2) / 2;
            const b = (x3 - x1) / 2;
            if (a !== 0) {
                T0 = T0 - b / (2 * a);
            }
            return sampleRate / T0;
        }

        return -1;
    };

    // Maps the frequency to note, cents deviation, etc.
    const processFrequency = (frequency) => {
        if (isAutoMode) {
            // AUTO MODE: Find the closest note out of all standard 12 semitones
            const n = 12 * Math.log2(frequency / 440) + 69;
            const midiNote = Math.round(n);
            const noteIndex = (midiNote % 12 + 12) % 12;
            const name = noteNames[noteIndex];
            
            const expectedFreq = 440 * Math.pow(2, (midiNote - 69) / 12);
            const cents = Math.round(1200 * Math.log2(frequency / expectedFreq));
            
            setDetectedNote(name);
            setCentsDeviation(cents);

            // Highlight the closest string of the current instrument if match
            const closestStringIdx = selectedInstrument.strings.reduce((closestIdx, currentString, idx) => {
                const prevDiff = Math.abs(selectedInstrument.strings[closestIdx].frequency - frequency);
                const currentDiff = Math.abs(currentString.frequency - frequency);
                return currentDiff < prevDiff ? idx : closestIdx;
            }, 0);
            
            setSelectedStringIndex(closestStringIdx);
        } else {
            // MANUAL MODE: Focussed on the selected string note
            const targetString = selectedInstrument.strings[selectedStringIndex];
            const targetFreq = targetString.frequency;
            
            const cents = Math.round(1200 * Math.log2(frequency / targetFreq));
            
            setDetectedNote(isPt ? getPtNoteName(targetString.note) : targetString.note);
            setCentsDeviation(cents);
        }
    };

    const getPtNoteName = (enNote) => {
        const enNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const ptNotes = ['Dó', 'Dó#', 'Ré', 'Ré#', 'Mi', 'Fá', 'Fá#', 'Sol', 'Sol#', 'Lá', 'Lá#', 'Si'];
        const idx = enNotes.indexOf(enNote.toUpperCase());
        return idx !== -1 ? ptNotes[idx] : enNote;
    };

    // Play/Stop Reference Tones
    const togglePlayTone = () => {
        if (isPlayToneActive) {
            stopTone();
        } else {
            stopAudio(); // Stop mic tuner if active
            startTone();
        }
    };

    const startTone = () => {
        stopTone();
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContextClass();
            toneContextRef.current = ctx;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            const targetFreq = selectedInstrument.strings[selectedStringIndex].frequency;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(targetFreq, ctx.currentTime);

            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1); // Volume ramp

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();

            oscillatorRef.current = osc;
            gainNodeRef.current = gain;
            setIsPlayToneActive(true);
        } catch (e) {
            console.error("Falha ao tocar som de referência:", e);
        }
    };

    const stopTone = () => {
        setIsPlayToneActive(false);
        if (gainNodeRef.current && toneContextRef.current) {
            try {
                gainNodeRef.current.gain.setValueAtTime(gainNodeRef.current.gain.value, toneContextRef.current.currentTime);
                gainNodeRef.current.gain.exponentialRampToValueAtTime(0.001, toneContextRef.current.currentTime + 0.15);
            } catch (e) {}
        }
        setTimeout(() => {
            if (oscillatorRef.current) {
                try { oscillatorRef.current.stop(); } catch (e) {}
                oscillatorRef.current = null;
            }
            if (toneContextRef.current && toneContextRef.current.state !== 'closed') {
                try { toneContextRef.current.close(); } catch (e) {}
                toneContextRef.current = null;
            }
            gainNodeRef.current = null;
        }, 160);
    };

    // Check if the current instrument matches detected note perfectly
    const isInTune = isActive && detectedNote !== '-' && Math.abs(centsDeviation) <= 3;
    
    // Convert cents deviation into needle rotation degree (-60 to +60)
    // Clamp cents between -50 and 50
    const clampedCents = Math.max(-50, Math.min(50, centsDeviation));
    const needleRotation = clampedCents * 1.2; 

    // Dynamic color coding for cents
    let needleColor = 'text-primary';
    let textColor = 'text-slate-900 dark:text-white';
    let ringColor = 'border-slate-200 dark:border-slate-800';
    let glowColor = 'shadow-none';

    if (isActive && detectedNote !== '-') {
        if (isInTune) {
            needleColor = 'text-emerald-500';
            textColor = 'text-emerald-500';
            ringColor = 'border-emerald-500';
            glowColor = 'shadow-[0_0_20px_rgba(16,185,129,0.3)] dark:shadow-[0_0_20px_rgba(16,185,129,0.15)]';
        } else if (centsDeviation < -3) {
            needleColor = 'text-amber-500';
            textColor = 'text-amber-500';
            ringColor = 'border-amber-500/50';
        } else {
            needleColor = 'text-rose-500';
            textColor = 'text-rose-500';
            ringColor = 'border-rose-500/50';
        }
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col antialiased">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="px-4 h-14 flex items-center justify-between">
                    <button onClick={() => navigate('/dashboard')} className="flex items-center text-primary active:opacity-70 transition-opacity">
                        <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
                        <span className="ml-1 text-base font-medium">{t('settings.home')}</span>
                    </button>
                    <h1 className="text-lg font-bold leading-tight">{t('tuner.title')}</h1>
                    <div className="w-14"></div> {/* Balance spacing */}
                </div>
            </header>

            <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-12 flex flex-col gap-6 overflow-y-auto">
                {/* Instrument Selector */}
                <section className="bg-white dark:bg-surface-dark p-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-around">
                    {INSTRUMENTS.map((inst) => {
                        const isSelected = selectedInstrument.id === inst.id;
                        return (
                            <button
                                key={inst.id}
                                onClick={() => handleInstrumentChange(inst)}
                                className={`flex flex-col items-center gap-1.5 py-2 px-3 rounded-xl transition-all ${
                                    isSelected 
                                        ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105' 
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                                }`}
                            >
                                <span className="material-symbols-outlined text-xl">{inst.icon}</span>
                                <span className="text-[11px] font-bold tracking-wide">{t(inst.nameKey)}</span>
                            </button>
                        );
                    })}
                </section>

                {/* Tuner Gauge Card */}
                <section className={`bg-white dark:bg-surface-dark rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm relative overflow-hidden transition-all duration-300 ${ringColor} ${glowColor}`}>
                    
                    {/* Mode selector */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-1 flex">
                            <button
                                onClick={() => {
                                    setIsAutoMode(true);
                                    stopTone();
                                }}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    isAutoMode
                                        ? 'bg-white dark:bg-slate-700 shadow-sm text-primary'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                {t('tuner.autoMode')}
                            </button>
                            <button
                                onClick={() => {
                                    setIsAutoMode(false);
                                }}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    !isAutoMode
                                        ? 'bg-white dark:bg-slate-700 shadow-sm text-primary'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                {t('tuner.manualMode')}
                            </button>
                        </div>
                    </div>

                    {/* SVG Tuner Gauge Dial */}
                    <div className="relative flex justify-center items-center h-[130px] w-full mt-2 overflow-visible">
                        <svg viewBox="0 0 200 120" className="w-full max-w-[240px] overflow-visible">
                            {/* Gauge Arc background */}
                            <path 
                                d="M 20 100 A 80 80 0 0 1 180 100" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="6" 
                                className="text-slate-100 dark:text-slate-800" 
                                strokeLinecap="round" 
                            />
                            
                            {/* Tuning ticks */}
                            <line x1="100" y1="20" x2="100" y2="32" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500" />
                            <line x1="40" y1="60" x2="50" y2="65" stroke="currentColor" strokeWidth="1.5" className="text-slate-300 dark:text-slate-700" />
                            <line x1="160" y1="60" x2="150" y2="65" stroke="currentColor" strokeWidth="1.5" className="text-slate-300 dark:text-slate-700" />
                            
                            {/* Center circle */}
                            <circle cx="100" cy="100" r="7" className="fill-slate-900 dark:fill-slate-300" />

                            {/* Pointer Needle */}
                            <line 
                                x1="100" 
                                y1="100" 
                                x2="100" 
                                y2="22" 
                                stroke="currentColor" 
                                strokeWidth="3.5" 
                                strokeLinecap="round"
                                className={`origin-[100px_100px] transition-transform duration-150 ease-out ${needleColor}`}
                                style={{
                                    transform: `rotate(${needleRotation}deg)`,
                                }}
                            />
                        </svg>

                        {/* Note Display (Center Overlay) */}
                        <div className="absolute bottom-2 flex flex-col items-center justify-center">
                            <span className={`text-5xl font-black tracking-tight transition-colors duration-300 ${textColor}`}>
                                {detectedNote}
                            </span>
                            {isActive && detectedNote !== '-' && (
                                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-1">
                                    {detectedFreq.toFixed(1)} Hz
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Tuning offset text readout */}
                    <div className="text-center h-6 mt-4 flex items-center justify-center">
                        {isActive && detectedNote !== '-' ? (
                            <div className="flex items-center gap-1.5">
                                {isInTune && (
                                    <span className="text-xs font-bold text-emerald-500 tracking-wide uppercase flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[16px] fill-1">check_circle</span>
                                        {t('tuner.inTune')}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                                {isActive ? t('tuner.allowMic') : "—"}
                            </span>
                        )}
                    </div>
                </section>

                {/* Instrument Strings Panel */}
                <section className="bg-white dark:bg-surface-dark rounded-3xl p-5 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            Cordas / Notas
                        </h3>
                        {!isAutoMode && (
                            <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                                {t('tuner.manualMode')}
                            </span>
                        )}
                    </div>

                    {/* Horizontal grid list of strings */}
                    <div className={`grid gap-2.5 ${selectedInstrument.strings.length === 6 ? 'grid-cols-6' : 'grid-cols-4'}`}>
                        {selectedInstrument.strings.map((str, idx) => {
                            const isStringSelected = selectedStringIndex === idx;
                            
                            // Highlight styles
                            let btnClass = "bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/60";
                            
                            if (isStringSelected) {
                                if (isAutoMode) {
                                    btnClass = isInTune 
                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/40 scale-105"
                                        : "bg-primary/10 text-primary border-primary/40 scale-105";
                                } else {
                                    btnClass = "bg-primary text-white border-primary shadow-sm scale-105";
                                }
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setSelectedStringIndex(idx);
                                        setIsAutoMode(false); // Switch to manual on click
                                        stopTone();
                                    }}
                                    className={`h-16 flex flex-col items-center justify-center rounded-2xl border font-bold transition-all relative ${btnClass}`}
                                >
                                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium leading-none mb-1">
                                        {str.label}
                                    </span>
                                    <span className="text-lg leading-none">
                                        {isPt ? getPtNoteName(str.note) : str.note}
                                    </span>
                                    {isStringSelected && isAutoMode && (
                                        <div className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${isInTune ? 'bg-emerald-500' : 'bg-primary animate-ping'}`}></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Manual Mode Reference Sound Controls */}
                    {!isAutoMode && (
                        <div className="mt-2 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[13px] font-bold">
                                        Corda {selectedInstrument.strings[selectedStringIndex].label} ({isPt ? getPtNoteName(selectedInstrument.strings[selectedStringIndex].note) : selectedInstrument.strings[selectedStringIndex].note})
                                    </p>
                                    <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                                        Frequência Alvo: {selectedInstrument.strings[selectedStringIndex].frequency} Hz
                                    </p>
                                </div>
                                <button
                                    onClick={togglePlayTone}
                                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                                        isPlayToneActive 
                                            ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20' 
                                            : 'bg-primary hover:bg-primary-dark text-white shadow-md shadow-primary/20'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[16px]">
                                        {isPlayToneActive ? 'volume_off' : 'volume_up'}
                                    </span>
                                    {isPlayToneActive ? t('tuner.stopTone') : t('tuner.playTone')}
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                {/* Primary Mic Activation Button */}
                <section className="mt-2 flex flex-col gap-3">
                    <button
                        onClick={toggleTuner}
                        className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg ${
                            isActive
                                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/15 active:scale-[0.98]'
                                : 'bg-primary hover:bg-primary-dark text-white shadow-primary/15 active:scale-[0.98]'
                        }`}
                    >
                        <span className="material-symbols-outlined">
                            {isActive ? 'mic_off' : 'mic'}
                        </span>
                        {isActive ? t('tuner.stop') : t('tuner.start')}
                    </button>

                    {micError && (
                        <div className="p-4 bg-rose-500/10 dark:bg-rose-500/5 rounded-2xl border border-rose-500/20 text-center animate-fade-in">
                            <span className="material-symbols-outlined text-rose-500 text-3xl mb-1.5 block">mic_external_off</span>
                            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{micError}</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default Tuner;
