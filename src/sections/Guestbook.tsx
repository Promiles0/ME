import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Loader2, Send } from 'lucide-react'
import { apiFetch, hasApi } from '../lib/api'
import { gsap, prefersReducedMotion } from '../lib/motion'
import SectionHeading from '../components/SectionHeading'
import Reveal from '../components/Reveal'

/**
 * Guestbook sky. Every visitor can leave one short word; each word is drawn
 * as a little constellation of grains that drifts in a shared night sky,
 * stored in D1 via the Worker. New words burst up from the input and settle
 * into place. Move the pointer through a word and its grains scatter.
 */

type Entry = { id: number; word: string }
type Grain = { ox: number; oy: number; x: number; y: number; vx: number; vy: number; tone: number }
type Star = { id: number; word: string; cx: number; cy: number; dx: number; dy: number; phase: number; born: number; grains: Grain[]; size: number }

const SEED: Entry[] = ['hello', 'murakoze', 'ship it', 'kigali', 'wow'].map((word, i) => ({ id: -i - 1, word }))

/** Sample grain offsets for a word, centred on (0,0). */
function sampleWord(word: string, size: number, max = 260): { x: number; y: number }[] {
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  const font = `400 ${size}px "Bebas Neue", Impact, sans-serif`
  ctx.font = font
  const w = Math.ceil(ctx.measureText(word.toUpperCase()).width) + 8
  const h = Math.ceil(size * 1.1)
  c.width = w
  c.height = h
  ctx.font = font
  ctx.textBaseline = 'middle'
  ctx.fillText(word.toUpperCase(), 4, h / 2)
  const { data } = ctx.getImageData(0, 0, w, h)
  const pts: { x: number; y: number }[] = []
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (data[(y * w + x) * 4 + 3] > 120) pts.push({ x: x - w / 2 + Math.random() * 1.5, y: y - h / 2 + Math.random() * 1.5 })
  // Thin to `max` grains, evenly.
  const step = Math.max(1, pts.length / max)
  const out: { x: number; y: number }[] = []
  for (let i = 0; i < pts.length && out.length < max; i += step) out.push(pts[Math.floor(i)])
  return out
}

export default function Guestbook() {
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const stars = useRef<Star[]>([])
  const pointer = useRef({ x: -9999, y: -9999 })
  const [entries, setEntries] = useState<Entry[]>(SEED)
  const [word, setWord] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'error' | 'sent'>('idle')
  const [msg, setMsg] = useState('')
  const reduced = prefersReducedMotion()

  // Load words (and refresh every 30 s while on screen).
  const load = useCallback(async () => {
    if (!hasApi) return
    try {
      const res = await apiFetch('/guestbook')
      if (!res.ok) return
      const data = (await res.json()) as Entry[]
      if (Array.isArray(data) && data.length) {
        // Drop the built-in starter words once the real sky has loaded.
        stars.current = stars.current.filter((s) => s.id > 0)
        setEntries(data)
      }
    } catch {
      /* keep what we have */
    }
  }, [])
  useEffect(() => {
    load()
    const id = setInterval(() => {
      const r = box.current?.getBoundingClientRect()
      if (r && r.bottom > 0 && r.top < window.innerHeight) load()
    }, 30000)
    return () => clearInterval(id)
  }, [load])

  // Place a star for every word we don't have yet.
  const place = useCallback((list: Entry[], fromInput = false) => {
    const el = box.current
    if (!el) return
    const W = el.clientWidth
    const H = el.clientHeight
    const have = new Set(stars.current.map((s) => s.id))
    const size = Math.max(26, Math.min(58, W / 16))
    const fresh = list.filter((e) => !have.has(e.id)).slice(0, 60)
    for (const e of fresh) {
      // Find a spot away from other words.
      let cx = 0
      let cy = 0
      for (let t = 0; t < 30; t++) {
        cx = W * 0.1 + Math.random() * W * 0.8
        cy = H * 0.12 + Math.random() * H * 0.62
        if (stars.current.every((s) => Math.hypot(s.cx - cx, (s.cy - cy) * 1.6) > size * 3.2)) break
      }
      const pts = sampleWord(e.word, size)
      const startX = fromInput ? W / 2 : cx
      const startY = fromInput ? H - 40 : cy
      stars.current.push({
        id: e.id,
        word: e.word,
        cx,
        cy,
        dx: (Math.random() - 0.5) * 0.12,
        dy: (Math.random() - 0.5) * 0.06,
        phase: Math.random() * Math.PI * 2,
        born: performance.now(),
        size,
        grains: pts.map((p) => ({
          ox: p.x,
          oy: p.y,
          x: startX + (fromInput ? (Math.random() - 0.5) * 30 : p.x + (Math.random() - 0.5) * 140),
          y: startY + (fromInput ? (Math.random() - 0.5) * 10 : p.y + (Math.random() - 0.5) * 140),
          vx: 0,
          vy: 0,
          tone: Math.random(),
        })),
      })
    }
    // Keep the sky to the newest 60.
    if (stars.current.length > 60) stars.current.splice(0, stars.current.length - 60)
  }, [])

  useEffect(() => place(entries), [entries, place])

  // Draw loop (only while visible).
  useEffect(() => {
    const el = box.current
    const cv = canvas.current
    if (!el || !cv) return
    const ctx = cv.getContext('2d')!
    const dpr = Math.min(window.devicePixelRatio, 2)
    const resize = () => {
      cv.width = el.clientWidth * dpr
      cv.height = el.clientHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    const draw = () => {
      const r = el.getBoundingClientRect()
      if (r.bottom < 0 || r.top > window.innerHeight) return
      const W = el.clientWidth
      const H = el.clientHeight
      const now = performance.now()
      ctx.clearRect(0, 0, W, H)
      const newest = stars.current.reduce((m, s) => Math.max(m, s.id), -Infinity)
      for (const s of stars.current) {
        if (!reduced) {
          s.cx += s.dx
          s.cy += s.dy
          if (s.cx < W * 0.08 || s.cx > W * 0.92) s.dx *= -1
          if (s.cy < H * 0.1 || s.cy > H * 0.78) s.dy *= -1
        }
        const bob = reduced ? 0 : Math.sin(now / 1400 + s.phase) * 4
        const fresh = s.id === newest && now - s.born < 6000
        for (const g of s.grains) {
          const tx = s.cx + g.ox
          const ty = s.cy + g.oy + bob
          // Pointer pushes grains away; springs pull them home.
          const px = g.x - pointer.current.x
          const py = g.y - pointer.current.y
          const d2 = px * px + py * py
          if (d2 < 3600 && !reduced) {
            const f = (1 - d2 / 3600) * 2.2
            const d = Math.sqrt(d2) || 1
            g.vx += (px / d) * f
            g.vy += (py / d) * f
          }
          g.vx += (tx - g.x) * 0.045
          g.vy += (ty - g.y) * 0.045
          g.vx *= 0.82
          g.vy *= 0.82
          g.x += g.vx
          g.y += g.vy
          const sz = 1.2 + g.tone * 1.1
          ctx.fillStyle = g.tone > 0.72 ? 'rgba(165,167,155,0.9)' : fresh ? 'rgba(255,244,227,1)' : 'rgba(232,210,181,0.88)'
          ctx.fillRect(g.x - sz / 2, g.y - sz / 2, sz, sz)
        }
      }
    }
    gsap.ticker.add(draw)
    return () => {
      gsap.ticker.remove(draw)
      ro.disconnect()
    }
  }, [reduced])

  const onMove = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect()
    pointer.current = { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const honey = String(new FormData(e.currentTarget).get('company') ?? '')
    const w = word.trim()
    if (!w) return
    if (!hasApi) {
      // Offline: still show it locally.
      const local = { id: Date.now(), word: w }
      place([local], true)
      setWord('')
      setStatus('sent')
      return
    }
    setStatus('sending')
    setMsg('')
    try {
      const res = await apiFetch('/guestbook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ word: w, company: honey }) }, 8000)
      const data = (await res.json().catch(() => ({}))) as Entry & { error?: string }
      if (!res.ok || !data.id) {
        setStatus('error')
        setMsg(data.error ?? 'The sky is busy. Try again in a moment.')
        return
      }
      place([data], true)
      setEntries((list) => [data, ...list])
      setWord('')
      setStatus('sent')
      setMsg('Your word is up there now.')
    } catch {
      setStatus('error')
      setMsg('Could not reach the sky. Try again.')
    }
  }

  return (
    <section id="guestbook" data-nav-theme="dark" className="relative overflow-hidden bg-ink py-28 text-cream md:py-40 on-ink">
      <div className="relative mx-auto max-w-[88rem] px-6 md:px-10">
        <SectionHeading index="06" eyebrow="Guestbook" title="Leave a word" outline="in the sky" />
        <Reveal>
          <p className="mt-6 max-w-lg text-base opacity-75 md:text-lg">
            One word, any language. It becomes a cluster of grains that floats here for everyone who visits after you.
          </p>
        </Reveal>

        <Reveal className="mt-12">
          <div
            ref={box}
            onPointerMove={onMove}
            onPointerLeave={() => (pointer.current = { x: -9999, y: -9999 })}
            data-cursor="Stir"
            className="relative h-[58vh] min-h-[380px] overflow-hidden rounded-[2rem] border border-cream/10 bg-[radial-gradient(ellipse_at_50%_120%,#2a2a24_0%,#1a1a16_60%)]"
          >
            <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden />

            <form onSubmit={submit} className="absolute inset-x-4 bottom-4 flex items-center gap-2 rounded-full border border-cream/15 bg-ink/80 p-1.5 pl-5 backdrop-blur md:inset-x-auto md:left-1/2 md:w-[28rem] md:-translate-x-1/2">
              <label htmlFor="gb-word" className="sr-only">
                Your word
              </label>
              <input
                id="gb-word"
                value={word}
                onChange={(e) => setWord(e.target.value.slice(0, 18))}
                maxLength={18}
                placeholder="Leave a word…"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-base text-cream outline-none placeholder:text-cream/40 focus-visible:outline-none"
              />
              <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
              <button
                type="submit"
                disabled={status === 'sending' || !word.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-cream px-5 py-2.5 text-sm font-bold text-ink transition-transform hover:scale-[1.03] disabled:opacity-50"
              >
                {status === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send up
              </button>
            </form>
          </div>
          <p className="mt-3 min-h-5 text-center text-sm opacity-70" role="status" aria-live="polite">
            {msg}
          </p>
        </Reveal>

        <ul className="sr-only">
          {entries.map((e) => (
            <li key={e.id}>{e.word}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
