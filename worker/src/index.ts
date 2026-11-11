/**
 * Portfolio API (Cloudflare Worker).
 *
 *   GET  /projects   published projects from D1, ordered by display_order
 *   POST /contact    store a contact message in D1 (Turnstile-verified when a secret is set)
 *   GET  /presence   WebSocket upgrade into the shared PresenceRoom Durable Object
 *   GET  /health     liveness check
 *
 * CORS is limited to ALLOWED_ORIGINS.
 */
export { PresenceRoom } from './presence'

export interface Env {
  DB: D1Database
  PRESENCE: DurableObjectNamespace
  ALLOWED_ORIGINS: string
  TURNSTILE_SECRET?: string
}

type ProjectRow = {
  slug: string
  title: string
  tagline: string
  summary: string
  highlights: string
  tech_stack: string
  repo_url: string | null
  demo_url: string | null
  image_url: string
  video_url: string | null
  is_private: number
  embeddable: number
  featured: number
  display_order: number
  year: string
}

const allowedOrigin = (req: Request, env: Env): string | null => {
  const origin = req.headers.get('Origin')
  if (!origin) return null
  const list = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  return list.includes(origin) ? origin : null
}

const cors = (origin: string | null): Record<string, string> =>
  origin
    ? {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
      }
    : { Vary: 'Origin' }

const json = (data: unknown, status: number, origin: string | null, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(origin), ...extra },
  })

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function getProjects(env: Env, origin: string | null): Promise<Response> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM projects WHERE published = 1 ORDER BY display_order ASC',
  ).all<ProjectRow>()
  const projects = results.map((r) => ({
    slug: r.slug,
    title: r.title,
    tagline: r.tagline,
    summary: r.summary,
    highlights: JSON.parse(r.highlights || '[]'),
    tech: JSON.parse(r.tech_stack || '[]'),
    repoUrl: r.repo_url,
    demoUrl: r.demo_url,
    image: r.image_url,
    video: r.video_url ?? undefined,
    isPrivate: r.is_private === 1,
    embeddable: r.embeddable === 1,
    featured: r.featured === 1,
    order: r.display_order,
    year: r.year,
  }))
  return json(projects, 200, origin, { 'Cache-Control': 'public, max-age=60' })
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

async function postContact(req: Request, env: Env, origin: string | null): Promise<Response> {
  // Browsers always send Origin on cross-site POSTs; refuse anything else.
  if (!origin) return json({ error: 'Origin not allowed' }, 403, null)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400, origin)
  }

  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim()
  const message = String(body.message ?? '').trim()
  const honeypot = String(body.company ?? '')
  const token = String(body.turnstileToken ?? '')

  if (honeypot) return json({ ok: true }, 200, origin) // quietly drop bots
  if (name.length < 1 || name.length > 120) return json({ error: 'Please add your name.' }, 400, origin)
  if (!EMAIL_RE.test(email) || email.length > 200) return json({ error: 'Please use a valid email.' }, 400, origin)
  if (message.length < 1 || message.length > 5000) return json({ error: 'Please write a message (up to 5000 characters).' }, 400, origin)

  const ip = req.headers.get('CF-Connecting-IP') ?? ''

  if (env.TURNSTILE_SECRET) {
    const form = new FormData()
    form.append('secret', env.TURNSTILE_SECRET)
    form.append('response', token)
    if (ip) form.append('remoteip', ip)
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
    const outcome = (await res.json()) as { success: boolean }
    if (!outcome.success) return json({ error: 'Verification failed. Please try again.' }, 403, origin)
  }

  // Light rate limit: at most 5 messages per address per hour.
  const ipHash = ip ? (await sha256(`aroi-me:${ip}`)).slice(0, 32) : null
  if (ipHash) {
    const row = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM contact_messages WHERE ip_hash = ? AND created_at > datetime('now', '-1 hour')",
    )
      .bind(ipHash)
      .first<{ n: number }>()
    if ((row?.n ?? 0) >= 5) return json({ error: 'Too many messages. Please try again later.' }, 429, origin)
  }

  await env.DB.prepare('INSERT INTO contact_messages (name, email, message, ip_hash, user_agent) VALUES (?, ?, ?, ?, ?)')
    .bind(name, email, message, ipHash, (req.headers.get('User-Agent') ?? '').slice(0, 300))
    .run()

  return json({ ok: true }, 201, origin)
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    const origin = allowedOrigin(req, env)

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) })

    try {
      if (url.pathname === '/health') return json({ ok: true }, 200, origin)
      if (url.pathname === '/projects' && req.method === 'GET') return await getProjects(env, origin)
      if (url.pathname === '/contact' && req.method === 'POST') return await postContact(req, env, origin)
      if (url.pathname === '/presence') {
        if (req.headers.get('Upgrade') !== 'websocket') return json({ error: 'Expected WebSocket' }, 426, origin)
        // WebSocket upgrades carry Origin too; only our sites may join the room.
        if (!origin) return new Response('Origin not allowed', { status: 403 })
        const id = env.PRESENCE.idFromName('global')
        return env.PRESENCE.get(id).fetch(req)
      }
      return json({ error: 'Not found' }, 404, origin)
    } catch (err) {
      console.error(err)
      return json({ error: 'Server error' }, 500, origin)
    }
  },
} satisfies ExportedHandler<Env>
