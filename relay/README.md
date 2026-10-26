# ezlook-anthropic-relay

Minimal non-Cloudflare relay for `POST https://api.anthropic.com/v1/messages`,
hosted on Render (not Cloudflare). See `server.js` for the full rationale.

Deployed separately from the main lookbook-ai Worker — this directory is not
part of the Vite/Workers build (`vite build` only processes `src/`).

## Env vars (set on Render)

- `RELAY_SECRET` — shared secret the caller must send as `X-Relay-Secret`.
  The relay does not hold an Anthropic API key itself; callers pass their own
  `x-api-key`/`anthropic-version` headers through unchanged.

## Usage from the Worker

```ts
fetch('https://<render-service>.onrender.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2026-10-21',
    'X-Relay-Secret': relaySecret,
  },
  body: JSON.stringify({ ... }),
})
```

Response status/body are passed through from Anthropic unchanged.
