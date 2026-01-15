
import os

target_dir = r'c:\Users\dmaen\.gemini\antigravity\scratch\rental_platform'
script_tag = '<script src="js/config.js"></script>'

html_files = [f for f in os.listdir(target_dir) if f.endswith('.html')]

for filename in html_files:
    filepath = os.path.join(target_dir, filename)
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'js/config.js' in content:
        print(f"Skipping {filename}: Already has config.js")
        continue
        
    # Inject before </head>
    if '</head>' in content:
        new_content = content.replace('</head>', f'    {script_tag}\n</head>')
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Injected config.js into {filename}")
    else:
        print(f"Warning: No </head> tag found in {filename}")
