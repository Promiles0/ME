import { galaxyPoints, imagePoints, textPoints, wavePoints, type ShapeBuilder } from './textPoints'

/** Hero: the word, then a spiral galaxy, then a rolling wave field. Waits for the display font. */
export function wordShapes(word: string): ShapeBuilder {
  return async (count, worldWidth) => {
    const load = document.fonts?.load('400 200px "Bebas Neue"').catch(() => undefined) ?? Promise.resolve()
    await Promise.race([load, new Promise((r) => setTimeout(r, 1500))])
    return {
      a: textPoints(word, count, worldWidth),
      b: galaxyPoints(count, worldWidth * 0.42),
      c: wavePoints(count, worldWidth * 1.1, worldWidth * 0.7),
    }
  }
}

/**
 * About: the hero's grains carry on down the page and become the portrait.
 * The canvas is taller than the card (it reaches up into the space above it),
 * so shape `a` is a drifting wave of grains near the top, the same look as the
 * hero's wave field, and shape `b` is the face, placed over the card at the
 * bottom. Scrolling morphs a -> b: the grains pour down and settle into a face.
 *
 * `cardFrac` is the card's share of the canvas height (card at the bottom).
 */
export function portraitShapes(src: string, cardFrac = 0.45, cardFracW = 1): ShapeBuilder {
  return async (count, _worldWidth, view) => {
    // Face fills ~90% of the card's width; the canvas is wider than the card.
    const faceW = view.w * cardFracW * 0.9
    const { positions, shade } = await imagePoints(src, count, faceW, { gamma: 1.8, cutoff: 0.8, depth: 0.6 })
    // Move the face down so it sits centred over the card.
    const cardH = view.h * cardFrac
    const faceY = -view.h / 2 + cardH / 2
    for (let i = 0; i < count; i++) positions[i * 3 + 1] += faceY

    // The waiting state: a rolling band of grains across the top of the canvas.
    const a = new Float32Array(count * 3)
    const top = view.h / 2
    for (let i = 0; i < count; i++) {
      // Same feel as the hero's wave field: a wide, airy, rolling sheet.
      // Bell-shaped spread, so the sheet thins out softly before the canvas edge.
      const x = (Math.random() + Math.random() + Math.random() - 1.5) * view.w * 0.3
      const z = (Math.random() - 0.5) * 3
      const wave = Math.sin(x * 0.9) * view.h * 0.05 + Math.cos(z * 1.4 + x * 0.4) * view.h * 0.035
      const spread = (Math.random() - 0.5) * view.h * 0.22 * Math.pow(Math.random(), 1.5)
      a[i * 3] = x
      a[i * 3 + 1] = top - view.h * 0.2 + wave + spread
      a[i * 3 + 2] = z
    }
    return { a, b: positions, c: positions, shade }
  }
}
