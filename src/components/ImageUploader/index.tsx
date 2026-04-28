import React, { useCallback, useRef, useState } from 'react'
import { useImageLoader } from '@/hooks/useImageLoader'

export function ImageUploader(): React.ReactElement {
  const { loadImage } = useImageLoader()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      loadImage(files[0])
    },
    [loadImage]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-obsidian-950 p-8">
      {/* Header */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-8 bg-acid rounded flex items-center justify-center">
            <GridIcon />
          </div>
          <span className="font-display text-2xl font-bold text-obsidian-100 tracking-tight">
            Grid<span className="text-acid">Slicer</span>
          </span>
        </div>
        <p className="text-sm font-mono text-obsidian-500 tracking-wider">
          UPLOAD → CONFIGURE → EXPORT
        </p>
      </div>

      {/* Drop Zone */}
      <div
        className={`
          relative w-full max-w-2xl rounded-2xl border-2 border-dashed
          transition-all duration-300 cursor-pointer group
          ${
            isDragging
              ? 'border-acid bg-acid/5 shadow-[0_0_60px_rgba(198,241,53,0.15)]'
              : 'border-obsidian-700 bg-obsidian-900/50 hover:border-obsidian-500 hover:bg-obsidian-900'
          }
        `}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          {/* Icon */}
          <div
            className={`
              w-20 h-20 rounded-2xl flex items-center justify-center mb-6
              transition-all duration-300
              ${isDragging ? 'bg-acid/20 scale-110' : 'bg-obsidian-800 group-hover:bg-obsidian-700'}
            `}
          >
            <svg
              className={`w-10 h-10 transition-colors ${isDragging ? 'text-acid' : 'text-obsidian-400 group-hover:text-obsidian-200'}`}
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

          <h2 className="font-display text-xl text-obsidian-100 mb-2 font-bold">
            {isDragging ? 'Drop it here' : 'Drop your image'}
          </h2>
          <p className="text-sm text-obsidian-400 mb-6 font-body">or click to browse your files</p>

          <div className="flex items-center gap-6 text-xs font-mono text-obsidian-600">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-obsidian-600" />
              JPG · PNG · WebP
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-obsidian-600" />
              Up to 20 MB
            </span>
          </div>
        </div>

        {/* Corner accents */}
        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-obsidian-600 rounded-tl-lg" />
        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-obsidian-600 rounded-tr-lg" />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-obsidian-600 rounded-bl-lg" />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-obsidian-600 rounded-br-lg" />
      </div>

      {/* Features */}
      <div className="flex gap-8 mt-12 text-center">
        {[
          { icon: '⊞', label: 'Grid Mode', desc: 'Rows × Cols' },
          { icon: '⬚', label: 'Custom Crop', desc: 'Draw regions' },
          { icon: '⬇', label: 'Export ZIP', desc: 'All slices' },
        ].map((f) => (
          <div key={f.label} className="flex flex-col items-center gap-1">
            <span className="text-2xl">{f.icon}</span>
            <span className="text-xs font-mono text-obsidian-400">{f.label}</span>
            <span className="text-xs text-obsidian-600">{f.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function GridIcon(): React.ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1" fill="#18181c" />
      <rect x="9" y="1" width="6" height="6" rx="1" fill="#18181c" />
      <rect x="1" y="9" width="6" height="6" rx="1" fill="#18181c" />
      <rect x="9" y="9" width="6" height="6" rx="1" fill="#18181c" />
    </svg>
  )
}
