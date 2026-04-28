import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type {
  AppStage,
  AppError,
  ImageFile,
  GridConfig,
  CustomRegion,
  Slice,
  SliceMode,
  ExportOptions,
  ProcessingStatus,
} from '@/types'

const MAX_HISTORY = 50

// ─── State Interfaces ────────────────────────────────────────────────────────

interface ImageState {
  imageFile: ImageFile | null
  setImageFile: (file: ImageFile | null) => void
  clearImage: () => void
}

interface ModeState {
  mode: SliceMode
  setMode: (mode: SliceMode) => void
}

interface GridState {
  gridConfig: GridConfig
  setGridConfig: (config: Partial<GridConfig>) => void
}

interface CustomRegionState {
  regions: CustomRegion[]
  selectedRegionId: string | null
  regionHistory: CustomRegion[][]
  historyIndex: number
  addRegion: (region: CustomRegion) => void
  updateRegion: (id: string, updates: Partial<CustomRegion>) => void
  removeRegion: (id: string) => void
  selectRegion: (id: string | null) => void
  clearRegions: () => void
  /** Call after a completed drag-move or drag-resize to record an undo checkpoint. */
  commitHistory: () => void
  undo: () => void
  redo: () => void
}

interface SliceState {
  slices: Slice[]
  setSlices: (slices: Slice[]) => void
  clearSlices: () => void
}

interface ExportState {
  exportOptions: ExportOptions
  setExportOptions: (opts: Partial<ExportOptions>) => void
}

interface UIState {
  stage: AppStage
  setStage: (stage: AppStage) => void
  processingStatus: ProcessingStatus
  setProcessingStatus: (status: ProcessingStatus) => void
  processingProgress: number
  setProcessingProgress: (progress: number) => void
  error: AppError | null
  setError: (error: AppError | null) => void
  clearError: () => void
}

// ─── Combined Store Type ─────────────────────────────────────────────────────

type SlicerStore = ImageState &
  ModeState &
  GridState &
  CustomRegionState &
  SliceState &
  ExportState &
  UIState & {
    reset: () => void
    enterBulkConvert: () => void
  }

// ─── Default Values ──────────────────────────────────────────────────────────

const DEFAULT_GRID_CONFIG: GridConfig = {
  rows: 3,
  cols: 3,
  paddingPx: 0,
  outputFormat: 'png',
}

const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'png',
  quality: 0.92,
  type: 'zip',
  prefix: 'slice',
}

// ─── History Helpers ─────────────────────────────────────────────────────────

function pushToHistory(
  history: CustomRegion[][],
  index: number,
  snapshot: CustomRegion[]
): { regionHistory: CustomRegion[][]; historyIndex: number } {
  const trimmed = history.slice(0, index + 1)
  trimmed.push([...snapshot])
  const capped = trimmed.slice(-MAX_HISTORY)
  return { regionHistory: capped, historyIndex: capped.length - 1 }
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useSlicerStore = create<SlicerStore>()(
  devtools(
    (set) => ({
      // ── Image ──────────────────────────────────────────────────────────────
      imageFile: null,
      setImageFile: (file) => set({ imageFile: file }),
      clearImage: () => set({ imageFile: null }),

      // ── Mode ───────────────────────────────────────────────────────────────
      mode: 'grid',
      setMode: (mode) => set({ mode }),

      // ── Grid ───────────────────────────────────────────────────────────────
      gridConfig: DEFAULT_GRID_CONFIG,
      setGridConfig: (config) =>
        set((state) => ({ gridConfig: { ...state.gridConfig, ...config } })),

      // ── Custom Regions ─────────────────────────────────────────────────────
      regions: [],
      selectedRegionId: null,
      regionHistory: [[]],
      historyIndex: 0,

      addRegion: (region) =>
        set((state) => {
          const newRegions = [...state.regions, region]
          return {
            regions: newRegions,
            ...pushToHistory(state.regionHistory, state.historyIndex, newRegions),
          }
        }),

      updateRegion: (id, updates) =>
        set((state) => ({
          regions: state.regions.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),

      removeRegion: (id) =>
        set((state) => {
          const newRegions = state.regions.filter((r) => r.id !== id)
          return {
            regions: newRegions,
            selectedRegionId: state.selectedRegionId === id ? null : state.selectedRegionId,
            ...pushToHistory(state.regionHistory, state.historyIndex, newRegions),
          }
        }),

      selectRegion: (id) => set({ selectedRegionId: id }),

      clearRegions: () =>
        set({
          regions: [],
          selectedRegionId: null,
          regionHistory: [[]],
          historyIndex: 0,
        }),

      commitHistory: () =>
        set((state) => ({
          ...pushToHistory(state.regionHistory, state.historyIndex, state.regions),
        })),

      undo: () =>
        set((state) => {
          if (state.historyIndex <= 0) return {}
          const newIndex = state.historyIndex - 1
          return {
            regions: [...state.regionHistory[newIndex]],
            historyIndex: newIndex,
            selectedRegionId: null,
          }
        }),

      redo: () =>
        set((state) => {
          if (state.historyIndex >= state.regionHistory.length - 1) return {}
          const newIndex = state.historyIndex + 1
          return {
            regions: [...state.regionHistory[newIndex]],
            historyIndex: newIndex,
            selectedRegionId: null,
          }
        }),

      // ── Slices ─────────────────────────────────────────────────────────────
      slices: [],
      setSlices: (slices) => set({ slices }),
      clearSlices: () =>
        set((state) => {
          state.slices.forEach((s) => URL.revokeObjectURL(s.url))
          return { slices: [] }
        }),

      // ── Export ─────────────────────────────────────────────────────────────
      exportOptions: DEFAULT_EXPORT_OPTIONS,
      setExportOptions: (opts) =>
        set((state) => ({ exportOptions: { ...state.exportOptions, ...opts } })),

      // ── UI ─────────────────────────────────────────────────────────────────
      stage: 'upload',
      setStage: (stage) => set({ stage }),
      processingStatus: 'idle',
      setProcessingStatus: (processingStatus) => set({ processingStatus }),
      processingProgress: 0,
      setProcessingProgress: (processingProgress) => set({ processingProgress }),
      error: null,
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // ── Bulk Convert Entry ─────────────────────────────────────────────────
      enterBulkConvert: () => set({ stage: 'configure', mode: 'convert' }),

      // ── Global Reset ───────────────────────────────────────────────────────
      reset: () =>
        set((state) => {
          state.slices.forEach((s) => URL.revokeObjectURL(s.url))
          if (state.imageFile) URL.revokeObjectURL(state.imageFile.url)
          return {
            imageFile: null,
            mode: 'grid',
            gridConfig: DEFAULT_GRID_CONFIG,
            regions: [],
            selectedRegionId: null,
            regionHistory: [[]],
            historyIndex: 0,
            slices: [],
            exportOptions: DEFAULT_EXPORT_OPTIONS,
            stage: 'upload',
            processingStatus: 'idle',
            processingProgress: 0,
            error: null,
          }
        }),
    }),
    { name: 'GridSlicerStore' }
  )
)
