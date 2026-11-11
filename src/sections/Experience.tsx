import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, useReducedMotion } from '../lib/motion'
import { experience } from '../data/profile'
import SectionHeading from '../components/SectionHeading'

/**
 * Experience. The left panel is pinned (sticky) while the timeline scrolls on
 * the right. The year rolls digit by digit like an odometer, the current role
 * slides in under it, and a ring fills as you progress through the entries.
 * The active entry is lit; the others dim back.
 */

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

/** One odometer column. Rolls to `digit`; later columns start a little later. */
function Digit({ digit, index }: { digit: string; index: number }) {
  const n = Number(digit)
  return (
    <span className="relative inline-block h-[1em] overflow-hidden align-top">
      <span
        className="flex flex-col transition-transform duration-[900ms] [transition-timing-function:cubic-bezier(.16,1,.3,1)]"
        style={{ transform: `translateY(-${n * 10}%)`, transitionDelay: `${index * 70}ms` }}
      >
        {DIGITS.map((d) => (
          <span key={d} className="block h-[1em] leading-none">
            {d}
          </span>
        ))}
      </span>
    </span>
  )
}

function RollingYear({ year, className = '' }: { year: string; className?: string }) {
  return (
    <span className={`inline-flex leading-none tabular-nums ${className}`} aria-label={year}>
      <span aria-hidden className="inline-flex">
        {year.split('').map((d, i) => (
          <Digit key={i} digit={d} index={i} />
        ))}
      </span>
    </span>
  )
}

export default function Experience() {
  const section = useRef<HTMLElement>(null)
  const line = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!section.current) return
    const ctx = gsap.context(() => {
      const entries = gsap.utils.toArray<HTMLElement>('[data-entry]')

      // The line draws and the ring fills across the whole timeline.
      ScrollTrigger.create({
        trigger: '[data-timeline]',
        start: 'top 60%',
        end: 'bottom 60%',
        scrub: reduced ? false : 0.4,
        onUpdate: (self) => {
          setProgress(self.progress)
          if (line.current) line.current.style.transform = `scaleY(${self.progress})`
        },
      })

      // Current entry: the last one whose top has crossed 55% of the viewport.
      const pick = () => {
        const mark = window.innerHeight * 0.55
        let current = 0
        entries.forEach((el, i) => {
          if (el.getBoundingClientRect().top <= mark) current = i
        })
        setActive(current)
      }
      ScrollTrigger.create({ trigger: section.current, start: 'top bottom', end: 'bottom top', onUpdate: pick, onRefresh: pick })

      if (!reduced) {
        entries.forEach((entry) => {
          gsap.fromTo(
            entry.querySelectorAll('[data-entry-item]'),
            { opacity: 0, x: 32 },
            { opacity: 1, x: 0, duration: 0.8, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: entry, start: 'top 85%' } },
          )
        })
      }
    }, section)
    return () => ctx.revert()
  }, [reduced])

  const current = experience[active]
  const total = experience.length
  const R = 46
  const C = 2 * Math.PI * R

  return (
    // overflow-clip (not hidden) so the sticky panel keeps working
    <section id="experience" ref={section} data-nav-theme="light" className="relative overflow-clip bg-sage py-28 md:py-40">
      {/* Giant outlined year drifting in the background */}
      <div className="pointer-events-none absolute inset-x-0 top-1/3 select-none text-center font-display text-[38vw] leading-none text-ink/[0.05]" aria-hidden>
        {current.year}
      </div>

      <div className="relative mx-auto max-w-[88rem] px-6 md:px-10">
        <SectionHeading index="02" eyebrow="Experience" title="Where I have" outline="been building" />

        <div className="mt-16 grid gap-10 md:mt-24 md:grid-cols-12">
          {/* Pinned panel */}
          <aside className="sticky top-[72px] z-10 -mx-6 bg-sage/90 px-6 py-4 backdrop-blur md:top-0 md:col-span-5 md:mx-0 md:flex md:h-screen md:flex-col md:justify-center md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
            <div className="flex items-end justify-between gap-6 md:block">
              <div>
                <p className="eyebrow hidden opacity-70 md:block">Timeline</p>
                <RollingYear year={current.year} className="font-display text-[clamp(4rem,9vw,4.5rem)] md:mt-2 md:text-[clamp(7rem,15vw,14rem)]" />
              </div>

              {/* Progress ring */}
              <div className="relative grid h-16 w-16 shrink-0 place-items-center md:mt-8 md:h-28 md:w-28">
                <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
                  <circle cx="50" cy="50" r={R} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" />
                  <circle
                    cx="50"
                    cy="50"
                    r={R}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={C}
                    strokeDashoffset={C * (1 - progress)}
                  />
                </svg>
                <p className="font-display text-xl tabular-nums md:text-3xl">
                  {String(active + 1).padStart(2, '0')}
                  <span className="opacity-40">/{String(total).padStart(2, '0')}</span>
                </p>
              </div>
            </div>

            {/* Current role, slides in on change */}
            <div className="relative mt-2 hidden h-24 overflow-hidden md:mt-6 md:block">
              {experience.map((e, i) => (
                <div
                  key={e.role + e.company}
                  aria-hidden={i !== active}
                  className="absolute inset-x-0 top-0 transition-all duration-700 [transition-timing-function:cubic-bezier(.16,1,.3,1)]"
                  style={{
                    transform: `translateY(${i === active ? 0 : i < active ? -100 : 100}%)`,
                    opacity: i === active ? 1 : 0,
                  }}
                >
                  <p className="text-2xl font-bold tracking-tight">{e.role}</p>
                  <p className="eyebrow mt-1 opacity-70">
                    {e.company} · {e.period}
                  </p>
                </div>
              ))}
            </div>

            {/* Mini year index */}
            <ol className="mt-6 hidden gap-2 md:flex">
              {experience.map((e, i) => (
                <li
                  key={e.role}
                  className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= active ? 'bg-ink' : 'bg-ink/15'}`}
                  aria-hidden
                />
              ))}
            </ol>
          </aside>

          {/* Timeline */}
          <div data-timeline className="relative md:col-span-7 md:py-[30vh]">
            <div className="absolute bottom-0 left-[7px] top-0 w-px bg-ink/15" aria-hidden />
            <div ref={line} className="absolute bottom-0 left-[7px] top-0 w-px origin-top bg-ink" style={{ transform: 'scaleY(0)' }} aria-hidden />

            <ol className="space-y-20 md:space-y-[38vh]">
              {experience.map((e, i) => {
                const on = i === active
                return (
                  <li
                    key={e.role + e.company}
                    data-entry
                    className={`relative pl-10 transition-opacity duration-700 md:pl-14 ${on ? 'opacity-100' : 'md:opacity-35'}`}
                  >
                    <span
                      className={`absolute left-0 top-2 grid h-[15px] w-[15px] place-items-center rounded-full border border-ink transition-all duration-500 ${
                        on ? 'scale-125 bg-ink' : 'bg-sage'
                      }`}
                      aria-hidden
                    >
                      <span className={`h-1.5 w-1.5 rounded-full bg-cream transition-opacity duration-500 ${on ? 'opacity-100' : 'opacity-0'}`} />
                    </span>

                    <p data-entry-item className="eyebrow flex flex-wrap items-center gap-x-3 opacity-70">
                      <span className="font-display text-base tracking-normal">{String(i + 1).padStart(2, '0')}</span>
                      <span>{e.period}</span>
                    </p>
                    <h3 data-entry-item className="mt-3 text-2xl font-bold tracking-tight md:text-4xl">
                      {e.role}
                    </h3>
                    <p data-entry-item className="mt-1 text-sm font-semibold uppercase tracking-[0.14em] text-ink/70">
                      {e.company}
                    </p>
                    <ul className="mt-5 space-y-2.5 text-base leading-relaxed md:text-lg">
                      {e.points.map((p) => (
                        <li key={p} data-entry-item className="flex gap-3">
                          <span className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-ink/60" aria-hidden />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
