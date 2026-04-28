import { useMemo } from 'react'
import type { GridCell, GridConfig, ImageFile } from '@/types'

// ─── Precision-safe floor division ───────────────────────────────────────────

function safeFloor(value: number): number {
  return Math.floor(Math.round(value * 1e10) / 1e10)
}

function safeCeil(value: number): number {
  return Math.ceil(Math.round(value * 1e10) / 1e10)
}

// ─── Cell calculation ─────────────────────────────────────────────────────────

/**
 * Computes pixel-precise grid cells with no bleeding.
 * Last row/col absorbs rounding remainder.
 */
export function calculateGridCells(image: ImageFile, config: GridConfig): GridCell[] {
  const { rows, cols, paddingPx } = config
  const { width: imgW, height: imgH } = image

  const totalPadW = paddingPx * (cols - 1)
  const totalPadH = paddingPx * (rows - 1)
  const availW = imgW - totalPadW
  const availH = imgH - totalPadH

  const baseW = safeFloor(availW / cols)
  const baseH = safeFloor(availH / rows)

  const cells: GridCell[] = []

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const isLastCol = col === cols - 1
      const isLastRow = row === rows - 1

      const x = col * (baseW + paddingPx)
      const y = row * (baseH + paddingPx)

      // Last cell absorbs any leftover pixels
      const cellW = isLastCol ? imgW - x - (isLastCol ? 0 : paddingPx) : baseW
      const cellH = isLastRow ? imgH - y - (isLastRow ? 0 : paddingPx) : baseH

      cells.push({
        row,
        col,
        x: safeFloor(x),
        y: safeFloor(y),
        width: safeCeil(cellW),
        height: safeCeil(cellH),
      })
    }
  }

  return cells
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useGridCalculator(image: ImageFile | null, config: GridConfig) {
  const cells = useMemo<GridCell[]>(() => {
    if (!image) return []
    return calculateGridCells(image, config)
  }, [image, config])

  const cellDimensions = useMemo(() => {
    if (cells.length === 0) return null
    // Use first cell as representative (last may differ by a pixel)
    const first = cells[0]
    return { width: first.width, height: first.height }
  }, [cells])

  return { cells, cellDimensions }
}
