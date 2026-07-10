import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { Check, ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
}

export function Select({ value, onChange, options, placeholder = 'Select...', disabled }: SelectProps) {
  const selected = options.find((o) => o.value === value)

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className="relative">
        <ListboxButton
          className="survey-brand-input flex h-10 w-full min-w-0 items-center justify-between gap-2 border border-input bg-transparent px-3 text-sm transition-colors outline-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className={`min-w-0 flex-1 truncate text-left ${selected ? '' : 'text-muted'}`}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown size={16} className="shrink-0 text-muted" aria-hidden />
        </ListboxButton>

        <ListboxOptions
          portal
          modal={false}
          anchor={{ to: 'bottom start', gap: 4 }}
          className="survey-brand-surface z-50 max-h-60 w-(--button-width) overflow-auto rounded-sm border border-border bg-background py-1 outline-none focus:outline-none"
        >
          {options.map((option) => (
            <ListboxOption
              key={option.value}
              value={option.value}
              className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm data-focus:bg-primary/5"
            >
              <span className="min-w-0 truncate">{option.label}</span>
              {value === option.value && <Check size={16} className="shrink-0" aria-hidden />}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  )
}
