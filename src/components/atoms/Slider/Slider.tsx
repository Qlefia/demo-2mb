import type { ReactNode } from 'react'

interface SliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  discrete?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  className?: string
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 5,
  step = 1,
  discrete = false,
  leftIcon,
  rightIcon,
  className = '',
}: SliderProps) {
  const points = discrete
    ? Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => min + i * step)
    : []

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {leftIcon && <span className="shrink-0 text-2xl">{leftIcon}</span>}
      <div className="relative flex flex-1 items-center">
        {discrete && (
          <div className="pointer-events-none absolute inset-x-0 flex justify-between px-0">
            {points.map((p) => (
              <span
                key={p}
                className={`h-2.5 w-2.5 rounded-full ${p <= value ? 'bg-primary' : 'bg-border'}`}
              />
            ))}
          </div>
        )}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1 w-full cursor-pointer appearance-none bg-border accent-primary [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
        />
      </div>
      {rightIcon && <span className="shrink-0 text-2xl">{rightIcon}</span>}
    </div>
  )
}
