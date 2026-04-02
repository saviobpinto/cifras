import os
import zipfile
import glob
import re

IPAD_SONGS_DIR = 'iPadSongs'

def process_zips():
    zip_files = glob.glob(os.path.join(IPAD_SONGS_DIR, '*.zip'))
    
    # Track the extracted files to avoid duplicates
    extracted_names = set()
    
    for zip_path in zip_files:
        print(f"Processing {zip_path}")
        with zipfile.ZipFile(zip_path, 'r') as z:
            for info in z.infolist():
                # Skip directories and non-txt files
                if info.is_dir() or not info.filename.lower().endswith('.txt'):
                    continue
                
                # Fix encoding issues in zip filename for mac
                try:
                    # sometimes filenames are cp437 encoded instead of utf8
                    filename_decoded = info.filename.encode('cp437').decode('utf-8')
                except:
                    filename_decoded = info.filename
                
                parts = filename_decoded.split('/')
                # The actual filename
                filename = parts[-1]
                
                # If there's a folder structure, the second to last is usually the artist
                artist = 'Desconhecido'
                if len(parts) >= 2:
                    artist = parts[-2]
                
                # remove extension for checking length
                filename_no_ext = filename[:-4]
                
                # Check if file is already 'Artist - Song'
                if '-' in filename_no_ext:
                    final_name = filename
                else:
                    # Clean up artist name (might be like 'creed' or 'aerosmith')
                    # format as "Artist - Title.txt"
                    # Let's title case them to look better
                    artist_clean = artist.replace('_', ' ').title()
                    # Also capitalize the first letter of title if we want, or title case it
                    title_clean = filename_no_ext.replace('_', ' ').title()
                    final_name = f"{artist_clean} - {title_clean}.txt"
                
                # ensure valid filename
                final_name = final_name.replace('/', '_').replace('\\', '_')
                
                # Avoid overwriting files with exactly the same name by adding a number if needed
                base_name = final_name[:-4]
                ext = final_name[-4:]
                counter = 1
                unique_name = final_name
                while unique_name in extracted_names:
                    unique_name = f"{base_name} ({counter}){ext}"
                    counter += 1
                
                extracted_names.add(unique_name)
                
                dest_path = os.path.join(IPAD_SONGS_DIR, unique_name)
                
                # read content and write to dest file
                try:
                    content = z.read(info)
                    # we do a simple decode with fallback to keep the content intact
                    text = content.decode('utf-8', errors='replace')
                    with open(dest_path, 'w', encoding='utf-8') as f:
                        f.write(text)
                except Exception as e:
                    print(f"Failed to extract {filename_decoded}: {e}")

if __name__ == '__main__':
    process_zips()
    print("Done extracting and organizing songs!")
