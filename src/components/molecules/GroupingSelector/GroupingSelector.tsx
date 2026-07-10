'use client'

interface GroupingSelectorProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  label?: string
}

export function GroupingSelector({ value, onChange, options, label }: GroupingSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm text-foreground">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 rounded-sm border border-border bg-transparent px-3 text-sm text-foreground outline-none transition-colors focus-visible:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
