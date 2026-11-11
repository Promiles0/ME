import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { TURNSTILE_SITE_KEY } from '../lib/api'

/**
 * Cloudflare Turnstile widget (privacy-friendly bot check). Renders only when
 * VITE_TURNSTILE_SITE_KEY is set. The token is passed up via onToken and
 * verified by the Worker. `reset()` gets a fresh token after a submit.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
      remove: (id: string) => void
    }
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let loading: Promise<void> | null = null
const loadScript = () =>
  (loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SCRIPT
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Turnstile failed to load'))
    document.head.appendChild(s)
  }))

export type TurnstileHandle = { reset: () => void }

const Turnstile = forwardRef<TurnstileHandle, { onToken: (t: string) => void }>(function Turnstile({ onToken }, ref) {
  const box = useRef<HTMLDivElement>(null)
  const widget = useRef<string | null>(null)

  useImperativeHandle(ref, () => ({
    reset: () => {
      onToken('')
      if (widget.current) window.turnstile?.reset(widget.current)
    },
  }))

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !box.current) return
    let alive = true
    loadScript()
      .then(() => {
        if (!alive || !box.current || !window.turnstile) return
        widget.current = window.turnstile.render(box.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'light',
          appearance: 'interaction-only',
          callback: (t: string) => onToken(t),
          'expired-callback': () => onToken(''),
          'error-callback': () => onToken(''),
        })
      })
      .catch(() => undefined)
    return () => {
      alive = false
      if (widget.current) window.turnstile?.remove(widget.current)
      widget.current = null
    }
  }, [onToken])

  if (!TURNSTILE_SITE_KEY) return null
  return <div ref={box} className="mt-4 min-h-0" />
})

export default Turnstile
