import { act } from '@testing-library/react'
import { useSlicerStore } from '@/store/slicerStore'

describe('useSlicerStore', () => {
  beforeEach(() => {
    useSlicerStore.getState().reset()
  })

  describe('grid config', () => {
    test('default grid is 3×3', () => {
      const { gridConfig } = useSlicerStore.getState()
      expect(gridConfig.rows).toBe(3)
      expect(gridConfig.cols).toBe(3)
    })

    test('setGridConfig merges partial config', () => {
      const { setGridConfig } = useSlicerStore.getState()
      act(() => setGridConfig({ rows: 5 }))
      const { gridConfig } = useSlicerStore.getState()
      expect(gridConfig.rows).toBe(5)
      expect(gridConfig.cols).toBe(3) // unchanged
    })
  })

  describe('mode', () => {
    test('default mode is grid', () => {
      expect(useSlicerStore.getState().mode).toBe('grid')
    })

    test('setMode updates mode', () => {
      act(() => useSlicerStore.getState().setMode('custom'))
      expect(useSlicerStore.getState().mode).toBe('custom')
    })
  })

  describe('regions', () => {
    test('addRegion appends region', () => {
      const region = { id: '1', label: 'R1', x: 0, y: 0, width: 0.5, height: 0.5 }
      act(() => useSlicerStore.getState().addRegion(region))
      expect(useSlicerStore.getState().regions).toHaveLength(1)
    })

    test('removeRegion deletes by id', () => {
      const region = { id: '1', label: 'R1', x: 0, y: 0, width: 0.5, height: 0.5 }
      act(() => {
        useSlicerStore.getState().addRegion(region)
        useSlicerStore.getState().removeRegion('1')
      })
      expect(useSlicerStore.getState().regions).toHaveLength(0)
    })

    test('updateRegion updates specific fields', () => {
      const region = { id: '1', label: 'R1', x: 0, y: 0, width: 0.5, height: 0.5 }
      act(() => {
        useSlicerStore.getState().addRegion(region)
        useSlicerStore.getState().updateRegion('1', { label: 'Updated' })
      })
      expect(useSlicerStore.getState().regions[0].label).toBe('Updated')
    })

    test('clearRegions empties list', () => {
      const region = { id: '1', label: 'R1', x: 0, y: 0, width: 0.5, height: 0.5 }
      act(() => {
        useSlicerStore.getState().addRegion(region)
        useSlicerStore.getState().clearRegions()
      })
      expect(useSlicerStore.getState().regions).toHaveLength(0)
    })
  })

  describe('error state', () => {
    test('setError sets error', () => {
      act(() => useSlicerStore.getState().setError({ code: 'TEST', message: 'Test error' }))
      expect(useSlicerStore.getState().error).not.toBeNull()
    })

    test('clearError resets to null', () => {
      act(() => {
        useSlicerStore.getState().setError({ code: 'TEST', message: 'Test error' })
        useSlicerStore.getState().clearError()
      })
      expect(useSlicerStore.getState().error).toBeNull()
    })
  })

  describe('z-index ordering', () => {
    test('addRegion auto-assigns increasing zIndex', () => {
      act(() => {
        useSlicerStore.getState().addRegion({
          id: '1', label: 'R1', x: 0, y: 0, width: 0.3, height: 0.3,
        })
        useSlicerStore.getState().addRegion({
          id: '2', label: 'R2', x: 0.1, y: 0.1, width: 0.3, height: 0.3,
        })
      })
      const [a, b] = useSlicerStore.getState().regions
      expect((a.zIndex ?? 0) < (b.zIndex ?? 0)).toBe(true)
    })

    test('bringToFront raises zIndex above all others', () => {
      act(() => {
        useSlicerStore.getState().addRegion({
          id: '1', label: 'R1', x: 0, y: 0, width: 0.3, height: 0.3,
        })
        useSlicerStore.getState().addRegion({
          id: '2', label: 'R2', x: 0.1, y: 0.1, width: 0.3, height: 0.3,
        })
        useSlicerStore.getState().bringToFront('1')
      })
      const regions = useSlicerStore.getState().regions
      const r1 = regions.find((r) => r.id === '1')!
      const r2 = regions.find((r) => r.id === '2')!
      expect((r1.zIndex ?? 0)).toBeGreaterThan(r2.zIndex ?? 0)
    })

    test('sendToBack lowers zIndex below all others', () => {
      act(() => {
        useSlicerStore.getState().addRegion({
          id: '1', label: 'R1', x: 0, y: 0, width: 0.3, height: 0.3,
        })
        useSlicerStore.getState().addRegion({
          id: '2', label: 'R2', x: 0.1, y: 0.1, width: 0.3, height: 0.3,
        })
        useSlicerStore.getState().sendToBack('2')
      })
      const regions = useSlicerStore.getState().regions
      const r1 = regions.find((r) => r.id === '1')!
      const r2 = regions.find((r) => r.id === '2')!
      expect((r2.zIndex ?? 0)).toBeLessThan(r1.zIndex ?? 0)
    })
  })

  describe('replaceRegions', () => {
    test('replaces regions atomically and assigns zIndex when missing', () => {
      act(() => {
        useSlicerStore.getState().replaceRegions([
          { id: 'a', label: 'A', x: 0, y: 0, width: 0.5, height: 0.5 },
          { id: 'b', label: 'B', x: 0, y: 0.5, width: 0.5, height: 0.5 },
        ])
      })
      const regions = useSlicerStore.getState().regions
      expect(regions).toHaveLength(2)
      expect(regions.every((r) => typeof r.zIndex === 'number')).toBe(true)
    })
  })

  describe('history', () => {
    test('undo restores previous regions snapshot', () => {
      act(() => {
        useSlicerStore.getState().addRegion({
          id: '1', label: 'R1', x: 0, y: 0, width: 0.3, height: 0.3,
        })
        useSlicerStore.getState().addRegion({
          id: '2', label: 'R2', x: 0.4, y: 0.4, width: 0.3, height: 0.3,
        })
        useSlicerStore.getState().undo()
      })
      expect(useSlicerStore.getState().regions).toHaveLength(1)
    })

    test('redo restores after undo', () => {
      act(() => {
        useSlicerStore.getState().addRegion({
          id: '1', label: 'R1', x: 0, y: 0, width: 0.3, height: 0.3,
        })
        useSlicerStore.getState().undo()
        useSlicerStore.getState().redo()
      })
      expect(useSlicerStore.getState().regions).toHaveLength(1)
    })
  })

  describe('viewport', () => {
    test('default viewport has zoom 1, no pan, snap off', () => {
      const { viewport } = useSlicerStore.getState()
      expect(viewport.zoom).toBe(1)
      expect(viewport.panX).toBe(0)
      expect(viewport.panY).toBe(0)
      expect(viewport.snapToGrid).toBe(false)
    })

    test('setViewport merges partial updates', () => {
      act(() => useSlicerStore.getState().setViewport({ zoom: 2.5, showGrid: true }))
      const { viewport } = useSlicerStore.getState()
      expect(viewport.zoom).toBe(2.5)
      expect(viewport.showGrid).toBe(true)
      expect(viewport.panX).toBe(0)
    })

    test('resetViewport returns to defaults', () => {
      act(() => {
        useSlicerStore.getState().setViewport({ zoom: 4, panX: 100 })
        useSlicerStore.getState().resetViewport()
      })
      const { viewport } = useSlicerStore.getState()
      expect(viewport.zoom).toBe(1)
      expect(viewport.panX).toBe(0)
    })
  })

  describe('reset', () => {
    test('reset returns to initial state', () => {
      act(() => {
        useSlicerStore.getState().setMode('custom')
        useSlicerStore.getState().setGridConfig({ rows: 10 })
        useSlicerStore.getState().reset()
      })
      const state = useSlicerStore.getState()
      expect(state.mode).toBe('grid')
      expect(state.gridConfig.rows).toBe(3)
      expect(state.stage).toBe('upload')
    })
  })
})
