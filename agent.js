const { BrowserUse } = require('browser-use-sdk');
const express = require('express');
const cors = require('cors');
const { deployProject } = require('./actions');
const app = express();
app.use(express.json());
app.use(cors());

app.post('/run-task', async (req, res) => {
    try {
        const prompt = req.body.prompt;
        console.log(`Processing task: ${prompt}`);

        // Check if Ollama is available
        try {
            const client = new BrowserUse({
                baseUrl: 'http://localhost:11434',
                model: 'qwen2.5:7b',
                headless: false,
                slowMo: 50
            });
            const result = await client.run(`You are NEOCRYPTZ AI OS. Connect to developer endpoints. Task: ${prompt}`);
            return res.json({ status: 'success', result: result.output });
        } catch (browserError) {
            console.warn('BrowserUse not available, using fallback:', browserError.message);
        }

        // Fallback response for demo/development
        const fallbackResponse = {
            status: 'success',
            result: `[NEOCRYPTZ AI - Demo Mode]\n\nTask processed: "${prompt}"\n\nTo enable full AI capabilities:\n1. Install Ollama: https://ollama.ai\n2. Run: ollama serve\n3. Pull model: ollama pull qwen2.5:7b\n4. Restart this server\n\nFor now, you're in demo/offline mode with mock responses.`
        };
        res.json(fallbackResponse);
    } catch (error) {
        console.error('Task error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(8000, () => console.log('NEOCRYPTZ AI Core Engine running on port 8000!'));
