import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gsap, useReducedMotion } from '../lib/motion'
import { storyShapes } from '../three/shapes'
import type { ParticleFieldHandle } from '../three/ParticleField'
import { onTilt } from '../lib/tilt'
import { storyField } from '../lib/story'

const ParticleField = lazy(() => import('../three/ParticleField'))

/**
 * One set of grains for the whole opening story, on a single fixed layer:
 *
 *   top of page        the grains spell the name in the hero
 *   through the hero   they let go and float as dust across the screen
 *   into About         they fall with you and settle on the portrait card as the face
 *
 * It's a pure function of scroll position, so scrolling up plays it backwards
 * on the same grains. The name is pinned to the hero's name slot and the face
 * to the portrait card every frame, so the face stays glued to the card.
 */
export default function StoryParticles({ ready }: { ready: boolean }) {
  const reduced = useReducedMotion()
  const handle = useRef<ParticleFieldHandle | null>(null)
  const [active, setActive] = useState(true)
  const [word] = useState(() => (window.innerWidth < 768 ? 'AROI' : 'AROI SERGE'))
  const shapes = useMemo(() => storyShapes(word, '/images/portrait.jpg'), [word])

  // Element lookups, cached.
  const els = useRef<{ slot: Element | null; card: Element | null; about: Element | null; hero: HTMLElement | null }>({
    slot: null,
    card: null,
    about: null,
    hero: null,
  })
  const find = () => {
    const e = els.current
    if (!e.slot || !e.slot.isConnected) e.slot = document.querySelector('[data-name-slot]')
    if (!e.card || !e.card.isConnected) e.card = document.querySelector('[data-portrait-card]')
    if (!e.about || !e.about.isConnected) e.about = document.getElementById('about')
    if (!e.hero || !e.hero.isConnected) e.hero = document.querySelector('main > section')
    return e
  }

  // Where shape a (name) and shape c (face) sit on screen, every frame.
  const track = useCallback(() => {
    const { slot, card } = find()
    const centre = (el: Element | null) => {
      if (!el) return undefined
      const r = el.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    }
    return { a: centre(slot), c: centre(card) }
  }, [])

  // Scroll -> morph (0 name, 1 dust, 2 face), plus pausing once it's all off screen.
  useEffect(() => {
    if (reduced) return
    const tick = () => {
      const { hero, card, about } = find()
      if (!hero || !card) return
      const y = window.scrollY
      const vh = window.innerHeight
      // Name -> dust over the first part of the hero's scroll.
      const heroScroll = hero.offsetHeight - vh
      const m1 = gsap.utils.clamp(0, 1, y / Math.max(1, heroScroll * 0.7))
      // Dust -> face as the card travels from the bottom of the screen to its middle.
      const r = card.getBoundingClientRect()
      const cardMidPage = r.top + y + r.height / 2
      const start = cardMidPage - vh * 1.15
      const end = cardMidPage - vh * 0.5
      const m2 = gsap.utils.clamp(0, 1, (y - start) / Math.max(1, end - start))
      handle.current?.setMorph(m1 + m2)

      const aboutBottom = about ? about.getBoundingClientRect().bottom : 1
      const on = aboutBottom > 0
      setActive((prev) => (prev === on ? prev : on))
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [reduced])

  // Expose burst to the hero's button; tilt leans the cloud on phones.
  useEffect(() => {
    storyField.current = { burst: () => handle.current?.burst?.() }
    const off = onTilt((x, yy) => handle.current?.tilt?.(x, yy))
    return () => {
      storyField.current = null
      off()
    }
  }, [])

  if (reduced) return null

  return (
    <Suspense fallback={null}>
      <ParticleField
        shapes={shapes}
        handle={handle}
        track={track}
        float={0.35}
        active={active && ready}
        className="pointer-events-none fixed inset-0 z-[20]"
        fit={1}
        mouseStrength={0.8}
        lean={0.06}
        spin={false}
        count={{ high: 24000, low: 10000 }}
        style={{ colorA: '#1a1a16', colorB: '#e8d2b5', colorHot: '#fff4e3', split: 0.46, size: 2.3, shadeSize: 0.3, drift: 0.035 }}
      />
    </Suspense>
  )
}
