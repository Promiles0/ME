import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { spherePoints, textPoints, torusKnotPoints } from './textPoints'
import { isLowPowerDevice } from '../lib/motion'

/**
 * The hero's signature piece: a cloud of particles that spells a word, and
 * melts into a sphere and then a torus knot as you scroll. The pointer pushes
 * particles out of the way; the whole cloud leans toward the pointer.
 *
 * All movement happens in the vertex shader, so the CPU does almost nothing
 * per frame. Point count scales down on low-powered devices.
 */

export type ParticleFieldHandle = {
  /** 0 = word, 1 = sphere, 2 = torus knot. Values in between blend. */
  setMorph: (v: number) => void
}

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uMorph;
  uniform vec3 uMouse;
  uniform float uMouseStrength;
  uniform float uSize;
  uniform float uPixelRatio;

  attribute vec3 aPosB;
  attribute vec3 aPosC;
  attribute float aRand;

  varying float vRand;
  varying float vForce;

  void main() {
    float m1 = smoothstep(0.0, 1.0, clamp(uMorph, 0.0, 1.0));
    float m2 = smoothstep(0.0, 1.0, clamp(uMorph - 1.0, 0.0, 1.0));
    // Stagger each particle a little so the morph ripples rather than snaps.
    float s1 = smoothstep(0.0, 1.0, (m1 - aRand * 0.25) / 0.75);
    float s2 = smoothstep(0.0, 1.0, (m2 - aRand * 0.25) / 0.75);
    vec3 p = mix(position, aPosB, s1);
    p = mix(p, aPosC, s2);

    // Idle drift: slow, organic breathing.
    float t = uTime * 0.6;
    p += 0.06 * vec3(
      sin(t + aRand * 6.2831),
      cos(t * 0.8 + aRand * 3.1),
      sin(t * 0.7 + aRand * 2.0)
    );

    // Pointer repulsion in world space.
    vec3 d = p - uMouse;
    float dist = length(d);
    float force = smoothstep(1.4, 0.0, dist) * uMouseStrength;
    p += normalize(d + 0.0001) * force * 0.9;
    vForce = force;
    vRand = aRand;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = uSize * (0.6 + aRand * 0.8) * (1.0 + force * 1.5);
    gl_PointSize = size * uPixelRatio * (6.0 / -mv.z);
  }
`

const fragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorHot;
  varying float vRand;
  varying float vForce;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv);
    if (r > 0.5) discard;
    float alpha = smoothstep(0.5, 0.15, r);
    vec3 col = mix(uColorA, uColorB, step(0.78, vRand));
    col = mix(col, uColorHot, vForce);
    gl_FragColor = vec4(col, alpha * 0.95);
  }
`

type CloudProps = {
  word: string
  count: number
  handle: React.MutableRefObject<ParticleFieldHandle | null>
  interactive: boolean
}

function Cloud({ word, count, handle, interactive }: CloudProps) {
  const points = useRef<THREE.Points>(null)
  const { viewport, size } = useThree()
  const mouse = useRef(new THREE.Vector3(999, 999, 0))
  const target = useRef(new THREE.Vector3(999, 999, 0))
  const lean = useRef({ x: 0, y: 0 })
  const morph = useRef(0)

  const worldWidth = Math.min(viewport.width * 0.78, 9)

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const a = textPoints(word, count, worldWidth)
    const b = spherePoints(count, worldWidth * 0.22)
    const c = torusKnotPoints(count, worldWidth * 0.2, worldWidth * 0.045)
    const rand = new Float32Array(count)
    for (let i = 0; i < count; i++) rand[i] = Math.random()
    g.setAttribute('position', new THREE.BufferAttribute(a, 3))
    g.setAttribute('aPosB', new THREE.BufferAttribute(b, 3))
    g.setAttribute('aPosC', new THREE.BufferAttribute(c, 3))
    g.setAttribute('aRand', new THREE.BufferAttribute(rand, 1))
    g.computeBoundingSphere()
    return g
  }, [word, count, worldWidth])

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
          uMouseStrength: { value: interactive ? 1 : 0 },
          uSize: { value: 2.4 },
          uPixelRatio: { value: 1 },
          uColorA: { value: new THREE.Color('#e8d2b5') },
          uColorB: { value: new THREE.Color('#1a1a16') },
          uColorHot: { value: new THREE.Color('#fff4e3') },
        },
      }),
    [interactive],
  )

  useEffect(() => {
    handle.current = { setMorph: (v) => (morph.current = v) }
    return () => {
      handle.current = null
    }
  }, [handle])

  useEffect(() => {
    material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
  }, [material, size])

  // Track the pointer over the whole window so the cloud reacts even when the
  // pointer is over the hero text, not just the canvas.
  useEffect(() => {
    if (!interactive) return
    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = -(e.clientY / window.innerHeight) * 2 + 1
      target.current.set((x * viewport.width) / 2, (y * viewport.height) / 2, 0)
      lean.current = { x, y }
    }
    const onLeave = () => target.current.set(999, 999, 0)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [interactive, viewport.width, viewport.height])

  useFrame((state, delta) => {
    const u = material.uniforms
    u.uTime.value = state.clock.elapsedTime
    u.uMorph.value += (morph.current - u.uMorph.value) * Math.min(1, delta * 6)
    mouse.current.lerp(target.current, Math.min(1, delta * 9))
    ;(u.uMouse.value as THREE.Vector3).copy(mouse.current)

    const obj = points.current
    if (!obj) return
    // Lean toward the pointer, and slowly spin once it has become a 3D shape.
    const spin = u.uMorph.value * state.clock.elapsedTime * 0.25
    const tx = -lean.current.y * 0.35
    const ty = lean.current.x * 0.5 + spin
    obj.rotation.x += (tx - obj.rotation.x) * Math.min(1, delta * 3)
    obj.rotation.y += (ty - obj.rotation.y) * Math.min(1, delta * 3)
  })

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
}

type Props = {
  word: string
  handle: React.MutableRefObject<ParticleFieldHandle | null>
  active: boolean
  className?: string
}

export default function ParticleField({ word, handle, active, className }: Props) {
  const [fontReady, setFontReady] = useState(false)
  const lowPower = useMemo(isLowPowerDevice, [])
  const count = lowPower ? 9000 : 22000

  useEffect(() => {
    let alive = true
    const load = document.fonts?.load('400 200px "Bebas Neue"') ?? Promise.resolve()
    Promise.race([load, new Promise((r) => setTimeout(r, 1500))]).then(() => alive && setFontReady(true))
    return () => {
      alive = false
    }
  }, [])

  if (!fontReady) return null

  return (
    <div className={className} aria-hidden>
      <Canvas
        dpr={[1, lowPower ? 1.5 : 2]}
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        frameloop={active ? 'always' : 'never'}
        style={{ pointerEvents: 'none' }}
      >
        <Cloud word={word} count={count} handle={handle} interactive={!lowPower} />
      </Canvas>
    </div>
  )
}
