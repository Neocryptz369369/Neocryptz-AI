'use strict';
const express = require('express');
const path = require('path');
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/ping', (_req, res) => res.json({ ok: true, port: process.env.PORT }));

// Single handler to stay under Vercel function limits
app.all('/api/:handler', async (req, res) => {
  const handlerName = req.params.handler;
  try {
    const handler = require('./api-hidden/' + handlerName + '.js');
    await handler(req, res);
  } catch (e) {
    res.status(404).json({ error: 'Endpoint not found' });
  }
});

app.use(express.static(__dirname));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Neocryptz AI on port', PORT));
