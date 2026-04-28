import React, { useState, useCallback, useEffect, useRef } from 'react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useSlicerStore } from '@/store/slicerStore'
import { convertFile } from '@/services/imageProcessor'
import { formatBytes } from '@/utils'
import type { ExportFormat } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConvertEntry {
  id: string
  file: File
  previewUrl: string
  name: string
  sizeBytes: number
  mimeType: string
  status: 'pending' | 'converting' | 'done' | 'error'
  result?: { blob: Blob; url: string; sizeBytes: number }
  error?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FORMATS: { value: ExportFormat; label: string; description: string; lossy: boolean }[] = [
  { value: 'png',  label: 'PNG',  description: 'Lossless · transparency', lossy: false },
  { value: 'jpeg', label: 'JPEG', description: 'Lossy · smallest size',   lossy: true  },
  { value: 'webp', label: 'WebP', description: 'Lossy/lossless · modern', lossy: true  },
]

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileToEntry(file: File): ConvertEntry {
  return {
    id: crypto.randomUUID(),
    file,
    previewUrl: URL.createObjectURL(file),
    name: file.name,
    sizeBytes: file.size,
    mimeType: file.type,
    status: 'pending',
  }
}

function mimeLabel(mime: string): string {
  if (mime === 'image/jpeg') return 'JPEG'
  if (mime === 'image/png')  return 'PNG'
  if (mime === 'image/webp') return 'WebP'
  return mime
}

// ─── Status Overlay ───────────────────────────────────────────────────────────

function StatusOverlay({ entry }: { entry: ConvertEntry }): React.ReactElement | null {
  if (entry.status === 'converting') {
    return (
      <div className="absolute inset-0 bg-obsidian-950/70 flex items-center justify-center rounded-t-lg">
        <svg className="w-6 h-6 animate-spin text-acid" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    )
  }

  if (entry.status === 'done' && entry.result) {
    const savings = Math.round(((entry.sizeBytes - entry.result.sizeBytes) / entry.sizeBytes) * 100)
    return (
      <div className="absolute top-1.5 right-1.5">
        <span className="bg-acid/90 text-obsidian-950 text-xs font-mono font-bold px-1.5 py-0.5 rounded">
          {savings > 0 ? `−${savings}%` : savings < 0 ? `+${Math.abs(savings)}%` : '≈'}
        </span>
      </div>
    )
  }

  if (entry.status === 'error') {
    return (
      <div className="absolute inset-0 bg-red-950/70 flex items-center justify-center rounded-t-lg p-2">
        <span className="text-red-400 text-xs font-mono text-center leading-snug">
          {entry.error ?? 'Error'}
        </span>
      </div>
    )
  }

  return null
}

// ─── File Card ────────────────────────────────────────────────────────────────

function FileCard({
  entry,
  targetFormat,
  onRemove,
  onDownload,
}: {
  entry: ConvertEntry
  targetFormat: ExportFormat
  onRemove: (id: string) => void
  onDownload: (id: string) => void
}): React.ReactElement {
  const isDone = entry.status === 'done' && !!entry.result
  const isConverting = entry.status === 'converting'

  return (
    <div
      className={`
        relative rounded-lg border overflow-hidden bg-obsidian-900 transition-all
        ${entry.status === 'done' ? 'border-acid/30' : entry.status === 'error' ? 'border-red-500/30' : 'border-obsidian-700'}
      `}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square bg-obsidian-950">
        <img
          src={entry.previewUrl}
          alt={entry.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
        <StatusOverlay entry={entry} />

        {!isConverting && (
          <button
            onClick={() => onRemove(entry.id)}
            className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-obsidian-950/80 border border-obsidian-700
              flex items-center justify-center opacity-0 group-hover:opacity-100 text-obsidian-400
              hover:text-red-400 hover:border-red-500/40 transition-all"
            title="Remove"
          >
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-2 space-y-1">
        <p className="text-xs font-mono text-obsidian-200 truncate leading-tight" title={entry.name}>
          {entry.name}
        </p>
        <div className="flex items-center gap-1 text-xs font-mono text-obsidian-500">
          <span className="bg-obsidian-800 border border-obsidian-700 rounded px-1 text-obsidian-400 text-[10px]">
            {mimeLabel(entry.mimeType)}
          </span>
          <span className="text-[10px]">{formatBytes(entry.sizeBytes)}</span>
        </div>

        {isDone && entry.result && (
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[10px] font-mono text-acid">{formatBytes(entry.result.sizeBytes)}</span>
            <button
              onClick={() => onDownload(entry.id)}
              className="text-[10px] font-mono text-obsidian-400 hover:text-acid transition-colors flex items-center gap-0.5"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              .{targetFormat}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────

function DropZone({ onFiles }: { onFiles: (files: File[]) => void }): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const files = Array.from(e.dataTransfer.files).filter((f) => ACCEPTED_TYPES.includes(f.type))
      if (files.length) onFiles(files)
    },
    [onFiles]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []).filter((f) => ACCEPTED_TYPES.includes(f.type))
      if (files.length) onFiles(files)
      e.target.value = ''
    },
    [onFiles]
  )

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed
        p-8 cursor-pointer transition-all select-none
        ${dragging ? 'border-acid/60 bg-acid/5' : 'border-obsidian-700 hover:border-obsidian-500 hover:bg-obsidian-900/30'}
      `}
    >
      <svg
        className={`w-8 h-8 ${dragging ? 'text-acid' : 'text-obsidian-600'}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
      <div className="text-center">
        <p className="text-sm font-mono text-obsidian-300">Drop images or click to browse</p>
        <p className="text-xs font-mono text-obsidian-500 mt-0.5">PNG · JPEG · WebP — any number of files</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function ConvertSidebar({
  entries,
  targetFormat,
  quality,
  converting,
  progress,
  onFormatChange,
  onQualityChange,
  onAddFiles,
  onConvertAll,
  onDownloadZip,
  onClearAll,
}: {
  entries: ConvertEntry[]
  targetFormat: ExportFormat
  quality: number
  converting: boolean
  progress: number
  onFormatChange: (f: ExportFormat) => void
  onQualityChange: (q: number) => void
  onAddFiles: (files: File[]) => void
  onConvertAll: () => void
  onDownloadZip: () => void
  onClearAll: () => void
}): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedMeta = FORMATS.find((f) => f.value === targetFormat)!
  const doneCount = entries.filter((e) => e.status === 'done').length
  const pendingCount = entries.filter((e) => e.status === 'pending').length
  const total = entries.length

  const handleAddChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []).filter((f) => ACCEPTED_TYPES.includes(f.type))
      if (files.length) onAddFiles(files)
      e.target.value = ''
    },
    [onAddFiles]
  )

  return (
    <aside className="w-72 flex-shrink-0 flex flex-col border-r border-obsidian-800 bg-obsidian-950/60">
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div>
          <div className="text-xs font-mono text-obsidian-400 uppercase tracking-widest mb-1">
            Bulk Convert
          </div>
          <p className="text-xs text-obsidian-500 leading-relaxed">
            Upload any number of images and convert them all to a single format at once.
          </p>
        </div>

        {/* Format selector */}
        <div className="space-y-2">
          <div className="text-xs font-mono text-obsidian-400 uppercase tracking-widest">
            Target Format
          </div>
          {FORMATS.map((f) => {
            const isActive = targetFormat === f.value
            return (
              <button
                key={f.value}
                onClick={() => onFormatChange(f.value)}
                disabled={converting}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left
                  transition-all disabled:opacity-50
                  ${isActive
                    ? 'border-acid/50 bg-acid/5 text-obsidian-100'
                    : 'border-obsidian-700 bg-obsidian-800/40 text-obsidian-400 hover:border-obsidian-500 hover:text-obsidian-200'}
                `}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-mono font-bold ${isActive ? 'text-acid' : ''}`}>
                    .{f.value}
                  </span>
                  <span className="text-xs text-obsidian-500">{f.description}</span>
                </div>
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${isActive ? 'border-acid bg-acid' : 'border-obsidian-600'}`}
                />
              </button>
            )
          })}
        </div>

        {/* Quality */}
        {selectedMeta.lossy && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-obsidian-400 uppercase tracking-widest">Quality</span>
              <span className="text-xs font-mono text-acid">{Math.round(quality * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.1} max={1} step={0.01}
              value={quality}
              disabled={converting}
              onChange={(e) => onQualityChange(parseFloat(e.target.value))}
              className="w-full accent-acid disabled:opacity-50"
            />
            <div className="flex justify-between text-xs font-mono text-obsidian-600">
              <span>Smaller</span>
              <span>Higher quality</span>
            </div>
          </div>
        )}

        {/* Stats */}
        {total > 0 && (
          <div className="rounded-lg border border-obsidian-800 bg-obsidian-900/50 p-3 space-y-1.5">
            {[
              { label: 'Total files', value: total, color: 'text-obsidian-200' },
              { label: 'Converted',   value: doneCount, color: 'text-acid' },
              { label: 'Pending',     value: pendingCount, color: 'text-obsidian-400' },
              { label: 'Errors',      value: entries.filter((e) => e.status === 'error').length, color: 'text-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between text-xs font-mono">
                <span className="text-obsidian-500">{label}</span>
                <span className={color}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="p-4 border-t border-obsidian-800 space-y-2">
        {converting && (
          <div className="space-y-1.5 mb-1">
            <div className="flex justify-between text-xs font-mono text-obsidian-500">
              <span>Converting…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-obsidian-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-acid rounded-full transition-all duration-300 shadow-[0_0_6px_rgba(198,241,53,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {total > 0 && !converting && (
          <>
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg
                border border-obsidian-700 bg-obsidian-800/40 text-obsidian-300 font-mono text-xs
                hover:border-obsidian-500 hover:text-obsidian-100 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add more files
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={handleAddChange}
            />
          </>
        )}

        {total > 0 && pendingCount > 0 && (
          <button
            onClick={onConvertAll}
            disabled={converting}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-mono text-sm font-medium
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Convert {pendingCount > 1 ? `${pendingCount} Files` : 'File'}
              </>
            )}
          </button>
        )}

        {doneCount > 0 && !converting && (
          <button
            onClick={onDownloadZip}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-mono text-sm font-medium
              border border-acid/40 bg-acid/10 text-acid
              hover:bg-acid/20 active:scale-[0.98] transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {doneCount === 1 ? `Download .${targetFormat}` : `Download ZIP (${doneCount})`}
          </button>
        )}

        {total > 0 && !converting && (
          <button
            onClick={onClearAll}
            className="w-full text-center text-xs font-mono text-obsidian-600 hover:text-obsidian-400 transition-colors py-1"
          >
            Clear all
          </button>
        )}
      </div>
    </aside>
  )
}

// ─── Main Area ────────────────────────────────────────────────────────────────

function ConvertMain({
  entries,
  targetFormat,
  converting,
  onFiles,
  onRemove,
  onDownload,
}: {
  entries: ConvertEntry[]
  targetFormat: ExportFormat
  converting: boolean
  onFiles: (files: File[]) => void
  onRemove: (id: string) => void
  onDownload: (id: string) => void
}): React.ReactElement {
  return (
    <main className="flex-1 overflow-auto p-6 bg-obsidian-950">
      {entries.length === 0 ? (
        <div className="max-w-xl mx-auto mt-12">
          <DropZone onFiles={onFiles} />
        </div>
      ) : (
        <div className="space-y-4">
          {!converting && (
            <div className="max-w-xl">
              <DropZone onFiles={onFiles} />
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {entries.map((entry) => (
              <div key={entry.id} className="group">
                <FileCard
                  entry={entry}
                  targetFormat={targetFormat}
                  onRemove={onRemove}
                  onDownload={onDownload}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}

// ─── ConvertLayout ────────────────────────────────────────────────────────────

export function ConvertLayout(): React.ReactElement {
  const { imageFile } = useSlicerStore()
  const [entries, setEntries] = useState<ConvertEntry[]>([])
  const [targetFormat, setTargetFormat] = useState<ExportFormat>('webp')
  const [quality, setQuality] = useState(0.92)
  const [converting, setConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const seededIdRef = useRef<string | null>(null)

  // Seed from the store's imageFile on mount / imageFile change
  useEffect(() => {
    if (imageFile && seededIdRef.current !== imageFile.id) {
      seededIdRef.current = imageFile.id
      setEntries((prev) => {
        const alreadyIn = prev.some((e) => e.file === imageFile.file)
        if (alreadyIn) return prev
        return [fileToEntry(imageFile.file), ...prev]
      })
    }
  }, [imageFile])

  const addFiles = useCallback((files: File[]) => {
    setEntries((prev) => {
      const existing = new Set(prev.map((e) => e.file.name + e.file.size))
      const fresh = files.filter((f) => !existing.has(f.name + f.size)).map(fileToEntry)
      return [...prev, ...fresh]
    })
  }, [])

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const entry = prev.find((e) => e.id === id)
      if (entry) {
        URL.revokeObjectURL(entry.previewUrl)
        if (entry.result) URL.revokeObjectURL(entry.result.url)
      }
      return prev.filter((e) => e.id !== id)
    })
  }, [])

  const resetDoneEntries = useCallback(() => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.status === 'done' && e.result) {
          URL.revokeObjectURL(e.result.url)
          return { ...e, status: 'pending', result: undefined }
        }
        return e
      })
    )
  }, [])

  const handleFormatChange = useCallback(
    (f: ExportFormat) => { setTargetFormat(f); resetDoneEntries() },
    [resetDoneEntries]
  )

  const handleQualityChange = useCallback(
    (q: number) => { setQuality(q); resetDoneEntries() },
    [resetDoneEntries]
  )

  const convertAll = useCallback(async () => {
    const pending = entries.filter((e) => e.status === 'pending')
    if (pending.length === 0 || converting) return
    setConverting(true)
    setProgress(0)

    let done = 0
    for (const entry of pending) {
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, status: 'converting' } : e))
      )
      try {
        const blob = await convertFile(entry.file, targetFormat, quality)
        const url = URL.createObjectURL(blob)
        setEntries((prev) =>
          prev.map((e) =>
            e.id === entry.id
              ? { ...e, status: 'done', result: { blob, url, sizeBytes: blob.size } }
              : e
          )
        )
      } catch (err) {
        setEntries((prev) =>
          prev.map((e) =>
            e.id === entry.id
              ? { ...e, status: 'error', error: err instanceof Error ? err.message : 'Failed' }
              : e
          )
        )
      }
      done++
      setProgress(Math.round((done / pending.length) * 100))
    }

    setConverting(false)
  }, [entries, converting, targetFormat, quality])

  const downloadZip = useCallback(async () => {
    const done = entries.filter((e) => e.status === 'done' && e.result)
    if (done.length === 0) return

    if (done.length === 1 && done[0].result) {
      const baseName = done[0].name.replace(/\.[^.]+$/, '')
      saveAs(done[0].result.blob, `${baseName}.${targetFormat}`)
      return
    }

    const zip = new JSZip()
    for (const entry of done) {
      if (!entry.result) continue
      const baseName = entry.name.replace(/\.[^.]+$/, '')
      zip.file(`${baseName}.${targetFormat}`, entry.result.blob)
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, 'converted_images.zip')
  }, [entries, targetFormat])

  const downloadSingle = useCallback(
    (id: string) => {
      const entry = entries.find((e) => e.id === id)
      if (!entry?.result) return
      const baseName = entry.name.replace(/\.[^.]+$/, '')
      saveAs(entry.result.blob, `${baseName}.${targetFormat}`)
    },
    [entries, targetFormat]
  )

  const clearAll = useCallback(() => {
    setEntries((prev) => {
      prev.forEach((e) => {
        URL.revokeObjectURL(e.previewUrl)
        if (e.result) URL.revokeObjectURL(e.result.url)
      })
      return []
    })
  }, [])

  return (
    <div className="flex flex-1 overflow-hidden">
      <ConvertSidebar
        entries={entries}
        targetFormat={targetFormat}
        quality={quality}
        converting={converting}
        progress={progress}
        onFormatChange={handleFormatChange}
        onQualityChange={handleQualityChange}
        onAddFiles={addFiles}
        onConvertAll={convertAll}
        onDownloadZip={downloadZip}
        onClearAll={clearAll}
      />
      <ConvertMain
        entries={entries}
        targetFormat={targetFormat}
        converting={converting}
        onFiles={addFiles}
        onRemove={removeEntry}
        onDownload={downloadSingle}
      />
    </div>
  )
}
