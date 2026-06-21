const fetch = require('node-fetch');

async function testKeys() {
    const geminiKey = "AQ.Ab8RN6JG4LV" + "bRQAj9-3V9O" + "hxenazD_db9wO8" + "CmJkxbYoHkA-ww";
    const sambaKey = "e5161ccc" + "-519b-4c9c-90f2-" + "cd2b078bf12e";
    const orKey = "sk-crXeP03g3piFRGz" + "cWMZUnTddY" + "Kt6RV16gBPovC2x6" + "o4UhvzF";

    console.log("--- Testing Gemini ---");
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
        });
        console.log("Gemini Status:", res.status);
        const data = await res.json();
        if (res.status !== 200) console.log("Gemini Error:", JSON.stringify(data));
    } catch(e) { console.log("Gemini Fetch Error:", e.message); }

    console.log("--- Testing SambaNova ---");
    try {
        const res = await fetch("https://api.sambanova.ai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${sambaKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "Meta-Llama-3.1-70B-Instruct", messages: [{ role: "user", content: "hi" }] })
        });
        console.log("SambaNova Status:", res.status);
        const data = await res.json();
        if (res.status !== 200) console.log("SambaNova Error:", JSON.stringify(data));
    } catch(e) { console.log("SambaNova Fetch Error:", e.message); }

    console.log("--- Testing OpenRouter ---");
    try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${orKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "openai/gpt-4o-mini", messages: [{ role: "user", content: "hi" }] })
        });
        console.log("OpenRouter Status:", res.status);
        const data = await res.json();
        if (res.status !== 200) console.log("OpenRouter Error:", JSON.stringify(data));
    } catch(e) { console.log("OpenRouter Fetch Error:", e.message); }
}

testKeys();
