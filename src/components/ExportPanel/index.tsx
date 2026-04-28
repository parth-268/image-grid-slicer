import React, { useState, useCallback } from 'react'
import { useSlicerStore } from '@/store/slicerStore'
import { exportSlices } from '@/services/exportService'
import { Button } from '@/components/ui/Button'
import type { ExportType, ExportFormat } from '@/types'

const EXPORT_TYPES: { value: ExportType; label: string; desc: string; icon: string }[] = [
  { value: 'zip', label: 'ZIP Archive', desc: 'All slices in a .zip', icon: '⬇' },
  { value: 'individual', label: 'Individual', desc: 'One by one download', icon: '⊡' },
  { value: 'spritesheet', label: 'Sprite Sheet', desc: 'Combined horizontal strip', icon: '⊞' },
]

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: 'png', label: 'PNG (lossless)' },
  { value: 'jpeg', label: 'JPEG (lossy)' },
  { value: 'webp', label: 'WebP (modern)' },
]

export function ExportPanel(): React.ReactElement {
  const { slices, exportOptions, setExportOptions, setError } = useSlicerStore()
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)

  const handleExport = useCallback(async () => {
    if (slices.length === 0) {
      setError({ code: 'NO_SLICES', message: 'No slices to export. Process the image first.' })
      return
    }

    setExporting(true)
    setDone(false)
    setProgress(0)

    try {
      await exportSlices(slices, exportOptions, setProgress)
      setDone(true)
      setTimeout(() => setDone(false), 3000)
    } catch (err) {
      setError({
        code: 'EXPORT_ERROR',
        message: err instanceof Error ? err.message : 'Export failed.',
      })
    } finally {
      setExporting(false)
    }
  }, [slices, exportOptions, setError])

  return (
    <div className="space-y-6">
      <div className="font-mono text-xs text-obsidian-400 uppercase tracking-widest">
        Export Options
      </div>

      {/* Export type */}
      <div className="space-y-2">
        <div className="text-xs font-mono text-obsidian-500 uppercase tracking-wider">Output Type</div>
        <div className="space-y-1.5">
          {EXPORT_TYPES.map((et) => (
            <button
              key={et.value}
              onClick={() => setExportOptions({ type: et.value })}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left
                transition-all duration-150
                ${exportOptions.type === et.value
                  ? 'border-acid/50 bg-acid/5 text-obsidian-100'
                  : 'border-obsidian-700 bg-obsidian-800/50 text-obsidian-400 hover:border-obsidian-600'
                }
              `}
            >
              <span className="text-lg flex-shrink-0">{et.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{et.label}</div>
                <div className="text-xs text-obsidian-500">{et.desc}</div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors
                  ${exportOptions.type === et.value ? 'border-acid bg-acid' : 'border-obsidian-600'}`}
              >
                {exportOptions.type === et.value && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-obsidian-950" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Format */}
      <div className="space-y-2">
        <div className="text-xs font-mono text-obsidian-500 uppercase tracking-wider">Format</div>
        <div className="grid grid-cols-3 gap-1.5">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              onClick={() => setExportOptions({ format: f.value })}
              className={`
                py-2 px-1 rounded text-xs font-mono font-medium transition-all
                ${exportOptions.format === f.value
                  ? 'bg-acid/10 text-acid border border-acid/30'
                  : 'bg-obsidian-800 text-obsidian-400 border border-obsidian-700 hover:border-obsidian-600'
                }
              `}
            >
              .{f.value}
            </button>
          ))}
        </div>
      </div>

      {/* Quality (for lossy formats) */}
      {exportOptions.format !== 'png' && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="text-xs font-mono text-obsidian-500 uppercase tracking-wider">Quality</div>
            <div className="text-xs font-mono text-acid">{Math.round(exportOptions.quality * 100)}%</div>
          </div>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.01}
            value={exportOptions.quality}
            onChange={(e) => setExportOptions({ quality: parseFloat(e.target.value) })}
            className="w-full accent-acid"
          />
        </div>
      )}

      {/* Prefix */}
      <div className="space-y-2">
        <div className="text-xs font-mono text-obsidian-500 uppercase tracking-wider">File Prefix</div>
        <input
          type="text"
          value={exportOptions.prefix}
          onChange={(e) =>
            setExportOptions({ prefix: e.target.value.replace(/[^a-zA-Z0-9-_]/g, '') })
          }
          placeholder="slice"
          className="w-full bg-obsidian-800 border border-obsidian-700 rounded px-3 py-2
            text-sm font-mono text-obsidian-200 placeholder-obsidian-600
            focus:outline-none focus:border-acid/50 transition-colors"
        />
        <div className="text-xs text-obsidian-600 font-mono">
          → {exportOptions.prefix}_r01_c01.{exportOptions.format}
        </div>
      </div>

      {/* Progress bar */}
      {exporting && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono text-obsidian-400">
            <span>Exporting…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-obsidian-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-acid rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Export button */}
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        loading={exporting}
        disabled={slices.length === 0}
        onClick={handleExport}
        icon={
          done ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )
        }
      >
        {done ? 'Downloaded!' : exporting ? 'Exporting…' : `Export ${slices.length} Slice${slices.length !== 1 ? 's' : ''}`}
      </Button>

      <div className="text-xs text-center text-obsidian-600 font-mono">
        {slices.length} slice{slices.length !== 1 ? 's' : ''} ready
      </div>
    </div>
  )
}
