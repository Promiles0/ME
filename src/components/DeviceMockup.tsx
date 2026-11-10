import { useEffect, useRef, type PointerEvent } from 'react'
import { gsap, useReducedMotion } from '../lib/motion'

type Props = {
  video?: string
  poster?: string
  image: string
  alt: string
}

/**
 * A laptop-style device rendered with CSS 3D. It tilts toward the pointer and
 * drifts gently when idle. The screen plays the project's demo video when one
 * is available and visible; otherwise it shows the screenshot and slowly pans
 * down it, as if someone were scrolling the page.
 */
export default function DeviceMockup({ video, poster, image, alt }: Props) {
  const frame = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const vid = useRef<HTMLVideoElement>(null)
  const img = useRef<HTMLImageElement>(null)
  const reduced = useReducedMotion()

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
        if (!v) return
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
  }, [reduced, video])

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
    <div ref={frame} className="relative [perspective:1600px]" onPointerMove={onMove} onPointerLeave={onLeave} data-cursor>
      {/* Glow */}
      <div className="pointer-events-none absolute inset-[-10%] -z-10 rounded-full bg-cream/20 blur-3xl" aria-hidden />

      <div ref={inner} className="relative [transform-style:preserve-3d] will-change-transform" style={{ transform: 'rotateY(-10deg) rotateX(6deg)' }}>
        {/* Lid / screen */}
        <div className="relative rounded-[1.1rem] border border-cream/20 bg-ink-soft p-[6px] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)] md:rounded-[1.4rem] md:p-2">
          <div className="relative aspect-video overflow-hidden rounded-[0.7rem] bg-ink md:rounded-[0.9rem]">
            {video ? (
              <video
                ref={vid}
                className="h-full w-full object-cover"
                src={video}
                poster={poster ?? image}
                muted
                loop
                playsInline
                preload="metadata"
                aria-label={alt}
              />
            ) : (
              <img ref={img} src={image} alt={alt} className="h-full w-full object-cover" style={{ objectPosition: '50% 0%' }} loading="lazy" />
            )}
            {/* Screen sheen */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent mix-blend-screen"
              aria-hidden
            />
          </div>
          {/* Camera dot */}
          <span className="absolute left-1/2 top-[3px] h-1 w-1 -translate-x-1/2 rounded-full bg-cream/40 md:top-1" aria-hidden />
        </div>

        {/* Base */}
        <div
          className="mx-auto mt-[2px] h-3 w-[104%] -translate-x-[2%] rounded-b-[1rem] bg-gradient-to-b from-sage-deep to-ink-soft [transform:translateZ(-12px)_rotateX(-70deg)] [transform-origin:top]"
          aria-hidden
        />
        <div className="mx-auto h-1.5 w-[28%] rounded-b-md bg-ink-soft" aria-hidden />
      </div>
    </div>
  )
}
