import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'acid' | 'coral' | 'sky'
}

const variantClasses = {
  default: 'bg-obsidian-800 text-obsidian-300 border-obsidian-700',
  acid:    'bg-acid/10 text-acid border-acid/25',
  coral:   'bg-coral/10 text-coral border-coral/25',
  sky:     'bg-sky-slicer/10 text-sky-slicer border-sky-slicer/25',
}

export function Badge({ children, variant = 'default' }: BadgeProps): React.ReactElement {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${variantClasses[variant]}`}
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
    <div className="rounded-xl border border-obsidian-800 bg-obsidian-925/60 p-3">
      <div className="text-[10px] font-mono text-obsidian-500 uppercase tracking-widest mb-1.5">
        {label}
      </div>
      <div className="text-lg font-mono font-bold text-obsidian-100 leading-none">{value}</div>
      {sub && <div className="text-[10px] font-mono text-obsidian-600 mt-1">{sub}</div>}
    </div>
  )
}
