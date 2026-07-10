import { Switch as HeadlessSwitch } from '@headlessui/react'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
}

export function Switch({ checked, onChange, disabled, label }: SwitchProps) {
  return (
    <div className="flex items-center gap-2">
      <HeadlessSwitch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-border bg-muted/40 outline-none transition-colors focus:outline-none data-checked:border-primary data-checked:bg-primary data-disabled:cursor-not-allowed data-disabled:opacity-50"
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full transition-[color,background-color,transform] ${
            checked ? 'translate-x-4 bg-primary-foreground' : 'translate-x-0.5 bg-background'
          }`}
        />
      </HeadlessSwitch>
      {label && (
        <span className={`text-sm ${disabled ? 'opacity-50' : ''}`}>{label}</span>
      )}
    </div>
  )
}
