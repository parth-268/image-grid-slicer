// ─── Image Types ────────────────────────────────────────────────────────────

export interface ImageFile {
  id: string
  file: File
  url: string
  width: number
  height: number
  sizeBytes: number
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
}

// ─── Grid Types ──────────────────────────────────────────────────────────────

export interface GridConfig {
  rows: number
  cols: number
  paddingPx: number
  outputFormat: ExportFormat
}

export interface GridCell {
  row: number
  col: number
  x: number
  y: number
  width: number
  height: number
}

// ─── Custom Region Types ─────────────────────────────────────────────────────

export interface CustomRegion {
  id: string
  label: string
  x: number // 0–1 normalized
  y: number // 0–1 normalized
  width: number // 0–1 normalized
  height: number // 0–1 normalized
  /** Stacking order. Higher = drawn on top + selected first under cursor. */
  zIndex?: number
  /** Lock prevents move/resize/delete via canvas interaction. */
  locked?: boolean
  /** Optional accent color (CSS string). Falls back to theme palette when absent. */
  color?: string
}

export interface Viewport {
  zoom: number // 1 = fit
  panX: number // CSS-px offset relative to image-fit
  panY: number
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number // image-space px between grid lines
  showOverlap: boolean
}

export type DrawState = 'idle' | 'drawing' | 'resizing' | 'moving'

export interface ResizeHandle {
  regionId: string
  corner: 'nw' | 'ne' | 'sw' | 'se'
}

// ─── Slice Types ─────────────────────────────────────────────────────────────

export interface Slice {
  id: string
  label: string
  blob: Blob
  url: string
  width: number
  height: number
  sizeBytes: number
  row?: number
  col?: number
}

// ─── Mode & Export Types ─────────────────────────────────────────────────────

export type SliceMode = 'grid' | 'custom' | 'convert'
export type ExportFormat = 'png' | 'jpeg' | 'webp'
export type ExportType = 'zip' | 'individual' | 'spritesheet'

export interface ExportOptions {
  format: ExportFormat
  quality: number // 0–1, for jpeg/webp
  type: ExportType
  prefix: string
}

// ─── App State Types ─────────────────────────────────────────────────────────

export type AppStage = 'upload' | 'configure' | 'preview' | 'export'
export type ProcessingStatus = 'idle' | 'processing' | 'done' | 'error'

export interface AppError {
  code: string
  message: string
  details?: string
}

// ─── Worker Message Types ────────────────────────────────────────────────────

export interface WorkerSliceRequest {
  type: 'SLICE'
  imageData: ImageData
  cells: GridCell[]
  format: ExportFormat
  quality: number
}

export interface WorkerSliceResponse {
  type: 'SLICE_DONE'
  blobs: ArrayBuffer[]
}

export interface WorkerProgressResponse {
  type: 'PROGRESS'
  current: number
  total: number
}

export type WorkerRequest = WorkerSliceRequest
export type WorkerResponse = WorkerSliceResponse | WorkerProgressResponse
