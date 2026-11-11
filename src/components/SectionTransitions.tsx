import { useEffect } from 'react'
import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/motion'

/**
 * Every section after the hero rises in as a rounded, inset card and opens
 * out to full bleed as it reaches the top of the screen, so colour changes
 * feel like new pages sliding over the last one. Pure clip-path, so layout,
 * sticky panels and pins are untouched. Waits for lazy sections to mount.
 */
export default function SectionTransitions() {
  useEffect(() => {
    if (prefersReducedMotion()) return
    let ctx: gsap.Context | undefined
    let tries = 0

    const setup = () => {
      const sections = Array.from(document.querySelectorAll<HTMLElement>('main > section')).slice(1)
      if (!sections.some((s) => s.id === 'projects') && tries++ < 20) {
        setTimeout(setup, 250)
        return
      }
      ctx = gsap.context(() => {
        const mm = gsap.matchMedia()
        mm.add({ desktop: '(min-width: 768px)', mobile: '(max-width: 767px)' }, (c) => {
          const inset = c.conditions?.desktop ? '5%' : '3%'
          const radius = c.conditions?.desktop ? '56px' : '28px'
          sections.forEach((s) => {
            gsap.fromTo(
              s,
              { clipPath: `inset(0% ${inset} 0% ${inset} round ${radius} ${radius} 0 0)` },
              {
                clipPath: 'inset(0% 0% 0% 0% round 0px 0px 0 0)',
                ease: 'none',
                scrollTrigger: { trigger: s, start: 'top bottom', end: 'top 20%', scrub: true },
              },
            )
          })
        })
      })
      ScrollTrigger.refresh()
    }
    setup()
    return () => ctx?.revert()
  }, [])

  return null
}
