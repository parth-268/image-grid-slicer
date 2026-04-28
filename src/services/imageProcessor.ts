import type { GridCell, ImageFile, CustomRegion, ExportOptions, Slice } from '@/types'

// ─── Canvas Factory ───────────────────────────────────────────────────────────

function createOffscreenCanvas(width: number, height: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height)
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

// ─── Image Bitmap Loader ─────────────────────────────────────────────────────

async function loadImageBitmap(imageFile: ImageFile): Promise<ImageBitmap> {
  return createImageBitmap(imageFile.file, {
    premultiplyAlpha: 'none',
    colorSpaceConversion: 'none',
  })
}

// ─── Blob from Canvas ────────────────────────────────────────────────────────

async function canvasToBlob(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  format: ExportOptions['format'],
  quality: number
): Promise<Blob> {
  const mimeType = `image/${format}`

  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: mimeType, quality })
  }

  return new Promise<Blob>((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to convert canvas to blob'))
      },
      mimeType,
      quality
    )
  })
}

// ─── Single Cell Processor ────────────────────────────────────────────────────

async function processCell(
  bitmap: ImageBitmap,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  options: ExportOptions
): Promise<Blob> {
  const canvas = createOffscreenCanvas(sw, sh)
  const ctx = canvas.getContext('2d') as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D

  if (!ctx) throw new Error('Failed to get canvas context')

  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh)

  return canvasToBlob(canvas, options.format, options.quality)
}

// ─── Grid Slicing ────────────────────────────────────────────────────────────

export async function sliceImageGrid(
  imageFile: ImageFile,
  cells: GridCell[],
  options: ExportOptions,
  onProgress?: (progress: number) => void
): Promise<Slice[]> {
  const bitmap = await loadImageBitmap(imageFile)
  const slices: Slice[] = []

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]

    const blob = await processCell(bitmap, cell.x, cell.y, cell.width, cell.height, options)

    const url = URL.createObjectURL(blob)
    const label = `${options.prefix}_r${String(cell.row + 1).padStart(2, '0')}_c${String(cell.col + 1).padStart(2, '0')}`

    slices.push({
      id: crypto.randomUUID(),
      label,
      blob,
      url,
      width: cell.width,
      height: cell.height,
      sizeBytes: blob.size,
      row: cell.row,
      col: cell.col,
    })

    onProgress?.(Math.round(((i + 1) / cells.length) * 100))
  }

  bitmap.close()
  return slices
}

// ─── Custom Region Slicing ────────────────────────────────────────────────────

export async function sliceImageCustom(
  imageFile: ImageFile,
  regions: CustomRegion[],
  options: ExportOptions,
  onProgress?: (progress: number) => void
): Promise<Slice[]> {
  const bitmap = await loadImageBitmap(imageFile)
  const slices: Slice[] = []
  const { width: imgW, height: imgH } = imageFile

  for (let i = 0; i < regions.length; i++) {
    const region = regions[i]

    // Convert normalized coordinates to pixel coordinates
    const sx = Math.round(region.x * imgW)
    const sy = Math.round(region.y * imgH)
    const sw = Math.round(region.width * imgW)
    const sh = Math.round(region.height * imgH)

    // Guard against zero-size regions
    if (sw <= 0 || sh <= 0) continue

    const blob = await processCell(bitmap, sx, sy, sw, sh, options)
    const url = URL.createObjectURL(blob)

    slices.push({
      id: crypto.randomUUID(),
      label: region.label || `${options.prefix}_${i + 1}`,
      blob,
      url,
      width: sw,
      height: sh,
      sizeBytes: blob.size,
    })

    onProgress?.(Math.round(((i + 1) / regions.length) * 100))
  }

  bitmap.close()
  return slices
}

// ─── Format Conversion (raw File) ────────────────────────────────────────────

export async function convertFile(
  file: File,
  targetFormat: ExportOptions['format'],
  quality: number
): Promise<Blob> {
  const bitmap = await createImageBitmap(file, {
    premultiplyAlpha: 'none',
    colorSpaceConversion: 'none',
  })
  const canvas = createOffscreenCanvas(bitmap.width, bitmap.height)
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  if (!ctx) throw new Error('Failed to get canvas context')
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  return canvasToBlob(canvas, targetFormat, quality)
}

// ─── Format Conversion (ImageFile) ───────────────────────────────────────────

export async function convertImageFormat(
  imageFile: ImageFile,
  targetFormat: ExportOptions['format'],
  quality: number
): Promise<Blob> {
  const bitmap = await loadImageBitmap(imageFile)
  const canvas = createOffscreenCanvas(imageFile.width, imageFile.height)
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  if (!ctx) throw new Error('Failed to get canvas context')
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  return canvasToBlob(canvas, targetFormat, quality)
}

// ─── Sprite Sheet Generator ───────────────────────────────────────────────────

export async function generateSpriteSheet(slices: Slice[], options: ExportOptions): Promise<Blob> {
  if (slices.length === 0) throw new Error('No slices to combine')

  // Load all slice images
  const bitmaps = await Promise.all(
    slices.map((s) =>
      fetch(s.url)
        .then((r) => r.blob())
        .then((b) => createImageBitmap(b))
    )
  )

  // Calculate sprite sheet dimensions (horizontal strip)
  const totalWidth = slices.reduce((sum, s) => sum + s.width, 0)
  const maxHeight = Math.max(...slices.map((s) => s.height))

  const canvas = createOffscreenCanvas(totalWidth, maxHeight)
  const ctx = canvas.getContext('2d') as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D

  if (!ctx) throw new Error('Failed to get canvas context')

  let x = 0
  for (let i = 0; i < bitmaps.length; i++) {
    ctx.drawImage(bitmaps[i], x, 0)
    x += slices[i].width
    bitmaps[i].close()
  }

  return canvasToBlob(canvas, options.format, options.quality)
}
