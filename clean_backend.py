import sys

def replace_in_file(filename, search_text, replace_text):
    with open(filename, 'r') as f:
        content = f.read()
    if search_text not in content:
        print(f"Search text not found in {filename}")
        return False
    new_content = content.replace(search_text, replace_text)
    with open(filename, 'w') as f:
        f.write(new_content)
    print(f"Successfully updated {filename}")
    return True

# Clean up Gemini block
old_gemini = """                if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
                    {
        if (supabase) {
            try { await supabase.from('query_cache').upsert([{ prompt: prompt.trim(), response: data.candidates[0].content.parts[0].text }], { onConflict: 'prompt' }); } catch(e) {}
        }
        {
        if (supabase) {
            try { await supabase.from('query_cache').upsert([{ prompt: prompt.trim(), response: data.candidates[0].content.parts[0].text }], { onConflict: 'prompt' }); } catch(e) {}
        }
        return res.status(200).json({ result: data.candidates[0].content.parts[0].text, provider: "Gemini" });
    }
    }"""

new_gemini = """                if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
                    const text = data.candidates[0].content.parts[0].text;
                    if (supabase) {
                        try { await supabase.from('query_cache').upsert([{ prompt: prompt.trim(), response: text }], { onConflict: 'prompt' }); } catch(e) {}
                    }
                    return res.status(200).json({ result: text, provider: "Gemini" });
                }"""

replace_in_file('api/chat.js', old_gemini, new_gemini)

# Clean up OpenRouter block
old_or = """                if (data.choices && data.choices[0] && data.choices[0].message) {
                    {
        if (supabase) {
            try { await supabase.from('query_cache').upsert([{ prompt: prompt.trim(), response: data.choices[0].message.content }], { onConflict: 'prompt' }); } catch(e) {}
        }
        {
        if (supabase) {
            try { await supabase.from('query_cache').upsert([{ prompt: prompt.trim(), response: data.choices[0].message.content }], { onConflict: 'prompt' }); } catch(e) {}
        }
        return res.status(200).json({ result: data.choices[0].message.content, provider: "OpenRouter" });
    }
    }"""

new_or = """                if (data.choices && data.choices[0] && data.choices[0].message) {
                    const text = data.choices[0].message.content;
                    if (supabase) {
                        try { await supabase.from('query_cache').upsert([{ prompt: prompt.trim(), response: text }], { onConflict: 'prompt' }); } catch(e) {}
                    }
                    return res.status(200).json({ result: text, provider: "OpenRouter" });
                }"""

replace_in_file('api/chat.js', old_or, new_or)

# Clean up Pollinations block
old_pol = """            if (polRes.ok) {
                const text = await polRes.text();
                {
        if (supabase) {
            try { await supabase.from('query_cache').upsert([{ prompt: prompt.trim(), response: text }], { onConflict: 'prompt' }); } catch(e) {}
        }
        {
        if (supabase) {
            try { await supabase.from('query_cache').upsert([{ prompt: prompt.trim(), response: text }], { onConflict: 'prompt' }); } catch(e) {}
        }
        return res.status(200).json({ result: text, provider: "Pollinations" });
    }
    }
            }"""

new_pol = """            if (polRes.ok) {
                const text = await polRes.text();
                if (supabase) {
                    try { await supabase.from('query_cache').upsert([{ prompt: prompt.trim(), response: text }], { onConflict: 'prompt' }); } catch(e) {}
                }
                return res.status(200).json({ result: text, provider: "Pollinations" });
            }"""

replace_in_file('api/chat.js', old_pol, new_pol)

# Clean up SambaNova block
old_samba = """                if (data.choices && data.choices[0] && data.choices[0].message) {
                    {
        if (supabase) {
            try { await supabase.from('query_cache').upsert([{ prompt: prompt.trim(), response: data.choices[0].message.content }], { onConflict: 'prompt' }); } catch(e) {}
        }
        {
        if (supabase) {
            try { await supabase.from('query_cache').upsert([{ prompt: prompt.trim(), response: data.choices[0].message.content }], { onConflict: 'prompt' }); } catch(e) {}
        }
        return res.status(200).json({ result: data.choices[0].message.content, provider: "SambaNova" });
    }
    }"""

new_samba = """                if (data.choices && data.choices[0] && data.choices[0].message) {
                    const text = data.choices[0].message.content;
                    if (supabase) {
                        try { await supabase.from('query_cache').upsert([{ prompt: prompt.trim(), response: text }], { onConflict: 'prompt' }); } catch(e) {}
                    }
                    return res.status(200).json({ result: text, provider: "SambaNova" });
                }"""

replace_in_file('api/chat.js', old_samba, new_samba)
