export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, keys, history } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    let memoryContext = "";
    if (history && history.length > 0) {
        memoryContext = "\n\nRecent Chat History:\n" + history.map(h => `User: ${h.user_msg}\nAI: ${h.ai_response}`).join("\n");
    }

    const systemPrompt = `You are a highly capable AI assistant. Keep all responses brief (under 50 words). Answer any question asked. You can write code seamlessly across all languages including HTML, Python, terminal scripts, and anything else requested. Only refer to yourself as or mention Neocryptz if explicitly asked.${memoryContext}`;

    // Provider 1: OpenAI (Requires OPENAI_API_KEY)
    const openaiKey = keys?.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (openaiKey) {
        try {
            const response1 = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    max_tokens: 150, // Hard limit
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt }
                    ]
                })
            });

            if (response1.ok) {
                const data1 = await response1.json();
                if (data1.choices && data1.choices[0].message && data1.choices[0].message.content) {
                    return res.status(200).json({ result: data1.choices[0].message.content });
                }
            } else {
                console.log("OpenAI API error:", await response1.text());
            }
        } catch (e) {
            console.log("Provider 1 (OpenAI) failed, falling back...", e);
        }
    }

    // Provider 2: Google Gemini (Requires GOOGLE_API_KEY from user settings)
    const geminiKey = keys?.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;
    if (geminiKey) {
        try {
            const response2 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${prompt}` }] }]
                })
            });

            if (response2.ok) {
                const data2 = await response2.json();
                if (data2.candidates && data2.candidates[0].content && data2.candidates[0].content.parts[0].text) {
                    return res.status(200).json({ result: data2.candidates[0].content.parts[0].text });
                }
            } else {
                console.log("Gemini API error:", await response2.text());
            }
        } catch (e) {
            console.log("Provider 2 (Gemini) failed, falling back...", e);
        }
    }

    // Provider 3: Groq (Requires GROQ_API_KEY from user settings)
    let lastError = "";
    const groqKey = keys?.GROQ_API_KEY || process.env.GROQ_API_KEY;
    if (groqKey) {
        try {
            const response3 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${groqKey}`
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    max_tokens: 150, // Hard limit to physically prevent massive token burns (e.g. 2000 token stories)
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt }
                    ]
                })
            });

            if (response3.ok) {
                const data3 = await response3.json();
                if (data3.choices && data3.choices[0].message && data3.choices[0].message.content) {
                    return res.status(200).json({ result: data3.choices[0].message.content });
                }
            } else {
                const errorText = await response3.text();
                console.log("Groq API error:", errorText);
                try {
                    const parsed = JSON.parse(errorText);
                    lastError = `Groq Error: ${parsed.error?.message || 'Invalid API Key or Rate Limit'}`;
                } catch(e) {
                    lastError = "Groq Error: Invalid API Key or Rate Limit";
                }
            }
        } catch (e) {
            console.log("Provider 3 (Groq) failed, falling back...", e);
            lastError = "Groq Request Failed completely.";
        }
    }

    // Provider 4: Free open Pollinations API (No Key Required)
    // Absolute fallback when keys fail or token limits hit
    try {
        const response4 = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                model: 'openai',
                jsonMode: false
            })
        });

        if (response4.ok) {
            const data4 = await response4.text();
            if (data4 && !data4.includes('error')) {
                return res.status(200).json({ result: data4.trim() });
            }
        }
    } catch (e) {
        console.log("Provider 4 (Pollinations) free fallback failed.", e);
    }

    // Ultimate Doomsday Fallback: Return locally scraped data if all AI fails
    const scrapes = keys?.LOCAL_SCRAPES;
    if (scrapes && scrapes.length > 0) {
        const fallbackText = "All Live AI Systems Offline. Displaying cached system scrape context:\n\n" + scrapes.slice(-2).map(s => `[${s.url}]: ${s.text.substring(0, 100)}...`).join("\n");
        return res.status(200).json({ result: fallbackText });
    }

    // Fallback: If no keys are provided, free endpoints fail, and no scrapes exist
    let errorDetail = "Offline fallback mode: Please provide a valid OpenAI, Google Gemini, or Groq API key in the admin settings to restore full AI functionality.";
    if (openaiKey || geminiKey || groqKey) {
        errorDetail = lastError ? lastError : "API Connection Failed: The provided API key(s) were invalid, expired, or rate-limited, and the free fallback servers are currently busy. Please check your admin settings or try again shortly.";
    }
    res.status(500).json({ error: errorDetail });
}
