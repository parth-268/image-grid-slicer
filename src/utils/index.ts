// ─── Format Helpers ───────────────────────────────────────────────────────────

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

export function formatDimensions(width: number, height: number): string {
  return `${width}×${height}`
}

// ─── ID Generator ─────────────────────────────────────────────────────────────

export function generateId(): string {
  return crypto.randomUUID()
}

// ─── Clamp ───────────────────────────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// ─── Canvas Position Calculator ───────────────────────────────────────────────

export interface CanvasPosition {
  x: number
  y: number
  scale: number
  offsetX: number
  offsetY: number
}

export function getCanvasPosition(
  canvas: HTMLCanvasElement,
  event: MouseEvent | Touch,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect()
  const scaleX = imageWidth / rect.width
  const scaleY = imageHeight / rect.height

  return {
    x: clamp((event.clientX - rect.left) * scaleX, 0, imageWidth),
    y: clamp((event.clientY - rect.top) * scaleY, 0, imageHeight),
  }
}
