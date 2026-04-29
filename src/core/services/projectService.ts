import type { CustomRegion, GridConfig } from '@/types'
import { PROJECT_FILE_EXTENSION } from '@/core/branding'

export const PROJECT_VERSION = 1

export interface ProjectFile {
  version: typeof PROJECT_VERSION
  exportedAt: string
  imageMeta: {
    name: string
    width: number
    height: number
    sizeBytes: number
    mimeType: string
  } | null
  regions: CustomRegion[]
  gridConfig: GridConfig
}

/** Type guard for parsed JSON. Throws with a useful message on shape error. */
function assertProject(value: unknown): asserts value is ProjectFile {
  if (!value || typeof value !== 'object') throw new Error('Invalid project file: not an object')
  const v = value as Record<string, unknown>
  if (v.version !== PROJECT_VERSION) {
    throw new Error(`Unsupported project version: ${v.version}. Expected ${PROJECT_VERSION}.`)
  }
  if (!Array.isArray(v.regions)) throw new Error('Invalid project file: regions must be an array')
  if (!v.gridConfig || typeof v.gridConfig !== 'object') {
    throw new Error('Invalid project file: missing gridConfig')
  }

  assertGridConfig(v.gridConfig)
  v.regions.forEach((region, index) => assertRegion(region, index))
}

function assertFiniteNumber(value: unknown, field: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid project file: ${field} must be a finite number`)
  }
}

function assertGridConfig(value: unknown): asserts value is GridConfig {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid project file: gridConfig must be an object')
  }
  const grid = value as Record<string, unknown>
  assertFiniteNumber(grid.rows, 'gridConfig.rows')
  assertFiniteNumber(grid.cols, 'gridConfig.cols')
  assertFiniteNumber(grid.paddingPx, 'gridConfig.paddingPx')
  if (!Number.isInteger(grid.rows) || grid.rows < 1 || grid.rows > 100) {
    throw new Error('Invalid project file: gridConfig.rows must be an integer from 1 to 100')
  }
  if (!Number.isInteger(grid.cols) || grid.cols < 1 || grid.cols > 100) {
    throw new Error('Invalid project file: gridConfig.cols must be an integer from 1 to 100')
  }
  if (grid.paddingPx < 0 || grid.paddingPx > 4096) {
    throw new Error('Invalid project file: gridConfig.paddingPx is out of range')
  }
  if (!['png', 'jpeg', 'webp'].includes(String(grid.outputFormat))) {
    throw new Error('Invalid project file: gridConfig.outputFormat is unsupported')
  }
}

function assertRegion(value: unknown, index: number): asserts value is CustomRegion {
  if (!value || typeof value !== 'object') {
    throw new Error(`Invalid project file: region ${index + 1} must be an object`)
  }
  const region = value as Record<string, unknown>
  if (typeof region.id !== 'string' || region.id.trim() === '') {
    throw new Error(`Invalid project file: region ${index + 1} has an invalid id`)
  }
  if (typeof region.label !== 'string') {
    throw new Error(`Invalid project file: region ${index + 1} has an invalid label`)
  }

  for (const field of ['x', 'y', 'width', 'height'] as const) {
    assertFiniteNumber(region[field], `region ${index + 1}.${field}`)
  }

  const x = region.x as number
  const y = region.y as number
  const width = region.width as number
  const height = region.height as number

  if (x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > 1 || y + height > 1) {
    throw new Error(`Invalid project file: region ${index + 1} is outside image bounds`)
  }
  if (region.zIndex !== undefined) assertFiniteNumber(region.zIndex, `region ${index + 1}.zIndex`)
  if (region.locked !== undefined && typeof region.locked !== 'boolean') {
    throw new Error(`Invalid project file: region ${index + 1}.locked must be boolean`)
  }
  if (region.color !== undefined && typeof region.color !== 'string') {
    throw new Error(`Invalid project file: region ${index + 1}.color must be a string`)
  }
}

export function serializeProject(input: Omit<ProjectFile, 'version' | 'exportedAt'>): Blob {
  const payload: ProjectFile = {
    version: PROJECT_VERSION,
    exportedAt: new Date().toISOString(),
    ...input,
  }
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
}

async function readBlobText(blob: Blob): Promise<string> {
  // Prefer the modern API where available; fall back for environments
  // (e.g. older jsdom under Jest) that don't implement Blob.text().
  if (typeof (blob as Blob & { text?: () => Promise<string> }).text === 'function') {
    return (blob as Blob & { text: () => Promise<string> }).text()
  }
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'))
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.readAsText(blob)
  })
}

export async function parseProjectFile(file: File): Promise<ProjectFile> {
  const text = await readBlobText(file)
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (err) {
    throw new Error(`Could not parse project JSON: ${(err as Error).message}`)
  }
  assertProject(parsed)
  return parsed
}

/** Convenience for deterministic filename based on image. */
export function projectFilename(imageName: string | undefined): string {
  const base = (imageName ?? 'project').replace(/\.[^.]+$/, '')
  return `${base}.${PROJECT_FILE_EXTENSION}.json`
}
