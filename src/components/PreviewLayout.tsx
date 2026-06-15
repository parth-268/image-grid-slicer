import React, { lazy, Suspense } from 'react'
import { useSlicerStore } from '@/store/slicerStore'
import { useSlicer } from '@/hooks/useSlicer'
import { Button } from '@/components/ui/Button'
import { CanvasFallback } from '@/components/ui/CanvasFallback'

const ExportPanel = lazy(() =>
  import('@/components/ExportPanel').then((m) => ({ default: m.ExportPanel }))
)
const PreviewPanel = lazy(() =>
  import('@/components/PreviewPanel').then((m) => ({ default: m.PreviewPanel }))
)

export function PreviewLayout(): React.ReactElement {
  const { setStage } = useSlicerStore()
  const { processSlices } = useSlicer()

  return (
    <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
      {/* Sidebar — export controls */}
      <aside
        className="flex flex-col w-full md:w-72 md:flex-shrink-0
        border-b md:border-b-0 md:border-r border-obsidian-800
        bg-obsidian-950/60 max-h-[45vh] md:max-h-none"
      >
        <div className="flex-1 overflow-y-auto p-4 md:p-5">
          <Suspense
            fallback={<div className="text-xs font-mono text-obsidian-600 p-2">Loading…</div>}
          >
            <ExportPanel />
          </Suspense>
        </div>
        <div className="flex-shrink-0 p-3 md:p-4 border-t border-obsidian-800 bg-obsidian-950/80 space-y-2">
          <Button variant="secondary" size="sm" className="w-full" onClick={processSlices}>
            Re-process
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setStage('configure')}
          >
            ← Configure
          </Button>
        </div>
      </aside>

      {/* Main — preview grid */}
      <main className="flex-1 overflow-hidden flex flex-col bg-obsidian-975 safe-area-bottom">
        <Suspense fallback={<CanvasFallback />}>
          <PreviewPanel />
        </Suspense>
      </main>
    </div>
  )
}
