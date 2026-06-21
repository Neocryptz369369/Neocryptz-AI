const fetch = require('node-fetch');

async function testPollinations() {
    try {
        const res = await fetch("https://text.pollinations.ai/", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [{ role: "user", content: "hi" }] })
        });
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Text:", text);
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testPollinations();
