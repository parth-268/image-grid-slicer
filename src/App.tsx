import React, { useEffect } from 'react'
import { useSlicerStore } from '@/store/slicerStore'
import { ImageUploader } from '@/components/ImageUploader'
import { GridControls } from '@/components/GridControls'
import { CanvasEditor } from '@/components/CanvasEditor'
import { CustomCropEditor } from '@/components/CustomCrop'
import { PreviewPanel } from '@/components/PreviewPanel'
import { ExportPanel } from '@/components/ExportPanel'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { useSlicer } from '@/hooks/useSlicer'
import { formatBytes, formatDimensions } from '@/utils'
import { ConvertPanel } from '@/components/ConvertPanel'
import type { CustomRegion } from '@/types'

// ─── Global Keyboard Shortcuts ────────────────────────────────────────────────

function useGlobalShortcuts() {
  const { mode, undo, redo, historyIndex, regionHistory } = useSlicerStore()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (mode !== 'custom') return
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const mod = isMac ? e.metaKey : e.ctrlKey
      if (!mod) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, undo, redo])

  return {
    canUndo: historyIndex > 0,
    canRedo: historyIndex < regionHistory.length - 1,
  }
}

// ─── Mode Toggle ──────────────────────────────────────────────────────────────

const MODE_LABELS: Record<'grid' | 'custom' | 'convert', string> = {
  grid: '⊞ Grid',
  custom: '⬚ Custom',
  convert: '⇄ Convert',
}

function ModeToggle(): React.ReactElement {
  const { mode, setMode } = useSlicerStore()
  return (
    <div className="flex items-center bg-obsidian-900 rounded-lg p-0.5 border border-obsidian-700">
      {(['grid', 'custom', 'convert'] as const).map((m) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={`
            px-4 py-1.5 rounded text-xs font-mono font-medium transition-all
            ${
              mode === m
                ? 'bg-obsidian-700 text-obsidian-100 shadow'
                : 'text-obsidian-500 hover:text-obsidian-300'
            }
          `}
        >
          {MODE_LABELS[m]}
        </button>
      ))}
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProcessingBar(): React.ReactElement | null {
  const { processingStatus, processingProgress } = useSlicerStore()
  if (processingStatus !== 'processing') return null
  return (
    <div className="absolute inset-x-0 bottom-0 h-1 bg-obsidian-800 z-10">
      <div
        className="h-full bg-acid transition-all duration-300 shadow-[0_0_8px_rgba(198,241,53,0.8)]"
        style={{ width: `${processingProgress}%` }}
      />
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header(): React.ReactElement {
  const { imageFile, stage, reset } = useSlicerStore()
  return (
    <header className="flex items-center justify-between px-5 py-3 bg-obsidian-900/80 backdrop-blur-sm border-b border-obsidian-800 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 bg-acid rounded flex items-center justify-center flex-shrink-0">
          <span className="text-obsidian-950 text-xs font-bold">GS</span>
        </div>
        <span className="font-display font-bold text-obsidian-100 text-lg tracking-tight">
          Grid<span className="text-acid">Slicer</span>
        </span>
        {imageFile && (
          <div className="hidden md:flex items-center gap-2 ml-4">
            <span className="text-obsidian-700">·</span>
            <span className="text-xs font-mono text-obsidian-500 truncate max-w-xs">
              {imageFile.file.name}
            </span>
            <span className="text-xs font-mono text-obsidian-600">
              {formatDimensions(imageFile.width, imageFile.height)}
            </span>
            <span className="text-xs font-mono text-obsidian-600">
              {formatBytes(imageFile.sizeBytes)}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {stage !== 'upload' && <ModeToggle />}
        {imageFile && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            New Image
          </Button>
        )}
      </div>
    </header>
  )
}

// ─── Custom Region List ───────────────────────────────────────────────────────

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
            width: `${100 / region.width}%`,
            height: `${100 / region.height}%`,
            left: `-${(region.x / region.width) * 100}%`,
            top: `-${(region.y / region.height) * 100}%`,
          }}
        />
      )}
    </div>
  )
}

function CustomRegionList(): React.ReactElement {
  const { regions, selectedRegionId, selectRegion, removeRegion, updateRegion, imageFile } =
    useSlicerStore()

  if (regions.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-xs font-mono text-obsidian-500">Draw regions on the canvas</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {regions.map((r, i) => (
        <div
          key={r.id}
          onClick={() => selectRegion(r.id === selectedRegionId ? null : r.id)}
          className={`
            grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer
            transition-all duration-150
            ${
              selectedRegionId === r.id
                ? 'border-acid/40 bg-acid/5'
                : 'border-obsidian-700 hover:border-obsidian-600 bg-obsidian-800/50'
            }
          `}
        >
          <div className="w-11 h-11 rounded-md overflow-hidden border border-obsidian-700 bg-obsidian-900">
            <CustomRegionThumbnail imageUrl={imageFile?.url} region={r} />
          </div>
          <span className="text-xs font-mono text-obsidian-500 w-4 text-center">{i + 1}</span>
          <input
            type="text"
            value={r.label}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => updateRegion(r.id, { label: e.target.value })}
            className="min-w-0 bg-transparent text-sm font-mono text-obsidian-200 focus:outline-none"
          />
          <button
            type="button"
            aria-label={`Delete ${r.label}`}
            onClick={(e) => {
              e.stopPropagation()
              removeRegion(r.id)
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-obsidian-600 transition-colors hover:border-red-500/25 hover:bg-red-500/10 hover:text-red-400"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── History Controls ─────────────────────────────────────────────────────────

function HistoryControls(): React.ReactElement {
  const { undo, redo, historyIndex, regionHistory } = useSlicerStore()
  const canUndo = historyIndex > 0
  const canRedo = historyIndex < regionHistory.length - 1
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC')
  const mod = isMac ? '⌘' : 'Ctrl'

  return (
    <div className="space-y-3">
      <div className="font-mono text-xs text-obsidian-400 uppercase tracking-widest">History</div>
      <div className="flex gap-2">
        <button
          onClick={undo}
          disabled={!canUndo}
          title={`Undo (${mod}+Z)`}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono
            transition-all disabled:opacity-30 disabled:cursor-not-allowed
            border-obsidian-700 bg-obsidian-800/60 text-obsidian-300
            hover:enabled:border-obsidian-500 hover:enabled:text-obsidian-100"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
          Undo
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title={`Redo (${mod}+Shift+Z)`}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono
            transition-all disabled:opacity-30 disabled:cursor-not-allowed
            border-obsidian-700 bg-obsidian-800/60 text-obsidian-300
            hover:enabled:border-obsidian-500 hover:enabled:text-obsidian-100"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
            />
          </svg>
          Redo
        </button>
      </div>
      <div className="text-xs font-mono text-obsidian-600">
        Step {historyIndex + 1} / {regionHistory.length}
      </div>

      <div className="rounded-lg border border-obsidian-800 bg-obsidian-900/50 p-3 space-y-1.5">
        <div className="text-xs font-mono text-obsidian-500 uppercase tracking-wider mb-2">
          Shortcuts
        </div>
        {[
          { key: 'Del / ⌫', label: 'Remove selected' },
          { key: 'Esc', label: 'Cancel drawing' },
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

// ─── Convert Mode Image Preview ───────────────────────────────────────────────

function ConvertModePreview(): React.ReactElement | null {
  const { imageFile } = useSlicerStore()
  if (!imageFile) return null
  return (
    <div className="rounded-lg overflow-hidden border border-obsidian-800 bg-obsidian-900/50">
      <img
        src={imageFile.url}
        alt="Source image"
        className="w-full object-contain max-h-[70vh]"
        draggable={false}
      />
    </div>
  )
}

// ─── Configure Layout ─────────────────────────────────────────────────────────

function ConfigureLayout(): React.ReactElement {
  const { mode, processingStatus, regions, gridConfig } = useSlicerStore()
  const { processSlices } = useSlicer()
  useGlobalShortcuts()
  const isProcessing = processingStatus === 'processing'
  const isConvertMode = mode === 'convert'

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="w-72 flex-shrink-0 flex flex-col border-r border-obsidian-800 bg-obsidian-950/60">
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {mode === 'grid' && <GridControls />}

          {mode === 'custom' && (
            <div className="space-y-5">
              <div>
                <div className="font-mono text-xs text-obsidian-400 uppercase tracking-widest mb-1">
                  Custom Regions
                </div>
                <p className="text-xs text-obsidian-500 leading-relaxed">
                  Drag on the canvas to draw slices. Click a slice to move or resize it.
                </p>
              </div>
              <CustomRegionList />
              {regions.length > 0 && (
                <div className="border-t border-obsidian-800 pt-5">
                  <HistoryControls />
                </div>
              )}
            </div>
          )}

          {mode === 'convert' && <ConvertPanel />}
        </div>

        {/* Slice button — hidden in convert mode (ConvertPanel handles its own actions) */}
        {!isConvertMode && (
          <div className="p-4 border-t border-obsidian-800">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              loading={isProcessing}
              onClick={processSlices}
            >
              {isProcessing
                ? 'Slicing…'
                : mode === 'grid'
                  ? `Slice ${gridConfig.rows * gridConfig.cols} Cells`
                  : `Slice ${regions.length} Region${regions.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        )}
      </aside>

      <main className="flex-1 overflow-auto p-6 bg-obsidian-950 relative">
        <div className="max-w-3xl mx-auto">
          {mode === 'grid' && <CanvasEditor />}
          {mode === 'custom' && <CustomCropEditor />}
          {mode === 'convert' && <ConvertModePreview />}
        </div>
        <ProcessingBar />
      </main>
    </div>
  )
}

// ─── Preview Layout ───────────────────────────────────────────────────────────

function PreviewLayout(): React.ReactElement {
  const { setStage } = useSlicerStore()
  const { processSlices } = useSlicer()

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="w-72 flex-shrink-0 border-r border-obsidian-800 bg-obsidian-950/60 overflow-y-auto p-5">
        <ExportPanel />
        <div className="mt-4 pt-4 border-t border-obsidian-800 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setStage('configure')}
          >
            ← Back to Configure
          </Button>
          <Button variant="secondary" size="sm" className="w-full" onClick={processSlices}>
            Re-process
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-hidden flex flex-col">
        <PreviewPanel />
      </main>
    </div>
  )
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export function App(): React.ReactElement {
  const { stage } = useSlicerStore()

  return (
    <div className="flex flex-col h-screen bg-obsidian-950 text-obsidian-100 font-body overflow-hidden">
      {stage === 'upload' ? (
        <ImageUploader />
      ) : (
        <>
          <Header />
          {stage === 'configure' && <ConfigureLayout />}
          {(stage === 'preview' || stage === 'export') && <PreviewLayout />}
        </>
      )}
      <Toast />
    </div>
  )
}
