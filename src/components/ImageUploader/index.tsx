import React, { useCallback, useRef, useState } from 'react'
import { useImageLoader } from '@/hooks/useImageLoader'
import { useSlicerStore } from '@/store/slicerStore'
import { APP_INITIALS, APP_NAME, APP_TAGLINE } from '@/core/branding'
import { navigate } from '@/core/router/hashRouter'

export function ImageUploader(): React.ReactElement {
  const { loadImage } = useImageLoader()
  const { enterBulkConvert } = useSlicerStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      loadImage(files[0])
    },
    [loadImage]
  )

  const handleBulkConvert = useCallback(() => {
    navigate('/converter')
    enterBulkConvert()
  }, [enterBulkConvert])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-obsidian-950 p-4 sm:p-8 safe-area-x safe-area-top safe-area-bottom">
      {/* Wordmark */}
      <div className="text-center mb-6 sm:mb-10 animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-8 h-8 bg-acid rounded flex items-center justify-center">
            <span className="text-obsidian-950 text-xs font-bold">{APP_INITIALS}</span>
          </div>
          <span className="font-display text-2xl font-bold text-obsidian-100 tracking-tight">
            {APP_NAME}
          </span>
        </div>
        <p className="text-sm font-mono text-obsidian-500 tracking-wider">
          {APP_TAGLINE}
        </p>
      </div>

      {/* Two-path layout */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── Path 1: Single image slice/crop ── */}
        <div
          className={`
            relative rounded-2xl border-2 border-dashed cursor-pointer group transition-all duration-300
            ${
              isDragging
                ? 'border-acid bg-acid/5 shadow-[0_0_60px_rgba(198,241,53,0.15)]'
                : 'border-obsidian-700 bg-obsidian-900/50 hover:border-obsidian-500 hover:bg-obsidian-900'
            }
          `}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
            <div
              className={`
                w-16 h-16 rounded-xl flex items-center justify-center mb-5
                transition-all duration-300
                ${isDragging ? 'bg-acid/20 scale-110' : 'bg-obsidian-800 group-hover:bg-obsidian-700'}
              `}
            >
              <svg
                className={`w-8 h-8 transition-colors ${isDragging ? 'text-acid' : 'text-obsidian-400 group-hover:text-obsidian-200'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>

            <h2 className="font-display text-lg font-bold text-obsidian-100 mb-1">
              {isDragging ? 'Drop it here' : 'Slice & Crop'}
            </h2>
            <p className="text-xs text-obsidian-400 mb-5 font-mono">
              Drop a single image or click to browse
            </p>

            <div className="flex flex-wrap justify-center gap-2">
              {['⊞ Grid split', '⬚ Custom crop', '⬇ ZIP export'].map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-mono text-obsidian-500 border border-obsidian-700 rounded px-2 py-0.5"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Corner accents */}
          <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-obsidian-600 rounded-tl-lg" />
          <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-obsidian-600 rounded-tr-lg" />
          <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-obsidian-600 rounded-bl-lg" />
          <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-obsidian-600 rounded-br-lg" />
        </div>

        {/* ── Path 2: Bulk convert ── */}
        <button
          onClick={handleBulkConvert}
          className="relative rounded-2xl border-2 border-obsidian-700 bg-obsidian-900/50
            hover:border-acid/40 hover:bg-obsidian-900 cursor-pointer group transition-all duration-300
            text-left"
        >
          <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
            <div className="w-16 h-16 rounded-xl bg-obsidian-800 group-hover:bg-acid/10 flex items-center justify-center mb-5 transition-all duration-300">
              <svg
                className="w-8 h-8 text-obsidian-400 group-hover:text-acid transition-colors duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>

            <h2 className="font-display text-lg font-bold text-obsidian-100 mb-1 group-hover:text-acid transition-colors duration-300">
              Bulk Convert
            </h2>
            <p className="text-xs text-obsidian-400 mb-5 font-mono">
              Convert many images to one format at once
            </p>

            <div className="flex flex-wrap justify-center gap-2">
              {['PNG → WebP', 'JPEG → PNG', 'Any → Any'].map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-mono text-obsidian-500 border border-obsidian-700 group-hover:border-acid/20 rounded px-2 py-0.5 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Corner accents */}
          <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-obsidian-600 group-hover:border-acid/30 rounded-tl-lg transition-colors" />
          <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-obsidian-600 group-hover:border-acid/30 rounded-tr-lg transition-colors" />
          <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-obsidian-600 group-hover:border-acid/30 rounded-bl-lg transition-colors" />
          <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-obsidian-600 group-hover:border-acid/30 rounded-br-lg transition-colors" />
        </button>
      </div>

      {/* Supported formats */}
      <p className="mt-8 text-xs font-mono text-obsidian-600">
        JPG · PNG · WebP &nbsp;·&nbsp; All processing happens in your browser
      </p>
    </div>
  )
}
