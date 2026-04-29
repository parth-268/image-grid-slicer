import React from 'react'
import { useSlicerStore } from '@/store/slicerStore'
import type { CustomRegion } from '@/types'

// ─── Region thumbnail ────────────────────────────────────────────────────────

function CustomRegionThumbnail({
  imageUrl,
  region,
}: {
  imageUrl?: string
  region: CustomRegion
}): React.ReactElement {
  return (
    <div className="w-full h-full rounded-md overflow-hidden bg-obsidian-900 relative">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={region.label}
          draggable={false}
          className="absolute max-w-none select-none pointer-events-none"
          style={{
            width: `${100 / Math.max(region.width, 0.001)}%`,
            height: `${100 / Math.max(region.height, 0.001)}%`,
            left: `-${(region.x / Math.max(region.width, 0.001)) * 100}%`,
            top: `-${(region.y / Math.max(region.height, 0.001)) * 100}%`,
          }}
        />
      )}
    </div>
  )
}

// ─── Region list ─────────────────────────────────────────────────────────────

export function CustomRegionList(): React.ReactElement {
  const {
    regions,
    selectedRegionId,
    selectRegion,
    removeRegion,
    updateRegion,
    imageFile,
  } = useSlicerStore()

  if (regions.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-xs font-mono text-obsidian-500">Draw regions on the canvas</p>
      </div>
    )
  }

  const sorted = [...regions].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))

  return (
    <div className="space-y-2">
      {sorted.map((r) => (
        <div
          key={r.id}
          onClick={() => selectRegion(r.id === selectedRegionId ? null : r.id)}
          className={`
            grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-2 py-2 rounded-md border cursor-pointer
            transition-all duration-150
            ${
              selectedRegionId === r.id
                ? 'border-acid/40 bg-acid/5'
                : 'border-obsidian-700 hover:border-obsidian-600 bg-obsidian-800/50'
            }
          `}
        >
          <div className="w-9 h-9 rounded overflow-hidden border border-obsidian-700 bg-obsidian-900">
            <CustomRegionThumbnail imageUrl={imageFile?.url} region={r} />
          </div>
          <div className="min-w-0 flex flex-col pr-1">
            <input
              type="text"
              value={r.label}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => updateRegion(r.id, { label: e.target.value })}
              className="w-full min-w-0 truncate bg-transparent text-sm font-mono text-obsidian-200 focus:outline-none"
            />
            <span className="text-[10px] font-mono text-obsidian-600 truncate">
              {Math.round(r.width * 100)}×{Math.round(r.height * 100)}%
              {r.locked ? ' · locked' : ''}
            </span>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <RowAction
              title={r.locked ? 'Unlock' : 'Lock'}
              onClick={() => updateRegion(r.id, { locked: !r.locked })}
            >
              {r.locked ? '🔒' : '🔓'}
            </RowAction>
            <RowAction
              title="Delete"
              onClick={() => removeRegion(r.id)}
              danger
            >
              ✕
            </RowAction>
          </div>
        </div>
      ))}
    </div>
  )
}

function RowAction({
  title,
  onClick,
  children,
  danger,
}: {
  title: string
  onClick: () => void
  children: React.ReactNode
  danger?: boolean
}): React.ReactElement {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`
        flex h-7 w-7 items-center justify-center rounded border border-transparent text-sm transition-colors
        ${
          danger
            ? 'text-obsidian-600 hover:border-red-500/25 hover:bg-red-500/10 hover:text-red-400'
            : 'text-obsidian-500 hover:border-obsidian-600 hover:text-obsidian-200'
        }
      `}
    >
      {children}
    </button>
  )
}

// ─── History controls ───────────────────────────────────────────────────────

export function HistoryControls(): React.ReactElement {
  const { undo, redo, historyIndex, regionHistory } = useSlicerStore()
  const canUndo = historyIndex > 0
  const canRedo = historyIndex < regionHistory.length - 1
  const isMac =
    typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC')
  const mod = isMac ? '⌘' : 'Ctrl'

  return (
    <div className="space-y-3">
      <div className="font-mono text-xs text-obsidian-400 uppercase tracking-widest">History</div>
      <div className="flex gap-2">
        <button
          onClick={undo}
          disabled={!canUndo}
          title={`Undo (${mod}+Z)`}
          className="flex-1 px-3 py-2 rounded border text-xs font-mono transition-all disabled:opacity-30 disabled:cursor-not-allowed border-obsidian-700 bg-obsidian-800/60 text-obsidian-300 hover:enabled:border-obsidian-500 hover:enabled:text-obsidian-100"
        >
          ↶ Undo
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title={`Redo (${mod}+Shift+Z)`}
          className="flex-1 px-3 py-2 rounded border text-xs font-mono transition-all disabled:opacity-30 disabled:cursor-not-allowed border-obsidian-700 bg-obsidian-800/60 text-obsidian-300 hover:enabled:border-obsidian-500 hover:enabled:text-obsidian-100"
        >
          ↷ Redo
        </button>
      </div>
      <div className="text-xs font-mono text-obsidian-600">
        Step {historyIndex + 1} / {regionHistory.length}
      </div>
      <div className="rounded-lg border border-obsidian-800 bg-obsidian-900/50 p-3 space-y-1.5 hidden sm:block">
        <div className="text-xs font-mono text-obsidian-500 uppercase tracking-wider mb-2">
          Shortcuts
        </div>
        {[
          { key: 'Drag', label: 'Draw slice' },
          { key: '⇧', label: 'Constrain to square' },
          { key: 'Space', label: 'Pan canvas' },
          { key: 'Wheel', label: 'Zoom in/out' },
          { key: 'Del', label: 'Remove selected' },
          { key: 'Esc', label: 'Cancel / deselect' },
          { key: `${mod}+Z`, label: 'Undo' },
          { key: `${mod}+⇧+Z`, label: 'Redo' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-2">
            <kbd className="text-xs font-mono bg-obsidian-800 border border-obsidian-700 px-1.5 py-0.5 rounded text-obsidian-300">
              {key}
            </kbd>
            <span className="text-xs text-obsidian-500 text-right">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
