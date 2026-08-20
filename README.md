# study-homepage

Kid-friendly study homepage (Vite + React) with a small Express + SQLite backend.

## Run (dev)

### 1) Server

1. Create `server/.env` (see `server/.env.example`)
2. Install + start:
   - `cd server`
   - `npm install`
   - `npm run dev`

Server runs on `http://localhost:3000`.

### 2) Client

- `cd client`
- `npm install`
- `npm run dev`

Client runs on Vite default port (usually `http://localhost:5173`).

## AI English Talk (Gemini + browser voice)

- Page: `AI 영어 대화` (`/english-talk`)
- Speech recognition / speech synthesis uses browser features (best on Chrome/Edge).
- Server uses Gemini for text replies:
  - `POST /api/v1/ai/english-chat`
  - Set `GEMINI_API_KEY` in `server/.env`

Daily usage limit (default 60 minutes) is enforced on the server (based on turns) and can be changed in Parent Mode.

## Cheaper Gemini setup (recommended)

For kid-level conversation, you don't need a high-end model. This project supports setting cheaper Gemini models via env:

- `GEMINI_MODEL` (conversation)
- `GEMINI_MODEL_MEANINGS` (Korean meanings for "Today words")

To see which models your API key can use and get a recommendation:

- `cd server`
- `npm run gemini:list-models`
- `npm run gemini:recommend`

Then copy the suggested `GEMINI_MODEL=...` lines into `server/.env`.

## Accounts / Parent mode

- Login automatically creates an account if it doesn't exist yet.
- You can set a Parent PIN at account creation time (Login page).
- Parent report/settings: `/parent`

## Production notes

- Set `NODE_ENV=production`
- Set `CLIENT_ORIGIN` in `server/.env` (comma-separated allowed origins).
- Set a strong `JWT_SECRET`.
- Optional: `LOG_SLOW_MS=1500` to log slow requests (ms).
- Health check: `GET /api/v1/health`

## Mobile (voice)

- Mobile browsers usually require **HTTPS** for microphone access (except `localhost`).
- Recommended: Android Chrome/Edge for Web Speech (speech recognition).
- iOS Safari has limited speech recognition support. This app can optionally use **Audio mode** (record → server STT) if `OPENAI_API_KEY` is configured.

## Ngrok (test on Android Chrome)

If you want to use the dev server on your phone (with HTTPS for mic access), ngrok is the simplest:

1. Start server: `cd server && npm run dev`
2. Start client: `cd client && npm run dev`
3. Expose the client: `ngrok http 5173`
4. Open the `https://....ngrok-free.dev` URL on your Android Chrome.

Notes:
- You only need to expose `5173` because the Vite dev server proxies `/api` to `http://localhost:3000`.
- If you see ngrok's warning/interstitial, reload once. API requests also send `ngrok-skip-browser-warning` automatically.

## Cost estimation (optional)

This project can show estimated AI cost using recorded token usage, but you must provide pricing yourself (prices change).

- Set `AI_PRICING_JSON` in `server/.env` (USD per 1,000,000 tokens).
- Example:
  - `AI_PRICING_JSON={"gemini":{"gemini-1.5-flash":{"input_usd_per_m":0,"output_usd_per_m":0}},"openai":{"gpt-4o-mini":{"input_usd_per_m":0,"output_usd_per_m":0}}}`

## Notes

- Do not paste API keys into chats or commit them. Put them in `server/.env`.
- `npm run lint` / `npm run build` are available in `client/`.

## Backups

SQLite DB backups:

- Run once: `cd server; npm run backup`
- Retention: set `BACKUP_KEEP` in your environment (default: 30)

To schedule automatically:

- Windows: Task Scheduler → run `npm run backup` daily in `server/`
- Linux/macOS: cron → `cd /path/to/server && BACKUP_KEEP=30 npm run backup`
