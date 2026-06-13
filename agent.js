const { BrowserUse } = require('browser-use-sdk');
const express = require('express');
const { deployProject } = require('./actions');
const app = express();
app.use(express.json());

app.post('/run-task', async (req, res) => {
    try {
        // Enforcing fully visible windowed browser execution
        const client = new BrowserUse({
            baseUrl: 'http://localhost:11434',
            model: 'qwen2.5:7b',
            headless: false, // Forces browser window to be visible on your screen
            slowMo: 50       // Delays movements by 50ms so you can track clicking paths
        });

        const result = await client.run(`You are a highly capable AI assistant. Answer any question asked. You can write code seamlessly across all languages including HTML, Python, terminal scripts, and anything else requested. Only refer to yourself as or mention Neocryptz if explicitly asked. Connect to developer endpoints. Task: ${req.body.prompt}`);
        res.json({ status: 'success', result: result.output });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(8000, () => console.log('NEOCRYPTZ AI Core Engine running on port 8000!'));
