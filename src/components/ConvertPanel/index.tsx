import React, { useState, useCallback } from 'react'
import { saveAs } from 'file-saver'
import { useSlicerStore } from '@/store/slicerStore'
import { convertImageFormat } from '@/services/imageProcessor'
import { formatBytes } from '@/utils'
import type { ExportFormat } from '@/types'

const FORMATS: { value: ExportFormat; label: string; description: string; lossy: boolean }[] = [
  { value: 'png',  label: 'PNG',  description: 'Lossless · transparency',  lossy: false },
  { value: 'jpeg', label: 'JPEG', description: 'Lossy · smallest size',    lossy: true  },
  { value: 'webp', label: 'WebP', description: 'Lossy/lossless · modern',  lossy: true  },
]

const FORMAT_MIME: Record<ExportFormat, string> = {
  png:  'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

function sourceLabelFrom(mime: string): string {
  if (mime === 'image/jpeg') return 'JPEG'
  if (mime === 'image/png')  return 'PNG'
  if (mime === 'image/webp') return 'WebP'
  return mime
}

export function ConvertPanel(): React.ReactElement | null {
  const { imageFile } = useSlicerStore()

  const [targetFormat, setTargetFormat] = useState<ExportFormat>('webp')
  const [quality, setQuality] = useState(0.92)
  const [converting, setConverting] = useState(false)
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null)

  const sourceFormat = imageFile ? sourceLabelFrom(imageFile.mimeType) : ''
  const targetIsSource = imageFile?.mimeType === FORMAT_MIME[targetFormat]
  const selectedFormatMeta = FORMATS.find((f) => f.value === targetFormat)!

  const handleConvert = useCallback(async () => {
    if (!imageFile) return
    setConverting(true)
    if (result) {
      URL.revokeObjectURL(result.url)
      setResult(null)
    }

    try {
      const blob = await convertImageFormat(imageFile, targetFormat, quality)
      const url = URL.createObjectURL(blob)
      setResult({ blob, url })
    } finally {
      setConverting(false)
    }
  }, [imageFile, targetFormat, quality, result])

  const handleDownload = useCallback(() => {
    if (!result || !imageFile) return
    const baseName = imageFile.file.name.replace(/\.[^.]+$/, '')
    saveAs(result.blob, `${baseName}.${targetFormat}`)
  }, [result, imageFile, targetFormat])

  if (!imageFile) return null

  const savings =
    result && imageFile.sizeBytes > 0
      ? Math.round(((imageFile.sizeBytes - result.blob.size) / imageFile.sizeBytes) * 100)
      : null

  return (
    <div className="flex flex-col gap-6">
      {/* Source info */}
      <div className="rounded-lg border border-obsidian-700/60 bg-obsidian-800/40 p-4 space-y-2">
        <div className="text-xs font-mono text-obsidian-500 uppercase tracking-widest">Source</div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-mono text-obsidian-100">{imageFile.file.name}</span>
          <span className="text-xs font-mono text-obsidian-500 ml-2 flex-shrink-0">
            {imageFile.width} × {imageFile.height}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded border border-obsidian-600 bg-obsidian-700 text-xs font-mono text-obsidian-300">
            {sourceFormat}
          </span>
          <span className="text-xs font-mono text-obsidian-500">{formatBytes(imageFile.sizeBytes)}</span>
        </div>
      </div>

      {/* Target format */}
      <div className="space-y-3">
        <div className="text-xs font-mono text-obsidian-400 uppercase tracking-widest">Convert to</div>
        <div className="space-y-2">
          {FORMATS.map((f) => {
            const isActive = targetFormat === f.value
            const isSource = imageFile.mimeType === FORMAT_MIME[f.value]
            return (
              <button
                key={f.value}
                onClick={() => { setTargetFormat(f.value); setResult(null) }}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left
                  transition-all duration-150
                  ${isActive
                    ? 'border-acid/50 bg-acid/5 text-obsidian-100'
                    : 'border-obsidian-700 bg-obsidian-800/40 text-obsidian-400 hover:border-obsidian-500 hover:text-obsidian-200'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-mono font-bold ${isActive ? 'text-acid' : ''}`}>
                    .{f.value}
                  </span>
                  <span className="text-xs text-obsidian-500">{f.description}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isSource && (
                    <span className="text-xs font-mono text-obsidian-600 border border-obsidian-700 rounded px-1.5 py-0.5">
                      current
                    </span>
                  )}
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${isActive ? 'border-acid bg-acid' : 'border-obsidian-600'}`}>
                    {isActive && <div className="w-full h-full flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-obsidian-950" /></div>}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Quality slider for lossy formats */}
      {selectedFormatMeta.lossy && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-obsidian-400 uppercase tracking-widest">Quality</span>
            <span className="text-xs font-mono text-acid">{Math.round(quality * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.01}
            value={quality}
            onChange={(e) => { setQuality(parseFloat(e.target.value)); setResult(null) }}
            className="w-full accent-acid"
          />
          <div className="flex justify-between text-xs font-mono text-obsidian-600">
            <span>Smaller file</span>
            <span>Higher quality</span>
          </div>
        </div>
      )}

      {/* Same-format warning */}
      {targetIsSource && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <p className="text-xs font-mono text-amber-400">
            Source is already {sourceFormat} — converting will re-encode the file.
          </p>
        </div>
      )}

      {/* Convert button */}
      <button
        onClick={handleConvert}
        disabled={converting}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-mono text-sm font-medium
          bg-acid text-obsidian-950 hover:bg-acid/90 active:scale-[0.98]
          disabled:opacity-60 disabled:cursor-not-allowed transition-all"
      >
        {converting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Converting…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Convert to {targetFormat.toUpperCase()}
          </>
        )}
      </button>

      {/* Result */}
      {result && (
        <div className="rounded-lg border border-acid/25 bg-acid/5 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-obsidian-400 uppercase tracking-widest">Result</span>
            {savings !== null && (
              <span className={`text-xs font-mono font-bold ${savings > 0 ? 'text-acid' : savings < 0 ? 'text-red-400' : 'text-obsidian-400'}`}>
                {savings > 0 ? `−${savings}%` : savings < 0 ? `+${Math.abs(savings)}%` : 'same size'}
              </span>
            )}
          </div>

          {/* Side-by-side size comparison */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-md bg-obsidian-800/60 px-3 py-2">
              <div className="text-xs text-obsidian-500 mb-0.5">Before</div>
              <div className="text-sm font-mono font-bold text-obsidian-200">{formatBytes(imageFile.sizeBytes)}</div>
              <div className="text-xs font-mono text-obsidian-600">{sourceFormat}</div>
            </div>
            <div className="rounded-md bg-obsidian-800/60 px-3 py-2">
              <div className="text-xs text-obsidian-500 mb-0.5">After</div>
              <div className="text-sm font-mono font-bold text-acid">{formatBytes(result.blob.size)}</div>
              <div className="text-xs font-mono text-obsidian-600">{targetFormat.toUpperCase()}</div>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-md overflow-hidden bg-obsidian-900 border border-obsidian-700">
            <img
              src={result.url}
              alt="Converted preview"
              className="w-full object-contain max-h-48"
            />
          </div>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg
              border border-acid/40 bg-acid/10 text-acid font-mono text-sm font-medium
              hover:bg-acid/20 active:scale-[0.98] transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download .{targetFormat}
          </button>
        </div>
      )}
    </div>
  )
}
