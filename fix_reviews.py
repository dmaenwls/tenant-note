
import os

target_file = r'c:\Users\dmaen\.gemini\antigravity\scratch\rental_platform\reviews.html'

with open(target_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 1-based index to 0-based
# Line 590: remove </div> (index 589)
# Check if it is indeed </div>
if '</div>' in lines[589]:
    print(f"Removing line 590: {lines[589].strip()}")
    lines[589] = '' # Clear content
else:
    print(f"Warning: Line 590 is not </div>: {lines[589]}")

# Move Scripts
# Start: Line 594 (index 593) <!-- Kakao Map SDK ... -->
# End: Line 1536 (index 1535) </script>
start_idx = 593
end_idx = 1535

# Verify start and end
print(f"Script Start: {lines[start_idx].strip()[:20]}...")
print(f"Script End: {lines[end_idx].strip()}")

script_block = lines[start_idx:end_idx+1]

# Remove original script lines
for i in range(start_idx, end_idx+1):
    lines[i] = ''

# Insert before </body>
# Find </body>
body_idx = -1
for i, line in enumerate(lines):
    if '</body>' in line:
        body_idx = i
        break

if body_idx != -1:
    print(f"Found </body> at line {body_idx+1}")
    # Insert script block before body_idx
    # We create a new list correctly
    new_lines = []
    for i, line in enumerate(lines):
        if i == body_idx:
            # Add script block here
            new_lines.extend(script_block)
            new_lines.append(line)
        else:
            if line != '': # Skip cleared lines
                new_lines.append(line)
    
    # Write back
    with open(target_file, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Successfully refactored reviews.html")

else:
    print("Error: Could not find </body> tag")
