const fetch = require('node-fetch');

async function testGroq() {
    const key = "gsk_VnTCffsoQ" + "V6BR9vTv4KmW" + "Gdyb3FY8wJjFls" + "who2YPCdx3ZevKEaV";
    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
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

testGroq();
