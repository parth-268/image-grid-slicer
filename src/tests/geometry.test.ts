import {
  intersect,
  overlapMap,
  contains,
  pointInRect,
  clampRect,
  snapTo,
  snapRect,
  rectFromCorners,
  constrainSquare,
  resizeCorner,
  clamp,
} from '@/core/geometry'

describe('geometry/intersect', () => {
  test('disjoint rectangles return null', () => {
    expect(
      intersect({ x: 0, y: 0, width: 10, height: 10 }, { x: 20, y: 20, width: 5, height: 5 })
    ).toBeNull()
  })

  test('edge-touching returns null (open intersection)', () => {
    expect(
      intersect({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 5, height: 5 })
    ).toBeNull()
  })

  test('partial overlap returns intersection rect', () => {
    expect(
      intersect({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 })
    ).toEqual({ x: 5, y: 5, width: 5, height: 5 })
  })

  test('full containment returns inner rect', () => {
    expect(
      intersect({ x: 0, y: 0, width: 10, height: 10 }, { x: 2, y: 3, width: 4, height: 4 })
    ).toEqual({ x: 2, y: 3, width: 4, height: 4 })
  })
})

describe('geometry/overlapMap', () => {
  test('returns empty list when no overlaps', () => {
    expect(
      overlapMap([
        { x: 0, y: 0, width: 1, height: 1 },
        { x: 5, y: 5, width: 1, height: 1 },
      ])
    ).toEqual([])
  })

  test('three pairwise overlapping rectangles produce three overlap regions', () => {
    const rects = [
      { x: 0, y: 0, width: 4, height: 4 },
      { x: 2, y: 2, width: 4, height: 4 },
      { x: 1, y: 1, width: 4, height: 4 },
    ]
    expect(overlapMap(rects)).toHaveLength(3)
  })

  test('N regions yield at most C(N,2) pairs', () => {
    const N = 5
    const rects = Array.from({ length: N }, (_, i) => ({
      x: i,
      y: 0,
      width: 1.5,
      height: 1.5,
    }))
    const overlaps = overlapMap(rects)
    expect(overlaps.length).toBeLessThanOrEqual((N * (N - 1)) / 2)
  })
})

describe('geometry/contains + pointInRect', () => {
  test('contains true for inner rect', () => {
    expect(
      contains({ x: 0, y: 0, width: 10, height: 10 }, { x: 1, y: 1, width: 5, height: 5 })
    ).toBe(true)
  })

  test('contains false when partly outside', () => {
    expect(
      contains({ x: 0, y: 0, width: 10, height: 10 }, { x: 8, y: 8, width: 5, height: 5 })
    ).toBe(false)
  })

  test('pointInRect on corners', () => {
    const r = { x: 0, y: 0, width: 10, height: 10 }
    expect(pointInRect({ x: 0, y: 0 }, r)).toBe(true)
    expect(pointInRect({ x: 10, y: 10 }, r)).toBe(true)
    expect(pointInRect({ x: 11, y: 5 }, r)).toBe(false)
  })
})

describe('geometry/clampRect', () => {
  test('preserves size when fully inside', () => {
    expect(
      clampRect(
        { x: 2, y: 2, width: 3, height: 3 },
        { x: 0, y: 0, width: 10, height: 10 }
      )
    ).toEqual({ x: 2, y: 2, width: 3, height: 3 })
  })

  test('shifts rect inside bounds when partly outside', () => {
    expect(
      clampRect(
        { x: 9, y: 9, width: 5, height: 5 },
        { x: 0, y: 0, width: 10, height: 10 }
      )
    ).toEqual({ x: 5, y: 5, width: 5, height: 5 })
  })

  test('shrinks rect when larger than bounds', () => {
    expect(
      clampRect(
        { x: -5, y: -5, width: 20, height: 20 },
        { x: 0, y: 0, width: 10, height: 10 }
      )
    ).toEqual({ x: 0, y: 0, width: 10, height: 10 })
  })
})

describe('geometry/snap', () => {
  test('snapTo rounds to nearest step', () => {
    expect(snapTo(7, 5)).toBe(5)
    expect(snapTo(8, 5)).toBe(10)
  })

  test('snapTo with step ≤ 0 is a no-op', () => {
    expect(snapTo(7, 0)).toBe(7)
    expect(snapTo(7, -2)).toBe(7)
  })

  test('snapRect rounds all components and enforces min step size', () => {
    expect(snapRect({ x: 7, y: 3, width: 1, height: 1 }, 5)).toEqual({
      x: 5,
      y: 5,
      width: 5,
      height: 5,
    })
  })
})

describe('geometry/rectFromCorners + constrainSquare', () => {
  test('rectFromCorners normalizes regardless of corner order', () => {
    expect(rectFromCorners({ x: 5, y: 5 }, { x: 1, y: 2 })).toEqual({
      x: 1,
      y: 2,
      width: 4,
      height: 3,
    })
  })

  test('constrainSquare yields equal sides preserving direction', () => {
    const out = constrainSquare({ x: 0, y: 0 }, { x: 5, y: 3 })
    expect(Math.abs(out.x)).toBe(Math.abs(out.y))
  })
})

describe('geometry/resizeCorner', () => {
  const bounds = { x: 0, y: 0, width: 100, height: 100 }
  const initial = { x: 10, y: 10, width: 30, height: 30 }

  test('SE corner extends width/height', () => {
    expect(resizeCorner(initial, 'se', { x: 5, y: 7 }, 1, bounds)).toEqual({
      x: 10,
      y: 10,
      width: 35,
      height: 37,
    })
  })

  test('NW corner moves origin', () => {
    expect(resizeCorner(initial, 'nw', { x: -5, y: -5 }, 1, bounds)).toEqual({
      x: 5,
      y: 5,
      width: 35,
      height: 35,
    })
  })

  test('respects min size', () => {
    const r = resizeCorner(initial, 'se', { x: -1000, y: -1000 }, 2, bounds)
    expect(r.width).toBe(2)
    expect(r.height).toBe(2)
  })

  test('respects bounds', () => {
    const r = resizeCorner(initial, 'se', { x: 9999, y: 9999 }, 1, bounds)
    expect(r.x + r.width).toBeLessThanOrEqual(bounds.x + bounds.width)
    expect(r.y + r.height).toBeLessThanOrEqual(bounds.y + bounds.height)
  })
})

describe('geometry/clamp', () => {
  test('clamps below min', () => expect(clamp(-1, 0, 10)).toBe(0))
  test('clamps above max', () => expect(clamp(11, 0, 10)).toBe(10))
  test('passes through inside range', () => expect(clamp(5, 0, 10)).toBe(5))
})
