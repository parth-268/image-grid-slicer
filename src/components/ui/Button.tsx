import React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-acid text-obsidian-975 font-semibold hover:bg-acid-light active:bg-acid-dark ' +
    'shadow-glow-acid hover:shadow-glow-acid-lg',
  secondary:
    'bg-obsidian-900 text-obsidian-200 border border-obsidian-700 ' +
    'hover:bg-obsidian-800 hover:border-obsidian-600 hover:text-obsidian-100',
  ghost:
    'bg-transparent text-obsidian-400 hover:bg-obsidian-900 hover:text-obsidian-100 ' +
    'border border-transparent hover:border-obsidian-700',
  danger:
    'bg-coral/10 text-coral border border-coral/30 hover:bg-coral/20 hover:border-coral/50',
}

const sizeClasses: Record<Size, string> = {
  xs: 'px-2.5 py-1 text-xs gap-1 rounded-md',
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-4 py-2 text-sm gap-2 rounded-lg',
  lg: 'px-5 py-2.5 text-sm gap-2 rounded-lg',
}

function Spinner(): React.ReactElement {
  return (
    <svg
      className="animate-spin h-3.5 w-3.5 flex-shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps): React.ReactElement {
  const isDisabled = disabled || loading

  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-body font-medium',
        'transition-all duration-150 cursor-pointer select-none',
        'active:scale-[0.97]',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
    >
      {loading ? <Spinner /> : icon ? <span className="flex-shrink-0">{icon}</span> : null}
      {children}
    </button>
  )
}
