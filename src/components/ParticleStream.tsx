import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, isLowPowerDevice, prefersReducedMotion } from '../lib/motion'

/**
 * Connects the site's particle moments into one story. A fixed 2D canvas
 * carries particles between places as you scroll:
 *
 *  1. Hero → About: grains leave the hero cloud and pour along curved paths
 *     into the portrait card, arriving just as the face assembles there.
 *  2. Contact → Footer: as the curtain opens, grains rain from the page edge
 *     into the giant AROI letters while they rise.
 *
 * Each leg is scrubbed by scroll, so it plays forwards and backwards. The
 * canvas only draws while a leg is in progress.
 */

type Rect = { x: number; y: number; w: number; h: number }
type Leg = {
  from: () => Rect | null
  to: () => Rect | null
  progress: number
  colorA: string
  colorB: string
}

const rectOf = (el: Element | null): Rect | null => {
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, w: r.width, h: r.height }
}

export default function ParticleStream() {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = canvas.current
    if (!cv || prefersReducedMotion()) return
    const ctx = cv.getContext('2d')!
    const N = isLowPowerDevice() ? 380 : 900
    const dpr = Math.min(window.devicePixelRatio, 2)

    const resize = () => {
      cv.width = window.innerWidth * dpr
      cv.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    // Per-grain random offsets in unit space, reused for every leg.
    const seeds = Array.from({ length: N }, () => ({
      fu: Math.random(),
      fv: Math.random(),
      tu: Math.random(),
      tv: Math.random(),
      bend: (Math.random() - 0.5) * 2,
      delay: Math.random() * 0.45,
      size: 0.8 + Math.random() * 1.8,
      dark: Math.random() < 0.7,
      wob: Math.random() * Math.PI * 2,
    }))

    const legs: Leg[] = [
      {
        // Bottom edge of the page → footer letters
        from: () => {
          const main = rectOf(document.querySelector('main'))
          return main ? { x: 0, y: main.y + main.h - 40, w: window.innerWidth, h: 40 } : null
        },
        to: () => {
          const letters = document.querySelector('[data-letter]')?.parentElement ?? null
          return rectOf(letters)
        },
        progress: 0,
        colorA: '#e8d2b5',
        colorB: '#a5a79b',
      },
    ]

    const triggers: ScrollTrigger[] = []
    const setup = () => {
      triggers.push(
        ScrollTrigger.create({
          trigger: document.documentElement,
          start: () => `bottom-=${(document.querySelector('footer') as HTMLElement | null)?.offsetHeight ?? 600} bottom`,
          end: 'bottom bottom',
          scrub: 0.4,
          invalidateOnRefresh: true,
          onUpdate: (s) => (legs[0].progress = s.progress),
        }),
      )
    }
    const setupTimer = setTimeout(setup, 300)

    const ease = (t: number) => 1 - Math.pow(1 - t, 3)

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      const t = performance.now() / 1000
      for (const leg of legs) {
        const p = leg.progress
        if (p <= 0.001 || p >= 0.999) continue
        const a = leg.from()
        const b = leg.to()
        if (!a || !b) continue
        for (const s of seeds) {
          // Each grain has its own window inside the leg.
          const local = Math.min(1, Math.max(0, (p - s.delay) / (1 - 0.45)))
          if (local <= 0 || local >= 1) continue
          const e = ease(local)
          const fx = a.x + s.fu * a.w
          const fy = a.y + s.fv * a.h
          const tx = b.x + s.tu * b.w
          const ty = b.y + s.tv * b.h
          // Curved path: control point pushed sideways for a sweeping pour.
          const cx = (fx + tx) / 2 + s.bend * window.innerWidth * 0.18
          const cy = (fy + ty) / 2 - window.innerHeight * 0.08
          const x = (1 - e) * (1 - e) * fx + 2 * (1 - e) * e * cx + e * e * tx + Math.sin(t * 3 + s.wob) * 4 * (1 - e)
          const y = (1 - e) * (1 - e) * fy + 2 * (1 - e) * e * cy + e * e * ty
          const alpha = Math.sin(local * Math.PI) * 0.95
          ctx.globalAlpha = alpha
          ctx.fillStyle = s.dark ? leg.colorA : leg.colorB
          ctx.beginPath()
          ctx.arc(x, y, s.size * (1 + Math.sin(local * Math.PI) * 0.6), 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
    }

    gsap.ticker.add(draw)
    return () => {
      clearTimeout(setupTimer)
      gsap.ticker.remove(draw)
      triggers.forEach((tr) => tr.kill())
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvas} className="pointer-events-none fixed inset-0 z-30 h-full w-full" aria-hidden />
}
