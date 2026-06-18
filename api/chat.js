export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, keys, history, lang } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    let memoryContext = "";
    if (history && history.length > 0) {
        memoryContext = "\n\nRecent Chat History:\n" + history.map(h => `User: ${h.user_msg}\nAI: ${h.ai_response}`).join("\n");
    }

    const translateModifier = lang ? `\n\nCRITICAL INSTRUCTION: Translate the following user text/response into ${lang}. Do not add any other commentary.` : '';
    const systemPrompt = `You are a highly capable AI assistant. Keep all responses brief (under 50 words). Answer any question asked. You can write code seamlessly across all languages including HTML, Python, terminal scripts, and anything else requested. Only refer to yourself as or mention Neocryptz if explicitly asked.${memoryContext}${translateModifier}`;


    const supabaseUrl = process.env.SUPABASE_URL || keys?.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || keys?.SUPABASE_KEY;

    if (supabaseUrl && supabaseKey) {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Check for exact query match in global logs (Semantic Query Caching)
        try {
            const { data, error } = await supabase
                .from('logs')
                .select('response')
                .ilike('message', prompt.trim()) // case insensitive match
                .order('created_at', { ascending: false })
                .limit(1);

            if (data && data.length > 0 && data[0].response && !data[0].response.includes('Error')) {
                console.log("CACHE HIT: Serving from Semantic Query Cache.");
                return res.status(200).json({ result: "[CACHED RESPONSE] " + data[0].response });
            }
        } catch (e) {
            console.log("Cache lookup failed, proceeding to live API:", e.message);
        }
    }

    const defaultOrder = ['openrouter', 'together', 'anyscale', 'openai', 'gemini', 'groq', 'pollinations'];
    const providerOrderStr = keys?.PROVIDER_ORDER || '';
    const customOrder = providerOrderStr ? providerOrderStr.split(',').map(s=>s.trim()).filter(Boolean) : [];

    // Build the final fallback list: User's chosen order first, then append any remaining defaults to ensure automatic cycling
    const providerOrder = [...new Set([...customOrder, ...defaultOrder])];

    let finalResult = null;
    let lastError = "All AI Providers Failed.";

    for (const provider of providerOrder) {
        if (finalResult) break;

        try {
            if (provider === 'openrouter') {
                const key = keys?.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
                if (key) {
                    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                        body: JSON.stringify({ model: 'openrouter/auto', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }] })
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (data.choices?.[0]?.message?.content) finalResult = data.choices[0].message.content;
                    } else lastError = "OpenRouter Error: " + await response.text();
                }
            }
            else if (provider === 'together') {
                const key = keys?.TOGETHER_API_KEY || process.env.TOGETHER_API_KEY;
                if (key) {
                    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
                        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                        body: JSON.stringify({ model: 'meta-llama/Llama-3-8b-chat-hf', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }] })
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (data.choices?.[0]?.message?.content) finalResult = data.choices[0].message.content;
                    } else lastError = "Together Error: " + await response.text();
                }
            }
            else if (provider === 'anyscale') {
                const key = keys?.ANYSCALE_API_KEY || process.env.ANYSCALE_API_KEY;
                if (key) {
                    const response = await fetch('https://api.endpoints.anyscale.com/v1/chat/completions', {
                        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                        body: JSON.stringify({ model: 'meta-llama/Llama-2-7b-chat-hf', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }] })
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (data.choices?.[0]?.message?.content) finalResult = data.choices[0].message.content;
                    } else lastError = "Anyscale Error: " + await response.text();
                }
            }
            else if (provider === 'openai') {
                const key = keys?.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
                if (key) {
                    const response = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                        body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 150, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }] })
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (data.choices?.[0]?.message?.content) finalResult = data.choices[0].message.content;
                    } else lastError = "OpenAI Error: " + await response.text();
                }
            }
            else if (provider === 'gemini') {
                const key = keys?.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;
                if (key) {
                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${prompt}` }] }] })
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (data.candidates?.[0]?.content?.parts?.[0]?.text) finalResult = data.candidates[0].content.parts[0].text;
                    } else lastError = "Gemini Error: " + await response.text();
                }
            }
            else if (provider === 'groq') {
                const key = keys?.GROQ_API_KEY || process.env.GROQ_API_KEY;
                if (key) {
                    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                        body: JSON.stringify({ model: 'llama-3.1-8b-instant', max_tokens: 150, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }] })
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (data.choices?.[0]?.message?.content) finalResult = data.choices[0].message.content;
                    } else lastError = "Groq Error: " + await response.text();
                }
            }
            else if (provider === 'pollinations') {
                const response = await fetch('https://text.pollinations.ai/', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }], model: 'openai', jsonMode: false })
                });
                if (response.ok) {
                    const data = await response.text();
                    if (data && !data.includes('error')) finalResult = data.trim();
                } else lastError = "Pollinations Error: " + await response.text();
            }
        } catch (e) {
            lastError = `${provider} Exception: ${e.message}`;
        }
    }

    // Force fail for testing
    if (keys?.PROVIDER_ORDER === 'force_fail') {
        finalResult = null;
    }


    if (finalResult) {
        // Affiliate Link Injection
        let affiliateLink = "";
        const pLower = prompt.toLowerCase();
        if (pLower.includes('host') || pLower.includes('server') || pLower.includes('website')) affiliateLink = "\n\n[Sponsored: Build your next project with Bluehost! (Affiliate Link)]";
        else if (pLower.includes('code') || pLower.includes('learn') || pLower.includes('book')) affiliateLink = "\n\n[Sponsored: Learn to code on Coursera! (Affiliate Link)]";
        else if (pLower.includes('market') || pLower.includes('seo') || pLower.includes('ads')) affiliateLink = "\n\n[Sponsored: Boost sales with SEMRush! (Affiliate Link)]";

        return res.status(200).json({ result: finalResult + affiliateLink });
    }


    // Ultimate Doomsday Fallback: Return locally scraped data if all AI fails
    const scrapes = keys?.LOCAL_SCRAPES;
    if (scrapes && scrapes.length > 0) {
        const fallbackText = "[Doomsday Fallback Active] All Live AI Systems Offline. Displaying cached system scrape context:\n\n" + scrapes.slice(-2).map(s => `[${s.url}]: ${s.text.substring(0, 100)}...`).join("\n");
        return res.status(200).json({ result: fallbackText });
    }

    res.status(500).json({ error: lastError });

}