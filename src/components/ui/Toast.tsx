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
    <div className="fixed top-4 right-4 z-50 animate-slide-up max-w-sm">
      <div className="bg-coral/10 border border-coral/40 rounded-lg p-4 backdrop-blur-sm shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="text-coral text-lg flex-shrink-0">✕</span>
          <div className="flex-1 min-w-0">
            <div className="font-mono text-xs text-coral/70 uppercase tracking-wider mb-0.5">
              Error · {error.code}
            </div>
            <div className="text-sm text-obsidian-200">{error.message}</div>
          </div>
          <button
            onClick={clearError}
            className="text-obsidian-500 hover:text-obsidian-200 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
