'use strict';
const express = require('express');
const path = require('path');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy handler: loads the API file on first request, not at startup.
// This guarantees the server always starts even if an API file has an issue.
function lazy(filePath) {
  let handler = null;
  let err = null;
  return async (req, res) => {
    if (!handler && !err) {
      try { handler = require(filePath); }
      catch(e) { err = e.message; console.error('lazy load failed:', filePath, e.message); }
    }
    if (err) return res.status(503).json({ error: 'handler unavailable', reason: err });
    try { await handler(req, res); }
    catch(e) { if (!res.headersSent) res.status(500).json({ error: e.message }); }
  };
}

// Health check — always works, confirms new code is running
app.get('/api/ping', (_req, res) => res.json({ ok: true, v: 'lazy-v1', ts: Date.now() }));

// API routes — loaded on first use
const apiRoutes = [
  ['/api/chat',                   './api/chat'],
  ['/api/reward',                 './api/reward'],
  ['/api/history',                './api/history'],
  ['/api/migrate',                './api/migrate'],
  ['/api/execute',                './api/execute'],
  ['/api/deploy-status',          './api/deploy-status'],
  ['/api/browser',                './api/browser'],
  ['/api/browser-run',            './api/browser-run'],
  ['/api/browser-session',        './api/browser-session'],
  ['/api/image/generate',         './api/image/generate'],
  ['/api/recommendations/active', './api/recommendations/active'],
  ['/api/recommendations/go',     './api/recommendations/go'],
];
for (const [route, file] of apiRoutes) {
  app.all(route, lazy(path.join(__dirname, file)));
}

// Static files + SPA fallback
app.use(express.static(__dirname));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log('Neocryptz AI (lazy-v1) on port', PORT));
