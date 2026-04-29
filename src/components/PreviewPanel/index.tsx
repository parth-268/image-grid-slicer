import React, { memo, useState, useCallback, useMemo } from 'react'
import { useSlicerStore } from '@/store/slicerStore'
import { formatBytes, formatDimensions } from '@/utils'
import type { Slice } from '@/types'

interface SliceCardProps {
  slice: Slice
  index: number
  isSelected: boolean
  onToggle: (id: string) => void
}

const SliceCard = memo(function SliceCard({
  slice,
  index,
  isSelected,
  onToggle,
}: SliceCardProps): React.ReactElement {
  const [loaded, setLoaded] = useState(false)
  const handleClick = useCallback(() => onToggle(slice.id), [onToggle, slice.id])

  return (
    <button
      onClick={handleClick}
      className={`
        relative group rounded-lg overflow-hidden border transition-all duration-150 text-left
        ${
          isSelected
            ? 'border-acid shadow-[0_0_16px_rgba(198,241,53,0.3)]'
            : 'border-obsidian-700 hover:border-obsidian-500'
        }
      `}
    >
      {/* Image */}
      <div className="aspect-square bg-obsidian-800 relative overflow-hidden">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-acid/30 border-t-acid rounded-full animate-spin" />
          </div>
        )}
        <img
          src={slice.url}
          alt={slice.label}
          loading="lazy"
          className={`w-full h-full object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
        />
        {/* Index badge */}
        <div className="absolute top-1 left-1 bg-obsidian-950/80 rounded px-1 py-0.5 text-xs font-mono text-obsidian-400">
          {index + 1}
        </div>
        {/* Selection check */}
        {isSelected && (
          <div className="absolute top-1 right-1 w-5 h-5 bg-acid rounded-full flex items-center justify-center">
            <svg
              className="w-3 h-3 text-obsidian-950"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="p-2 bg-obsidian-900/80">
        <div className="text-xs font-mono text-obsidian-300 truncate" title={slice.label}>
          {slice.label}
        </div>
        <div className="flex justify-between items-center mt-0.5">
          <span className="text-xs text-obsidian-600">
            {formatDimensions(slice.width, slice.height)}
          </span>
          <span className="text-xs text-obsidian-600">{formatBytes(slice.sizeBytes)}</span>
        </div>
      </div>
    </button>
  )
})

export function PreviewPanel(): React.ReactElement {
  const { slices, imageFile } = useSlicerStore()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const totalSize = useMemo(
    () => slices.reduce((sum, s) => sum + s.sizeBytes, 0),
    [slices]
  )

  const toggleSlice = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  if (slices.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div>
          <div className="text-4xl mb-3">⊞</div>
          <p className="text-sm font-mono text-obsidian-500">
            No slices yet. Configure and process.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-obsidian-800">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-obsidian-400 uppercase tracking-widest">
            Preview
          </span>
          <span className="bg-acid/10 text-acid text-xs font-mono px-2 py-0.5 rounded border border-acid/20">
            {slices.length}
          </span>
        </div>
        <div className="text-xs font-mono text-obsidian-500">{formatBytes(totalSize)} total</div>
      </div>

      {/* Slices grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-3 gap-2">
          {slices.map((slice, idx) => (
            <SliceCard
              key={slice.id}
              slice={slice}
              index={idx}
              isSelected={selectedIds.has(slice.id)}
              onToggle={toggleSlice}
            />
          ))}
        </div>
      </div>

      {/* Footer summary */}
      <div className="px-4 py-3 border-t border-obsidian-800 bg-obsidian-900/50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-mono font-bold text-obsidian-100">{slices.length}</div>
            <div className="text-xs text-obsidian-500">Slices</div>
          </div>
          <div>
            <div className="text-lg font-mono font-bold text-obsidian-100">
              {imageFile ? `${imageFile.width}×${imageFile.height}` : '—'}
            </div>
            <div className="text-xs text-obsidian-500">Source</div>
          </div>
          <div>
            <div className="text-lg font-mono font-bold text-acid">{formatBytes(totalSize)}</div>
            <div className="text-xs text-obsidian-500">Output</div>
          </div>
        </div>
      </div>
    </div>
  )
}
