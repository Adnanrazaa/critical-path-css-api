# WPCC Vercel Worker

This is a remote critical-CSS generator for the WordPress plugin.

## Deploy on Vercel

1. Create a new Git repo containing this `vercel-worker` folder.
2. In Vercel, import that repo.
3. Framework preset: `Other`.
4. Build command: leave empty.
5. Output directory: leave empty.

Endpoint after deploy:
- `https://YOUR-PROJECT.vercel.app/api/generate`

## Environment variables

Set these in Vercel Project Settings:

- `WPCC_API_KEY` = a random secret string
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` = `1`
- `PUPPETEER_SKIP_DOWNLOAD` = `1`

## Local test

```bash
npm install
vercel dev
```

Then test:

```bash
curl -X POST http://localhost:3000/api/generate \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_KEY' \
  -d '{"url":"https://example.com","width":1366,"height":768,"timeout":60000}'
```

Expected JSON:

```json
{ "css": "..." }
```

## WordPress plugin settings

In `Tools > WP Critical CSS`:

- `Generator Mode`: `Remote API`
- `Remote Endpoint`: `https://YOUR-PROJECT.vercel.app/api/generate`
- `Remote API Key`: same value as `WPCC_API_KEY`

