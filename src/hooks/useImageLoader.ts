import { useCallback } from 'react'
import { useSlicerStore } from '@/store/slicerStore'
import type { ImageFile } from '@/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_SIZE_BYTES = 20 * 1024 * 1024 // 20MB

// ─── Helpers ─────────────────────────────────────────────────────────────────

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.has(file.type)) {
    return `File type "${file.type}" is not supported. Use JPG, PNG, or WebP.`
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds the 20MB limit.`
  }
  return null
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255)
}

function loadImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useImageLoader() {
  const { setImageFile, clearImage, setError, setStage, clearSlices, clearRegions } =
    useSlicerStore()

  const loadImage = useCallback(
    async (file: File): Promise<void> => {
      // Validate
      const validationError = validateFile(file)
      if (validationError) {
        setError({ code: 'INVALID_FILE', message: validationError })
        return
      }

      // Revoke previous object URLs
      clearImage()
      clearSlices()
      clearRegions()

      const url = URL.createObjectURL(file)

      try {
        const { width, height } = await loadImageDimensions(url)

        const imageFile: ImageFile = {
          id: crypto.randomUUID(),
          file: new File([file], sanitizeFileName(file.name), { type: file.type }),
          url,
          width,
          height,
          sizeBytes: file.size,
          mimeType: file.type as ImageFile['mimeType'],
        }

        setImageFile(imageFile)
        setStage('configure')
      } catch {
        URL.revokeObjectURL(url)
        setError({ code: 'LOAD_ERROR', message: 'Failed to load image. The file may be corrupt.' })
      }
    },
    [setImageFile, clearImage, setError, setStage, clearSlices, clearRegions]
  )

  return { loadImage }
}
