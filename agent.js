'use strict';
const express = require('express');
const path = require('path');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── API routes (CommonJS require) ──────────────────────────────────────────
const routes = [
  ['/api/chat',                   require('./api/chat')],
  ['/api/reward',                 require('./api/reward')],
  ['/api/history',                require('./api/history')],
  ['/api/migrate',                require('./api/migrate')],
  ['/api/execute',                require('./api/execute')],
  ['/api/deploy-status',          require('./api/deploy-status')],
  ['/api/browser',                require('./api/browser')],
  ['/api/browser-run',            require('./api/browser-run')],
  ['/api/browser-session',        require('./api/browser-session')],
  ['/api/image/generate',         require('./api/image/generate')],
  ['/api/recommendations/active', require('./api/recommendations/active')],
  ['/api/recommendations/go',     require('./api/recommendations/go')],
];

for (const [route, handler] of routes) {
  app.all(route, async (req, res) => {
    try { await handler(req, res); }
    catch (e) { if (!res.headersSent) res.status(500).json({ error: e.message }); }
  });
  console.log('registered', route);
}

// Static files + SPA fallback
app.use(express.static(__dirname));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log('Neocryptz AI on port', PORT));
