export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    const groqApiKey = process.env.GROQ_API_KEY;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama3-8b-8192', // Fast, reliable model on Groq
                messages: [
                    {
                        role: 'system',
                        content: 'You are a highly capable AI assistant. Answer any question asked. You can write code seamlessly across all languages including HTML, Python, terminal scripts, and anything else requested. Only refer to yourself as or mention Neocryptz if explicitly asked.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: data.error?.message || 'Failed to fetch from Groq' });
        }

        res.status(200).json({ result: data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
