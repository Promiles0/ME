import { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import { skills } from '../data/profile'
import { onTilt } from '../lib/tilt'
import { gsap } from '../lib/motion'

/**
 * Skills as physical objects. Every tag is a rigid body: they rain into the
 * box, tumble and pile up. Desktop: grab and throw them. Phones: tilt the
 * device to change gravity, or tap Shake. "Zero-G" lets them float.
 *
 * The pills are real DOM elements (crisp text, selectable for screen readers
 * via the list below); matter-js only computes positions, which we copy onto
 * the elements each frame. The engine sleeps while the box is off screen.
 */

const TONES = [
  'bg-cream text-ink border-cream',
  'bg-sage text-ink border-sage',
  'bg-transparent text-cream border-cream/60',
  'bg-sage-deep text-cream border-sage-deep',
]

type Tag = { label: string; group: number }
const TAGS: Tag[] = skills.flatMap((g, gi) => g.items.map((label) => ({ label, group: gi })))

export default function SkillsPlayground() {
  const box = useRef<HTMLDivElement>(null)
  const pills = useRef<(HTMLLIElement | null)[]>([])
  const api = useRef<{ shake: () => void; reset: () => void; zeroG: (on: boolean) => void } | null>(null)
  const [zero, setZero] = useState(false)
  const [touch] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Events } = Matter

    const engine = Engine.create({ gravity: { x: 0, y: 1, scale: 0.0012 } })
    engine.enableSleeping = false
    let bodies: Matter.Body[] = []
    let walls: Matter.Body[] = []
    let drops: ReturnType<typeof setTimeout>[] = []

    const W = () => el.clientWidth
    const H = () => el.clientHeight

    const buildWalls = () => {
      Composite.remove(engine.world, walls)
      const t = 200
      walls = [
        Bodies.rectangle(W() / 2, H() + t / 2, W() + t * 2, t, { isStatic: true }), // floor
        Bodies.rectangle(-t / 2, H() / 2, t, H() * 4, { isStatic: true }), // left
        Bodies.rectangle(W() + t / 2, H() / 2, t, H() * 4, { isStatic: true }), // right
        Bodies.rectangle(W() / 2, -H() * 1.5 - t / 2, W() + t * 2, t, { isStatic: true }), // high ceiling
      ]
      Composite.add(engine.world, walls)
    }

    const drop = () => {
      drops.forEach(clearTimeout)
      drops = []
      Composite.remove(engine.world, bodies)
      bodies = TAGS.map((_, i) => {
        const pill = pills.current[i]!
        const w = pill.offsetWidth
        const h = pill.offsetHeight
        const b = Bodies.rectangle(40 + Math.random() * (W() - 80), -60 - Math.random() * H() * 0.8, w, h, {
          chamfer: { radius: h / 2 },
          restitution: 0.35,
          friction: 0.3,
          frictionAir: 0.012,
          density: 0.0018,
          angle: (Math.random() - 0.5) * 0.8,
        })
        return b
      })
      // Stagger them in so it rains rather than dumps.
      bodies.forEach((b, i) => {
        drops.push(setTimeout(() => Composite.add(engine.world, b), i * 55))
      })
    }

    buildWalls()
    drop()

    // Desktop: grab and throw. Touch devices keep native scrolling instead.
    let mc: Matter.MouseConstraint | null = null
    if (!touch) {
      const mouse = Mouse.create(el)
      // Let the page keep scrolling with the wheel over the box.
      const m = mouse as unknown as { mousewheel: EventListener }
      el.removeEventListener('wheel', m.mousewheel)
      el.removeEventListener('mousewheel', m.mousewheel)
      el.removeEventListener('DOMMouseScroll', m.mousewheel)
      mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.18, damping: 0.1, render: { visible: false } } })
      Composite.add(engine.world, mc)
      Events.on(mc, 'startdrag', () => el.classList.add('cursor-grabbing'))
      Events.on(mc, 'enddrag', () => el.classList.remove('cursor-grabbing'))
    }

    // Copy physics onto the DOM pills.
    Events.on(engine, 'afterUpdate', () => {
      bodies.forEach((b, i) => {
        const pill = pills.current[i]
        if (!pill) return
        const inWorld = engine.world.bodies.includes(b)
        pill.style.opacity = inWorld ? '1' : '0'
        pill.style.transform = `translate(${b.position.x - pill.offsetWidth / 2}px, ${b.position.y - pill.offsetHeight / 2}px) rotate(${b.angle}rad)`
      })
    })

    // Phones: gravity follows the tilt.
    const offTilt = onTilt((x, y) => {
      if (engine.gravity.scale === 0) return
      engine.gravity.x = x * 0.9
      engine.gravity.y = 0.6 + Math.max(-0.4, y) * 0.6
    })

    // Step the simulation on the shared GSAP ticker, only while visible.
    const step = (_t: number, dt: number) => {
      const r = el.getBoundingClientRect()
      if (r.bottom > 0 && r.top < window.innerHeight) Engine.update(engine, Math.min(dt, 33))
    }
    gsap.ticker.add(step)

    // Rebuild on width change.
    let lastW = W()
    const ro = new ResizeObserver(() => {
      if (Math.abs(W() - lastW) < 40) return
      lastW = W()
      buildWalls()
      drop()
    })
    ro.observe(el)

    api.current = {
      shake: () =>
        bodies.forEach((b) =>
          Body.setVelocity(b, { x: (Math.random() - 0.5) * 22, y: -8 - Math.random() * 14 }),
        ),
      reset: drop,
      zeroG: (on) => {
        engine.gravity.scale = on ? 0 : 0.0012
        if (on) bodies.forEach((b) => Body.setVelocity(b, { x: (Math.random() - 0.5) * 4, y: -2 - Math.random() * 4 }))
        bodies.forEach((b) => (b.frictionAir = on ? 0.002 : 0.012))
      },
    }

    return () => {
      drops.forEach(clearTimeout)
      ro.disconnect()
      offTilt()
      gsap.ticker.remove(step)
      Events.off(engine, 'afterUpdate', undefined as unknown as () => void)
      if (mc) Composite.remove(engine.world, mc)
      Composite.clear(engine.world, false)
      Engine.clear(engine)
      api.current = null
    }
  }, [touch])

  return (
    <div>
      {/* Legend + controls */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold">
          {skills.map((g, gi) => (
            <li key={g.group} className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full border ${TONES[gi % TONES.length]}`} aria-hidden />
              {g.group}
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => api.current?.shake()}
            data-cursor="Shake"
            className="rounded-full border border-cream/25 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] hover:bg-cream hover:text-ink"
          >
            Shake
          </button>
          <button
            type="button"
            aria-pressed={zero}
            onClick={() => {
              const on = !zero
              setZero(on)
              api.current?.zeroG(on)
            }}
            className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] ${zero ? 'border-cream bg-cream text-ink' : 'border-cream/25 hover:bg-cream hover:text-ink'}`}
          >
            Zero-G
          </button>
          <button
            type="button"
            onClick={() => {
              setZero(false)
              api.current?.zeroG(false)
              api.current?.reset()
            }}
            className="rounded-full border border-cream/25 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] hover:bg-cream hover:text-ink"
          >
            Drop again
          </button>
        </div>
      </div>

      {/* The box */}
      <div
        ref={box}
        data-cursor={touch ? '' : 'Grab'}
        className="relative h-[62vh] min-h-[420px] cursor-grab touch-pan-y select-none overflow-hidden rounded-[2rem] border border-cream/15 bg-ink-soft md:h-[68vh]"
        aria-hidden
      >
        <p className="pointer-events-none absolute inset-x-0 top-6 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-cream/40">
          {touch ? 'Tilt your phone · tap Shake' : 'Grab a skill and throw it'}
        </p>
        <ul>
          {TAGS.map((t, i) => (
            <li
              key={t.label}
              ref={(n) => {
                pills.current[i] = n
              }}
              className={`pointer-events-none absolute left-0 top-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold opacity-0 will-change-transform sm:px-4 sm:py-2 sm:text-sm md:px-5 md:py-2.5 md:text-base ${TONES[t.group % TONES.length]}`}
            >
              {t.label}
            </li>
          ))}
        </ul>
      </div>

      {/* The same skills as a plain list for screen readers */}
      <ul className="sr-only">
        {skills.map((g) => (
          <li key={g.group}>
            {g.group}: {g.items.join(', ')}
          </li>
        ))}
      </ul>
    </div>
  )
}
