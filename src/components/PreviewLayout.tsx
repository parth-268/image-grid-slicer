import React, { lazy, Suspense } from 'react'
import { useSlicerStore } from '@/store/slicerStore'
import { useSlicer } from '@/hooks/useSlicer'
import { Button } from '@/components/ui/Button'
import { CanvasFallback } from '@/components/ui/CanvasFallback'

// Both panels pull in JSZip / file-saver — keep them out of the initial chunk.
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
      <aside className="w-full md:w-72 md:flex-shrink-0 border-b md:border-b-0 md:border-r border-obsidian-800 bg-obsidian-950/60 overflow-y-auto p-4 md:p-5 max-h-[40vh] md:max-h-none">
        <Suspense fallback={<div className="text-xs font-mono text-obsidian-500">Loading…</div>}>
          <ExportPanel />
        </Suspense>
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
      <main className="flex-1 overflow-hidden flex flex-col safe-area-bottom">
        <Suspense fallback={<CanvasFallback />}>
          <PreviewPanel />
        </Suspense>
      </main>
    </div>
  )
}
