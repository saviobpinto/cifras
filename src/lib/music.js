// Utility for music theory logic

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export function parseChordPro(text) {
    if (!text) return [];

    const lines = text.split('\n');
    return lines.map(line => {
        let currentLine = line;
        let pauseSeconds = 0;

        // Check for pause marker P{seconds}
        const pauseMatch = currentLine.match(/P\{(\d+)\}/);
        if (pauseMatch) {
            pauseSeconds = parseInt(pauseMatch[1], 10);
            currentLine = currentLine.replace(/P\{\d+\}/, '');
        }

        // Check if line is a section header [Chorus], [Verse] etc.
        const sectionMatch = currentLine.trim().match(/^\[(Verse|Chorus|Bridge|Outro|Intro|Solo|Instrumental|Refrão|Ponte|Ending)\]$/i);
        if (sectionMatch) {
            return { type: 'section', label: sectionMatch[1], pause: pauseSeconds };
        }

        // Check if line has chords
        if (!currentLine.includes('[')) {
            return { type: 'lyrics', content: currentLine, pause: pauseSeconds };
        }

        // Split by regex capturing group
        const parts = currentLine.split(/(\[[^\]]+\])/);
        // parts will be: ["Lyrics ", "[Am]", " more lyrics ", "[G]", ""]

        const lineSegments = [];

        // We need to pair chords with following lyrics
        // Standard approach: 
        // "Lyrics [Am]Lyrics" -> { chord: null, lyrics: "Lyrics " }, { chord: "Am", lyrics: "Lyrics" }

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            if (part.startsWith('[') && part.endsWith(']')) {
                // It's a chord
                const chord = part.slice(1, -1);

                // Check if next part is lyrics
                let lyrics = '';
                if (i + 1 < parts.length && !parts[i + 1].startsWith('[')) {
                    lyrics = parts[i + 1];
                    i++; // Skip next part as we consumed it
                }

                lineSegments.push({ chord, lyrics });
            } else if (part.trim() !== '' || part.length > 0) {
                // It's leading lyrics or space
                lineSegments.push({ chord: null, lyrics: part });
            }
        }

        return { type: 'line', segments: lineSegments, pause: pauseSeconds };
    });
}

export function transposeNote(note, semitones) {
    if (!note) return null;
    if (semitones === 0) return note;

    // Handle bass notes (e.g. G/F#)
    if (note.includes('/')) {
        const parts = note.split('/');
        return transposeNote(parts[0], semitones) + '/' + transposeNote(parts[1], semitones);
    }

    // Find root note
    const regex = /^([A-G][#b]?)(.*)$/;
    const match = note.match(regex);
    if (!match) return note;

    const root = match[1];
    const suffix = match[2];

    let index = NOTES.indexOf(root);
    // Handle flats mapping to sharps for index finding
    if (index === -1) {
        const flatMap = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
        if (flatMap[root]) index = NOTES.indexOf(flatMap[root]);
    }

    if (index === -1) return note; // Note not found

    let newIndex = (index + semitones) % 12;
    if (newIndex < 0) newIndex += 12;

    return NOTES[newIndex] + suffix;
}

export function formatChords(text) {
    if (!text) return text;

    const chordRegex = /\b[A-G](?:#|b|♯|♭)?(?:m|maj|min|aug|dim|sus|add|M|°|ø|\+|[0-9]|b|#|-)*(?:[\(][\d\+\-b#a-zA-Z]+[\)])?(?:\/[A-G](?:#|b|♯|♭)?)?(?=\s|$)/g;

    const lines = text.split('\n');
    const resultLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // If line already has brackets, assume handled natively or skip
        if (line.includes('[')) {
            resultLines.push(line);
            continue;
        }

        const words = line.trim().split(/\s+/).filter(w => w);
        if (words.length === 0) {
            resultLines.push(line);
            continue;
        }

        const potentialChords = words.filter(word => {
            return /^[A-G](?:#|b|♯|♭)?(?:m|maj|min|aug|dim|sus|add|M|°|ø|\+|[0-9]|b|#|-)*(?:[\(][\d\+\-b#a-zA-Z]+[\)])?(?:\/[A-G](?:#|b|♯|♭)?)?$/.test(word);
        });

        if (potentialChords.length > 0 && potentialChords.length / words.length >= 0.5) {
            // It's a chord line! 
            // We need to extract the chords and their exact index position.
            const chordsToMerge = [];
            chordRegex.lastIndex = 0;
            let m;
            while ((m = chordRegex.exec(line)) !== null) {
                chordsToMerge.push({
                    chord: m[0],
                    index: m.index
                });
            }

            // Check if there's a lyrics line below to merge into
            if (i + 1 < lines.length && !lines[i + 1].trim().split(/\s+/).every(w => /^[A-G]/.test(w)) && lines[i + 1].trim() !== '') {
                const nextLine = lines[i + 1];
                let mergedLine = '';

                // Sort chords by index just in case, though regex guarantees it
                chordsToMerge.sort((a, b) => a.index - b.index);

                let offset = 0; // Tracks the offset in the *new* string
                mergedLine = nextLine;

                for (let c = 0; c < chordsToMerge.length; c++) {
                    const chordData = chordsToMerge[c];
                    let insertAt = chordData.index;

                    // If the chord is placed further out than the lyrics line length,
                    // we pad the lyrics line with spaces.
                    if (insertAt > mergedLine.length - offset) {
                        mergedLine += ' '.repeat(insertAt - (mergedLine.length - offset));
                    }

                    const chordStr = `[${chordData.chord}]`;
                    mergedLine = mergedLine.substring(0, insertAt + offset) + chordStr + mergedLine.substring(insertAt + offset);

                    // The string just got longer by the length of the chord + brackets
                    offset += chordStr.length;
                }

                resultLines.push(mergedLine);
                i++; // Skip the next line because we consumed it
            } else {
                // There is no lyrics line immediately below (e.g. Intro/Solo or end of section)
                // We just bracket them on their own line.
                let unmergedLine = '';
                let lastIndex = 0;
                for (const c of chordsToMerge) {
                    unmergedLine += line.substring(lastIndex, c.index) + `[${c.chord}]`;
                    lastIndex = c.index + c.chord.length;
                }
                unmergedLine += line.substring(lastIndex);
                resultLines.push(unmergedLine);
            }
        } else {
            // Normal lyrics line or empty line
            resultLines.push(line);
        }
    }

    return resultLines.join('\n');
}
