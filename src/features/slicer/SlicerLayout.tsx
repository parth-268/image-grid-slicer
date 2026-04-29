import React, { lazy, Suspense } from 'react'
import { useSlicerStore } from '@/store/slicerStore'
import { GridControls } from '@/components/GridControls'
import { Toolbar } from '@/components/Toolbar'
import { Button } from '@/components/ui/Button'
import { useSlicer } from '@/hooks/useSlicer'
import { CustomRegionList, HistoryControls } from './SidebarPanels'
import { CanvasFallback } from '@/components/ui/CanvasFallback'

// Heavy canvas components are lazily loaded — they pull in only when the user
// switches to slicer mode and the relevant sub-mode.
const CanvasEditor = lazy(() =>
  import('@/components/CanvasEditor').then((m) => ({ default: m.CanvasEditor }))
)
const CustomCropEditor = lazy(() =>
  import('@/components/CustomCrop').then((m) => ({ default: m.CustomCropEditor }))
)

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

function SidebarContent(): React.ReactElement {
  const { mode, regions } = useSlicerStore()
  if (mode === 'grid') return <GridControls />
  return (
    <div className="space-y-5">
      <div>
        <div className="font-mono text-xs text-obsidian-400 uppercase tracking-widest mb-1">
          Custom Regions
        </div>
        <p className="text-xs text-obsidian-500 leading-relaxed">
          Drag on the canvas to draw slices. Slices may overlap freely — each is exported
          independently from the source image.
        </p>
      </div>
      <CustomRegionList />
      {regions.length > 0 && (
        <div className="border-t border-obsidian-800 pt-5">
          <HistoryControls />
        </div>
      )}
    </div>
  )
}

function SliceButton(): React.ReactElement {
  const { mode, regions, gridConfig, processingStatus } = useSlicerStore()
  const { processSlices } = useSlicer()
  const isProcessing = processingStatus === 'processing'
  return (
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
  )
}

export default function SlicerLayout(): React.ReactElement {
  const { mode } = useSlicerStore()

  return (
    <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
      {/* Sidebar — full width on mobile (above canvas), fixed-width column on desktop */}
      <aside
        className="
          flex flex-col border-b md:border-b-0 md:border-r border-obsidian-800 bg-obsidian-950/60
          w-full md:w-72 md:flex-shrink-0
          max-h-[40vh] md:max-h-none
        "
      >
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-6">
          <SidebarContent />
        </div>
        <div className="p-3 md:p-4 border-t border-obsidian-800 safe-area-bottom">
          <SliceButton />
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-3 md:p-6 bg-obsidian-950 relative">
        <div className="max-w-3xl mx-auto space-y-3">
          {mode === 'custom' && <Toolbar />}
          <Suspense fallback={<CanvasFallback />}>
            {mode === 'grid' && <CanvasEditor />}
            {mode === 'custom' && <CustomCropEditor />}
          </Suspense>
        </div>
        <ProcessingBar />
      </main>
    </div>
  )
}
