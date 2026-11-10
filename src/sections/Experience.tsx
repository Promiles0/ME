import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, useReducedMotion } from '../lib/motion'
import { experience } from '../data/profile'
import SectionHeading from '../components/SectionHeading'

/**
 * Experience: a vertical timeline that draws itself as you scroll. A huge year
 * on the left (sticky on desktop) flips to match whichever entry is in view.
 */
export default function Experience() {
  const section = useRef<HTMLElement>(null)
  const line = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [year, setYear] = useState(experience[0].year)

  useEffect(() => {
    if (!section.current) return
    const ctx = gsap.context(() => {
      if (!reduced) {
        gsap.fromTo(
          line.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: { trigger: '[data-timeline]', start: 'top 70%', end: 'bottom 60%', scrub: 0.4 },
          },
        )
      } else {
        gsap.set(line.current, { scaleY: 1 })
      }

      const entries = gsap.utils.toArray<HTMLElement>('[data-entry]')

      // One trigger decides which entry is "current": the last one whose top
      // has passed 60% of the viewport. Falls back to the first entry, so the
      // big year is never stale when nothing is in the active band.
      const pick = () => {
        const line = window.innerHeight * 0.6
        let current = entries[0]
        for (const el of entries) if (el.getBoundingClientRect().top <= line) current = el
        entries.forEach((el) => el.classList.toggle('is-active', el === current))
        setYear(current?.dataset.year ?? experience[0].year)
      }
      ScrollTrigger.create({ trigger: section.current, start: 'top bottom', end: 'bottom top', onUpdate: pick, onRefresh: pick })

      entries.forEach((entry) => {
        if (!reduced) {
          gsap.fromTo(
            entry.querySelectorAll('[data-entry-item]'),
            { opacity: 0, x: 24 },
            {
              opacity: 1,
              x: 0,
              duration: 0.7,
              stagger: 0.07,
              ease: 'expo.out',
              scrollTrigger: { trigger: entry, start: 'top 80%' },
            },
          )
        }
      })
    }, section)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section id="experience" ref={section} className="relative overflow-hidden bg-sage py-28 md:py-40">
      <div className="relative mx-auto max-w-[88rem] px-6 md:px-10">
        <SectionHeading index="02" eyebrow="Experience" title="Where I have" outline="been building" />

        <div className="mt-16 grid gap-10 md:mt-24 md:grid-cols-12">
          {/* Sticky year */}
          <div className="md:col-span-5">
            <div className="md:sticky md:top-32">
              <p className="eyebrow opacity-70">Timeline</p>
              <div className="relative mt-2 h-[0.9em] overflow-hidden font-display text-[clamp(6rem,16vw,15rem)] leading-[0.9]">
                {Array.from(new Set(experience.map((e) => e.year))).map((y) => (
                  <span
                    key={y}
                    aria-hidden={y !== year}
                    className="absolute left-0 top-0 block transition-all duration-700 [transition-timing-function:cubic-bezier(.16,1,.3,1)]"
                    style={{ transform: `translateY(${y === year ? 0 : Number(y) > Number(year) ? -100 : 100}%)`, opacity: y === year ? 1 : 0 }}
                  >
                    {y}
                  </span>
                ))}
              </div>
              <p className="mt-4 max-w-xs text-sm opacity-80">
                From designing pages to shipping full-stack products. Scroll to draw the line.
              </p>
            </div>
          </div>

          {/* Entries */}
          <div data-timeline className="relative md:col-span-7">
            <div className="absolute bottom-0 left-[7px] top-0 w-px bg-ink/15" aria-hidden />
            <div ref={line} className="absolute bottom-0 left-[7px] top-0 w-px origin-top bg-ink" aria-hidden />

            <ol className="space-y-16 md:space-y-24">
              {experience.map((e, i) => (
                <li key={e.role + e.company} data-entry data-year={e.year} className="group relative pl-10 md:pl-14">
                  <span
                    className="absolute left-0 top-2 grid h-[15px] w-[15px] place-items-center rounded-full border border-ink bg-sage transition-colors duration-500 group-[.is-active]:bg-ink"
                    aria-hidden
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-cream opacity-0 transition-opacity duration-500 group-[.is-active]:opacity-100" />
                  </span>

                  <p data-entry-item className="eyebrow flex flex-wrap items-center gap-x-3 opacity-70">
                    <span className="font-display text-base tracking-normal">{String(i + 1).padStart(2, '0')}</span>
                    <span>{e.period}</span>
                  </p>
                  <h3 data-entry-item className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
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
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
