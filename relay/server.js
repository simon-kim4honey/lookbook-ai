// Minimal "dumb pipe" relay for POST https://api.anthropic.com/v1/messages.
//
// Why this exists: lookbook-ai's Cloudflare Worker calls api.anthropic.com
// directly, and both sides are Cloudflare-fronted ("Orange-to-Orange" traffic).
// That pattern intermittently gets blocked at the Cloudflare edge — the request
// never reaches Anthropic's application layer (no anthropic-ratelimit-*/
// x-request-id headers, ~15ms response), returning HTTP 403
// {"error":{"type":"forbidden","message":"Request not allowed"}}. Routing the
// call through this relay (hosted on Render, not Cloudflare) breaks that
// specific pattern since the outbound leg to Anthropic no longer originates
// from a Cloudflare-fronted host.
//
// The relay does not hold its own Anthropic API key — the caller (the Worker)
// sends its own x-api-key/anthropic-version headers through unchanged, exactly
// as it would when calling Anthropic directly. The relay only adds one piece
// of its own: a shared-secret check (X-Relay-Secret) so this isn't a wide-open
// proxy for anyone who finds the URL.

const http = require('http')

const PORT = process.env.PORT || 10000
const RELAY_SECRET = process.env.RELAY_SECRET

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('ok')
    return
  }

  if (req.method !== 'POST' || req.url !== '/v1/messages') {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'not found' }))
    return
  }

  if (!RELAY_SECRET || req.headers['x-relay-secret'] !== RELAY_SECRET) {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'unauthorized' }))
    return
  }

  const apiKey = req.headers['x-api-key']
  const anthropicVersion = req.headers['anthropic-version'] || '2026-10-21'
  if (!apiKey) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'missing x-api-key header' }))
    return
  }

  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const body = Buffer.concat(chunks)

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': anthropicVersion,
        'User-Agent': 'EZlook-relay/1.0 (+https://aifashion.co.kr)',
      },
      body,
    })
    const text = await upstream.text()
    res.writeHead(upstream.status, { 'Content-Type': upstream.headers.get('content-type') || 'application/json' })
    res.end(text)
  } catch (e) {
    res.writeHead(502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'relay fetch failed', message: String((e && e.message) || e) }))
  }
})

server.listen(PORT, () => console.log(`ezlook-anthropic-relay listening on ${PORT}`))
