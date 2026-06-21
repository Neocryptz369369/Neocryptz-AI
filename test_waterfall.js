const fetch = require('node-fetch');

async function testWaterfall() {
    const payload = {
        prompt: "Say hello",
        keys: { PROVIDER_ORDER: "groq,sambanova,gemini,openrouter,pollinations" },
        history: []
    };

    console.log("Testing chat API waterfall...");

    // Since we are in a serverless environment context, we can't easily call the handler directly without mock objects
    // But we can check the syntax and logic of the handler.
}

testWaterfall();
