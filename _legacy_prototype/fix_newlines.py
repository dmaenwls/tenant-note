
import os

target_file = r"c:\Users\dmaen\.gemini\antigravity\scratch\rental_platform\reviews.html"

with open(target_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Check if it looks double spaced
if '\n\n' in content:
    print("Detected double spacing. Attempting to fix...")
    # Naive fix: if every line is double spaced, we'll see a lot of \n\n.
    # But we want to preserve intentional paragraphs (which might be \n\n\n\n now).
    # Actually, if the tool inserted an extra newline after every newline:
    # Original: A\nB\n\nC
    # Doubled: A\n\nB\n\n\n\nC
    # We want to turn \n\n -> \n.
    
    new_content = content.replace('\n\n', '\n')
    
    # Write back
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Fixed newlines. Old length: {len(content)}, New length: {len(new_content)}")
else:
    print("No double spacing detected (or strictly \\r without \\n?).")
