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
      slowMo: 50      // Delays movements by 50ms so you can track clicking paths
    });

    const result = await client.run(`You are Neocryptz AI OS, an autonomous agent just like Jules. You are responsible for executing all technical tasks yourself, including connecting to platforms, deploying projects, and submitting code. When a user asks you to connect or deploy, you should automatically use the provided OAuth tokens to do so without asking the user for help. You do the work for them. Task: ${req.body.prompt}`);
    res.json({ status: 'success', result: result.output });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(8000, () => console.log('Neocryptz AI Core Engine running on port 8000!'));
