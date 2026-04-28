import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { generateSpriteSheet } from './imageProcessor'
import type { Slice, ExportOptions } from '@/types'

// ─── Sanitize file names ──────────────────────────────────────────────────────

function sanitizeLabel(label: string): string {
  return label.replace(/[^a-zA-Z0-9._-]/g, '_')
}

// ─── ZIP Export ───────────────────────────────────────────────────────────────

export async function exportAsZip(
  slices: Slice[],
  options: ExportOptions,
  onProgress?: (pct: number) => void
): Promise<void> {
  if (slices.length === 0) throw new Error('No slices to export')

  const zip = new JSZip()
  const folder = zip.folder('slices')

  if (!folder) throw new Error('Failed to create ZIP folder')

  for (let i = 0; i < slices.length; i++) {
    const slice = slices[i]
    const fileName = `${sanitizeLabel(slice.label)}.${options.format}`
    folder.file(fileName, slice.blob)
    onProgress?.(Math.round(((i + 1) / slices.length) * 80))
  }

  const zipBlob = await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
    (meta) => onProgress?.(80 + Math.round(meta.percent * 0.2))
  )

  saveAs(zipBlob, `grid-slices-${Date.now()}.zip`)
}

// ─── Individual File Export ───────────────────────────────────────────────────

export async function exportIndividual(
  slices: Slice[],
  options: ExportOptions
): Promise<void> {
  for (const slice of slices) {
    const fileName = `${sanitizeLabel(slice.label)}.${options.format}`
    saveAs(slice.blob, fileName)
    // Small delay to avoid browser throttling
    await new Promise((r) => setTimeout(r, 150))
  }
}

// ─── Sprite Sheet Export ──────────────────────────────────────────────────────

export async function exportSpriteSheet(
  slices: Slice[],
  options: ExportOptions,
  onProgress?: (pct: number) => void
): Promise<void> {
  onProgress?.(10)
  const blob = await generateSpriteSheet(slices, options)
  onProgress?.(90)
  saveAs(blob, `spritesheet-${Date.now()}.${options.format}`)
  onProgress?.(100)
}

// ─── Unified Export Dispatcher ────────────────────────────────────────────────

export async function exportSlices(
  slices: Slice[],
  options: ExportOptions,
  onProgress?: (pct: number) => void
): Promise<void> {
  switch (options.type) {
    case 'zip':
      return exportAsZip(slices, options, onProgress)
    case 'individual':
      return exportIndividual(slices, options)
    case 'spritesheet':
      return exportSpriteSheet(slices, options, onProgress)
    default:
      throw new Error(`Unknown export type: ${options.type}`)
  }
}
