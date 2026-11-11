import { DurableObject } from 'cloudflare:workers'

/**
 * One shared room for everyone viewing the portfolio.
 *
 * Uses the WebSocket Hibernation API, so idle connections cost nothing.
 * Each socket gets a short id and a colour index (stored as its attachment).
 *
 * Client → room:  { t: 'm', x, y }        cursor moved (x: 0..1 of width, y: 0..1 of page height)
 *                 { t: 'h' }              cursor hidden (left the window)
 * Room → client:  { t: 'hi', id, n }     your id and current count
 *                 { t: 'n', n }          people count changed
 *                 { t: 'm', id, x, y, c } someone moved
 *                 { t: 'x', id }         someone left or hid their cursor
 */

type Attachment = { id: string; c: number }

const MAX_PEOPLE = 200

export class PresenceRoom extends DurableObject {
  async fetch(req: Request): Promise<Response> {
    const sockets = this.ctx.getWebSockets()
    if (sockets.length >= MAX_PEOPLE) return new Response('Room full', { status: 503 })

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)
    const att: Attachment = { id: crypto.randomUUID().slice(0, 8), c: Math.floor(Math.random() * 4) }
    this.ctx.acceptWebSocket(server)
    server.serializeAttachment(att)

    const n = sockets.length + 1
    server.send(JSON.stringify({ t: 'hi', id: att.id, n }))
    this.broadcast({ t: 'n', n }, server)

    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    if (typeof raw !== 'string' || raw.length > 200) return
    let msg: { t?: string; x?: number; y?: number }
    try {
      msg = JSON.parse(raw)
    } catch {
      return
    }
    const att = ws.deserializeAttachment() as Attachment
    if (msg.t === 'm' && typeof msg.x === 'number' && typeof msg.y === 'number') {
      const x = Math.min(1, Math.max(0, msg.x))
      const y = Math.min(1, Math.max(0, msg.y))
      this.broadcast({ t: 'm', id: att.id, x: +x.toFixed(4), y: +y.toFixed(4), c: att.c }, ws)
    } else if (msg.t === 'h') {
      this.broadcast({ t: 'x', id: att.id }, ws)
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    this.leave(ws)
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    this.leave(ws)
  }

  private leave(ws: WebSocket) {
    const att = ws.deserializeAttachment() as Attachment | null
    try {
      ws.close(1000, 'bye')
    } catch {
      /* already closed */
    }
    const n = this.ctx.getWebSockets().filter((s) => s !== ws && s.readyState === WebSocket.OPEN).length
    if (att) this.broadcast({ t: 'x', id: att.id }, ws)
    this.broadcast({ t: 'n', n }, ws)
  }

  private broadcast(msg: unknown, except?: WebSocket) {
    const data = JSON.stringify(msg)
    for (const s of this.ctx.getWebSockets()) {
      if (s === except || s.readyState !== WebSocket.OPEN) continue
      try {
        s.send(data)
      } catch {
        /* ignore dead sockets */
      }
    }
  }
}
