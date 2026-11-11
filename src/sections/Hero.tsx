import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { gsap, useReducedMotion } from '../lib/motion'
import { profile } from '../data/profile'
import Magnetic from '../components/Magnetic'
import Typewriter from '../components/Typewriter'
import { storyField } from '../lib/story'

type Props = { ready: boolean }

const ROLES = ['web apps that feel instant.', 'full-stack products.', 'interfaces people enjoy.', 'things that ship.']

/**
 * Hero. The name itself is drawn by the shared story particle layer
 * (components/StoryParticles), placed on the `data-name-slot` box below.
 * The same grains later float down the page and become the portrait in About.
 * Click or tap the name to blast it apart; it regroups.
 */
export default function Hero({ ready }: Props) {
  const section = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const [hint, setHint] = useState(true)
  const word = typeof window !== 'undefined' && window.innerWidth < 768 ? profile.shortName.toUpperCase() : 'AROI SERGE'
  const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

  useEffect(() => {
    if (!ready || !section.current) return
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set('[data-hero-fade]', { opacity: 1, y: 0 })
        return
      }
      gsap.fromTo('[data-hero-fade]', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.09, ease: 'expo.out', delay: 0.5 })
      // Copy fades and lifts away as the grains let go of the name.
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
    storyField.current?.burst()
    setHint(false)
  }

  return (
    <section ref={section} data-nav-theme="light" className="relative h-[190vh]" aria-label="Introduction">
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
        <div className="stripe bg-cream/70" style={{ left: '58%' }} />

        {/* Where the shared grains spell the name (measured by StoryParticles). */}
        <div data-name-slot className="pointer-events-none absolute inset-x-[5%] top-[14vh] h-[48vh] md:top-[8vh] md:h-[62vh]" aria-hidden />

        {!reduced && (
          <button
            type="button"
            onClick={blast}
            data-cursor="Blast"
            aria-label="Scatter the particles"
            className="absolute inset-x-[8%] top-[24vh] z-[25] h-[28vh] md:top-[20vh] md:h-[38vh]"
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
          <p data-hero-fade className="eyebrow mx-auto flex items-center gap-3 opacity-0">
            <span className="h-px w-8 bg-current opacity-50" />
            Hello, I&apos;m Iradukunda
            <span className="h-px w-8 bg-current opacity-50" />
          </p>

          <p data-hero-fade className="mx-auto mt-[44vh] max-w-[92vw] text-center font-display text-[clamp(1.6rem,4.4vw,3.6rem)] leading-tight opacity-0 md:mt-[58vh]">
            I build <Typewriter words={ROLES} start={ready} className="text-ink" />
          </p>
          {!reduced && (
            <p
              data-hero-fade
              className={`mx-auto mt-2 max-w-[90vw] text-center text-[11px] font-semibold uppercase tracking-[0.2em] opacity-0 transition-opacity duration-700 ${hint ? '' : '!opacity-0'}`}
              aria-hidden
            >
              {coarse ? 'Tap my name to scatter it · tilt your phone' : 'Move your cursor through my name · click to scatter it'}
            </p>
          )}

          <div className="pointer-events-auto relative z-[25] mt-auto flex flex-col items-center gap-5 md:flex-row md:items-end md:justify-between">
            <p data-hero-fade className="flex items-center gap-3 text-sm font-semibold opacity-0 md:pl-20">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ink opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-ink" />
              </span>
              {profile.availability} · {profile.location}
            </p>

            <a data-hero-fade href="#about" className="hidden flex-col items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] opacity-0 md:flex">
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

        <style>{`
          @keyframes cue { 0% { transform: translateY(-100%); } 100% { transform: translateY(200%); } }
          @keyframes caret { 50% { opacity: 0; } }
        `}</style>
      </div>
    </section>
  )
}
