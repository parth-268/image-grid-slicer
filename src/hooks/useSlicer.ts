import { useCallback } from 'react'
import { useSlicerStore } from '@/store/slicerStore'
import { calculateGridCells } from '@/hooks/useGridCalculator'
import { sliceImageGrid, sliceImageCustom } from '@/services/imageProcessor'
import type { Slice } from '@/types'

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSlicer() {
  const {
    imageFile,
    mode,
    gridConfig,
    regions,
    exportOptions,
    setSlices,
    clearSlices,
    setProcessingStatus,
    setProcessingProgress,
    setError,
    setStage,
  } = useSlicerStore()

  const processSlices = useCallback(async (): Promise<void> => {
    if (!imageFile) {
      setError({ code: 'NO_IMAGE', message: 'No image loaded.' })
      return
    }

    clearSlices()
    setProcessingStatus('processing')
    setProcessingProgress(0)

    try {
      let slices: Slice[] = []

      if (mode === 'grid') {
        const cells = calculateGridCells(imageFile, gridConfig)
        slices = await sliceImageGrid(imageFile, cells, exportOptions, (progress) => {
          setProcessingProgress(progress)
        })
      } else {
        if (regions.length === 0) {
          setError({ code: 'NO_REGIONS', message: 'Draw at least one region before slicing.' })
          setProcessingStatus('idle')
          return
        }
        slices = await sliceImageCustom(imageFile, regions, exportOptions, (progress) => {
          setProcessingProgress(progress)
        })
      }

      setSlices(slices)
      setProcessingStatus('done')
      setStage('preview')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Processing failed.'
      setError({ code: 'PROCESSING_ERROR', message })
      setProcessingStatus('error')
    }
  }, [
    imageFile,
    mode,
    gridConfig,
    regions,
    exportOptions,
    clearSlices,
    setSlices,
    setProcessingStatus,
    setProcessingProgress,
    setError,
    setStage,
  ])

  return { processSlices }
}
