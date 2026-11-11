/**
 * Helpers that produce point clouds for the particle fields.
 * Each returns a flat Float32Array of xyz triples, `count` points long.
 */

export type ShapeSet = {
  a: Float32Array
  b: Float32Array
  c: Float32Array
  /** Optional per-point tone in 0..1 (0 = darkest). Random when omitted. */
  shade?: Float32Array
}

/** `view` is the canvas's visible size in world units, for builders that place shapes off-centre. */
export type ShapeBuilder = (count: number, worldWidth: number, view: { w: number; h: number }) => Promise<ShapeSet> | ShapeSet

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

/**
 * Stipple a photo: darker pixels attract more points, near-white pixels get
 * none. Returns positions plus a per-point shade (luminance) so the shader can
 * tint dark areas differently from mid-tones. The image is fitted to
 * `worldWidth` wide, keeping its aspect ratio.
 */
export async function imagePoints(
  src: string,
  count: number,
  worldWidth: number,
  opts: { gamma?: number; cutoff?: number; depth?: number } = {},
): Promise<{ positions: Float32Array; shade: Float32Array }> {
  const { gamma = 2.0, cutoff = 0.82, depth = 0.5 } = opts
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image()
    im.crossOrigin = 'anonymous'
    im.onload = () => resolve(im)
    im.onerror = reject
    im.src = src
  })

  const W = 360
  const H = Math.round((img.naturalHeight / img.naturalWidth) * W)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, W, H)
  const { data } = ctx.getImageData(0, 0, W, H)

  // Luminance per pixel and a weight that favours dark areas.
  const lum = new Float32Array(W * H)
  const weight = new Float32Array(W * H)
  let total = 0
  for (let i = 0; i < W * H; i++) {
    const l = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255
    lum[i] = l
    const w = l >= cutoff ? 0 : Math.pow(1 - l / cutoff, gamma)
    weight[i] = w
    total += w
  }

  // Cumulative distribution for weighted sampling.
  const cdf = new Float32Array(W * H)
  let acc = 0
  for (let i = 0; i < W * H; i++) {
    acc += weight[i] / total
    cdf[i] = acc
  }
  const pick = () => {
    const r = Math.random()
    let lo = 0
    let hi = cdf.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (cdf[mid] < r) lo = mid + 1
      else hi = mid
    }
    return lo
  }

  const positions = new Float32Array(count * 3)
  const shade = new Float32Array(count)
  const scale = worldWidth / W
  for (let i = 0; i < count; i++) {
    const idx = pick()
    const px = (idx % W) + Math.random()
    const py = Math.floor(idx / W) + Math.random()
    const l = lum[idx]
    positions[i * 3] = (px - W / 2) * scale
    positions[i * 3 + 1] = (H / 2 - py) * scale
    // Dark areas sit slightly forward for a little relief.
    positions[i * 3 + 2] = (1 - l) * depth - depth * 0.5 + (Math.random() - 0.5) * 0.08
    shade[i] = l
  }
  return { positions, shade }
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

/** A loose cloud of points, used as the "before" state of an assembling shape. */
export function scatterPoints(count: number, width: number, height: number, depth = 3): Float32Array {
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    out[i * 3] = (Math.random() - 0.5) * width * 1.6
    out[i * 3 + 1] = (Math.random() - 0.5) * height * 1.6
    out[i * 3 + 2] = (Math.random() - 0.5) * depth
  }
  return out
}

/**
 * A three-armed spiral galaxy lying flat in the XZ plane, with a dense core.
 * The hero shader swirls it (inner stars faster) and tilts it toward the viewer.
 */
export function galaxyPoints(count: number, radius: number, arms = 3): Float32Array {
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const r = Math.pow(Math.random(), 1.7) * radius
    const branch = ((i % arms) / arms) * Math.PI * 2
    const twist = (r / radius) * 5.2
    const spread = Math.pow(Math.random(), 3) * 0.55 * (0.25 + r / radius) * radius * 0.35
    const sign = () => (Math.random() < 0.5 ? -1 : 1)
    out[i * 3] = Math.cos(branch + twist) * r + sign() * spread * Math.random()
    out[i * 3 + 1] = sign() * Math.pow(Math.random(), 4) * radius * 0.08 * (1 - r / radius + 0.2)
    out[i * 3 + 2] = Math.sin(branch + twist) * r + sign() * spread * Math.random()
  }
  return out
}

/** A jittered grid in the XZ plane; the hero shader turns it into rolling waves. */
export function wavePoints(count: number, width: number, depth: number): Float32Array {
  const out = new Float32Array(count * 3)
  const cols = Math.ceil(Math.sqrt(count * (width / depth)))
  const rows = Math.ceil(count / cols)
  for (let i = 0; i < count; i++) {
    const cx = i % cols
    const cz = Math.floor(i / cols)
    out[i * 3] = (cx / (cols - 1) - 0.5) * width + (Math.random() - 0.5) * (width / cols) * 0.6
    out[i * 3 + 1] = 0
    out[i * 3 + 2] = (cz / (rows - 1) - 0.5) * depth + (Math.random() - 0.5) * (depth / rows) * 0.6
  }
  return out
}
