import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(__dirname));

const routes = [
  ['/api/chat',                   './api/chat.js'],
  ['/api/reward',                 './api/reward.js'],
  ['/api/history',                './api/history.js'],
  ['/api/migrate',                './api/migrate.js'],
  ['/api/execute',                './api/execute.js'],
  ['/api/deploy-status',          './api/deploy-status.js'],
  ['/api/browser',                './api/browser.js'],
  ['/api/browser-run',            './api/browser-run.js'],
  ['/api/browser-session',        './api/browser-session.js'],
  ['/api/image/generate',         './api/image/generate.js'],
  ['/api/recommendations/active', './api/recommendations/active.js'],
  ['/api/recommendations/go',     './api/recommendations/go.js'],
];

for (const [route, file] of routes) {
  const mod = await import(file);
  const handler = mod.default;
  app.all(route, async (req, res) => {
    try { await handler(req, res); }
    catch (err) {
      console.error(route, err.message);
      if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
    }
  });
}

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Neocryptz AI running on port ' + PORT));
