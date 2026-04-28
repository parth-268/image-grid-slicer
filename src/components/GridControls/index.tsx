import React from 'react'
import { useSlicerStore } from '@/store/slicerStore'
import { Slider } from '@/components/ui/Slider'
import { Badge } from '@/components/ui/Badge'

export function GridControls(): React.ReactElement {
  const { gridConfig, setGridConfig, imageFile } = useSlicerStore()

  const totalCells = gridConfig.rows * gridConfig.cols

  const cellWidth = imageFile
    ? Math.floor((imageFile.width - gridConfig.paddingPx * (gridConfig.cols - 1)) / gridConfig.cols)
    : 0

  const cellHeight = imageFile
    ? Math.floor(
        (imageFile.height - gridConfig.paddingPx * (gridConfig.rows - 1)) / gridConfig.rows
      )
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs text-obsidian-400 uppercase tracking-widest">
          Grid Configuration
        </h3>
        <Badge variant="acid">{totalCells} slices</Badge>
      </div>

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
          label="Padding"
          value={gridConfig.paddingPx}
          min={0}
          max={50}
          unit="px"
          onChange={(v) => setGridConfig({ paddingPx: v })}
        />
      </div>

      {imageFile && cellWidth > 0 && cellHeight > 0 && (
        <div className="bg-obsidian-800/50 border border-obsidian-700/40 rounded-lg p-3 space-y-2">
          <div className="font-mono text-xs text-obsidian-500 uppercase tracking-widest mb-2">
            Cell Preview
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-obsidian-500">Width</div>
              <div className="font-mono text-sm text-obsidian-200">{cellWidth}px</div>
            </div>
            <div>
              <div className="text-xs text-obsidian-500">Height</div>
              <div className="font-mono text-sm text-obsidian-200">{cellHeight}px</div>
            </div>
            <div>
              <div className="text-xs text-obsidian-500">Grid</div>
              <div className="font-mono text-sm text-obsidian-200">
                {gridConfig.rows}×{gridConfig.cols}
              </div>
            </div>
            <div>
              <div className="text-xs text-obsidian-500">Ratio</div>
              <div className="font-mono text-sm text-obsidian-200">
                {(cellWidth / cellHeight).toFixed(2)}:1
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
