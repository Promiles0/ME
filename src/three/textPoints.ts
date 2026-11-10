/**
 * Helpers that produce point clouds for the hero particle field.
 * Each returns a flat Float32Array of xyz triples, `count` points long.
 */

/** Sample points that fall inside rendered glyphs of `text`. */
export function textPoints(text: string, count: number, worldWidth: number, fontFamily = 'Bebas Neue'): Float32Array {
  const W = 1024
  const H = 512
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = '#000'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // Fit the word to roughly 90% of the canvas width.
  let size = 460
  ctx.font = `400 ${size}px "${fontFamily}", Impact, sans-serif`
  const measured = ctx.measureText(text).width
  size = Math.floor(size * Math.min(1, (W * 0.9) / measured))
  ctx.font = `400 ${size}px "${fontFamily}", Impact, sans-serif`
  ctx.fillText(text, W / 2, H / 2 + size * 0.04)

  const { data } = ctx.getImageData(0, 0, W, H)
  const inside: number[] = []
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (data[(y * W + x) * 4 + 3] > 128) inside.push(x, y)
    }
  }

  const out = new Float32Array(count * 3)
  const scale = worldWidth / W
  const n = inside.length / 2
  for (let i = 0; i < count; i++) {
    const k = Math.floor(Math.random() * n) * 2
    const px = inside[k] + Math.random() * 2
    const py = inside[k + 1] + Math.random() * 2
    out[i * 3] = (px - W / 2) * scale
    out[i * 3 + 1] = (H / 2 - py) * scale
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.35
  }
  return out
}

/** Evenly distributed points on a sphere (Fibonacci lattice) with light jitter. */
export function spherePoints(count: number, radius: number): Float32Array {
  const out = new Float32Array(count * 3)
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = golden * i
    const jitter = 0.92 + Math.random() * 0.16
    out[i * 3] = Math.cos(theta) * r * radius * jitter
    out[i * 3 + 1] = y * radius * jitter
    out[i * 3 + 2] = Math.sin(theta) * r * radius * jitter
  }
  return out
}

/** Points scattered on a torus knot tube. */
export function torusKnotPoints(count: number, radius: number, tube: number, p = 2, q = 3): Float32Array {
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI * 2
    const r = radius * (2 + Math.cos(q * t)) * 0.5
    const cx = r * Math.cos(p * t)
    const cy = r * Math.sin(p * t)
    const cz = radius * Math.sin(q * t) * 0.5
    // Approximate normal direction for the tube offset.
    const nx = Math.cos(p * t) * Math.cos(phi)
    const ny = Math.sin(p * t) * Math.cos(phi)
    const nz = Math.sin(phi)
    out[i * 3] = cx + nx * tube
    out[i * 3 + 1] = cy + ny * tube
    out[i * 3 + 2] = cz + nz * tube
  }
  return out
}
