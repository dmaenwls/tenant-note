
import re

file_path = r'c:\Users\dmaen\.gemini\antigravity\scratch\rental_platform\reviews.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the last script block
scripts = re.findall(r'<script[^>]*>(.*?)</script>', content, re.DOTALL)
if not scripts:
    print("No scripts found")
    exit()

last_script = scripts[-1]

# Check braces
open_braces = last_script.count('{')
close_braces = last_script.count('}')
print(f"Open Braces: {open_braces}")
print(f"Close Braces: {close_braces}")

if open_braces != close_braces:
    print("Brace mismatch detected!")
    
    # Simple stack check to find roughly where
    stack = []
    lines = last_script.split('\n')
    for i, line in enumerate(lines):
        for char in line:
            if char == '{':
                stack.append(i)
            elif char == '}':
                if stack:
                    stack.pop()
                else:
                    print(f"Extra closing brace at line {i} (script line)")
    
    if stack:
        print(f"Unclosed braces starting at script lines: {stack[:5]}...")

else:
    print("Braces are balanced.")
