import React, { useState } from 'react'
import { useSlicerStore } from '@/store/slicerStore'
import type { CustomRegion } from '@/types'

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconLock({ locked }: { locked?: boolean }): React.ReactElement {
  if (locked) {
    return (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    )
  }
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
}

function IconTrash(): React.ReactElement {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  )
}

function IconUndo(): React.ReactElement {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
  )
}

function IconRedo(): React.ReactElement {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
    </svg>
  )
}

function IconChevron({ open }: { open: boolean }): React.ReactElement {
  return (
    <svg
      className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isMacPlatform(): boolean {
  const p =
    (navigator as Navigator & { userAgentData?: { platform: string } }).userAgentData?.platform
    ?? navigator.platform
    ?? ''
  return /mac/i.test(p)
}

// ─── Region thumbnail ─────────────────────────────────────────────────────────

function RegionThumbnail({
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
            width:  `${100 / Math.max(region.width,  0.001)}%`,
            height: `${100 / Math.max(region.height, 0.001)}%`,
            left:   `-${(region.x / Math.max(region.width,  0.001)) * 100}%`,
            top:    `-${(region.y / Math.max(region.height, 0.001)) * 100}%`,
          }}
        />
      )}
    </div>
  )
}

// ─── Row action button ────────────────────────────────────────────────────────

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
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={[
        'flex h-6 w-6 items-center justify-center rounded border border-transparent',
        'text-xs transition-all duration-150',
        danger
          ? 'text-obsidian-600 hover:border-coral/25 hover:bg-coral/10 hover:text-coral'
          : 'text-obsidian-500 hover:border-obsidian-700 hover:bg-obsidian-800 hover:text-obsidian-200',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function DrawHint(): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-3">
      {/* Mini canvas illustration */}
      <div className="w-16 h-12 rounded-lg border-2 border-dashed border-obsidian-700 relative flex items-center justify-center">
        <div className="absolute top-2 left-2 w-5 h-3 rounded-sm border border-acid/60 bg-acid/10" />
        <div className="absolute bottom-2 right-2 w-6 h-4 rounded-sm border border-acid/40 bg-acid/5" />
        <svg className="w-4 h-4 text-acid/40 absolute top-0.5 right-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <p className="text-xs font-mono text-obsidian-500 leading-relaxed">
        Drag on the canvas to<br />draw a slice region
      </p>
    </div>
  )
}

// ─── Region List ─────────────────────────────────────────────────────────────

export function CustomRegionList(): React.ReactElement {
  const { regions, selectedRegionId, selectRegion, removeRegion, updateRegion, imageFile } =
    useSlicerStore()

  if (regions.length === 0) return <DrawHint />

  const sorted = [...regions].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))

  return (
    <div className="space-y-1.5">
      {sorted.map((r) => {
        const selected = r.id === selectedRegionId
        const w = Math.round(r.width  * (imageFile?.width  ?? 100))
        const h = Math.round(r.height * (imageFile?.height ?? 100))

        return (
          <div
            key={r.id}
            onClick={() => selectRegion(r.id === selectedRegionId ? null : r.id)}
            className={[
              'grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-2 py-2 rounded-lg border cursor-pointer',
              'transition-all duration-150',
              selected
                ? 'border-acid/40 bg-acid/5 shadow-glow-acid-sm'
                : 'border-obsidian-800 hover:border-obsidian-700 bg-obsidian-925/60',
            ].join(' ')}
          >
            {/* Thumbnail */}
            <div className="w-8 h-8 rounded-md overflow-hidden border border-obsidian-700 bg-obsidian-900 flex-shrink-0">
              <RegionThumbnail imageUrl={imageFile?.url} region={r} />
            </div>

            {/* Label + dimensions */}
            <div className="min-w-0 flex flex-col gap-0.5">
              <input
                type="text"
                value={r.label}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => updateRegion(r.id, { label: e.target.value })}
                className="w-full min-w-0 bg-transparent text-xs font-mono text-obsidian-200
                  focus:outline-none focus:text-white truncate"
              />
              <span className="text-[10px] font-mono text-obsidian-600 flex items-center gap-1.5">
                {w}×{h}px
                {r.locked && (
                  <span className="inline-flex items-center gap-0.5 text-acid/60">
                    <IconLock locked />
                  </span>
                )}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <RowAction
                title={r.locked ? 'Unlock region' : 'Lock region'}
                onClick={() => updateRegion(r.id, { locked: !r.locked })}
              >
                <IconLock locked={r.locked} />
              </RowAction>
              <RowAction
                title="Delete region"
                onClick={() => removeRegion(r.id)}
                danger
              >
                <IconTrash />
              </RowAction>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── History Controls ─────────────────────────────────────────────────────────

export function HistoryControls(): React.ReactElement {
  const { undo, redo, historyIndex, regionHistory } = useSlicerStore()
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const canUndo = historyIndex > 0
  const canRedo = historyIndex < regionHistory.length - 1
  const mod = isMacPlatform() ? '⌘' : 'Ctrl'

  const shortcuts = [
    { key: 'Drag',         label: 'Draw slice' },
    { key: '⇧ + drag',    label: 'Constrain square' },
    { key: 'Space + drag', label: 'Pan canvas' },
    { key: 'Scroll',       label: 'Zoom in/out' },
    { key: 'Del',          label: 'Remove selected' },
    { key: 'Esc',          label: 'Cancel / deselect' },
    { key: `${mod}+Z`,     label: 'Undo' },
    { key: `${mod}+⇧+Z`,  label: 'Redo' },
  ]

  return (
    <div className="space-y-3">
      {/* Undo/Redo row */}
      <div className="flex gap-2">
        <button
          onClick={undo}
          disabled={!canUndo}
          title={`Undo (${mod}+Z)`}
          aria-label="Undo"
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-mono
            transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed
            border-obsidian-800 bg-obsidian-925/60 text-obsidian-400
            hover:enabled:border-obsidian-600 hover:enabled:text-obsidian-100 hover:enabled:bg-obsidian-900"
        >
          <IconUndo /> Undo
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title={`Redo (${mod}+Shift+Z)`}
          aria-label="Redo"
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-mono
            transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed
            border-obsidian-800 bg-obsidian-925/60 text-obsidian-400
            hover:enabled:border-obsidian-600 hover:enabled:text-obsidian-100 hover:enabled:bg-obsidian-900"
        >
          <IconRedo /> Redo
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between text-[10px] font-mono text-obsidian-600">
        <span>History</span>
        <span>{historyIndex + 1} / {regionHistory.length}</span>
      </div>

      {/* Shortcuts — collapsible */}
      <button
        type="button"
        onClick={() => setShortcutsOpen((o) => !o)}
        className="w-full flex items-center justify-between text-xs font-mono text-obsidian-500
          hover:text-obsidian-300 transition-colors py-0.5"
        aria-expanded={shortcutsOpen}
      >
        <span>Shortcuts</span>
        <IconChevron open={shortcutsOpen} />
      </button>

      {shortcutsOpen && (
        <div className="rounded-xl border border-obsidian-800 bg-obsidian-925/60 p-3 space-y-2 animate-enter-up">
          {shortcuts.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-2">
              <kbd className="text-[10px] font-mono bg-obsidian-800 border border-obsidian-700
                px-1.5 py-0.5 rounded text-obsidian-300 flex-shrink-0 whitespace-nowrap">
                {key}
              </kbd>
              <span className="text-[10px] font-mono text-obsidian-500 text-right">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
