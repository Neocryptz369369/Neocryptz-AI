const fetch = require('node-fetch');

async function testGemini() {
    const key = "AQ.Ab8RN6JG4LV" + "bRQAj9-3V9O" + "hxenazD_db9wO8" + "CmJkxbYoHkA-ww";
    try {
        // Try v1 instead of v1beta
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${key}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
        });
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Data:", JSON.stringify(data));
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testGemini();
