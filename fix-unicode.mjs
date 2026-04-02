import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, 'src', 'data', 'ipadSongs.js');

let content = fs.readFileSync(filePath, 'utf-8');

// Strip invalid unicode code points. 
// Valid unicode ranges include surrogate pairs, but we'll try something simpler:
// Just strip characters that fail when converted to code point.
let cleaned = '';
for (let i = 0; i < content.length; i++) {
    const code = content.charCodeAt(i);
    // JS strings are UTF-16.
    // Ensure we don't have lone surrogates or code points that are explicitly invalid.
    cleaned += content[i];
}

// Actually, "Invalid code point 1381141" means some sequence of bytes or characters translated to code point 0x151315
// A regex to replace anything outside of basic multi-lingual plane and standard emoji could work:
// Or maybe just strip out the characters that are exactly 0x151315? Wait, JavaScript strings cannot hold code points > 0x10FFFF.
// So how did it get inside? Usually this happens if you have a backslash escape in the JS file like \u... or rather, Tailwind tries to decode something. 
// Tailwind v4 searches for strings like `\u{151000}`.
// Let's just remove any \uXXXX or \u{XXXXXX} that are out of bounds.

content = content.replace(/\\u\{([0-9a-fA-F]+)\}/g, (match, hex) => {
    const codePoint = parseInt(hex, 16);
    if (codePoint > 0x10FFFF) {
        console.log(`Found invalid code point: ${hex}`);
        return '';
    }
    return match;
});

// Also replace invalid raw characters (lone surrogates or whatever Node might have read but can't be valid)
// eslint-disable-next-line no-control-regex
content = content.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/g, '?');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Done cleaning ipadSongs.js');
