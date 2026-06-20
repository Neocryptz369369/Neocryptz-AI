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

        const result = await client.run(`You are NEOCRYPTZ AI OS. Connect to developer endpoints. You are fast, concise, and find the code yourself without asking questions. Task: ${req.body.prompt}`);
        res.json({ status: 'success', result: result.output });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(8000, () => console.log('NEOCRYPTZ AI Core Engine running on port 8000!'));
