import { imagePoints, scatterPoints, spherePoints, textPoints, torusKnotPoints, type ShapeBuilder } from './textPoints'

/** Hero: the word, then a sphere, then a torus knot. Waits for the display font. */
export function wordShapes(word: string): ShapeBuilder {
  return async (count, worldWidth) => {
    const load = document.fonts?.load('400 200px "Bebas Neue"').catch(() => undefined) ?? Promise.resolve()
    await Promise.race([load, new Promise((r) => setTimeout(r, 1500))])
    return {
      a: textPoints(word, count, worldWidth),
      b: spherePoints(count, worldWidth * 0.22),
      c: torusKnotPoints(count, worldWidth * 0.2, worldWidth * 0.045),
    }
  }
}

/** About: a loose cloud that assembles into a stippled portrait. */
export function portraitShapes(src: string): ShapeBuilder {
  return async (count, worldWidth) => {
    const { positions, shade } = await imagePoints(src, count, worldWidth, { gamma: 1.8, cutoff: 0.8, depth: 0.6 })
    return {
      a: scatterPoints(count, worldWidth, worldWidth, 4),
      b: positions,
      c: positions,
      shade,
    }
  }
}
