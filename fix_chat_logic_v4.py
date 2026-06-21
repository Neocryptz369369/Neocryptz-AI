import sys
import re

with open('api/chat.js', 'r') as f:
    content = f.read()

# Helper to create clean provider block
def clean_block(provider_name, condition, text_extract):
    return f'if ({condition}) {{ const text = {text_extract}; if (supabase) {{ try {{ await supabase.from("query_cache").upsert([{{ prompt: prompt.trim(), response: text }}], {{ onConflict: "prompt" }}); }} catch(e) {{}} }} return res.status(200).json({{ result: text, provider: "{provider_name}" }}); }}'

# Clean Gemini
content = re.sub(r'if \(data\.candidates && data\.candidates\[0\] && data\.candidates\[0\]\.content && data\.candidates\[0\]\.content\.parts\[0\]\) \{.*?\}[\s\n]*\}[\s\n]*\}[\s\n]*\}',
                 clean_block("Gemini", "data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]", "data.candidates[0].content.parts[0].text") + " } } }", content, flags=re.DOTALL)

# Clean OpenRouter
# Note: I need to be careful to match the correct provider block based on the URL or variable names
content = re.sub(r'if \(orRes\.ok\) \{.*?if \(data\.choices && data\.choices\[0\] && data\.choices\[0\]\.message\) \{.*?\}[\s\n]*\}[\s\n]*\}[\s\n]*\}',
                 r'if (orRes.ok) { const data = await orRes.json(); ' + clean_block("OpenRouter", "data.choices && data.choices[0] && data.choices[0].message", "data.choices[0].message.content") + " } } }", content, flags=re.DOTALL)

# Clean SambaNova
content = re.sub(r'if \(sambaRes\.ok\) \{.*?if \(data\.choices && data\.choices\[0\] && data\.choices\[0\]\.message\) \{.*?\}[\s\n]*\}[\s\n]*\}[\s\n]*\}',
                 r'if (sambaRes.ok) { const data = await sambaRes.json(); ' + clean_block("SambaNova", "data.choices && data.choices[0] && data.choices[0].message", "data.choices[0].message.content") + " } } }", content, flags=re.DOTALL)

# Clean Pollinations
content = re.sub(r'if \(polRes\.ok\) \{.*?\}[\s\n]*\}[\s\n]*\}',
                 clean_block("Pollinations", "polRes.ok", "await polRes.text()") + " } }", content, flags=re.DOTALL)

with open('api/chat.js', 'w') as f:
    f.write(content)
