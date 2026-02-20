const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const penthouse = require('penthouse');

function minifyCss(css) {
  if (!css) {
    return '';
  }
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>+~])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

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
    const url = String(body.url || '').trim();
    const width = Number(body.width || 1366);
    const height = Number(body.height || 768);
    const timeout = Number(body.timeout || 60000);
    const userAgent = String(body.userAgent || 'WPCC-Generator').trim();

    if (!url) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing url' }));
      return;
    }

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: {
        width,
        height,
        deviceScaleFactor: 1,
      },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    let css = '';
    try {
      const page = await browser.newPage();
      if (userAgent) {
        await page.setUserAgent(userAgent);
      }
      await page.goto(url, { waitUntil: 'networkidle2', timeout });

      try {
        css = await penthouse({
          url,
          width,
          height,
          timeout,
          userAgent,
          pageLoadSkipTimeout: timeout,
          puppeteer: {
            getBrowser: async () => browser,
          },
          forceInclude: [],
          renderWaitTime: 300,
          blockJSRequests: false,
        });
      } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        if (!/css should not be empty/i.test(msg)) {
          throw err;
        }

        css = await page.evaluate(() => {
          let out = '';
          for (const sheet of Array.from(document.styleSheets || [])) {
            try {
              const rules = sheet.cssRules;
              if (!rules) continue;
              for (const rule of Array.from(rules)) {
                out += `${rule.cssText}\n`;
              }
            } catch (e) {
              // Ignore cross-origin/inaccessible stylesheets.
            }
          }
          return out;
        });
      }
    } finally {
      await browser.close();
    }

    css = minifyCss(css);
    if (!css) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: 'Generated CSS is empty' }));
      return;
    }

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
