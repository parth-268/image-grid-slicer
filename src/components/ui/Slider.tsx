import React from 'react'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: SliderProps): React.ReactElement {
  const pct = ((value - min) / (max - min)) * 100
  const id = `slider-${label.toLowerCase().replace(/\s+/g, '-')}`

  const decrement = () => onChange(Math.max(min, value - step))
  const increment = () => onChange(Math.min(max, value + step))

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-mono text-obsidian-400 uppercase tracking-widest select-none">
          {label}
        </label>

        {/* Stepper */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={decrement}
            disabled={value <= min}
            aria-label={`Decrease ${label}`}
            className="w-5 h-5 flex items-center justify-center rounded border border-obsidian-700
              bg-obsidian-900 text-obsidian-400 text-xs font-mono
              hover:enabled:border-obsidian-500 hover:enabled:text-obsidian-100
              disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            −
          </button>
          <span
            className="w-10 text-center text-sm font-mono font-semibold text-acid tabular-nums"
            aria-live="polite"
            aria-label={`${label}: ${value}${unit}`}
          >
            {value}{unit}
          </span>
          <button
            type="button"
            onClick={increment}
            disabled={value >= max}
            aria-label={`Increase ${label}`}
            className="w-5 h-5 flex items-center justify-center rounded border border-obsidian-700
              bg-obsidian-900 text-obsidian-400 text-xs font-mono
              hover:enabled:border-obsidian-500 hover:enabled:text-obsidian-100
              disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            +
          </button>
        </div>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value}${unit}`}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-acid
          [&::-webkit-slider-thumb]:shadow-glow-acid-sm
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:transition-transform
          [&::-webkit-slider-thumb]:hover:scale-125
          [&::-moz-range-thumb]:w-4
          [&::-moz-range-thumb]:h-4
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-acid
          [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:cursor-pointer"
        style={{
          background: `linear-gradient(to right, #c6f135 ${pct}%, #3a3b41 ${pct}%)`,
        }}
      />
    </div>
  )
}
