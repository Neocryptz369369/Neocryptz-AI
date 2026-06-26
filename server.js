'use strict';
const express = require('express');
const path = require('path');
const { pathToFileURL } = require('url');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(__dirname));

// Health check — always available
app.get('/api/status', (_req, res) => res.json({ ok: true, loaded: globalThis._loadedRoutes || [] }));

const routes = [
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

globalThis._loadedRoutes = [];

async function start() {
  for (const [route, file] of routes) {
    // Use absolute file URL — avoids CWD vs __dirname mismatch on Render
    const absUrl = pathToFileURL(path.join(__dirname, file)).href;
    try {
      const mod = await import(absUrl);
      const handler = mod.default;
      if (typeof handler !== 'function') throw new Error('No default export');
      app.all(route, async (req, res) => {
        try { await handler(req, res); }
        catch (err) {
          console.error('[' + route + '] runtime error:', err.message);
          if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
        }
      });
      globalThis._loadedRoutes.push(route);
      console.log('✓ loaded', route);
    } catch (err) {
      console.error('✗ failed', route, err.message);
      app.all(route, (_req, res) => res.status(503).json({ error: 'Route unavailable', detail: err.message }));
    }
  }

  app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log('Neocryptz AI on port ' + PORT));
}

start().catch(err => { console.error('FATAL startup error:', err); process.exit(1); });
