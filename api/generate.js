const { generateCriticalCss } = require('../lib-generate');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const configuredKey = process.env.WPCC_API_KEY || '';
    if (configuredKey) {
      const authHeader = req.headers.authorization || '';
      const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      const headerKey = req.headers['x-wpcc-key'] || '';
      if (bearer !== configuredKey && headerKey !== configuredKey) {
        res.statusCode = 401;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const css = await generateCriticalCss(body);

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ css }));
  } catch (err) {
    const message = err && err.message ? err.message : 'Generation failed';
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: message }));
  }
};
