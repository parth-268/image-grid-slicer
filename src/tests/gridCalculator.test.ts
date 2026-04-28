import { calculateGridCells } from '@/hooks/useGridCalculator'
import type { ImageFile, GridConfig } from '@/types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeImage(width: number, height: number): ImageFile {
  return {
    id: 'test-id',
    file: new File([], 'test.png', { type: 'image/png' }),
    url: 'blob:test',
    width,
    height,
    sizeBytes: 1000,
    mimeType: 'image/png',
  }
}

function makeConfig(rows: number, cols: number, paddingPx = 0): GridConfig {
  return { rows, cols, paddingPx, outputFormat: 'png' }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('calculateGridCells', () => {
  describe('basic grid generation', () => {
    test('produces correct number of cells', () => {
      const img = makeImage(300, 300)
      const cells = calculateGridCells(img, makeConfig(3, 3))
      expect(cells).toHaveLength(9)
    })

    test('single cell returns full image dimensions', () => {
      const img = makeImage(800, 600)
      const cells = calculateGridCells(img, makeConfig(1, 1))
      expect(cells).toHaveLength(1)
      expect(cells[0]).toMatchObject({ x: 0, y: 0, width: 800, height: 600 })
    })

    test('row and col indices are correct', () => {
      const cells = calculateGridCells(makeImage(300, 300), makeConfig(2, 3))
      const rowCols = cells.map((c) => [c.row, c.col])
      expect(rowCols).toEqual([
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 1],
        [1, 2],
      ])
    })
  })

  describe('dimension precision', () => {
    test('evenly divisible image has no remainder', () => {
      const img = makeImage(300, 300)
      const cells = calculateGridCells(img, makeConfig(3, 3))
      cells.forEach((c) => {
        expect(c.width).toBe(100)
        expect(c.height).toBe(100)
      })
    })

    test('non-divisible width — last column absorbs remainder', () => {
      const img = makeImage(100, 100)
      const cells = calculateGridCells(img, makeConfig(1, 3))
      // 100 / 3 = 33.33... → 33, 33, 34
      const widths = cells.map((c) => c.width)
      expect(widths[0]).toBe(33)
      expect(widths[1]).toBe(33)
      // last absorbs remainder: 100 - 33 - 33 = 34
      expect(widths[2]).toBeGreaterThanOrEqual(33)
      expect(widths.reduce((s, w) => s + w, 0)).toBe(100)
    })

    test('no pixel bleeding — total width per row sums to image width', () => {
      const img = makeImage(997, 503)
      const cells = calculateGridCells(img, makeConfig(7, 11))

      // Sum widths across each row — should equal img width
      const widthByRow = new Map<number, number>()
      // Sum heights across each column — should equal img height
      const heightByCol = new Map<number, number>()

      cells.forEach((c) => {
        widthByRow.set(c.row, (widthByRow.get(c.row) ?? 0) + c.width)
        heightByCol.set(c.col, (heightByCol.get(c.col) ?? 0) + c.height)
      })

      widthByRow.forEach((totalW) => expect(totalW).toBe(997))
      heightByCol.forEach((totalH) => expect(totalH).toBe(503))
    })

    test('large grid (20x20) produces 400 cells', () => {
      const img = makeImage(2000, 2000)
      const cells = calculateGridCells(img, makeConfig(20, 20))
      expect(cells).toHaveLength(400)
    })

    test('very small image (1x1 pixel)', () => {
      const img = makeImage(1, 1)
      const cells = calculateGridCells(img, makeConfig(1, 1))
      expect(cells[0]).toMatchObject({ width: 1, height: 1 })
    })
  })

  describe('padding', () => {
    test('cells account for padding between slices', () => {
      const img = makeImage(310, 100)
      const config = makeConfig(1, 3, 5) // 2 gaps × 5px = 10px
      const cells = calculateGridCells(img, config)
      const totalWidth = cells.reduce((s, c) => s + c.width, 0)
      // Total content width = 310 - (2 * 5) = 300
      expect(totalWidth).toBeLessThanOrEqual(300)
    })

    test('x positions skip padding', () => {
      const img = makeImage(210, 100)
      const config = makeConfig(1, 3, 5)
      const cells = calculateGridCells(img, config)
      expect(cells[0].x).toBe(0)
      expect(cells[1].x).toBeGreaterThan(cells[0].width)
    })
  })

  describe('edge cases', () => {
    test('1×N grid (single row)', () => {
      const img = makeImage(400, 200)
      const cells = calculateGridCells(img, makeConfig(1, 4))
      expect(cells).toHaveLength(4)
      cells.forEach((c) => expect(c.height).toBe(200))
    })

    test('N×1 grid (single column)', () => {
      const img = makeImage(400, 200)
      const cells = calculateGridCells(img, makeConfig(4, 1))
      expect(cells).toHaveLength(4)
      cells.forEach((c) => expect(c.width).toBe(400))
    })

    test('no negative dimensions with large padding', () => {
      const img = makeImage(100, 100)
      const config = makeConfig(3, 3, 10)
      const cells = calculateGridCells(img, config)
      cells.forEach((c) => {
        expect(c.width).toBeGreaterThan(0)
        expect(c.height).toBeGreaterThan(0)
      })
    })
  })
})
