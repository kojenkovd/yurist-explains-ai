# Юрист объясняет | AI — V8

Premium Telegram Mini App / web dashboard for citizens in Russia.

## Frontend

`index.html` is self-contained and uses `background.jpg`. It can be published as a static GitHub Pages site.

## Serverless AI

`worker.js` is a Cloudflare Workers backend with a Workers AI binding named `AI`. It exposes:

- `POST /analyze` — structured document analysis;
- `POST /chat` — legal AI chat;
- `POST /generate` — document generation;
- `GET /health` — health check.

The frontend currently uses local extraction/screening by default. Set `API_ENDPOINT` in `index.html` (or wire `config.example.js`) after deploying the Worker.

Never put AI tokens or other secrets in GitHub Pages or browser JavaScript. Use Cloudflare bindings/secrets on the server side.
