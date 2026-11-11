import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { gsap, useReducedMotion } from '../lib/motion'

type Props = {
  video?: string
  poster?: string
  image: string
  alt: string
  /** When set, the video is not autoplayed; the parent drives it. */
  onVideo?: (video: HTMLVideoElement | null) => void
  /** A live URL that may be embedded. Hovering the screen boots it in an iframe. */
  liveUrl?: string
}

/**
 * A laptop-style device rendered with CSS 3D. It tilts toward the pointer and
 * drifts gently when idle. The screen plays the project's demo video when one
 * is available and visible (or hands it to the parent via `onVideo` so scroll
 * can drive it); otherwise it shows the screenshot and slowly pans down it.
 */
export default function DeviceMockup({ video, poster, image, alt, onVideo, liveUrl }: Props) {
  const frame = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const vid = useRef<HTMLVideoElement>(null)
  const img = useRef<HTMLImageElement>(null)
  const reduced = useReducedMotion()
  const screen = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState<'off' | 'booting' | 'on'>('off')
  const [scale, setScale] = useState(0.5)
  const bootTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // The iframe renders at desktop width (1440px) and is scaled to fit the screen.
  useEffect(() => {
    const el = screen.current
    if (!el || !liveUrl) return
    const ro = new ResizeObserver(() => setScale(el.offsetWidth / 1440))
    ro.observe(el)
    return () => ro.disconnect()
  }, [liveUrl])

  const startLive = () => {
    if (!liveUrl || live !== 'off') return
    bootTimer.current = setTimeout(() => setLive('booting'), 450)
  }
  // Never leave the boot screen up forever if a site is slow to report load.
  useEffect(() => {
    if (live !== 'booting') return
    const t = setTimeout(() => setLive('on'), 9000)
    return () => clearTimeout(t)
  }, [live])

  const stopLive = () => {
    if (bootTimer.current) clearTimeout(bootTimer.current)
  }

  useEffect(() => {
    onVideo?.(vid.current)
    return () => onVideo?.(null)
  }, [onVideo])

  // Idle float, screenshot pan, and autoplay only when visible.
  useEffect(() => {
    const el = inner.current
    const v = vid.current
    if (!el) return
    const tweens: gsap.core.Tween[] = []
    if (!reduced) {
      tweens.push(gsap.to(el, { y: -10, rotateX: 4, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 }))
      if (img.current && !video) {
        tweens.push(
          gsap.fromTo(
            img.current,
            { objectPosition: '50% 0%' },
            { objectPosition: '50% 100%', duration: 9, ease: 'sine.inOut', yoyo: true, repeat: -1, repeatDelay: 1.2 },
          ),
        )
      }
    }
    const io = new IntersectionObserver(
      ([e]) => {
        tweens.forEach((t) => (e.isIntersecting ? t.play() : t.pause()))
        if (!v || onVideo) return
        if (e.isIntersecting && !reduced) v.play().catch(() => undefined)
        else v.pause()
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => {
      tweens.forEach((t) => t.kill())
      io.disconnect()
    }
  }, [reduced, video, onVideo])

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== 'mouse' || !frame.current || !inner.current) return
    const r = frame.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    gsap.to(inner.current, { rotateY: px * 22, rotateX: -py * 16, duration: 0.6, ease: 'power3.out', overwrite: 'auto' })
  }
  const onLeave = () => {
    if (!inner.current) return
    gsap.to(inner.current, { rotateY: 0, rotateX: 0, duration: 1, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' })
  }

  return (
    <div ref={frame} className="relative [perspective:1600px]" onPointerMove={onMove} onPointerLeave={onLeave} data-cursor={liveUrl && live === 'off' ? 'Play' : liveUrl ? 'Scroll' : 'Tilt'}>
      <div className="pointer-events-none absolute inset-[-10%] -z-10 rounded-full bg-cream/20 blur-3xl" aria-hidden />

      <div ref={inner} className="relative [transform-style:preserve-3d] will-change-transform" style={{ transform: 'rotateY(-10deg) rotateX(6deg)' }}>
        <div className="relative rounded-[1.1rem] border border-cream/20 bg-ink-soft p-[6px] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)] md:rounded-[1.4rem] md:p-2">
          <div
            ref={screen}
            onPointerEnter={startLive}
            onPointerLeave={stopLive}
            onClick={() => liveUrl && live === 'off' && setLive('booting')}
            className="relative aspect-video overflow-hidden rounded-[0.7rem] bg-ink md:rounded-[0.9rem]"
          >
            {video ? (
              <video
                ref={vid}
                className="h-full w-full object-cover"
                src={video}
                poster={poster ?? image}
                muted
                loop={!onVideo}
                playsInline
                preload={onVideo ? 'auto' : 'metadata'}
                aria-label={alt}
              />
            ) : (
              <img ref={img} src={image} alt={alt} className="h-full w-full object-cover" style={{ objectPosition: '50% 0%' }} loading="lazy" />
            )}
            {liveUrl && live !== 'off' && (
              <>
                <iframe
                  src={liveUrl}
                  title={`${alt} (live site)`}
                  onLoad={() => setTimeout(() => setLive('on'), 350)}
                  className="absolute left-0 top-0 origin-top-left border-0 bg-ink transition-opacity duration-700"
                  style={{ width: 1440, height: 810, transform: `scale(${scale})`, opacity: live === 'on' ? 1 : 0 }}
                  data-lenis-prevent
                />
                {/* Boot screen: scanlines and a loading bar until the site is in */}
                <div
                  className={`pointer-events-none absolute inset-0 grid place-items-center bg-ink transition-opacity duration-500 ${live === 'on' ? 'opacity-0' : 'opacity-100'}`}
                  aria-hidden
                >
                  <div className="absolute inset-0 opacity-30 [background:repeating-linear-gradient(0deg,rgba(232,210,181,.18)_0_1px,transparent_1px_3px)]" />
                  <div className="relative text-center text-cream">
                    <p className="eyebrow opacity-70">Booting live site</p>
                    <div className="mx-auto mt-3 h-[2px] w-32 overflow-hidden bg-cream/20">
                      <div className="h-full w-1/3 animate-[boot_1.1s_ease-in-out_infinite] bg-cream" />
                    </div>
                  </div>
                </div>
              </>
            )}
            {liveUrl && live === 'off' && (
              <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-ink/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cream backdrop-blur" aria-hidden>
                Hover to go live
              </span>
            )}
            {liveUrl && live === 'on' && (
              <span className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-ink/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cream backdrop-blur" aria-hidden>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7bd88f]" /> Live
              </span>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent mix-blend-screen" aria-hidden />
          </div>
          <span className="absolute left-1/2 top-[3px] h-1 w-1 -translate-x-1/2 rounded-full bg-cream/40 md:top-1" aria-hidden />
        </div>
        <div
          className="mx-auto mt-[2px] h-3 w-[104%] -translate-x-[2%] rounded-b-[1rem] bg-gradient-to-b from-sage-deep to-ink-soft [transform:translateZ(-12px)_rotateX(-70deg)] [transform-origin:top]"
          aria-hidden
        />
        <div className="mx-auto h-1.5 w-[28%] rounded-b-md bg-ink-soft" aria-hidden />
      </div>
    </div>
  )
}
