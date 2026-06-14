export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    const systemPrompt = "You are a highly capable AI assistant. Answer any question asked. You can write code seamlessly across all languages including HTML, Python, terminal scripts, and anything else requested. Only refer to yourself as or mention Neocryptz if explicitly asked.";

    // Provider 1: Pollinations AI (Free, no key required, routes to GPT/Llama)
    try {
        const response1 = await fetch('https://text.pollinations.ai/', {
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

        if (response1.ok) {
            const textResponse1 = await response1.text();
            if (textResponse1 && !textResponse1.includes('error')) {
                return res.status(200).json({ result: textResponse1 });
            }
        }
    } catch (e) {
        console.log("Provider 1 (Pollinations) failed, falling back...", e);
    }

    // Provider 2: Free open HuggingFace Inference API (Mistral/Zephyr)
    // Using a public proxy format if available, or a direct public HF endpoint without auth
    try {
        const response2 = await fetch('https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                inputs: `<|system|>\n${systemPrompt}</s>\n<|user|>\n${prompt}</s>\n<|assistant|>\n`,
                parameters: { max_new_tokens: 800, return_full_text: false }
            })
        });

        if (response2.ok) {
            const data2 = await response2.json();
            if (data2 && data2[0] && data2[0].generated_text) {
                return res.status(200).json({ result: data2[0].generated_text.trim() });
            }
        }
    } catch (e) {
        console.log("Provider 2 (HuggingFace) failed, falling back...", e);
    }

    // Fallback: If all endpoints fail or rate-limit
    res.status(500).json({ error: "All AI fallback providers are currently busy or unavailable. Please try again in a few moments!" });
}
