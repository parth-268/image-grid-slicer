import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'acid' | 'coral' | 'sky'
}

const variantClasses = {
  default: 'bg-obsidian-700 text-obsidian-300',
  acid: 'bg-acid/10 text-acid border border-acid/20',
  coral: 'bg-coral/10 text-coral border border-coral/20',
  sky: 'bg-sky-slicer/10 text-sky-slicer border border-sky-slicer/20',
}

export function Badge({ children, variant = 'default' }: BadgeProps): React.ReactElement {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium
        ${variantClasses[variant]}`}
    >
      {children}
    </span>
  )
}

interface StatCardProps {
  label: string
  value: string
  sub?: string
}

export function StatCard({ label, value, sub }: StatCardProps): React.ReactElement {
  return (
    <div className="bg-obsidian-800/50 border border-obsidian-700/50 rounded p-3">
      <div className="text-xs font-mono text-obsidian-500 uppercase tracking-widest mb-1">
        {label}
      </div>
      <div className="text-lg font-mono font-bold text-obsidian-100 leading-none">{value}</div>
      {sub && <div className="text-xs text-obsidian-500 mt-0.5">{sub}</div>}
    </div>
  )
}
