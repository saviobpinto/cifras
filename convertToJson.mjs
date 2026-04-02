import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, 'src', 'data', 'ipadSongs.js');
const outputPath = path.join(__dirname, 'public', 'ipadSongs.json');

console.log('Reading JS file...');
let content = fs.readFileSync(inputPath, 'utf8');

console.log('Converting to JSON format...');
// The file starts with:
// // Automatically generated from iPadSongs folder
// export const ipadSongs = [
// ...
// ];
// We just need to strip the first two lines and the trailing semicolon.

content = content.replace(/^\/\/ Automatically generated from iPadSongs folder\nexport const ipadSongs = /, '');
content = content.replace(/;\n?$/, '');

console.log('Writing JSON file...');
fs.writeFileSync(outputPath, content, 'utf8');

// remove the old js file
fs.unlinkSync(inputPath);

console.log('Done!');
