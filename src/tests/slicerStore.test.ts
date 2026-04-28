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
