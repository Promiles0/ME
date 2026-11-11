/**
 * Device tilt for phones. One shared deviceorientation listener feeds every
 * subscriber a smoothed (x, y) in -1..1. iOS needs a one-time permission from
 * a user gesture; we ask on the first tap anywhere. No-op on desktop and under
 * reduced motion.
 */
type Cb = (x: number, y: number) => void

const subs = new Set<Cb>()
let started = false
let base: { b: number; g: number } | null = null

function handle(e: DeviceOrientationEvent) {
  if (e.beta == null || e.gamma == null) return
  // Calibrate to however the phone was held when tilt first arrived.
  base ??= { b: e.beta, g: e.gamma }
  const x = Math.max(-1, Math.min(1, (e.gamma - base.g) / 25))
  const y = Math.max(-1, Math.min(1, -(e.beta - base.b) / 25))
  subs.forEach((cb) => cb(x, y))
}

function start() {
  if (started || typeof window === 'undefined') return
  if (!window.matchMedia('(pointer: coarse)').matches) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (!('DeviceOrientationEvent' in window)) return
  started = true

  const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<'granted' | 'denied'> }
  if (typeof DOE.requestPermission === 'function') {
    // iOS: ask once, on the first tap.
    const ask = () => {
      DOE.requestPermission!()
        .then((r) => r === 'granted' && window.addEventListener('deviceorientation', handle))
        .catch(() => undefined)
      window.removeEventListener('touchend', ask)
    }
    window.addEventListener('touchend', ask, { once: true })
  } else {
    window.addEventListener('deviceorientation', handle)
  }
}

/** Subscribe to tilt; returns an unsubscribe function. */
export function onTilt(cb: Cb): () => void {
  start()
  subs.add(cb)
  return () => subs.delete(cb)
}
