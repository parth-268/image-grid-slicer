// Pure rectangle math. No DOM, no canvas. Fully testable.

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}

export const clamp = (v: number, min: number, max: number): number =>
  Math.min(Math.max(v, min), max)

/** Bounding-box intersection. Returns null if rectangles do not overlap. */
export function intersect(a: Rect, b: Rect): Rect | null {
  const x = Math.max(a.x, b.x)
  const y = Math.max(a.y, b.y)
  const w = Math.min(a.x + a.width, b.x + b.width) - x
  const h = Math.min(a.y + a.height, b.y + b.height) - y
  if (w <= 0 || h <= 0) return null
  return { x, y, width: w, height: h }
}

/** All pairwise overlap rectangles between regions. O(n²) — fine for n < 200. */
export function overlapMap<T extends Rect>(regions: readonly T[]): Rect[] {
  const out: Rect[] = []
  for (let i = 0; i < regions.length; i++) {
    for (let j = i + 1; j < regions.length; j++) {
      const o = intersect(regions[i], regions[j])
      if (o) out.push(o)
    }
  }
  return out
}

/** Whether `inner` lies entirely within `outer`. */
export function contains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  )
}

/** Whether a point lies inside a rectangle (inclusive on top/left, exclusive on bottom/right). */
export function pointInRect(p: Point, r: Rect): boolean {
  return p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height
}

/** Clamp a rectangle so it stays within `bounds`. Width/height are preserved when possible. */
export function clampRect(r: Rect, bounds: Rect): Rect {
  const w = Math.min(r.width, bounds.width)
  const h = Math.min(r.height, bounds.height)
  const x = clamp(r.x, bounds.x, bounds.x + bounds.width - w)
  const y = clamp(r.y, bounds.y, bounds.y + bounds.height - h)
  return { x, y, width: w, height: h }
}

/** Round a value to the nearest grid step. Step ≤ 0 is a no-op. */
export function snapTo(value: number, step: number): number {
  if (step <= 0) return value
  return Math.round(value / step) * step
}

export function snapRect(r: Rect, step: number): Rect {
  if (step <= 0) return r
  return {
    x: snapTo(r.x, step),
    y: snapTo(r.y, step),
    width: Math.max(step, snapTo(r.width, step)),
    height: Math.max(step, snapTo(r.height, step)),
  }
}

/** Rectangle from two arbitrary corners (drawing). */
export function rectFromCorners(a: Point, b: Point): Rect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  }
}

/** Constrain a corner-to-corner draw to a square (Shift behaviour). */
export function constrainSquare(start: Point, end: Point): Point {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const s = Math.max(Math.abs(dx), Math.abs(dy))
  const sx = Math.sign(dx) || 1
  const sy = Math.sign(dy) || 1
  return { x: start.x + sx * s, y: start.y + sy * s }
}

/** Resize one corner of a rectangle. Corner is two-letter combo of n/s + e/w. */
export function resizeCorner(
  initial: Rect,
  corner: string,
  delta: Point,
  minSize: number,
  bounds: Rect
): Rect {
  let { x, y, width, height } = initial

  if (corner.includes('e')) {
    width = clamp(initial.width + delta.x, minSize, bounds.x + bounds.width - x)
  }
  if (corner.includes('s')) {
    height = clamp(initial.height + delta.y, minSize, bounds.y + bounds.height - y)
  }
  if (corner.includes('w')) {
    const newX = clamp(initial.x + delta.x, bounds.x, initial.x + initial.width - minSize)
    width = initial.x + initial.width - newX
    x = newX
  }
  if (corner.includes('n')) {
    const newY = clamp(initial.y + delta.y, bounds.y, initial.y + initial.height - minSize)
    height = initial.y + initial.height - newY
    y = newY
  }
  return { x, y, width, height }
}

/** Total uncovered area of `bounds` after subtracting all rectangles. Useful for diagnostics. */
export function uncoveredArea(bounds: Rect, rects: readonly Rect[]): number {
  // Sample-grid approximation; cheap and good enough for UI hints.
  const N = 32
  const cellW = bounds.width / N
  const cellH = bounds.height / N
  let uncovered = 0
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const px = bounds.x + (i + 0.5) * cellW
      const py = bounds.y + (j + 0.5) * cellH
      const covered = rects.some((r) => pointInRect({ x: px, y: py }, r))
      if (!covered) uncovered++
    }
  }
  return (uncovered / (N * N)) * (bounds.width * bounds.height)
}
