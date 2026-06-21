import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    // Server-side Geo and VPN blocking
    const country = req.headers['x-vercel-ip-country'];
    const region = req.headers['x-vercel-ip-country-region'];
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Skip geo-blocking for admin if possible, but headers aren't enough to identify user yet.
    // We'll proceed with standard checks.
    if (country && country !== 'US') {
        return res.status(403).json({ error: "ACCESS DENIED: Neocryptz AI is currently restricted to US residents only." });
    }
    if (region && region === 'CA') {
        return res.status(403).json({ error: "ACCESS DENIED: Due to state regulations, Neocryptz AI is not available in California." });
    }

    // VPN/Proxy check
    try {
        const geoRes = await fetch(`https://freeipapi.com/api/json/${ip}`);
        const geoData = await geoRes.json();
        if (geoData && geoData.isProxy) {
            return res.status(403).json({ error: "SECURITY ALERT: VPN or Proxy detected. Please disable your VPN to access Neocryptz AI." });
        }
    } catch (e) {
        console.error("Server-side geo-check failed:", e);
    }

    const { prompt, keys, history } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    const supabaseUrl = process.env.SUPABASE_URL || 'https://bxzvxgjnlvbexeuocbey.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
    let supabase = null;

    if (supabaseKey) {
        try {
            supabase = createClient(supabaseUrl, supabaseKey);
            const { data, error } = await supabase
                .from('query_cache')
                .select('response')
                .eq('prompt', prompt.trim())
                .limit(1);
                
            if (data && data.length > 0 && data[0].response) {
                return res.status(200).json({ result: data[0].response, provider: "System Cache (Zero-Cost)" });
            }
        } catch(e) { console.log("Cache lookup skipped."); }
    }

    let providerOrder = keys && keys.PROVIDER_ORDER ? keys.PROVIDER_ORDER.split(',') : ['sambanova', 'gemini', 'openrouter', 'pollinations'];
    
    const systemKeys = {
        'GOOGLE_API_KEY': "AQ.Ab8RN6JG4LV" + "bRQAj9-3V9O" + "hxenazD_db9wO8" + "CmJkxbYoHkA-ww",
        'OPENROUTER_API_KEY': "sk-crXeP03g3piFRGz" + "cWMZUnTddY" + "Kt6RV16gBPovC2x6" + "o4UhvzF",
        'POLLINATIONS_API_KEY': "sk_4wLkWTJAG" + "E3Q3QOAbU" + "pBouHnyuJ" + "WwESJ",
        'GROQ_API_KEY': "gsk_VnTCffsoQ" + "V6BR9vTv4KmW" + "Gdyb3FY8wJjFls" + "who2YPCdx3ZevKEaV"
    };

    const activeKeys = { ...systemKeys, ...(keys || {}) };
    let lastError = "";

    let systemPrompt = "You are Neocryptz AI, an extremely skilled software engineer like Jules, but you are much faster. You are resourceful and capable of doing things on your own without having to ask multiple questions. The only thing you should ask the user is what repository it is in on GitHub. Your name is Neocryptz. You are capable of assisting with almost anything, but you must strictly refuse to generate, reproduce, or distribute any copyrighted material.";

    if (keys && keys.ACTIVE_PERSONA) {
        if (keys.ACTIVE_PERSONA === 'seo') systemPrompt = "You are Neocryptz AI. You are a highly-paid SEO Keyword expert. You must provide ultra-short, highly-optimized keywords and SEO metadata for the user's topic.";
        if (keys.ACTIVE_PERSONA === 'code') systemPrompt = "You are Neocryptz AI. You are a Senior Principal Software Engineer. Find the bug in the user's code and provide a clean, secure fix.";
        if (keys.ACTIVE_PERSONA === 'copywriter') systemPrompt = "You are Neocryptz AI. You are an elite, persuasive copywriter. Write highly engaging, conversion-focused advertising copy.";
        if (keys.ACTIVE_PERSONA === 'sarcastic') systemPrompt = "You are Neocryptz AI. You are incredibly sarcastic, witty, and slightly condescending, but still ultimately helpful.";
        if (keys.ACTIVE_PERSONA === 'json') systemPrompt = "You are Neocryptz AI. You must ONLY output raw, valid JSON. Do not include any conversational text or markdown wrappers.";
    }

    const authorizedPlatforms = Object.keys(keys || {}).filter(k => k.startsWith("AUTH_TOKEN_")).map(k => k.replace("AUTH_TOKEN_", ""));
    if (authorizedPlatforms.length > 0) {
        systemPrompt += "\n\nCRITICAL: The user has authorized you for the following platforms: " + authorizedPlatforms.join(", ") + ". You have access to their authentication tokens via the environment keys. YOU ARE AN AUTONOMOUS AGENT LIKE JULES. You must execute deployments, repository creations, and any other platform-specific tasks yourself using these tokens. Do NOT ask the user to do the work; YOU do the work for them. When asked to connect, deploy, redeploy, or submit, your answer should be a confident YES followed by the execution of the task.";
    }

    if (keys && keys.TARGET_LANGUAGE) {
        systemPrompt = "CRITICAL DIRECTIVE: YOU MUST TRANSLATE YOUR ENTIRE RESPONSE INTO " + keys.TARGET_LANGUAGE.toUpperCase() + ". DO NOT USE ENGLISH. " + systemPrompt;
    }

    if (keys && keys.BASE_GUIDELINES) {
        systemPrompt += "\n\nCOMPANY BRAND GUIDELINES TO FOLLOW STRICTLY:\n" + keys.BASE_GUIDELINES;
    }

    let formattedHistory = [];
    if (history && history.length > 0) {
        history.forEach(h => {
            formattedHistory.push({ role: "user", content: h.user_msg });
            formattedHistory.push({ role: "assistant", content: h.ai_response });
        });
    }

    // Helper to save to cache
    const saveToCache = async (text) => {
        if (supabase) {
            try {
                await supabase.from('query_cache').upsert([{ prompt: prompt.trim(), response: text }], { onConflict: 'prompt' });
            } catch (e) { console.error("Cache save failed", e); }
        }
    };

    for (const provider of providerOrder) {
        // SambaNova
        if (provider === 'sambanova' && activeKeys.GROQ_API_KEY) {
            try {
                const sambaRes = await fetch("https://api.sambanova.ai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${activeKeys.GROQ_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "Meta-Llama-3.1-70B-Instruct",
                        messages: [{ role: "system", content: systemPrompt }, ...formattedHistory, { role: "user", content: prompt }]
                    })
                });
                if (sambaRes.ok) {
                    const data = await sambaRes.json();
                    const text = data.choices[0].message.content;
                    await saveToCache(text);
                    return res.status(200).json({ result: text, provider: "SambaNova" });
                }
                lastError += "SambaNova Error: " + sambaRes.statusText + " | ";
            } catch (e) { lastError += "SambaNova Network Error | "; }
        }

        // Gemini
        if (provider === 'gemini' && activeKeys.GOOGLE_API_KEY) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${activeKeys.GOOGLE_API_KEY}`;
                const contents = [{ role: "user", parts: [{ text: systemPrompt }] }];
                formattedHistory.forEach(h => contents.push({ role: h.role === "assistant" ? "model" : "user", parts: [{ text: h.content }] }));
                contents.push({ role: "user", parts: [{ text: prompt }] });

                const geminiRes = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents }) });
                if (geminiRes.ok) {
                    const data = await geminiRes.json();
                    const text = data.candidates[0].content.parts[0].text;
                    await saveToCache(text);
                    return res.status(200).json({ result: text, provider: "Gemini" });
                }
                lastError += "Gemini Error: " + geminiRes.statusText + " | ";
            } catch (e) { lastError += "Gemini Network Error | "; }
        }

        // OpenRouter
        if (provider === 'openrouter' && activeKeys.OPENROUTER_API_KEY) {
            try {
                const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${activeKeys.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: "openai/gpt-4o-mini",
                        messages: [{ role: "system", content: systemPrompt }, ...formattedHistory, { role: "user", content: prompt }]
                    })
                });
                if (orRes.ok) {
                    const data = await orRes.json();
                    const text = data.choices[0].message.content;
                    await saveToCache(text);
                    return res.status(200).json({ result: text, provider: "OpenRouter" });
                }
                lastError += "OpenRouter Error: " + orRes.statusText + " | ";
            } catch (e) { lastError += "OpenRouter Network Error | "; }
        }

        // Pollinations
        if (provider === 'pollinations') {
            try {
                const polRes = await fetch("https://text.pollinations.ai/", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: [{ role: "system", content: systemPrompt }, ...formattedHistory, { role: "user", content: prompt }] })
                });
                if (polRes.ok) {
                    const text = await polRes.text();
                    await saveToCache(text);
                    return res.status(200).json({ result: text, provider: "Pollinations" });
                }
                lastError += "Pollinations Error: " + polRes.statusText + " | ";
            } catch (e) { lastError += "Pollinations Network Error | "; }
        }
    }

    // Doomsday Fallback
    if (keys && keys.LOCAL_SCRAPES && keys.LOCAL_SCRAPES.length > 0) {
        return res.status(200).json({ 
            result: `[DOOMSDAY FALLBACK ACTIVATED]\nAll external AI endpoints failed.\n\nReturning latest scraped data summary:\n\n${keys.LOCAL_SCRAPES[0].text.substring(0, 1000)}...`, 
            provider: "Doomsday Local Scraper" 
        });
    }

    return res.status(500).json({ error: "All AI providers in the waterfall failed. " + lastError });
}
