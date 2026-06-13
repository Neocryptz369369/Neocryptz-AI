const { BrowserUse } = require('browser-use-sdk');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const { deployProject } = require('./actions');
const app = express();
app.use(express.json());
app.use(cors());

const upload = multer();

// Serve the frontend static file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// In-memory mock databases
let activeAds = [
    { id: '1', text: 'Sponsored Content 1', type: 'ticker', status: 'active' },
    { id: '2', text: 'Sponsored Content 2', type: 'ticker', status: 'active' }
];

let settings = {
    ticker_speed: 25,
    key_openai: '',
    key_anthropic: ''
};

// --- Ad Management Endpoints ---

app.get('/ads/active', (req, res) => {
    res.json(activeAds);
});

app.post('/admin/ads/create', (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const newAd = {
        id: uuidv4(),
        text: text,
        type: 'ticker', // default to ticker for now
        status: 'active'
    };
    activeAds.push(newAd);
    res.status(201).json(newAd);
});

app.delete('/admin/ads/:id', (req, res) => {
    const { id } = req.params;
    activeAds = activeAds.filter(ad => ad.id !== id);
    res.status(200).json({ status: 'success' });
});

// --- Settings Endpoints ---

app.get('/admin/settings', (req, res) => {
    res.json(settings);
});

app.post('/admin/settings', (req, res) => {
    settings = { ...settings, ...req.body };
    res.json(settings);
});

// --- Authentication & User Management Mock Endpoints ---

// Login endpoint mimicking OAuth password flow used in index.html
app.post('/token', upload.none(), (req, res) => {
    // For mock testing, just return a fake token immediately
    res.json({ access_token: "mock-token" });
});

// User identity endpoint mimicking /users/me
app.get('/users/me', (req, res) => {
    // Mock user response, marked as admin to expose admin section
    res.json({
        username: "admin",
        plan: "Power",
        credits: 999999,
        is_admin: true
    });
});

app.get('/admin/users', (req, res) => {
    res.json({
        "user1": { username: "admin", email: "admin@neocryptz.ai", plan: "Power", credits: 9999 }
    });
});

app.get('/admin/scrapes', (req, res) => {
    res.json([]);
});

app.post('/run-task', async (req, res) => {
    try {
        // Enforcing fully visible windowed browser execution
        const client = new BrowserUse({
            baseUrl: 'http://localhost:11434',
            model: 'qwen2.5:7b',
            headless: false, // Forces browser window to be visible on your screen
            slowMo: 50       // Delays movements by 50ms so you can track clicking paths
        });

        const result = await client.run(`You are NEOCRYPTZ AI OS. Connect to developer endpoints. Task: ${req.body.prompt}`);
        res.json({ status: 'success', result: result.output });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(8000, () => console.log('NEOCRYPTZ AI Core Engine running on port 8000!'));
