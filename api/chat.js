export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { prompt, keys, history } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    // The waterfall order exactly as requested: Gemini, OpenRouter, Pollinations, Groq
    let providerOrder = ['gemini', 'openrouter', 'pollinations', 'groq'];
    
    // Inject the hardcoded keys provided by the user if they are missing from the frontend payload
    const systemKeys = {
        'GOOGLE_API_KEY': process.env.GOOGLE_API_KEY,
        'OPENROUTER_API_KEY': process.env.OPENROUTER_API_KEY,
        'POLLINATIONS_API_KEY': process.env.POLLINATIONS_API_KEY,
        'GROQ_API_KEY': process.env.GROQ_API_KEY
    };

    const activeKeys = { ...systemKeys, ...(keys || {}) };

    let lastError = "";

    // Build the system prompt
    let systemPrompt = "You are NEOCRYPTZ AI, an advanced, highly skilled, and strictly objective artificial intelligence. You communicate clearly, effectively, and professionally. Your name is NEOCRYPTZ. ";
    
    // Add Doomsday Scrapes fallback data if provided
    if (keys && keys.LOCAL_SCRAPES && keys.LOCAL_SCRAPES.length > 0) {
        systemPrompt += "\n\nCRITICAL CONTEXT FROM SYSTEM SCRAPER:\n";
        keys.LOCAL_SCRAPES.forEach(s => {
            systemPrompt += `\n[Source: ${s.url}]\n${s.text.substring(0, 500)}...\n`;
        });
    }

    // Format chat history
    let formattedHistory = [];
    if (history && history.length > 0) {
        history.forEach(h => {
            formattedHistory.push({ role: "user", content: h.user_msg });
            formattedHistory.push({ role: "assistant", content: h.ai_response });
        });
    }

    // 1. Google Gemini
    if (providerOrder.includes('gemini') && activeKeys.GOOGLE_API_KEY) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${activeKeys.GOOGLE_API_KEY}`;
            const contents = [];
            
            // Format for Gemini API
            contents.push({ role: "user", parts: [{ text: systemPrompt }] });
            formattedHistory.forEach(h => {
                contents.push({
                    role: h.role === "assistant" ? "model" : "user",
                    parts: [{ text: h.content }]
                });
            });
            contents.push({ role: "user", parts: [{ text: prompt }] });

            const geminiRes = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents })
            });

            if (geminiRes.ok) {
                const data = await geminiRes.json();
                if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
                    return res.status(200).json({ result: data.candidates[0].content.parts[0].text, provider: "Gemini" });
                }
            } else {
                lastError += "Gemini Error: " + geminiRes.statusText + " | ";
            }
        } catch (e) {
            lastError += "Gemini Network Error | ";
        }
    }

    // 2. OpenRouter
    if (providerOrder.includes('openrouter') && activeKeys.OPENROUTER_API_KEY) {
        try {
            const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${activeKeys.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "openai/gpt-4o-mini", // Fast default on openrouter
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...formattedHistory,
                        { role: "user", content: prompt }
                    ]
                })
            });

            if (orRes.ok) {
                const data = await orRes.json();
                if (data.choices && data.choices[0] && data.choices[0].message) {
                    return res.status(200).json({ result: data.choices[0].message.content, provider: "OpenRouter" });
                }
            } else {
                 lastError += "OpenRouter Error: " + orRes.statusText + " | ";
            }
        } catch(e) {
            lastError += "OpenRouter Network Error | ";
        }
    }

    // 3. Pollinations AI (Free Tier bypass text generation)
    if (providerOrder.includes('pollinations')) {
        try {
            let messages = [
                { role: "system", content: systemPrompt },
                ...formattedHistory,
                { role: "user", content: prompt }
            ];
            
            const polRes = await fetch("https://text.pollinations.ai/", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: messages })
            });

            if (polRes.ok) {
                const text = await polRes.text();
                return res.status(200).json({ result: text, provider: "Pollinations" });
            } else {
                 lastError += "Pollinations Error: " + polRes.statusText + " | ";
            }
        } catch(e) {
            lastError += "Pollinations Network Error | ";
        }
    }

    // 4. Groq
    if (providerOrder.includes('groq') && activeKeys.GROQ_API_KEY) {
        try {
            const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${activeKeys.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama3-70b-8192",
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...formattedHistory,
                        { role: "user", content: prompt }
                    ]
                })
            });

            if (groqRes.ok) {
                const data = await groqRes.json();
                if (data.choices && data.choices[0] && data.choices[0].message) {
                    return res.status(200).json({ result: data.choices[0].message.content, provider: "Groq" });
                }
            } else {
                 lastError += "Groq Error: " + groqRes.statusText + " | ";
            }
        } catch(e) {
             lastError += "Groq Network Error | ";
        }
    }

    // Doomsday Fallback (If all APIs fail, but we have scrapes)
    if (keys && keys.LOCAL_SCRAPES && keys.LOCAL_SCRAPES.length > 0) {
        return res.status(200).json({ 
            result: `[DOOMSDAY FALLBACK ACTIVATED]\nAll external AI endpoints failed.\n\nReturning latest scraped data summary:\n\n${keys.LOCAL_SCRAPES[0].text.substring(0, 1000)}...`, 
            provider: "Doomsday Local Scraper" 
        });
    }

    return res.status(500).json({ error: "All AI providers in the waterfall failed. " + lastError });
}
