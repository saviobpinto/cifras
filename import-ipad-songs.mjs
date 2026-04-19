import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IPAD_SONGS_DIR = path.join(__dirname, 'iPadSongs');
const OUTPUT_FILE = path.join(__dirname, 'src', 'data', 'ipadSongs.js');

function isChordLine(line) {
    if (!line.trim()) return false;
    // Don't treat tab lines as chord lines
    if (line.match(/^[A-Ga-g]\|/)) return false;

    const words = line.trim().split(/\s+/);
    let chordCount = 0;
    // Regex for basic chords: A-G, optional #/b, optional m/min/maj/dim/aug/sus/add, optional numbers, optional bass note... and we also allow parentheses like (intro)
    // Here we'll just check if it loosely looks like a chord or standard musical formatting
    const chordRegex = /^(\(|\[)?[A-G][a-zA-Z0-9#\/\+\-\(\)]*(\)|\])?$/;

    for (const word of words) {
        if (chordRegex.test(word) || word.match(/^(x\d|\d[xX]|\(.\))$/i) || word.toLowerCase() === 'intro' || word.toLowerCase() === 'solo') {
            chordCount++;
        }
    }

    // If more than 60% of the words look like chords
    return chordCount / words.length > 0.6;
}

function processContent(content) {
    const lines = content.split('\n');
    let formattedLines = [];
    let extractedKey = "";
    let i = 0;

    // Filter out some header lines that we don't need in content if they duplicate metadata?
    // Let's just keep everything for now, or just remove lines matching "Tom: " or "Artista: " 

    while (i < lines.length) {
        // check if it is part of header (Tom:, Artista:, Música:)
        if (i < 10) {
            const lLow = lines[i].toLowerCase();
            if (lLow.startsWith('tom:')) {
                const match = lines[i].match(/tom:\s*([A-Ga-g][#b]?(?:m|m7|M7|7)?)/i);
                if (match) {
                    extractedKey = match[1].charAt(0).toUpperCase() + match[1].slice(1);
                }
                i++;
                continue;
            } else if (lLow.startsWith('artista:') || lLow.startsWith('música:')) {
                i++;
                continue;
            }
        }

        const line = lines[i].replace(/\r$/, '');

        // Tab lines formatting preservation
        if (line.match(/^[A-Ga-g]\|/) || line.match(/^[A-Ga-g]\s*\|/)) {
            formattedLines.push(line);
            i++;
            continue;
        }

        if (isChordLine(line)) {
            if (!extractedKey) {
                // Deduce key from the first chord of the first chord line
                const match = line.match(/(?:^|\s|\(|\[)([A-Ga-g][#b]?m?)/);
                if (match) {
                    let k = match[1];
                    extractedKey = k.charAt(0).toUpperCase() + k.slice(1);
                }
            }

            const nextIdx = i + 1;
            if (nextIdx < lines.length) {
                const nextLine = lines[nextIdx].replace(/\r$/, '');
                if (!isChordLine(nextLine) && nextLine.trim().length > 0 && !nextLine.match(/^[A-Ga-g]\|/)) {
                    // Weave
                    let lyricLine = nextLine;
                    const matches = [...line.matchAll(/[^\s]+/g)];
                    for (let j = matches.length - 1; j >= 0; j--) {
                        const match = matches[j];
                        const index = match.index;
                        let chord = match[0];

                        // Clean up chord if we want to remove (intro) etc. but usually it's fine.
                        // Actually, if it's (intro), we can just leave it as [(intro)]
                        if (index > lyricLine.length) {
                            lyricLine = lyricLine.padEnd(index, ' ');
                        }

                        lyricLine = lyricLine.slice(0, index) + '[' + chord + ']' + lyricLine.slice(index);
                    }
                    formattedLines.push(lyricLine);
                    i += 2;
                    continue;
                }
            }

            // If we didn't weave it, just format the chords in place
            if (line.trim().length > 0) {
                const formatted = line.replace(/[^\s]+/g, (match) => `[${match}]`);
                formattedLines.push(formatted);
            } else {
                formattedLines.push(line);
            }
            i++;
        } else {
            formattedLines.push(line);
            i++;
        }
    }

    // Clean up empty lines at start and end
    while (formattedLines.length > 0 && formattedLines[0].trim() === '') formattedLines.shift();
    while (formattedLines.length > 0 && formattedLines[formattedLines.length - 1].trim() === '') formattedLines.pop();

    let finalContent = formattedLines.join('\n');
    // Remove double brackets generated when original text already had brackets
    finalContent = finalContent.replace(/\[\[(.*?)\]\]/g, '[$1]');
    // Enforce lowercase [intro] as explicitly requested by user
    finalContent = finalContent.replace(/\[intro\]/gi, '[intro]');

    return { content: finalContent, key: extractedKey };
}

function processSongs() {
    const files = fs.readdirSync(IPAD_SONGS_DIR);
    const parsedSongs = [];

    files.forEach(file => {
        if (!file.endsWith('.txt')) return;

        let filenameWithoutExt = file.replace(/\.txt$/, '');
        let artist = "";
        let title = "";

        const separatorIndex = filenameWithoutExt.indexOf('-');
        if (separatorIndex !== -1) {
            artist = filenameWithoutExt.slice(0, separatorIndex).trim();
            title = filenameWithoutExt.slice(separatorIndex + 1).trim();
        } else {
            title = filenameWithoutExt.trim();
            artist = "Desconhecido";
        }

        const filePath = path.join(IPAD_SONGS_DIR, file);
        const originalContent = fs.readFileSync(filePath, 'utf-8');

        const processed = processContent(originalContent);
        const content = processed.content;
        // Basic cleanup on the key if needed, or take it directly
        const songKey = processed.key || "";

        parsedSongs.push({
            id: uuidv4(),
            title: title,
            artist: artist,
            genre: "",
            key: songKey,
            bpm: 120,
            capo: 0,
            content: content,
            lastEdited: new Date().toISOString()
        });
    });

    console.log("Parsed " + parsedSongs.length + " songs. Generating output file...");

    const fileContent = "// Automatically generated from iPadSongs folder\n" +
        "export const ipadSongs = " + JSON.stringify(parsedSongs, null, 4) + ";\n";

    fs.writeFileSync(OUTPUT_FILE, fileContent, 'utf-8');
    console.log("Successfully wrote " + parsedSongs.length + " songs to " + OUTPUT_FILE);
}

processSongs();
