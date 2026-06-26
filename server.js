'use strict';
const express = require('express');
const path = require('path');
const { pathToFileURL } = require('url');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API ping — synchronous, always registered first
app.get('/api/ping', (_req, res) => res.json({ ok: true, port: process.env.PORT }));

// Load API routes asynchronously
const ROUTES = [
  ['/api/chat',                   'api/chat.js'],
  ['/api/reward',                 'api/reward.js'],
  ['/api/history',                'api/history.js'],
  ['/api/migrate',                'api/migrate.js'],
  ['/api/execute',                'api/execute.js'],
  ['/api/deploy-status',          'api/deploy-status.js'],
  ['/api/browser',                'api/browser.js'],
  ['/api/browser-run',            'api/browser-run.js'],
  ['/api/browser-session',        'api/browser-session.js'],
  ['/api/image/generate',         'api/image/generate.js'],
  ['/api/recommendations/active', 'api/recommendations/active.js'],
  ['/api/recommendations/go',     'api/recommendations/go.js'],
];

(async () => {
  for (const [route, file] of ROUTES) {
    try {
      const url = pathToFileURL(path.join(__dirname, file)).href;
      const { default: handler } = await import(url);
      app.all(route, async (req, res) => {
        try { await handler(req, res); }
        catch (e) { if (!res.headersSent) res.status(500).json({ error: e.message }); }
      });
      console.log('OK', route);
    } catch (e) {
      console.error('FAIL', route, e.message);
      app.all(route, (_req, res) => res.status(503).json({ error: 'unavailable', reason: e.message }));
    }
  }

  // Static files + SPA fallback AFTER API routes
  app.use(express.static(__dirname));
  app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log('Neocryptz AI on port', PORT));
})();
