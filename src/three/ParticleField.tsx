import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { ShapeBuilder, ShapeSet } from './textPoints'
import { isLowPowerDevice } from '../lib/motion'

/**
 * A reusable particle cloud. A `shapes` builder supplies three point sets
 * (a → b → c); `setMorph` blends between them. The pointer pushes particles
 * aside and the cloud leans toward it. All per-frame movement happens in the
 * vertex shader so the CPU does almost nothing.
 *
 * Used for the hero word (a: word, b: sphere, c: torus knot) and the About
 * portrait (a: scattered, b/c: the face stippled from a photo).
 */

type Pt = { x: number; y: number }
export type Tracker = () => { a?: Pt; c?: Pt; d?: Pt } | null

export type ParticleFieldHandle = {
  /** 0 = shape a, 1 = shape b, 2 = shape c. Values in between blend. */
  setMorph: (v: number) => void
  /** Blow every particle outward; they drift back into shape. */
  burst?: () => void
  /** Device tilt in -1..1 on each axis (phones); leans the cloud like the pointer does. */
  tilt?: (x: number, y: number) => void
}

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uMorph;
  uniform vec3 uMouse;
  uniform float uMouseStrength;
  uniform float uSize;
  uniform float uShadeSize;
  uniform float uDrift;
  uniform float uPixelRatio;
  uniform float uMode;
  uniform float uKick;
  uniform vec3 uOffA;
  uniform vec3 uOffC;
  uniform vec3 uOffD;
  uniform float uFloat;

  attribute vec3 aPosB;
  attribute vec3 aPosC;
  attribute vec3 aPosD;
  attribute float aRand;
  attribute float aShade;

  varying float vShade;
  varying float vForce;
  varying float vS3;
  varying float vR;

  void main() {
    float m1 = smoothstep(0.0, 1.0, clamp(uMorph, 0.0, 1.0));
    float m2 = smoothstep(0.0, 1.0, clamp(uMorph - 1.0, 0.0, 1.0));
    // Stagger each particle a little so the morph ripples rather than snaps.
    float s1 = smoothstep(0.0, 1.0, (m1 - aRand * 0.25) / 0.75);
    float s2 = smoothstep(0.0, 1.0, (m2 - aRand * 0.25) / 0.75);
    float m3 = smoothstep(0.0, 1.0, clamp(uMorph - 2.0, 0.0, 1.0));
    float s3 = smoothstep(0.0, 1.0, (m3 - aRand * 0.25) / 0.75);
    vec3 pb = aPosB;
    vec3 pc = aPosC;
    float waveH = 0.0;

    if (uMode > 0.5) {
      // Galaxy: differential swirl (inner stars orbit faster), then tilt toward the viewer.
      float rr = length(pb.xz);
      float ang = uTime * 0.45 / (0.35 + rr * 0.6);
      float ca = cos(ang), sa = sin(ang);
      pb.xz = mat2(ca, -sa, sa, ca) * pb.xz;
      pb.yz = mat2(cos(1.05), -sin(1.05), sin(1.05), cos(1.05)) * pb.yz;

      // Waves: two crossing swells rolling toward the viewer, tilted like a landscape.
      float tw = uTime * 1.3;
      waveH = 0.5 * sin(pc.x * 1.2 + tw) + 0.32 * cos(pc.z * 1.9 + tw * 0.8) + 0.12 * sin((pc.x + pc.z) * 3.1 - tw * 1.6);
      pc.y += waveH;
      pc.yz = mat2(cos(0.6), -sin(0.6), sin(0.6), cos(0.6)) * pc.yz;
      pc.y -= 0.2;
    }

    // uOffA / uOffC move shape a and shape c so they can follow elements on the page.
    vec3 p = mix(position + uOffA, pb, s1);
    p = mix(p, pc + uOffC, s2);
    // Fourth stage (optional): the face lets go and the grains rain into the footer word.
    p = mix(p, aPosD + uOffD, s3);

    // Burst: a click kick (any mode), plus mid-morph bursts in hero mode.
    vec3 dir = normalize(vec3(sin(aRand * 91.7), cos(aRand * 47.3), sin(aRand * 13.1)) + 0.0001);
    float burst = uKick * (2.4 + aRand * 2.6);
    if (uMode > 0.5) burst += sin(s1 * 3.14159) + sin(s2 * 3.14159);
    p += dir * burst * (0.6 + aRand * 0.9);

    // Idle drift: slow, organic breathing.
    float t = uTime * 0.6;
    // While in the middle shape (b), grains float far more freely: dust in the air.
    p += (uDrift + uFloat * s1 * (1.0 - s2) + uFloat * 2.4 * s3 * (1.0 - s3)) * vec3(
      sin(t + aRand * 6.2831),
      cos(t * 0.8 + aRand * 3.1),
      sin(t * 0.7 + aRand * 2.0)
    );

    // Pointer repulsion in world space.
    vec3 d = p - uMouse;
    float dist = length(d);
    float force = smoothstep(1.4, 0.0, dist) * uMouseStrength;
    p += normalize(d + 0.0001) * force * 0.9;
    vForce = max(force, uMode * s2 * clamp(waveH * 2.2, 0.0, 1.0) * 0.55);
    // Tone: random mix (cream and ink) for the name and dust, photo shading once in the face.
    float tone = mix(mix(aRand, aShade, s2), aRand, s3);
    vShade = tone;
    vS3 = s3;
    vR = aRand;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = uSize * (0.6 + aRand * 0.8) * (1.0 + force * 1.5) * (1.0 - tone * uShadeSize) * (1.0 - 0.35 * uFloat * s1 * (1.0 - s2) / max(uFloat, 0.0001) * step(0.0001, uFloat));
    gl_PointSize = size * uPixelRatio * (6.0 / -mv.z);
  }
`

const fragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorHot;
  uniform float uSplit;
  varying float vShade;
  varying float vForce;
  varying float vS3;
  varying float vR;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv);
    if (r > 0.5) discard;
    float alpha = smoothstep(0.5, 0.15, r);
    vec3 col = mix(uColorA, uColorB, step(uSplit, vShade));
    // On the dark footer the grains turn cream and sage so they read on ink.
    vec3 colD = mix(vec3(0.91, 0.82, 0.71), vec3(0.65, 0.655, 0.61), step(0.72, vR));
    col = mix(col, colD, vS3);
    col = mix(col, uColorHot, vForce);
    gl_FragColor = vec4(col, alpha * 0.95);
  }
`

export type ParticleStyle = {
  /** Colour for points whose shade is below `split`. */
  colorA?: string
  /** Colour for points whose shade is at or above `split`. */
  colorB?: string
  /** Colour particles flash when pushed by the pointer. */
  colorHot?: string
  split?: number
  size?: number
  /** How much point size shrinks for lighter shades (0 = none). */
  shadeSize?: number
  /** Amplitude of the idle breathing. */
  drift?: number
}

type CloudProps = {
  shapes: ShapeBuilder
  count: number
  fit: number
  handle: React.MutableRefObject<ParticleFieldHandle | null>
  interactive: boolean
  mouseStrength: number
  lean: number
  spin: boolean
  style: Required<ParticleStyle>
  choreography: boolean
  track?: Tracker
  floatAmount: number
}

function Cloud({ shapes, count, fit, handle, interactive, mouseStrength, lean: leanAmount, spin, style, choreography, track, floatAmount }: CloudProps) {
  const points = useRef<THREE.Points>(null)
  const { viewport, size, gl, invalidate } = useThree()
  const mouse = useRef(new THREE.Vector3(999, 999, 0))
  const target = useRef(new THREE.Vector3(999, 999, 0))
  const lean = useRef({ x: 0, y: 0 })
  const morph = useRef(0)
  const kick = useRef(0)
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)

  const worldWidth = Math.min(viewport.width * fit, 9)

  // Build the point sets (possibly async, e.g. after an image loads).
  useEffect(() => {
    let alive = true
    Promise.resolve(shapes(count, worldWidth, { w: viewport.width, h: viewport.height })).then((set: ShapeSet) => {
      if (!alive) return
      const g = new THREE.BufferGeometry()
      const rand = new Float32Array(count)
      for (let i = 0; i < count; i++) rand[i] = Math.random()
      g.setAttribute('position', new THREE.BufferAttribute(set.a, 3))
      g.setAttribute('aPosB', new THREE.BufferAttribute(set.b, 3))
      g.setAttribute('aPosC', new THREE.BufferAttribute(set.c, 3))
      g.setAttribute('aPosD', new THREE.BufferAttribute(set.d ?? set.c, 3))
      g.setAttribute('aRand', new THREE.BufferAttribute(rand, 1))
      g.setAttribute('aShade', new THREE.BufferAttribute(set.shade ?? rand, 1))
      g.computeBoundingSphere()
      setGeometry((old) => {
        old?.dispose()
        return g
      })
      invalidate()
    })
    return () => {
      alive = false
    }
  }, [shapes, count, worldWidth, viewport.width, viewport.height, invalidate])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uMorph: { value: 0 },
          uMouse: { value: new THREE.Vector3(999, 999, 0) },
          uMouseStrength: { value: interactive ? mouseStrength : 0 },
          uSize: { value: style.size },
          uShadeSize: { value: style.shadeSize },
          uDrift: { value: style.drift },
          uPixelRatio: { value: 1 },
          uColorA: { value: new THREE.Color(style.colorA) },
          uColorB: { value: new THREE.Color(style.colorB) },
          uColorHot: { value: new THREE.Color(style.colorHot) },
          uSplit: { value: style.split },
          uMode: { value: choreography ? 1 : 0 },
          uKick: { value: 0 },
          uOffA: { value: new THREE.Vector3() },
          uOffC: { value: new THREE.Vector3() },
          uOffD: { value: new THREE.Vector3() },
          uFloat: { value: floatAmount },
        },
      }),
    [interactive, mouseStrength, style, choreography, floatAmount],
  )

  useEffect(() => {
    handle.current = {
      burst: () => {
        kick.current = 1
        invalidate()
      },
      tilt: (x, y) => {
        lean.current = { x, y }
        invalidate()
      },
      setMorph: (v) => {
        morph.current = v
        invalidate()
      },
    }
    return () => {
      handle.current = null
    }
  }, [handle, invalidate])

  useEffect(() => {
    material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
  }, [material, size])

  // Track the pointer over the whole window and convert it into this canvas's
  // world space, so the cloud reacts even when the pointer is over nearby text.
  useEffect(() => {
    if (!interactive) return
    const el = gl.domElement
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const x = ((e.clientX - r.left) / r.width) * 2 - 1
      const y = -((e.clientY - r.top) / r.height) * 2 + 1
      target.current.set((x * viewport.width) / 2, (y * viewport.height) / 2, 0)
      lean.current = { x: THREE.MathUtils.clamp(x, -1, 1), y: THREE.MathUtils.clamp(y, -1, 1) }
      invalidate()
    }
    const onLeave = () => target.current.set(999, 999, 0)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [interactive, gl, viewport.width, viewport.height, invalidate])

  useFrame((state, delta) => {
    const u = material.uniforms
    u.uTime.value = state.clock.elapsedTime
    u.uMorph.value += (morph.current - u.uMorph.value) * Math.min(1, delta * 6)
    // Kick rises fast and settles slowly, so the burst feels like an explosion then a regroup.
    kick.current *= Math.pow(0.4, delta)
    u.uKick.value += (kick.current - u.uKick.value) * Math.min(1, delta * 14)
    // Follow page elements: convert their screen centres (px) into world offsets.
    if (track) {
      const t = track()
      const toWorld = (pt: { x: number; y: number }, out: THREE.Vector3) =>
        out.set((pt.x / size.width - 0.5) * viewport.width, -(pt.y / size.height - 0.5) * viewport.height, 0)
      if (t?.a) toWorld(t.a, u.uOffA.value as THREE.Vector3)
      if (t?.c) toWorld(t.c, u.uOffC.value as THREE.Vector3)
      if (t?.d) toWorld(t.d, u.uOffD.value as THREE.Vector3)
    }
    mouse.current.lerp(target.current, Math.min(1, delta * 9))
    ;(u.uMouse.value as THREE.Vector3).copy(mouse.current)

    const obj = points.current
    if (!obj) return
    const spinAngle = spin ? u.uMorph.value * state.clock.elapsedTime * 0.25 : 0
    const tx = -lean.current.y * 0.35 * leanAmount
    const ty = lean.current.x * 0.5 * leanAmount + spinAngle
    obj.rotation.x += (tx - obj.rotation.x) * Math.min(1, delta * 3)
    obj.rotation.y += (ty - obj.rotation.y) * Math.min(1, delta * 3)
  })

  if (!geometry) return null
  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
}

type Props = {
  shapes: ShapeBuilder
  handle: React.MutableRefObject<ParticleFieldHandle | null>
  /** Run the render loop. When false the scene renders only on demand. */
  active: boolean
  className?: string
  /** Fraction of the canvas width the shape should span (0..1). */
  fit?: number
  /** 0..1 strength of the pointer repulsion. */
  mouseStrength?: number
  /** 0..1 how far the whole cloud leans toward the pointer. */
  lean?: number
  /** Slowly rotate once morphed into a 3D shape. */
  spin?: boolean
  /** Point counts for capable and low-powered devices. */
  count?: { high: number; low: number }
  style?: ParticleStyle
  /** Hero-only motion: swirling galaxy, rolling waves and a burst between shapes. */
  choreography?: boolean
  /** Called every frame: screen-pixel centres that shape a and shape c should sit on. */
  track?: Tracker
  /** Extra floating while in shape b (0 = none). */
  float?: number
}

const defaultStyle: Required<ParticleStyle> = {
  colorA: '#e8d2b5',
  colorB: '#1a1a16',
  colorHot: '#fff4e3',
  split: 0.78,
  size: 2.4,
  shadeSize: 0,
  drift: 0.06,
}

export default function ParticleField({
  shapes,
  handle,
  active,
  className,
  fit = 0.78,
  mouseStrength = 1,
  lean = 1,
  spin = true,
  count = { high: 22000, low: 9000 },
  style,
  choreography = false,
  track,
  float = 0,
}: Props) {
  const lowPower = useMemo(isLowPowerDevice, [])
  const n = lowPower ? count.low : count.high
  const merged = useMemo(() => ({ ...defaultStyle, ...style }), [style])

  return (
    <div className={className} aria-hidden>
      <Canvas
        dpr={[1, lowPower ? 1.5 : 2]}
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        frameloop={active ? 'always' : 'demand'}
        style={{ pointerEvents: 'none' }}
      >
        <Cloud
          shapes={shapes}
          count={n}
          fit={fit}
          handle={handle}
          interactive={!lowPower}
          mouseStrength={mouseStrength}
          lean={lean}
          spin={spin}
          style={merged}
          choreography={choreography}
          track={track}
          floatAmount={float}
        />
      </Canvas>
    </div>
  )
}
