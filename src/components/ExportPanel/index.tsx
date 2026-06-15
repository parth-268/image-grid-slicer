import React, { useState, useCallback } from 'react'
import { useSlicerStore } from '@/store/slicerStore'
import { Button } from '@/components/ui/Button'
import type { ExportType, ExportFormat } from '@/types'

// ─── Meta ─────────────────────────────────────────────────────────────────────

const EXPORT_TYPES: { value: ExportType; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    value: 'zip',
    label: 'ZIP Archive',
    desc: 'All slices in one file',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    value: 'individual',
    label: 'Individual',
    desc: 'One by one download',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
      </svg>
    ),
  },
  {
    value: 'spritesheet',
    label: 'Sprite Sheet',
    desc: 'Combined horizontal strip',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12h.008v.008H13.5V12z M3.75 3.75h16.5a.75.75 0 01.75.75v15a.75.75 0 01-.75.75H3.75a.75.75 0 01-.75-.75v-15a.75.75 0 01.75-.75z" />
      </svg>
    ),
  },
]

const FORMATS: { value: ExportFormat; label: string; badge: string }[] = [
  { value: 'png',  label: 'PNG',  badge: 'lossless' },
  { value: 'jpeg', label: 'JPEG', badge: 'lossy'    },
  { value: 'webp', label: 'WebP', badge: 'modern'   },
]

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="text-[10px] font-mono text-obsidian-500 uppercase tracking-widest mb-2">
      {children}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExportPanel(): React.ReactElement {
  const { slices, exportOptions, setExportOptions, setError } = useSlicerStore()
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [done, setDone]           = useState(false)

  const handleExport = useCallback(async () => {
    if (slices.length === 0) {
      setError({ code: 'NO_SLICES', message: 'No slices to export. Process the image first.' })
      return
    }
    setExporting(true)
    setDone(false)
    setProgress(0)

    try {
      const { exportSlices } = await import('@/services/exportService')
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
      <div className="text-xs font-mono text-obsidian-400 uppercase tracking-widest">Export</div>

      {/* Export type */}
      <div>
        <SectionLabel>Output type</SectionLabel>
        <div className="space-y-1.5">
          {EXPORT_TYPES.map((et) => {
            const active = exportOptions.type === et.value
            return (
              <button
                key={et.value}
                onClick={() => setExportOptions({ type: et.value })}
                className={[
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left',
                  'transition-all duration-150',
                  active
                    ? 'border-acid/40 bg-acid/5 text-obsidian-100'
                    : 'border-obsidian-800 bg-obsidian-925/50 text-obsidian-400 hover:border-obsidian-700 hover:text-obsidian-200',
                ].join(' ')}
              >
                <span className={`flex-shrink-0 transition-colors ${active ? 'text-acid' : ''}`}>
                  {et.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-medium">{et.label}</div>
                  <div className="text-[10px] font-mono text-obsidian-600 mt-0.5">{et.desc}</div>
                </div>
                {/* Radio dot */}
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                  ${active ? 'border-acid bg-acid' : 'border-obsidian-700'}`}>
                  {active && <div className="w-1.5 h-1.5 rounded-full bg-obsidian-975" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Format */}
      <div>
        <SectionLabel>Format</SectionLabel>
        <div className="grid grid-cols-3 gap-1.5">
          {FORMATS.map((f) => {
            const active = exportOptions.format === f.value
            return (
              <button
                key={f.value}
                onClick={() => setExportOptions({ format: f.value })}
                className={[
                  'flex flex-col items-center py-2.5 px-1 rounded-xl border transition-all duration-150',
                  active
                    ? 'border-acid/40 bg-acid/8 text-acid'
                    : 'border-obsidian-800 bg-obsidian-925/50 text-obsidian-400 hover:border-obsidian-700 hover:text-obsidian-200',
                ].join(' ')}
              >
                <span className="text-xs font-mono font-bold">.{f.value}</span>
                <span className="text-[9px] font-mono text-obsidian-600 mt-0.5">{f.badge}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Quality */}
      {exportOptions.format !== 'png' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <SectionLabel>Quality</SectionLabel>
            <span className="text-xs font-mono text-acid font-semibold">
              {Math.round(exportOptions.quality * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.01}
            value={exportOptions.quality}
            aria-label="Quality"
            aria-valuetext={`${Math.round(exportOptions.quality * 100)}%`}
            onChange={(e) => setExportOptions({ quality: parseFloat(e.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-acid [&::-webkit-slider-thumb]:shadow-glow-acid-sm
              [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:hover:scale-125
              [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-acid
              [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
            style={{
              background: `linear-gradient(to right, #c6f135 ${exportOptions.quality * 100}%, #3a3b41 ${exportOptions.quality * 100}%)`,
            }}
          />
          <div className="flex justify-between text-[10px] font-mono text-obsidian-700 mt-1.5">
            <span>Smaller file</span>
            <span>Higher quality</span>
          </div>
        </div>
      )}

      {/* File prefix */}
      <div>
        <SectionLabel>File prefix</SectionLabel>
        <input
          type="text"
          value={exportOptions.prefix}
          onChange={(e) => setExportOptions({ prefix: e.target.value.replace(/[^a-zA-Z0-9-_]/g, '') })}
          placeholder="slice"
          className="w-full bg-obsidian-925 border border-obsidian-800 rounded-lg px-3 py-2
            text-xs font-mono text-obsidian-200 placeholder-obsidian-700
            focus:outline-none focus:border-acid/50 focus:bg-obsidian-900 transition-colors"
        />
        <div className="text-[10px] font-mono text-obsidian-700 mt-1.5">
          → {exportOptions.prefix || 'slice'}_r01_c01.{exportOptions.format}
        </div>
      </div>

      {/* Progress bar */}
      {exporting && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-mono text-obsidian-500">
            <span>Exporting…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 bg-obsidian-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-acid rounded-full transition-all duration-300 relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />
            </div>
          </div>
        </div>
      )}

      {/* Export button */}
      <Button
        variant="primary"
        size="lg"
        className={`w-full ${done ? '!bg-obsidian-800 !text-acid !shadow-none' : ''}`}
        loading={exporting}
        disabled={slices.length === 0}
        onClick={handleExport}
        icon={done ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        )}
      >
        {done
          ? 'Downloaded!'
          : exporting
            ? 'Exporting…'
            : `Export ${slices.length} slice${slices.length !== 1 ? 's' : ''}`}
      </Button>

      {!exporting && !done && slices.length > 0 && (
        <div className="text-[10px] text-center font-mono text-obsidian-700">
          {slices.length} slice{slices.length !== 1 ? 's' : ''} ready · {exportOptions.type}
        </div>
      )}
    </div>
  )
}
