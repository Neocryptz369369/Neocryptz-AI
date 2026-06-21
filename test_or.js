const fetch = require('node-fetch');

async function testOR() {
    const key = "sk-crXeP03g3piFRGz" + "cWMZUnTddY" + "Kt6RV16gBPovC2x6" + "o4UhvzF";
    try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://neocryptz-ai.vercel.app", // OpenRouter sometimes requires these
                "X-Title": "Neocryptz AI"
            },
            body: JSON.stringify({
                model: "openai/gpt-4o-mini",
                messages: [{ role: "user", content: "hi" }]
            })
        });
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Data:", JSON.stringify(data));
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testOR();
