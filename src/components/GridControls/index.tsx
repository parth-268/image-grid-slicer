import React, { useMemo } from 'react'
import { useSlicerStore } from '@/store/slicerStore'
import { Slider } from '@/components/ui/Slider'
import { Badge } from '@/components/ui/Badge'
import { formatDimensions } from '@/utils'

// ─── Mini grid thumbnail ──────────────────────────────────────────────────────

function GridThumbnail({
  rows,
  cols,
}: {
  rows: number
  cols: number
}): React.ReactElement {
  const clampedRows = Math.min(rows, 10)
  const clampedCols = Math.min(cols, 10)

  return (
    <div
      className="w-full aspect-video rounded-lg overflow-hidden border border-obsidian-700/60 bg-obsidian-900"
      style={{ display: 'grid', gridTemplateColumns: `repeat(${clampedCols}, 1fr)`, gridTemplateRows: `repeat(${clampedRows}, 1fr)`, gap: '1px', backgroundColor: 'rgba(198,241,53,0.25)' }}
      aria-hidden="true"
    >
      {Array.from({ length: clampedRows * clampedCols }).map((_, i) => (
        <div
          key={i}
          className="bg-obsidian-900"
          style={{ opacity: 0.6 + (i % 2) * 0.15 }}
        />
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GridControls(): React.ReactElement {
  const { gridConfig, setGridConfig, imageFile } = useSlicerStore()

  const { cellWidth, cellHeight } = useMemo(() => {
    if (!imageFile) return { cellWidth: 0, cellHeight: 0 }
    const pad = gridConfig.paddingPx
    const w = Math.floor((imageFile.width  - pad * (gridConfig.cols - 1)) / gridConfig.cols)
    const h = Math.floor((imageFile.height - pad * (gridConfig.rows - 1)) / gridConfig.rows)
    return { cellWidth: Math.max(0, w), cellHeight: Math.max(0, h) }
  }, [imageFile, gridConfig])

  const totalCells = gridConfig.rows * gridConfig.cols
  const isDegenerate = cellWidth <= 0 || cellHeight <= 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono text-obsidian-400 uppercase tracking-widest">Grid</h3>
        <Badge variant="acid">{totalCells} slice{totalCells !== 1 ? 's' : ''}</Badge>
      </div>

      {/* Mini grid preview */}
      <GridThumbnail rows={gridConfig.rows} cols={gridConfig.cols} />

      {/* Sliders */}
      <div className="space-y-5">
        <Slider
          label="Rows"
          value={gridConfig.rows}
          min={1}
          max={20}
          onChange={(v) => setGridConfig({ rows: v })}
        />
        <Slider
          label="Columns"
          value={gridConfig.cols}
          min={1}
          max={20}
          onChange={(v) => setGridConfig({ cols: v })}
        />
        <Slider
          label="Gap"
          value={gridConfig.paddingPx}
          min={0}
          max={50}
          unit="px"
          onChange={(v) => setGridConfig({ paddingPx: v })}
        />
      </div>

      {/* Cell info */}
      {imageFile && (
        <div className={`rounded-xl border p-3.5 space-y-2.5 transition-colors ${
          isDegenerate
            ? 'border-coral/30 bg-coral/5'
            : 'border-obsidian-800 bg-obsidian-925/60'
        }`}>
          {isDegenerate ? (
            <p className="text-xs font-mono text-coral text-center leading-relaxed">
              Gap too large — cells have zero size.
              <br />Reduce the gap or increase columns.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-obsidian-500 uppercase tracking-widest">Cell size</span>
                <span className="text-xs font-mono font-semibold text-obsidian-200">
                  {formatDimensions(cellWidth, cellHeight)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-obsidian-500 uppercase tracking-widest">Grid</span>
                <span className="text-xs font-mono font-semibold text-obsidian-200">
                  {gridConfig.rows}×{gridConfig.cols}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-obsidian-500 uppercase tracking-widest">Ratio</span>
                <span className="text-xs font-mono font-semibold text-acid">
                  {cellHeight > 0 ? (cellWidth / cellHeight).toFixed(2) : '—'}:1
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
