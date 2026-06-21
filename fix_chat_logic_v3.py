import sys
import re

with open('api/chat.js', 'r') as f:
    lines = f.readlines()

new_lines = []
skip_mode = False
for line in lines:
    if "if (supabase) {" in line and "upsert" in line:
        if not skip_mode:
            new_lines.append(line)
            skip_mode = True
        else:
            # Skip the duplicate
            continue
    elif "return res.status(200)" in line:
        new_lines.append(line)
        skip_mode = False # Reset for next provider
    elif not skip_mode:
        new_lines.append(line)
    else:
        # We are in skip mode but it's not the return line or the upsert line
        # Check if it's the closing brace of the upsert block
        if line.strip() == "}":
            continue
        new_lines.append(line)

# Let's try a different approach, just replace the messy blocks with clean ones
content = "".join(lines)

# Clean up Gemini
content = re.sub(r'if \(data\.candidates && data\.candidates\[0\] && data\.candidates\[0\]\.content && data\.candidates\[0\]\.content\.parts\[0\]\) \{.*?return res\.status\(200\)\.json\(\{ result: data\.candidates\[0\]\.content\.parts\[0\]\.text, provider: "Gemini" \}\);',
                 r'if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) { const text = data.candidates[0].content.parts[0].text; if (supabase) { try { await supabase.from("query_cache").upsert([{ prompt: prompt.trim(), response: text }], { onConflict: "prompt" }); } catch(e) {} } return res.status(200).json({ result: text, provider: "Gemini" });', content, flags=re.DOTALL)

# Clean up OpenRouter
content = re.sub(r'if \(data\.choices && data\.choices\[0\] && data\.choices\[0\]\.message\) \{.*?return res\.status\(200\)\.json\(\{ result: data\.choices\[0\]\.message\.content, provider: "OpenRouter" \}\);',
                 r'if (data.choices && data.choices[0] && data.choices[0].message) { const text = data.choices[0].message.content; if (supabase) { try { await supabase.from("query_cache").upsert([{ prompt: prompt.trim(), response: text }], { onConflict: "prompt" }); } catch(e) {} } return res.status(200).json({ result: text, provider: "OpenRouter" });', content, flags=re.DOTALL)

# Clean up SambaNova
content = re.sub(r'if \(data\.choices && data\.choices\[0\] && data\.choices\[0\]\.message\) \{.*?return res\.status\(200\)\.json\(\{ result: data\.choices\[0\]\.message\.content, provider: "SambaNova" \}\);',
                 r'if (data.choices && data.choices[0] && data.choices[0].message) { const text = data.choices[0].message.content; if (supabase) { try { await supabase.from("query_cache").upsert([{ prompt: prompt.trim(), response: text }], { onConflict: "prompt" }); } catch(e) {} } return res.status(200).json({ result: text, provider: "SambaNova" });', content, flags=re.DOTALL)

# Clean up Pollinations
content = re.sub(r'if \(polRes\.ok\) \{.*?return res\.status\(200\)\.json\(\{ result: text, provider: "Pollinations" \}\);',
                 r'if (polRes.ok) { const text = await polRes.text(); if (supabase) { try { await supabase.from("query_cache").upsert([{ prompt: prompt.trim(), response: text }], { onConflict: "prompt" }); } catch(e) {} } return res.status(200).json({ result: text, provider: "Pollinations" });', content, flags=re.DOTALL)

with open('api/chat.js', 'w') as f:
    f.write(content)
