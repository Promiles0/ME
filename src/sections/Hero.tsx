import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { gsap, ScrollTrigger, useReducedMotion } from '../lib/motion'
import { profile } from '../data/profile'
import Magnetic from '../components/Magnetic'
import Typewriter from '../components/Typewriter'
import type { ParticleFieldHandle } from '../three/ParticleField'
import { wordShapes } from '../three/shapes'
import { onTilt } from '../lib/tilt'

const ParticleField = lazy(() => import('../three/ParticleField'))

type Props = { ready: boolean }

const STAGES = [
  { word: 'Ideas', label: 'Galaxy', line: 'Every product starts as scattered thoughts pulled into orbit.' },
  { word: 'Flow', label: 'Waves', line: 'Then it ships, and keeps moving with the people who use it.' },
]

const ROLES = ['web apps that feel instant.', 'full-stack products.', 'interfaces people enjoy.', 'things that ship.']

/**
 * Hero. The name *is* the particle cloud: full width, centred, and alive.
 * The pointer pushes letters aside, a click blows the whole word apart and it
 * regroups, and on phones tilting the device leans it. Scrolling morphs it
 * into a galaxy, then waves. A typed line underneath says what I build.
 */
export default function Hero({ ready }: Props) {
  const section = useRef<HTMLElement>(null)
  const field = useRef<ParticleFieldHandle | null>(null)
  const reduced = useReducedMotion()
  const [active, setActive] = useState(true)
  const [stage, setStage] = useState(-1)
  const [hint, setHint] = useState(true)

  // Full name on wide screens, short name on phones so letters stay big.
  const word = typeof window !== 'undefined' && window.innerWidth < 768 ? profile.shortName.toUpperCase() : 'AROI SERGE'
  const shapes = useMemo(() => wordShapes(word), [word])

  // Pause the 3D loop when the hero is off screen.
  useEffect(() => {
    const el = section.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Phones: tilt leans the cloud.
  useEffect(() => onTilt((x, y) => field.current?.tilt?.(x, y)), [])

  // Entrance + scroll choreography.
  useEffect(() => {
    if (!ready || !section.current) return
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set('[data-hero-fade]', { opacity: 1, y: 0 })
        return
      }
      gsap.fromTo('[data-hero-fade]', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.09, ease: 'expo.out', delay: 0.5 })

      ScrollTrigger.create({
        trigger: section.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          field.current?.setMorph(self.progress * 2)
          const pr = self.progress
          setStage(pr < 0.32 ? -1 : pr < 0.72 ? 0 : 1)
        },
      })

      gsap.fromTo(
        '[data-hero-copy]',
        { opacity: 1, y: 0 },
        {
          opacity: 0,
          y: -40,
          ease: 'none',
          immediateRender: false,
          scrollTrigger: { trigger: section.current, start: 'top top', end: () => `+=${window.innerHeight * 0.42}`, scrub: true, invalidateOnRefresh: true },
        },
      )
    }, section)
    return () => ctx.revert()
  }, [ready, reduced])

  const blast = () => {
    field.current?.burst?.()
    setHint(false)
  }

  return (
    <section ref={section} data-nav-theme="light" className="relative h-[190vh]" aria-label="Introduction">
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
        <div className="stripe bg-cream/70" style={{ left: '58%' }} />

        {/* The name, as particles. Click (or tap) to blow it apart. */}
        {!reduced && (
          <Suspense fallback={null}>
            <ParticleField
              shapes={shapes}
              handle={field}
              choreography
              spin={false}
              fit={0.9}
              count={{ high: 26000, low: 10000 }}
              active={active && ready}
              className="absolute inset-x-0 top-[12vh] h-[52vh] md:top-[6vh] md:h-[66vh]"
            />
          </Suspense>
        )}
        {!reduced && (
          <button
            type="button"
            onClick={blast}
            data-cursor="Blast"
            aria-label="Scatter the particles"
            className="absolute inset-x-[8%] top-[22vh] z-[1] h-[30vh] md:top-[18vh] md:h-[40vh]"
          />
        )}
        {reduced && (
          <p className="display pointer-events-none absolute inset-x-0 top-[22vh] text-center text-[22vw] leading-none text-ink/80" aria-hidden>
            {word}
          </p>
        )}

        <h1 className="sr-only">
          {profile.name}, {profile.title}
        </h1>

        <div data-hero-copy className="pointer-events-none relative mx-auto flex w-full max-w-[88rem] flex-1 flex-col px-6 pb-8 pt-24 md:px-10 md:pb-10">
          {/* Line above the word */}
          <p data-hero-fade className="eyebrow mx-auto flex items-center gap-3 opacity-0">
            <span className="h-px w-8 bg-current opacity-50" />
            Hello, I&apos;m Iradukunda
            <span className="h-px w-8 bg-current opacity-50" />
          </p>

          {/* Typed line under the word */}
          <p data-hero-fade className="mx-auto mt-[44vh] max-w-[92vw] text-center font-display text-[clamp(1.6rem,4.4vw,3.6rem)] leading-tight opacity-0 md:mt-[58vh]">
            I build <Typewriter words={ROLES} start={ready} className="text-ink" />
          </p>
          {!reduced && (
            <p
              data-hero-fade
              className={`mx-auto mt-2 max-w-[90vw] text-center text-[11px] font-semibold uppercase tracking-[0.2em] opacity-0 transition-opacity duration-700 ${hint ? '' : '!opacity-0'}`}
              aria-hidden
            >
              {typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
                ? 'Tap my name to scatter it · tilt your phone'
                : 'Move your cursor through my name · click to scatter it'}
            </p>
          )}

          {/* Bottom bar */}
          <div className="pointer-events-auto mt-auto flex flex-col items-center gap-5 md:flex-row md:items-end md:justify-between">
            <p data-hero-fade className="flex items-center gap-3 text-sm font-semibold opacity-0 md:pl-20">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ink opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-ink" />
              </span>
              {profile.availability} · {profile.location}
            </p>

            <a
              data-hero-fade
              href="#about"
              className="hidden flex-col items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] opacity-0 md:flex"
            >
              <span>Scroll</span>
              <span className="relative h-10 w-px overflow-hidden bg-ink/20">
                <span className="absolute inset-x-0 top-0 h-1/2 animate-[cue_1.6s_ease-in-out_infinite] bg-ink" />
              </span>
              <ArrowDown className="h-3.5 w-3.5" />
            </a>

            <div data-hero-fade className="flex flex-wrap justify-center gap-3 opacity-0">
              <Magnetic>
                <a
                  href="#projects"
                  data-cursor="Work"
                  className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-cream transition-transform duration-300 hover:scale-[1.03]"
                >
                  See my work
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </Magnetic>
              <Magnetic>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 rounded-full border border-ink/40 bg-paper/30 px-6 py-3.5 text-sm font-semibold backdrop-blur-sm transition-colors duration-300 hover:bg-paper"
                >
                  Hire me
                </a>
              </Magnetic>
            </div>
          </div>
        </div>

        {/* Stage captions once the particles take over */}
        <div className="pointer-events-none absolute bottom-10 left-6 md:bottom-14 md:left-10" aria-hidden>
          {STAGES.map((st, i) => (
            <div
              key={st.word}
              className="absolute bottom-0 left-0 w-[80vw] max-w-md transition-all duration-700 [transition-timing-function:cubic-bezier(.16,1,.3,1)]"
              style={{ opacity: stage === i ? 1 : 0, transform: `translateY(${stage === i ? 0 : stage > i ? -30 : 30}px)` }}
            >
              <p className="eyebrow opacity-70">
                0{i + 1} / 02 · {st.label}
              </p>
              <p className="display mt-2 text-[clamp(3.5rem,9vw,8rem)]">
                {st.word}
                <span className="text-cream">.</span>
              </p>
              <p className="mt-2 max-w-xs text-sm opacity-80">{st.line}</p>
            </div>
          ))}
        </div>
        <style>{`
          @keyframes cue { 0% { transform: translateY(-100%); } 100% { transform: translateY(200%); } }
          @keyframes caret { 50% { opacity: 0; } }
        `}</style>
      </div>
    </section>
  )
}
