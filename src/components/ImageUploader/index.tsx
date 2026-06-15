import React, { useCallback, useRef, useState } from 'react'
import { useImageLoader } from '@/hooks/useImageLoader'
import { useSlicerStore } from '@/store/slicerStore'
import { APP_INITIALS, APP_NAME, APP_TAGLINE } from '@/core/branding'
import { navigate } from '@/core/router/hashRouter'

// ─── Feature tags ─────────────────────────────────────────────────────────────

function Tag({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-obsidian-500
      border border-obsidian-800 bg-obsidian-925/60 rounded-full px-2.5 py-0.5 select-none">
      {children}
    </span>
  )
}

// ─── Slice card ───────────────────────────────────────────────────────────────

function SliceCard({
  isDragging,
  onClick,
  onDrop,
  onDragOver,
  onDragLeave,
  inputRef,
  onFileChange,
}: {
  isDragging: boolean
  onClick: () => void
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  inputRef: React.RefObject<HTMLInputElement>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}): React.ReactElement {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload image for slicing and cropping"
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={[
        'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed',
        'cursor-pointer group transition-all duration-300 py-10 px-6 text-center',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-acid/70',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian-975',
        isDragging
          ? 'border-acid bg-acid/5 shadow-glow-acid'
          : 'border-obsidian-800 bg-obsidian-925/40 hover:border-obsidian-600 hover:bg-obsidian-925/60',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        tabIndex={-1}
        onChange={onFileChange}
      />

      {/* Icon */}
      <div className={[
        'w-14 h-14 rounded-2xl flex items-center justify-center mb-5',
        'transition-all duration-300',
        isDragging
          ? 'bg-acid/20 scale-110'
          : 'bg-obsidian-900 border border-obsidian-800 group-hover:border-obsidian-700 group-hover:bg-obsidian-850',
      ].join(' ')}>
        <svg
          className={`w-7 h-7 transition-colors duration-300 ${isDragging ? 'text-acid' : 'text-obsidian-500 group-hover:text-obsidian-300'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
          />
        </svg>
      </div>

      <h2 className={`font-display text-lg font-bold mb-1.5 transition-colors duration-300
        ${isDragging ? 'text-acid' : 'text-obsidian-100 group-hover:text-white'}`}>
        {isDragging ? 'Drop to slice' : 'Slice & Crop'}
      </h2>
      <p className="text-xs font-mono text-obsidian-500 mb-5 leading-relaxed">
        Drop an image or click to browse
      </p>

      <div className="flex flex-wrap justify-center gap-1.5">
        <Tag>⊞ Grid split</Tag>
        <Tag>⬚ Custom crop</Tag>
        <Tag>⬇ ZIP export</Tag>
      </div>

      {/* Corner marks */}
      <span className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-obsidian-700 rounded-tl" />
      <span className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-obsidian-700 rounded-tr" />
      <span className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-obsidian-700 rounded-bl" />
      <span className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-obsidian-700 rounded-br" />
    </div>
  )
}

// ─── Convert card ─────────────────────────────────────────────────────────────

function ConvertCard({ onClick }: { onClick: () => void }): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'relative flex flex-col items-center justify-center rounded-2xl border-2',
        'border-obsidian-800 bg-obsidian-925/40 cursor-pointer group',
        'transition-all duration-300 py-10 px-6 text-center w-full',
        'hover:border-obsidian-600 hover:bg-obsidian-925/60',
        'active:scale-[0.99]',
      ].join(' ')}
    >
      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-obsidian-900 border border-obsidian-800
        flex items-center justify-center mb-5
        group-hover:border-acid/30 group-hover:bg-acid/5
        transition-all duration-300">
        <svg className="w-7 h-7 text-obsidian-500 group-hover:text-acid transition-colors duration-300"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
      </div>

      <h2 className="font-display text-lg font-bold text-obsidian-100 mb-1.5
        group-hover:text-acid transition-colors duration-300">
        Bulk Convert
      </h2>
      <p className="text-xs font-mono text-obsidian-500 mb-5 leading-relaxed">
        Convert many images at once
      </p>

      <div className="flex flex-wrap justify-center gap-1.5">
        <Tag>PNG → WebP</Tag>
        <Tag>JPEG → PNG</Tag>
        <Tag>Any → Any</Tag>
      </div>

      {/* Corner marks */}
      <span className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-obsidian-700 group-hover:border-acid/30 rounded-tl transition-colors" />
      <span className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-obsidian-700 group-hover:border-acid/30 rounded-tr transition-colors" />
      <span className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-obsidian-700 group-hover:border-acid/30 rounded-bl transition-colors" />
      <span className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-obsidian-700 group-hover:border-acid/30 rounded-br transition-colors" />
    </button>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

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
    <div className="relative flex flex-col items-center justify-center min-h-[100dvh]
      bg-obsidian-975 overflow-hidden px-4 py-10 sm:py-12
      safe-area-x safe-area-top safe-area-bottom">

      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-100 pointer-events-none" />
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, #0d0e11 100%)',
        }}
      />
      {/* Acid glow bloom */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px]
        bg-acid/5 blur-[100px] pointer-events-none rounded-full" />

      {/* Wordmark */}
      <div className="relative text-center mb-10 sm:mb-14 animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-10 h-10 bg-acid rounded-xl flex items-center justify-center shadow-glow-acid flex-shrink-0">
            <span className="text-obsidian-975 text-sm font-bold font-mono">{APP_INITIALS}</span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
            {APP_NAME}
          </h1>
        </div>
        <p className="text-xs font-mono text-obsidian-500 tracking-[0.2em] uppercase">
          {APP_TAGLINE}
        </p>
      </div>

      {/* Cards */}
      <div className="relative w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 animate-enter-up">
        <SliceCard
          isDragging={isDragging}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          inputRef={inputRef}
          onFileChange={(e) => handleFiles(e.target.files)}
        />
        <ConvertCard onClick={handleBulkConvert} />
      </div>

      {/* Footer */}
      <div className="relative mt-10 flex items-center gap-2 text-[11px] font-mono text-obsidian-700 select-none animate-fade-in">
        <span>JPG</span>
        <span className="text-obsidian-800">·</span>
        <span>PNG</span>
        <span className="text-obsidian-800">·</span>
        <span>WebP</span>
        <span className="mx-2 text-obsidian-800">|</span>
        <svg className="w-3 h-3 text-obsidian-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>100% in-browser · zero uploads</span>
      </div>
    </div>
  )
}
