const { BrowserUse } = require('browser-use-sdk');
const express = require('express');
const { deployProject } = require('./actions');
const app = express();
app.use(express.json());
const path = require('path');

// ── Serve index.html (original) ────────────────────────────────────────────
app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── API routes (added) ─────────────────────────────────────────────────────
// Lazy-load: each handler file is required on first request, not at startup.
function lazy(filePath) {
  let h = null, e = null;
  return async (req, res) => {
    if (!h && !e) {
      try { h = require(filePath); }
      catch (err) { e = err.message; console.error('lazy-load failed:', filePath, err.message); }
    }
    if (e) return res.status(503).json({ error: 'handler unavailable', reason: e });
    try { await h(req, res); }
    catch (err) { if (!res.headersSent) res.status(500).json({ error: err.message }); }
  };
}


app.get('/admin-login', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'admin-login.html'));
});
app.get('/api/ping', (_req, res) => res.json({ ok: true, v: 3 }));
app.all('/api/chat',                   lazy(path.join(__dirname, 'api/chat')));
app.all('/api/reward',                 lazy(path.join(__dirname, 'api/reward')));
app.all('/api/history',                lazy(path.join(__dirname, 'api/history')));
app.all('/api/migrate',                lazy(path.join(__dirname, 'api/migrate')));
app.all('/api/execute',                lazy(path.join(__dirname, 'api/execute')));
app.all('/api/deploy-status',          lazy(path.join(__dirname, 'api/deploy-status')));
app.all('/api/browser',                lazy(path.join(__dirname, 'api/browser')));
app.all('/api/browser-run',            lazy(path.join(__dirname, 'api/browser-run')));
app.all('/api/browser-session',        lazy(path.join(__dirname, 'api/browser-session')));
app.all('/api/image/generate',         lazy(path.join(__dirname, 'api/image/generate')));
app.all('/api/recommendations/active', lazy(path.join(__dirname, 'api/recommendations/active')));
app.all('/api/recommendations/go',     lazy(path.join(__dirname, 'api/recommendations/go')));
app.all('/api/admin/tiktok',           lazy(path.join(__dirname, 'api/tiktok-admin')));
app.all('/api/admin/upload-image',     lazy(path.join(__dirname, 'api/upload-image')));

// Serve other static assets (CSS, JS, images) — but NOT as a wildcard SPA
// so Express keeps routing /api/* to the handlers above.
app.use(express.static(__dirname, { index: false }));

// ── /run-task (original) ───────────────────────────────────────────────────
app.post('/run-task', async (req, res) => {
  try {
    const client = new BrowserUse({
      baseUrl: 'http://localhost:11434',
      model: 'qwen2.5:7b',
      headless: false,
      slowMo: 50
    });
    const result = await client.run('You are Neocryptz AI OS, an autonomous agent just like Jules. You are responsible for executing all technical tasks yourself, including connecting to platforms, deploying projects, and submitting code. When a user asks you to connect or deploy, you should automatically use the provided OAuth tokens to do so without asking the user for help. You do the work for them. Task: ' + req.body.prompt);
    res.json({ status: 'success', result: result.output });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ── /api/register — creates Supabase user via service key (auto-confirmed) ──
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) return res.status(400).json({ error: 'username, email and password required' });
    const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!svcKey) return res.status(500).json({ error: 'Server not configured for registration' });
    const supaRes = await fetch('https://bxzvxgjnlvbexeuocbey.supabase.co/auth/v1/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': svcKey, 'Authorization': 'Bearer ' + svcKey },
      body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { username } })
    });
    const data = await supaRes.json();
    if (data.id) {
      return res.json({ ok: true, id: data.id, email: data.email });
    } else {
      return res.status(400).json({ error: data.msg || data.message || 'Registration failed' });
    }
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
});

app.listen(8000, () => console.log('Neocryptz AI Core Engine running on port 8000!'));
