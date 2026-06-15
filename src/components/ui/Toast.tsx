import React, { useEffect } from 'react'
import { useSlicerStore } from '@/store/slicerStore'

export function Toast(): React.ReactElement | null {
  const { error, clearError } = useSlicerStore()

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(clearError, 5000)
    return () => clearTimeout(timer)
  }, [error, clearError])

  if (!error) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className="fixed top-4 right-4 z-50 animate-slide-up max-w-sm w-full sm:w-auto"
    >
      <div className="flex items-start gap-3 rounded-xl border border-coral/30 bg-obsidian-950/95
        px-4 py-3 backdrop-blur-md shadow-card-lg">
        {/* Icon */}
        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-coral/15 flex items-center justify-center mt-0.5">
          <svg className="w-3 h-3 text-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono text-coral/70 uppercase tracking-wider mb-0.5">
            {error.code}
          </p>
          <p className="text-xs text-obsidian-200 leading-relaxed">{error.message}</p>
        </div>

        <button
          onClick={clearError}
          aria-label="Dismiss error"
          className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center
            text-obsidian-600 hover:text-obsidian-200 hover:bg-obsidian-800 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
