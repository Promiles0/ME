import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/motion'

const LenisContext = createContext<Lenis | null>(null)
export const useLenis = () => useContext(LenisContext)

type Props = { children: ReactNode; paused?: boolean }

/**
 * Site-wide smooth scrolling. Lenis drives the scroll position and GSAP's
 * ticker drives Lenis, so ScrollTrigger and Lenis always agree on where the
 * page is. Disabled entirely when the visitor prefers reduced motion.
 */
export default function SmoothScroll({ children, paused = false }: Props) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return

    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      syncTouch: false,
      anchors: { offset: -72 },
    })
    lenisRef.current = lenis

    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  useEffect(() => {
    const lenis = lenisRef.current
    if (!lenis) return
    if (paused) lenis.stop()
    else lenis.start()
  }, [paused])

  return <LenisContext.Provider value={lenisRef.current}>{children}</LenisContext.Provider>
}
