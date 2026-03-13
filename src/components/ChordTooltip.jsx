import React, { useState, useRef } from 'react';
import guitar from '@tombatossals/chords-db/lib/guitar.json';
import { chordParserFactory } from 'chord-symbol';

const parseChord = chordParserFactory();

// Map parsed root to chords-db keys
const rootMap = {
    'C': 'C',
    'C#': 'Csharp',
    'Db': 'Csharp',
    'D': 'D',
    'D#': 'Eb',
    'Eb': 'Eb',
    'E': 'E',
    'F': 'F',
    'F#': 'Fsharp',
    'Gb': 'Fsharp',
    'G': 'G',
    'G#': 'Ab',
    'Ab': 'Ab',
    'A': 'A',
    'A#': 'Bb',
    'Bb': 'Bb',
    'B': 'B'
};

// Map chord-symbol qualifiers/extensions to chords-db suffixes
const suffixMap = {
    '': 'major',
    'm': 'minor',
    'dim': 'dim',
    'dim7': 'dim7',
    'sus2': 'sus2',
    'sus4': 'sus4',
    '7sus4': '7sus4',
    'aug': 'aug',
    '6': '6',
    'm6': 'm6',
    '7': '7',
    'm7': 'm7',
    'maj7': 'maj7',
    'm7b5': 'm7b5',
    '9': '9',
    'm9': 'm9',
    'maj9': 'maj9',
    'add9': 'add9',
    '11': '11',
    'm11': 'm11',
    '13': '13',
    'm13': 'm13',
    // additional typical mapping aliases
    'M7': 'maj7',
    '7M': 'maj7',
    'minor': 'minor',
    '-': 'minor',
    '+': 'aug',
    '7m': 'm7',
    '9m': 'm9',
    '7dim': 'dim7',
    '7+': 'aug7'
};

// Hardcoded power chords because chords-db lacks '5' suffix
const powerChords = {
    'C': [{ frets: [-1, 1, 3, 3, -1, -1], fingers: [0, 1, 3, 4, 0, 0], baseFret: 3, barres: [] }],
    'Csharp': [{ frets: [-1, 1, 3, 3, -1, -1], fingers: [0, 1, 3, 4, 0, 0], baseFret: 4, barres: [] }],
    'D': [{ frets: [-1, 1, 3, 3, -1, -1], fingers: [0, 1, 3, 4, 0, 0], baseFret: 5, barres: [] }, { frets: [-1, 0, 0, 2, 3, -1], fingers: [0, 0, 0, 1, 2, 0], baseFret: 1, barres: [] }],
    'Eb': [{ frets: [-1, 1, 3, 3, -1, -1], fingers: [0, 1, 3, 4, 0, 0], baseFret: 6, barres: [] }],
    'E': [{ frets: [0, 2, 2, -1, -1, -1], fingers: [0, 1, 2, 0, 0, 0], baseFret: 1, barres: [] }, { frets: [-1, 1, 3, 3, -1, -1], fingers: [0, 1, 3, 4, 0, 0], baseFret: 7, barres: [] }],
    'F': [{ frets: [1, 3, 3, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0], baseFret: 1, barres: [] }],
    'Fsharp': [{ frets: [1, 3, 3, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0], baseFret: 2, barres: [] }],
    'G': [{ frets: [1, 3, 3, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0], baseFret: 3, barres: [] }],
    'Ab': [{ frets: [1, 3, 3, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0], baseFret: 4, barres: [] }],
    'A': [{ frets: [-1, 0, 2, 2, -1, -1], fingers: [0, 0, 1, 2, 0, 0], baseFret: 1, barres: [] }, { frets: [1, 3, 3, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0], baseFret: 5, barres: [] }],
    'Bb': [{ frets: [-1, 1, 3, 3, -1, -1], fingers: [0, 1, 3, 4, 0, 0], baseFret: 1, barres: [] }],
    'B': [{ frets: [-1, 1, 3, 3, -1, -1], fingers: [0, 1, 3, 4, 0, 0], baseFret: 2, barres: [] }]
};

function getChordData(chordName) {
    if (!chordName) return null;
    let parsed;
    try {
        parsed = parseChord(chordName);
    } catch {
        return null; // Parse failed
    }
    if (!parsed || parsed.error) return null;

    const root = parsed.normalized.rootNote;
    const dbKey = rootMap[root];
    if (!dbKey) return null; // Root not supported

    // Extract the exact suffix the user typed (e.g. 'm7' from 'Am7', '7' from 'F#7')
    let descriptor = chordName.substring(root.length).trim();

    // Fix for Power Chords ('5') which are not in chords-db
    if (descriptor === '5' && powerChords[dbKey]) {
        return powerChords[dbKey];
    }

    // First try the mapped alias, if not, assume the user string is literally what's in the DB.
    let dbSuffix = suffixMap[descriptor] || descriptor;

    // Check if it exists in the key's list
    const chordsGroup = guitar.chords;
    const chordsList = chordsGroup[dbKey];
    if (!chordsList) return null;

    let chord = chordsList.find(c => c.suffix === dbSuffix);

    // If exact match failed, try chord-symbol's normalization as fallback
    if (!chord) {
        let normDescriptor = parsed.normalized.qualifier || '';
        if (parsed.normalized.extension) {
            normDescriptor += parsed.normalized.extension;
        }
        let fallbackSuffix = suffixMap[normDescriptor] || suffixMap[parsed.normalized.qualifier] || 'major';
        if (parsed.normalized.qualifier === 'major') fallbackSuffix = 'major';
        if (parsed.normalized.qualifier === 'minor') fallbackSuffix = 'minor';

        chord = chordsList.find(c => c.suffix === fallbackSuffix);
    }
    if (!chord) return null;

    // Return the override position (if any) as the first choice, 
    // and the NEXT available position as the second choice (up to 2 variations).
    // chords-db sometimes puts weird/uncommon voicings as the 1st position.
    // Override position index for specific chords to show the standard barre.
    let positionIndex = 0;
    if (dbKey === 'Csharp' && chord.suffix === 'minor') positionIndex = 1; // standard C#m barre at 4th fret
    if (dbKey === 'Fsharp' && chord.suffix === 'minor') positionIndex = 1; // F#m sometimes weird
    if (dbKey === 'Ab' && chord.suffix === 'minor') positionIndex = 1; // G#m

    // Ensure we don't go out of bounds if the override index doesn't exist
    if (!chord.positions[positionIndex]) positionIndex = 0;

    const variations = [];
    variations.push(chord.positions[positionIndex]);

    // Find a second distinct variation if it exists
    const secondVariationIndex = chord.positions.findIndex((_, idx) => idx !== positionIndex);
    if (secondVariationIndex !== -1) {
        variations.push(chord.positions[secondVariationIndex]);
    }

    return variations;
}

// --- Custom SVG Chord Diagram Renderer ---
function ChordDiagram({ position }) {
    if (!position) return null;

    const { frets, fingers, baseFret, barres } = position;

    // Geometry
    const width = 140;
    const height = 140;
    const stringCount = 6;
    const fretCount = 4;

    const margin = { top: 25, right: 20, bottom: 25, left: 35 };
    const gridWidth = width - margin.left - margin.right;
    const gridHeight = height - margin.top - margin.bottom;

    const stringSpacing = gridWidth / (stringCount - 1);
    const fretSpacing = gridHeight / fretCount;

    // x coords for each string
    const stringXs = Array.from({ length: stringCount }).map((_, i) => margin.left + i * stringSpacing);
    // y coords for each fret line (0 is the top nut)
    const fretYs = Array.from({ length: fretCount + 1 }).map((_, i) => margin.top + i * fretSpacing);

    // Helpers
    const getFretCenterY = (relativeFret) => {
        // chords-db frets are ALREADY 1-indexed relative to the diagram block, 
        // so no need to subtract baseFret
        return margin.top + (relativeFret - 0.5) * fretSpacing;
    };

    return (
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="text-slate-900 dark:text-slate-100">
            {/* Draw Base Fret Number if needed */}
            {baseFret > 1 && (
                <text x={margin.left - 4} y={fretYs[0] + fretSpacing / 2} fontSize="12" textAnchor="end" alignmentBaseline="middle" className="fill-current font-bold">
                    {baseFret}fr
                </text>
            )}

            {/* Fret Lines (Horizontal) */}
            {fretYs.map((y, i) => (
                <line
                    key={`fret-${i}`}
                    x1={margin.left} y1={y}
                    x2={width - margin.right} y2={y}
                    stroke="currentColor"
                    strokeWidth={i === 0 && baseFret === 1 ? 4 : 1}
                />
            ))}

            {/* String Lines (Vertical) */}
            {stringXs.map((x, i) => (
                <line
                    key={`string-${i}`}
                    x1={x} y1={margin.top}
                    x2={x} y2={height - margin.bottom}
                    stroke="currentColor"
                    strokeWidth={1}
                />
            ))}

            {/* Muted and Open Strings */}
            {frets.map((f, i) => {
                if (f === -1) {
                    return (
                        <path
                            key={`mute-${i}`}
                            d={`M ${stringXs[i] - 4} ${margin.top - 12} L ${stringXs[i] + 4} ${margin.top - 4} M ${stringXs[i] + 4} ${margin.top - 12} L ${stringXs[i] - 4} ${margin.top - 4}`}
                            stroke="currentColor"
                            strokeWidth="1.5"
                        />
                    );
                }
                if (f === 0) {
                    return (
                        <circle
                            key={`open-${i}`}
                            cx={stringXs[i]} cy={margin.top - 8} r="3"
                            fill="none" stroke="currentColor" strokeWidth="1.5"
                        />
                    );
                }
                return null;
            })}

            {/* Barres */}
            {barres && barres.map((barreFret, i) => {
                // Find min and max strings covered by this barre -> strings that have frets >= barreFret
                let minString = -1;
                let maxString = -1;
                for (let s = 0; s < 6; s++) {
                    if (frets[s] >= barreFret) {
                        if (minString === -1) minString = s;
                        maxString = s;
                    }
                }

                if (minString === -1) return null; // shouldn't happen

                const y = getFretCenterY(barreFret);
                return (
                    <rect
                        key={`barre-${i}`}
                        x={stringXs[minString] - 6}
                        y={y - 6}
                        width={(stringXs[maxString] - stringXs[minString]) + 12}
                        height={12}
                        rx={6}
                        fill="currentColor"
                    />
                );
            })}

            {/* Finger Dots */}
            {frets.map((f, i) => {
                if (f > 0) {
                    // if it's part of a barre, don't draw a duplicate dot unless necessary, 
                    // but drawing it on top is fine.
                    const y = getFretCenterY(f);
                    return (
                        <circle
                            key={`dot-${i}`}
                            cx={stringXs[i]} cy={y} r="6"
                            fill="currentColor"
                        />
                    );
                }
                return null;
            })}

            {/* Finger Numbers */}
            {fingers && fingers.map((finger, i) => {
                if (finger > 0 && frets[i] > 0) { // Only show finger if not an open/muted string
                    return (
                        <text
                            key={`finger-${i}`}
                            x={stringXs[i]} y={height - margin.bottom + 14}
                            fontSize="10"
                            textAnchor="middle"
                            className="fill-current"
                        >
                            {finger}
                        </text>
                    );
                }
                return null;
            })}
        </svg>
    );
}

export default function ChordTooltip({ chordName, children }) {
    const [showTooltip, setShowTooltip] = useState(false);
    const [hoveringTooltip, setHoveringTooltip] = useState(false);
    const timeoutRef = useRef(null);
    const touchTimeoutRef = useRef(null);

    const positions = getChordData(chordName);

    const handleMouseEnter = () => {
        if (touchTimeoutRef.current) return; // Prevent hover if triggered by touch
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setShowTooltip(true);
    };

    const handleMouseLeave = () => {
        // slight delay to allow moving mouse onto tooltip
        timeoutRef.current = setTimeout(() => {
            if (!hoveringTooltip) {
                setShowTooltip(false);
            }
        }, 300);
    };

    const handleTouchStart = () => {
        // Touch triggers on mobile
        touchTimeoutRef.current = setTimeout(() => {
            touchTimeoutRef.current = null;
        }, 1000);
    };

    const toggleTooltip = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setShowTooltip(prev => !prev);
    };

    return (
        <span
            className="relative inline-block touch-none"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
        >
            <span
                onClick={toggleTooltip}
                className="cursor-pointer hover:underline decoration-primary decoration-2 underline-offset-4 touch-manipulation"
            >
                {children}
            </span>

            {showTooltip && positions && positions.length > 0 && (
                <div
                    className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 p-2 md:p-3 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 pointer-events-auto flex flex-row gap-2 sm:gap-4"
                    onMouseEnter={() => {
                        setHoveringTooltip(true);
                        if (timeoutRef.current) clearTimeout(timeoutRef.current);
                    }}
                    onMouseLeave={() => {
                        setHoveringTooltip(false);
                        setShowTooltip(false);
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {positions.map((pos, idx) => (
                        <div key={idx} className="w-[75px] sm:w-[100px] md:w-[120px]">
                            <ChordDiagram position={pos} />
                        </div>
                    ))}
                </div>
            )}
            {/* If parsing failed or chord not found, we just show nothing on tooltip but still render children */}
            {showTooltip && (!positions || positions.length === 0) && (
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-3 py-2 bg-slate-900 text-white text-xs rounded shadow-xl whitespace-nowrap">
                    Diagram not found
                </div>
            )}
        </span>
    );
}
