
from html.parser import HTMLParser
import sys

class TagValidator(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = {'html': 0, 'head': 0, 'body': 0}
        self.stack = []
        self.errors = []
        self.script_locations = [] # (line, parent_tag)
        self.style_locations = [] # (line, parent_tag)

    def handle_starttag(self, tag, attrs):
        if tag in self.tags:
            self.tags[tag] += 1
            if self.tags[tag] > 1:
                self.errors.append(f"Duplicate <{tag}> tag found at line {self.getpos()[0]}")
        
        if tag in ['meta', 'link', 'img', 'input', 'br', 'hr', 'path', 'circle', 'rect', 'svg']: # Basic void list
            return

        self.stack.append((tag, self.getpos()[0]))
        
        if tag == 'script':
            parent = self.stack[-2][0] if len(self.stack) > 1 else None
            self.script_locations.append((self.getpos()[0], parent))
        if tag == 'style':
            parent = self.stack[-2][0] if len(self.stack) > 1 else None
            self.style_locations.append((self.getpos()[0], parent))

    def handle_endtag(self, tag):
        # Specific check for void elements that shouldn't be popped if they weren't pushed? 
        # HTMLParser usually handles void elements by not calling handle_endtag for them?? 
        # Actually HTMLParser relies on the HTML spec. 
        # For simplicity, we just pop and check mismatch.
        # But we need to handle void tags like meta, link, img, br, input, hr manually if strict.
        # However, checking basic structure (div, head, body, script) is the goal.
        
        if tag in ['meta', 'link', 'img', 'input', 'br', 'hr']:
            return

        if not self.stack:
            self.errors.append(f"Unexpected closing </{tag}> at line {self.getpos()[0]}")
            return

        top_tag, top_line = self.stack.pop()
        # If mismatch, it means we have unclosed tags.
        # Simple stack check: if not match, we might have unclosed children.
        # We'll valid leniently: pop verify. 
        if top_tag != tag:
            # Try to find the tag in the stack
            found = False
            for i in range(len(self.stack)-1, -1, -1):
                if self.stack[i][0] == tag:
                    # Found it, so everything above it was unclosed
                    for j in range(len(self.stack)-1, i, -1):
                         self.errors.append(f"Unclosed <{self.stack[j][0]}> opened at line {self.stack[j][1]}")
                    # Resize stack to strict parent
                    self.stack = self.stack[:i]
                    found = True
                    break
            
            if not found:
                # If not found in stack, it's a stray closing tag
                self.stack.append((top_tag, top_line)) # Put back
                self.errors.append(f"Stray closing </{tag}> at line {self.getpos()[0]}")

    def check_structure(self):
        if self.stack:
            for tag, line in self.stack:
                self.errors.append(f"Unclosed <{tag}> at line {line}")
        
        return self.errors

filename = r"c:\Users\dmaen\.gemini\antigravity\scratch\rental_platform\reviews.html"
with open(filename, 'r', encoding='utf-8') as f:
    content = f.read()

parser = TagValidator()
parser.feed(content)
errors = parser.check_structure()

print(f"--- Scan Results for {filename} ---")
print(f"HTML tags: {parser.tags['html']}")
print(f"HEAD tags: {parser.tags['head']}")
print(f"BODY tags: {parser.tags['body']}")

if parser.tags['html'] > 1 or parser.tags['head'] > 1 or parser.tags['body'] > 1:
    print("CRITICAL: Duplicate structure tags found!")

print("\n--- Script Locations (Line, Parent) ---")
for line, parent in parser.script_locations:
    print(f"Line {line}: Parent <{parent}>")

print("\n--- Style Locations (Line, Parent) ---")
for line, parent in parser.style_locations:
    print(f"Line {line}: Parent <{parent}>")

print("\n--- Structural Errors ---")
if errors:
    for e in errors:
        print(e)
else:
    print("No structural nesting errors detected.")
