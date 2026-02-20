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

async function resolveLaunchOptions(width, height) {
  // Render/Docker path: system Chromium is available.
  if (process.env.CHROMIUM_PATH) {
    return {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.CHROMIUM_PATH,
      headless: true,
      defaultViewport: { width, height, deviceScaleFactor: 1 },
    };
  }

  // Serverless path: use Sparticuz Chromium.
  return {
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
    defaultViewport: { width, height, deviceScaleFactor: 1 },
  };
}

async function generateCriticalCss(params) {
  const url = String(params.url || '').trim();
  const width = Number(params.width || 1366);
  const height = Number(params.height || 768);
  const timeout = Number(params.timeout || 60000);
  const userAgent = String(params.userAgent || 'WPCC-Generator').trim();

  if (!url) {
    throw new Error('Missing url');
  }

  const launchOptions = await resolveLaunchOptions(width, height);
  const browser = await puppeteer.launch(launchOptions);

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
    throw new Error('Generated CSS is empty');
  }

  return css;
}

module.exports = { generateCriticalCss };
