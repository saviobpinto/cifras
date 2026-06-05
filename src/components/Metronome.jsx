import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Time signatures configurations
const TIME_SIGNATURES = [
    { label: '2/4', beats: 2 },
    { label: '3/4', beats: 3 },
    { label: '4/4', beats: 4 },
    { label: '5/4', beats: 5 },
    { label: '6/8', beats: 6 }
];

function Metronome() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // UI States
    const [isPlaying, setIsPlaying] = useState(false);
    const [tempo, setTempo] = useState(120); // BPM
    const [timeSignature, setTimeSignature] = useState(TIME_SIGNATURES[2]); // Default 4/4
    const [isMuted, setIsMuted] = useState(false);
    const [activeBeat, setActiveBeat] = useState(-1); // -1 means none

    // tap tempo variables
    const tapTimesRef = useRef([]);

    // Web Audio scheduler variables
    const audioContextRef = useRef(null);
    const nextNoteTimeRef = useRef(0.0);
    const currentBeatInBarRef = useRef(0);
    const timerIdRef = useRef(null);

    // Refs for synchronization to prevent closure issues in interval
    const tempoRef = useRef(tempo);
    const beatsPerMeasureRef = useRef(timeSignature.beats);
    const isMutedRef = useRef(isMuted);

    useEffect(() => {
        tempoRef.current = tempo;
    }, [tempo]);

    useEffect(() => {
        beatsPerMeasureRef.current = timeSignature.beats;
        // Reset current beat tracker when compass change to prevent out of bounds
        currentBeatInBarRef.current = 0;
        setActiveBeat(-1);
    }, [timeSignature]);

    useEffect(() => {
        isMutedRef.current = isMuted;
    }, [isMuted]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopMetronome();
        };
    }, []);

    // precise scheduling constants
    const lookahead = 25.0; // how frequently to call scheduling function (in milliseconds)
    const scheduleAheadTime = 0.1; // how far ahead to schedule audio (in seconds)

    const startMetronome = async () => {
        if (isPlaying) return;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        // Initialize scheduling times
        nextNoteTimeRef.current = ctx.currentTime + 0.05;
        currentBeatInBarRef.current = 0;

        setIsPlaying(true);
        setActiveBeat(-1);

        // Scheduling ticker
        timerIdRef.current = setInterval(() => {
            scheduler();
        }, lookahead);
    };

    const stopMetronome = () => {
        setIsPlaying(false);
        setActiveBeat(-1);

        if (timerIdRef.current) {
            clearInterval(timerIdRef.current);
            timerIdRef.current = null;
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    };

    const togglePlay = () => {
        if (isPlaying) {
            stopMetronome();
        } else {
            startMetronome();
        }
    };

    const scheduler = () => {
        if (!audioContextRef.current) return;

        // While there are notes to play before the next interval tick
        while (nextNoteTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTime) {
            scheduleNote(currentBeatInBarRef.current, nextNoteTimeRef.current);
            advanceNote();
        }
    };

    const scheduleNote = (beatNumber, time) => {
        if (!audioContextRef.current) return;

        // 1. Synthesize audio click if not muted
        if (!isMutedRef.current) {
            const osc = audioContextRef.current.createOscillator();
            const gainNode = audioContextRef.current.createGain();

            osc.connect(gainNode);
            gainNode.connect(audioContextRef.current.destination);

            // First beat gets a higher pitch click
            if (beatNumber === 0) {
                osc.frequency.setValueAtTime(1000, time); // High click (1000Hz)
            } else {
                osc.frequency.setValueAtTime(600, time);  // Medium click (600Hz)
            }

            // Synthesize click envelope
            gainNode.gain.setValueAtTime(0.3, time);
            gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

            osc.start(time);
            osc.stop(time + 0.06);
        }

        // 2. Schedule visual flash on the main thread precisely in sync with the audio
        const delay = (time - audioContextRef.current.currentTime) * 1000;
        setTimeout(() => {
            setActiveBeat(beatNumber);
        }, Math.max(0, delay));
    };

    const advanceNote = () => {
        // Increment nextNoteTime by 1 beat duration
        const secondsPerBeat = 60.0 / tempoRef.current;
        nextNoteTimeRef.current += secondsPerBeat;

        // Rotate beats in measure
        currentBeatInBarRef.current = (currentBeatInBarRef.current + 1) % beatsPerMeasureRef.current;
    };

    // Tap Tempo algorithm
    const handleTapTempo = () => {
        const now = performance.now();
        const tapTimes = tapTimesRef.current;

        // Reset sequence if the tap is after 2 seconds from the last one
        if (tapTimes.length > 0 && now - tapTimes[tapTimes.length - 1] > 2000) {
            tapTimesRef.current = [];
        }

        tapTimesRef.current.push(now);

        // We need at least two taps to measure BPM
        if (tapTimesRef.current.length > 1) {
            // Keep only last 5 taps for moving average
            if (tapTimesRef.current.length > 5) {
                tapTimesRef.current.shift();
            }

            // Calculate intervals
            let sumIntervals = 0;
            for (let i = 1; i < tapTimesRef.current.length; i++) {
                sumIntervals += tapTimesRef.current[i] - tapTimesRef.current[i - 1];
            }

            const avgInterval = sumIntervals / (tapTimesRef.current.length - 1);
            const calculatedBpm = Math.round(60000 / avgInterval);

            // Clamp BPM between 30 and 250
            const clampedBpm = Math.max(30, Math.min(250, calculatedBpm));
            setTempo(clampedBpm);
        }
    };

    // Quick BPM steps
    const adjustTempo = (amount) => {
        setTempo((prev) => Math.max(30, Math.min(250, prev + amount)));
    };

    // Determine pendulum swing angle
    // If beat is even, swing left (-20deg). If odd, swing right (+20deg).
    // If not playing, centered.
    let pendulumAngle = 0;
    if (isPlaying && activeBeat !== -1) {
        pendulumAngle = activeBeat % 2 === 0 ? -20 : 20;
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
                    <h1 className="text-lg font-bold leading-tight">{t('metronome.title')}</h1>
                    <div className="w-14"></div> {/* Balance spacing */}
                </div>
            </header>

            <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-12 flex flex-col gap-6 overflow-y-auto">
                
                {/* Visual Pendulum and Beat Indicator Card */}
                <section className="bg-white dark:bg-surface-dark rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col items-center justify-center relative min-h-[220px]">
                    
                    {/* SVG Metronome Pendulum */}
                    <div className="w-full flex justify-center h-[120px] relative overflow-hidden">
                        <svg viewBox="0 0 100 100" className="h-full w-auto overflow-visible">
                            {/* Metronome Body outline */}
                            <path d="M 50 10 L 25 90 L 75 90 Z" className="fill-slate-100/50 dark:fill-slate-800/30 stroke-slate-200 dark:stroke-slate-800" strokeWidth="2" />
                            <line x1="50" y1="10" x2="50" y2="90" className="stroke-slate-200 dark:stroke-slate-800" strokeDasharray="2,2" />
                            
                            {/* Swing Needle */}
                            <line 
                                x1="50" 
                                y1="90" 
                                x2="50" 
                                y2="15" 
                                stroke="currentColor" 
                                strokeWidth="3" 
                                strokeLinecap="round"
                                className="origin-[50px_90px] transition-transform duration-[200ms] ease-in-out text-primary"
                                style={{
                                    transform: `rotate(${pendulumAngle}deg)`
                                }}
                            />
                            
                            {/* Pivot point */}
                            <circle cx="50" cy="90" r="5" className="fill-slate-700 dark:fill-slate-300" />
                        </svg>
                    </div>

                    {/* Horizontal list of Beat Bulbs */}
                    <div className="flex gap-4 justify-center items-center mt-6 w-full px-2">
                        {Array.from({ length: timeSignature.beats }).map((_, idx) => {
                            const isActive = activeBeat === idx;
                            const isDownbeat = idx === 0;

                            let bulbClass = "bg-slate-200 dark:bg-slate-800 scale-100 opacity-60";
                            if (isActive) {
                                bulbClass = isDownbeat 
                                    ? "bg-emerald-500 text-white scale-125 opacity-100 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                    : "bg-primary text-white scale-115 opacity-100 shadow-[0_0_12px_rgba(59,130,246,0.5)]";
                            }

                            return (
                                <div
                                    key={idx}
                                    className={`size-6 rounded-full flex items-center justify-center font-extrabold text-[10px] transition-all duration-100 ${bulbClass}`}
                                >
                                    {idx + 1}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Tempo Speed control card */}
                <section className="bg-white dark:bg-surface-dark rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col gap-6 items-center">
                    
                    {/* Big BPM read & fine adjustment controls */}
                    <div className="flex items-center justify-between w-full max-w-[280px]">
                        <button 
                            onClick={() => adjustTempo(-5)}
                            className="size-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 font-black text-sm flex items-center justify-center active:scale-95 transition-transform"
                        >
                            -5
                        </button>
                        <button 
                            onClick={() => adjustTempo(-1)}
                            className="size-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 font-black text-lg flex items-center justify-center active:scale-95 transition-transform"
                        >
                            -
                        </button>

                        <div className="flex flex-col items-center select-none">
                            <span className="text-5xl font-black tracking-tight font-mono leading-none">
                                {tempo}
                            </span>
                            <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mt-1">
                                {t('metronome.bpm')}
                            </span>
                        </div>

                        <button 
                            onClick={() => adjustTempo(1)}
                            className="size-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 font-black text-lg flex items-center justify-center active:scale-95 transition-transform"
                        >
                            +
                        </button>
                        <button 
                            onClick={() => adjustTempo(5)}
                            className="size-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 font-black text-sm flex items-center justify-center active:scale-95 transition-transform"
                        >
                            +5
                        </button>
                    </div>

                    {/* Range Slider for Speed */}
                    <div className="w-full px-2">
                        <input 
                            type="range"
                            min="30"
                            max="250"
                            value={tempo}
                            onChange={(e) => setTempo(parseInt(e.target.value, 10))}
                            className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary border border-slate-200/50 dark:border-slate-700/40"
                        />
                    </div>
                </section>

                {/* Time Signatures & Sound Controls Panel */}
                <section className="bg-white dark:bg-surface-dark rounded-3xl p-5 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col gap-5">
                    
                    {/* Time signature chips */}
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                            {t('metronome.timeSignature')}
                        </span>
                        <div className="flex gap-2 flex-wrap">
                            {TIME_SIGNATURES.map((sig) => {
                                const isSelected = timeSignature.label === sig.label;
                                return (
                                    <button
                                        key={sig.label}
                                        onClick={() => setTimeSignature(sig)}
                                        className={`flex-1 min-w-[60px] py-2.5 rounded-xl border text-xs font-extrabold tracking-wide transition-all ${
                                            isSelected 
                                                ? 'bg-primary text-white border-primary shadow-sm scale-105' 
                                                : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        {sig.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sound Options Toggle */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                isMuted ? 'bg-rose-500/20 text-rose-500' : 'bg-emerald-500/20 text-emerald-500'
                            }`}>
                                <span className="material-symbols-outlined text-xl">
                                    {isMuted ? 'volume_off' : 'volume_up'}
                                </span>
                            </div>
                            <span className="font-bold text-sm">
                                {isMuted ? t('metronome.mute') : t('metronome.sound')}
                            </span>
                        </div>
                        
                        {/* Toggle switch for mute */}
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                className="sr-only peer" 
                                type="checkbox" 
                                checked={!isMuted} 
                                onChange={() => setIsMuted(!isMuted)} 
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </section>

                {/* Auxiliary controls: Tap Tempo & Start/Stop */}
                <section className="flex flex-col gap-3">
                    
                    <button
                        onClick={handleTapTempo}
                        className="w-full py-3.5 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-sm tracking-wide shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                    >
                        <span className="material-symbols-outlined text-[18px]">touch_app</span>
                        {t('metronome.tapTempo')}
                    </button>

                    <button
                        onClick={togglePlay}
                        className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg ${
                            isPlaying
                                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/15 active:scale-[0.98]'
                                : 'bg-primary hover:bg-primary-dark text-white shadow-primary/15 active:scale-[0.98]'
                        }`}
                    >
                        <span className="material-symbols-outlined">
                            {isPlaying ? 'stop' : 'play_arrow'}
                        </span>
                        {isPlaying ? t('metronome.stop') : t('metronome.start')}
                    </button>
                </section>
            </main>
        </div>
    );
}

export default Metronome;
