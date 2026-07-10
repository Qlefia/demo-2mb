import { RadioGroup as HeadlessRadioGroup, Radio, Field, Label } from '@headlessui/react'

interface RadioOption {
  value: string
  label: string
  image?: string | null
}

interface RadioGroupProps {
  value: string
  onChange: (value: string) => void
  options: RadioOption[]
  disabled?: boolean
}

export function RadioGroup({ value, onChange, options, disabled }: RadioGroupProps) {
  return (
    <HeadlessRadioGroup value={value} onChange={onChange} disabled={disabled} className="flex flex-col gap-2">
      {options.map((option) => (
        <Field key={option.value} className="flex min-w-0 items-center gap-3">
          <Radio
            value={option.value}
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-input outline-none transition-colors focus:outline-none data-checked:border-primary data-disabled:cursor-not-allowed data-disabled:opacity-50"
          >
            <span className="h-2 w-2 rounded-full bg-primary opacity-0 transition-opacity [[data-checked]>&]:opacity-100" />
          </Radio>
          {option.image && !option.image.startsWith('blob:') && (
            <div className="survey-brand-surface flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden bg-primary/5">
              <img
                src={option.image}
                alt=""
                className="h-full w-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            </div>
          )}
          <Label className={`min-w-0 wrap-break-word text-sm ${disabled ? 'opacity-50' : ''}`}>{option.label}</Label>
        </Field>
      ))}
    </HeadlessRadioGroup>
  )
}
