import { useSyncExternalStore } from 'react'
import { presenceUrl } from './api'

/**
 * Live presence: a tiny store fed by one WebSocket to the PresenceRoom
 * Durable Object. Holds the people count and everyone else's cursor.
 * Cursor positions are normalised: x is a fraction of viewport width,
 * y a fraction of total page height, so different screens line up.
 */

export type Peer = { id: string; x: number; y: number; c: number; seen: number }
type State = { connected: boolean; count: number; peers: Map<string, Peer> }

let state: State = { connected: false, count: 0, peers: new Map() }
const listeners = new Set<() => void>()
const emit = () => {
  state = { ...state, peers: new Map(state.peers) }
  listeners.forEach((l) => l())
}

let ws: WebSocket | null = null
let started = false
let retry = 0

function connect() {
  const url = presenceUrl()
  if (!url) return
  try {
    ws = new WebSocket(url)
  } catch {
    return
  }
  ws.onopen = () => {
    retry = 0
    state.connected = true
    emit()
  }
  ws.onmessage = (ev) => {
    let m: { t: string; id?: string; n?: number; x?: number; y?: number; c?: number }
    try {
      m = JSON.parse(ev.data)
    } catch {
      return
    }
    if ((m.t === 'hi' || m.t === 'n') && typeof m.n === 'number') state.count = m.n
    else if (m.t === 'm' && m.id) state.peers.set(m.id, { id: m.id, x: m.x ?? 0, y: m.y ?? 0, c: m.c ?? 0, seen: Date.now() })
    else if (m.t === 'x' && m.id) state.peers.delete(m.id)
    emit()
  }
  ws.onclose = () => {
    state.connected = false
    state.peers.clear()
    emit()
    // Back off and reconnect while the tab is open.
    retry = Math.min(retry + 1, 6)
    setTimeout(connect, 1000 * 2 ** retry)
  }
}

let lastSent = 0
let pending: { x: number; y: number } | null = null

function send(obj: unknown) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj))
}

export function startPresence() {
  if (started || !presenceUrl()) return
  started = true
  connect()

  const flush = () => {
    if (!pending) return
    send({ t: 'm', ...pending })
    pending = null
    lastSent = performance.now()
  }
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return
      const h = document.documentElement.scrollHeight || 1
      pending = { x: e.clientX / window.innerWidth, y: (e.clientY + window.scrollY) / h }
      // ~20 updates per second is plenty.
      if (performance.now() - lastSent > 50) flush()
      else setTimeout(flush, 50)
    },
    { passive: true },
  )
  document.documentElement.addEventListener('pointerleave', () => send({ t: 'h' }))

  // Forget cursors that went quiet.
  setInterval(() => {
    const now = Date.now()
    let changed = false
    for (const [id, p] of state.peers) if (now - p.seen > 15000) (state.peers.delete(id), (changed = true))
    if (changed) emit()
  }, 5000)
}

export function usePresence(): State {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
  )
}
