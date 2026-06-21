import sys
import re

with open('api/chat.js', 'r') as f:
    content = f.read()

# Pattern for the duplicated upsert blocks
pattern = r'\{[\s\n]*if \(supabase\) \{[\s\n]*try \{ await supabase\.from\(\'query_cache\'\)\.upsert\(\[\{ prompt: prompt\.trim\(\), response: (.*?) \}\], \{ onConflict: \'prompt\' \}\); \} catch\(e\) \{\}[\s\n]*\}[\s\n]*\}[\s\n]*\{[\s\n]*if \(supabase\) \{[\s\n]*try \{ await supabase\.from\(\'query_cache\'\)\.upsert\(\[\{ prompt: prompt\.trim\(\), response: (.*?) \}\], \{ onConflict: \'prompt\' \}\); \} catch\(e\) \{\}[\s\n]*\}[\s\n]*\}'

content = re.sub(pattern, r'if (supabase) { try { await supabase.from("query_cache").upsert([{ prompt: prompt.trim(), response: \1 }], { onConflict: "prompt" }); } catch(e) {} }', content)

with open('api/chat.js', 'w') as f:
    f.write(content)
