import React, { memo, useState, useCallback, useMemo } from 'react'
import { useSlicerStore } from '@/store/slicerStore'
import { formatBytes, formatDimensions } from '@/utils'
import type { Slice } from '@/types'

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconDownload(): React.ReactElement {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}

function IconCheck(): React.ReactElement {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

// ─── Slice card ───────────────────────────────────────────────────────────────

interface SliceCardProps {
  slice: Slice
  index: number
  isSelected: boolean
  exportFormat: string
  onToggle: (id: string) => void
  onDownload: (slice: Slice) => void
}

const SliceCard = memo(function SliceCard({
  slice,
  index,
  isSelected,
  exportFormat,
  onToggle,
  onDownload,
}: SliceCardProps): React.ReactElement {
  const [loaded, setLoaded] = useState(false)

  return (
    <div
      className={[
        'relative group rounded-xl overflow-hidden border transition-all duration-150',
        'bg-obsidian-925 cursor-pointer',
        isSelected
          ? 'border-acid shadow-glow-acid-sm ring-1 ring-acid/30'
          : 'border-obsidian-800 hover:border-obsidian-700',
      ].join(' ')}
      onClick={() => onToggle(slice.id)}
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(slice.id) } }}
    >
      {/* Image */}
      <div className="aspect-square bg-obsidian-950/60 relative overflow-hidden">
        {!loaded && (
          <div className="absolute inset-0 shimmer-bg" aria-hidden="true" />
        )}
        <img
          src={slice.url}
          alt={slice.label}
          loading="lazy"
          className={`w-full h-full object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          draggable={false}
        />

        {/* Index badge */}
        <div className="absolute top-1.5 left-1.5 bg-obsidian-950/80 rounded-md px-1.5 py-0.5 text-[10px] font-mono text-obsidian-500">
          {index + 1}
        </div>

        {/* Selection check */}
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-acid rounded-full flex items-center justify-center shadow-glow-acid-sm animate-pop">
            <IconCheck />
          </div>
        )}

        {/* Download button — always accessible, prominent on hover */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDownload(slice) }}
          title={`Download ${slice.label}.${exportFormat}`}
          aria-label={`Download ${slice.label}`}
          className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-lg bg-obsidian-950/90 border border-obsidian-700
            flex items-center justify-center text-obsidian-400
            opacity-0 group-hover:opacity-100 focus:opacity-100
            hover:border-acid/50 hover:text-acid hover:bg-obsidian-950
            focus:outline-none focus:border-acid/50 focus:text-acid
            transition-all duration-150"
        >
          <IconDownload />
        </button>
      </div>

      {/* Meta */}
      <div className="px-2 py-1.5 bg-obsidian-950/40">
        <div className="text-[10px] font-mono text-obsidian-400 truncate" title={slice.label}>
          {slice.label}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[10px] font-mono text-obsidian-600">
            {formatDimensions(slice.width, slice.height)}
          </span>
          <span className="text-[10px] font-mono text-obsidian-600">
            {formatBytes(slice.sizeBytes)}
          </span>
        </div>
      </div>
    </div>
  )
})

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState(): React.ReactElement {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
      <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-obsidian-700
        flex items-center justify-center text-obsidian-700">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-mono text-obsidian-400 font-medium">No slices yet</p>
        <p className="text-xs font-mono text-obsidian-600 mt-1">Configure your grid and click Slice</p>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PreviewPanel(): React.ReactElement {
  const { slices, imageFile, exportOptions } = useSlicerStore()
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

  const selectAll  = useCallback(() => setSelectedIds(new Set(slices.map((s) => s.id))), [slices])
  const clearAll   = useCallback(() => setSelectedIds(new Set()), [])

  const downloadSlice = useCallback(
    async (slice: Slice) => {
      const { saveAs } = await import('file-saver')
      saveAs(slice.blob, `${slice.label}.${exportOptions.format}`)
    },
    [exportOptions.format]
  )

  if (slices.length === 0) return <EmptyState />

  const allSelected  = selectedIds.size === slices.length
  const noneSelected = selectedIds.size === 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-obsidian-800 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono text-obsidian-500 uppercase tracking-widest">Preview</span>
          <span className="bg-acid/10 text-acid text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-acid/20">
            {slices.length}
          </span>
          {selectedIds.size > 0 && (
            <span className="text-[10px] font-mono text-obsidian-500 animate-fade-in">
              {selectedIds.size} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={allSelected ? clearAll : selectAll}
            className="text-[10px] font-mono text-obsidian-500 hover:text-obsidian-200 transition-colors px-2 py-1 rounded hover:bg-obsidian-800"
          >
            {allSelected ? 'Deselect all' : noneSelected ? 'Select all' : `All (${slices.length})`}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {slices.map((slice, idx) => (
            <SliceCard
              key={slice.id}
              slice={slice}
              index={idx}
              isSelected={selectedIds.has(slice.id)}
              exportFormat={exportOptions.format}
              onToggle={toggleSlice}
              onDownload={downloadSlice}
            />
          ))}
        </div>
      </div>

      {/* Stats footer */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-obsidian-800 bg-obsidian-950/60">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-base font-mono font-bold text-obsidian-100 leading-tight">{slices.length}</div>
            <div className="text-[10px] font-mono text-obsidian-600 mt-0.5">slices</div>
          </div>
          <div>
            <div className="text-base font-mono font-bold text-obsidian-100 leading-tight">
              {imageFile ? `${imageFile.width}×${imageFile.height}` : '—'}
            </div>
            <div className="text-[10px] font-mono text-obsidian-600 mt-0.5">source</div>
          </div>
          <div>
            <div className="text-base font-mono font-bold text-acid leading-tight">{formatBytes(totalSize)}</div>
            <div className="text-[10px] font-mono text-obsidian-600 mt-0.5">output</div>
          </div>
        </div>
      </div>
    </div>
  )
}
