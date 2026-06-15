import React, { lazy, Suspense } from 'react'
import { useSlicerStore } from '@/store/slicerStore'
import { GridControls } from '@/components/GridControls'
import { Toolbar } from '@/components/Toolbar'
import { Button } from '@/components/ui/Button'
import { useSlicer } from '@/hooks/useSlicer'
import { CustomRegionList, HistoryControls } from './SidebarPanels'
import { CanvasFallback } from '@/components/ui/CanvasFallback'

const CanvasEditor = lazy(() =>
  import('@/components/CanvasEditor').then((m) => ({ default: m.CanvasEditor }))
)
const CustomCropEditor = lazy(() =>
  import('@/components/CustomCrop').then((m) => ({ default: m.CustomCropEditor }))
)

// ─── Processing bar ───────────────────────────────────────────────────────────

function ProcessingBar(): React.ReactElement | null {
  const { processingStatus, processingProgress } = useSlicerStore()
  if (processingStatus !== 'processing') return null

  return (
    <div
      role="progressbar"
      aria-valuenow={processingProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Processing slices"
      className="absolute inset-x-0 bottom-0 h-1 bg-obsidian-800 z-20"
    >
      <div
        className="h-full bg-acid transition-all duration-300 relative overflow-hidden"
        style={{ width: `${processingProgress}%` }}
      >
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />
      </div>
    </div>
  )
}

// ─── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent(): React.ReactElement {
  const { mode, regions } = useSlicerStore()

  if (mode === 'grid') return <GridControls />

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-mono text-obsidian-500 leading-relaxed">
          Drag to draw slice regions. Regions may overlap — each exports from the source independently.
        </p>
      </div>
      <CustomRegionList />
      {regions.length > 0 && (
        <div className="border-t border-obsidian-800 pt-4">
          <HistoryControls />
        </div>
      )}
    </div>
  )
}

// ─── Slice button ─────────────────────────────────────────────────────────────

function SliceButton(): React.ReactElement {
  const { mode, regions, gridConfig, processingStatus } = useSlicerStore()
  const { processSlices } = useSlicer()
  const isProcessing = processingStatus === 'processing'

  const count = mode === 'grid' ? gridConfig.rows * gridConfig.cols : regions.length
  const label = mode === 'grid' ? `${count} cell${count !== 1 ? 's' : ''}` : `${count} region${count !== 1 ? 's' : ''}`

  return (
    <Button
      variant="primary"
      size="lg"
      className="w-full"
      loading={isProcessing}
      onClick={processSlices}
      disabled={mode === 'custom' && regions.length === 0}
    >
      {isProcessing ? 'Slicing…' : `Slice — ${label}`}
    </Button>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function SlicerLayout(): React.ReactElement {
  const { mode } = useSlicerStore()

  return (
    <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <aside
        className="flex flex-col border-b md:border-b-0 md:border-r border-obsidian-800
          bg-obsidian-950/50 w-full md:w-72 md:flex-shrink-0
          max-h-[42vh] md:max-h-none"
      >
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5">
          <SidebarContent />
        </div>
        <div className="p-3 md:p-4 border-t border-obsidian-800 safe-area-bottom bg-obsidian-950/80">
          <SliceButton />
        </div>
      </aside>

      {/* Canvas area */}
      <main className="flex-1 overflow-auto p-3 md:p-5 bg-obsidian-975 relative">
        <div className="max-w-3xl mx-auto space-y-3">
          {mode === 'custom' && <Toolbar />}
          <Suspense fallback={<CanvasFallback />}>
            {mode === 'grid'   && <CanvasEditor />}
            {mode === 'custom' && <CustomCropEditor />}
          </Suspense>
        </div>
        <ProcessingBar />
      </main>
    </div>
  )
}
