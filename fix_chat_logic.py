import sys

with open('api/chat.js', 'r') as f:
    lines = f.readlines()

new_lines = []
skip_next = False
for i, line in enumerate(lines):
    if skip_next:
        skip_next = False
        continue

    # Remove the duplicated block logic
    if i < len(lines) - 1 and \"if (supabase) {\" in line and \"if (supabase) {\" in lines[i+4]:
        # This looks like the duplicated pattern
        pass # We will handle it by only adding one block

    # Actually, let's just use a more direct replacement for the upsert lines
    # and clean up the duplicated blocks manually or via regex
    new_lines.append(line)

content = \"\".join(new_lines)

# Fix duplicated blocks and simplify
import re
pattern = r'\{[\s\n]*if \(supabase\) \{[\s\n]*try \{ await supabase\.from\(\'query_cache\'\)\.upsert\(\[\{ prompt: prompt\.trim\(\), response: (.*?)\}\], \{ onConflict: \'prompt\' \}\); \} catch\(e\) \{\}[\s\n]*\}[\s\n]*\}[\s\n]*\{[\s\n]*if \(supabase\) \{[\s\n]*try \{ await supabase\.from\(\'query_cache\'\)\.upsert\(\[\{ prompt: prompt\.trim\(\), response: (.*?)\}\], \{ onConflict: \'prompt\' \}\); \} catch\(e\) \{\}[\s\n]*\}[\s\n]*\}'
content = re.sub(pattern, r'if (supabase) { try { await supabase.from("query_cache").upsert([{ prompt: prompt.trim(), response: \1}], { onConflict: "prompt" }); } catch(e) {} }', content)

with open('api/chat.js', 'w') as f:
    f.write(content)
