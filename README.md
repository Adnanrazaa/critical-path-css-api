# WP Critical Path CSS API

Remote critical-CSS generator for the WordPress plugin.

## Recommended deploy: Render (Docker)

1. Push this repo to GitHub.
2. In Render, create a new `Blueprint` or `Web Service` using this repo.
3. If using Blueprint, Render will use `render.yaml`.
4. Set env var:
   - `WPCC_API_KEY` (required)

Service endpoints:
- `POST /api/generate`
- `GET /health`

## Local run (Docker)

```bash
docker build -t wp-critical-path-api .
docker run --rm -p 3000:3000 -e WPCC_API_KEY=generate wp-critical-path-api
```

Then test:

```bash
curl -X POST http://localhost:3000/api/generate \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer generate' \
  -d '{"url":"https://example.com","width":1366,"height":768,"timeout":60000}'
```

Expected JSON:

```json
{ "css": "..." }
```

## WordPress plugin settings

In `Tools > WP Critical CSS`:

- `Generator Mode`: `Remote API`
- `Remote Endpoint`: your service URL + `/api/generate`
- `Remote API Key`: same as `WPCC_API_KEY`
