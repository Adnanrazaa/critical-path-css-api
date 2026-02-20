const express = require('express');
const { generateCriticalCss } = require('./lib-generate');

const app = express();
app.use(express.json({ limit: '1mb' }));

function isAuthorized(req) {
  const configuredKey = process.env.WPCC_API_KEY || '';
  if (!configuredKey) {
    return true;
  }

  const authHeader = req.headers.authorization || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const headerKey = req.headers['x-wpcc-key'] || '';
  return bearer === configuredKey || headerKey === configuredKey;
}

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.post('/api/generate', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const css = await generateCriticalCss(req.body || {});
    return res.status(200).json({ css });
  } catch (err) {
    const message = err && err.message ? err.message : 'Generation failed';
    return res.status(500).json({ error: message });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`WP critical path API listening on port ${port}`);
});
