'use client'

import { TextArea } from '@/components/atoms'
import { Select } from '@/components/molecules'
import { StudioFieldHeader } from '@/features/studio-settings/components'
import type { PlaybookSections } from '@/lib/playbooks/schema'
import { PLAYBOOK_SECTION_ORDER } from '@/lib/playbooks/schema'

type PlaybookSectionsFieldsProps = {
  sections: PlaybookSections
  readOnly: boolean
  labelFor: (key: keyof PlaybookSections) => string
  hintFor: (key: keyof PlaybookSections) => string | null
  placeholderFor: (key: keyof PlaybookSections) => string
  onChange: (next: PlaybookSections) => void
}

const SECTION_KEYS = PLAYBOOK_SECTION_ORDER

export function PlaybookSectionsFields({
  sections,
  readOnly,
  labelFor,
  hintFor,
  placeholderFor,
  onChange,
}: PlaybookSectionsFieldsProps) {
  return (
    <div className="space-y-[var(--studio-stack-block-gap)]">
      {SECTION_KEYS.map((key) => {
        const hint = hintFor(key)
        return (
          <div key={key} className="studio-field-stack">
            <StudioFieldHeader htmlFor={`pb-${key}`} label={labelFor(key)} showAi={false} />
            {hint ? <p className="text-xs text-muted">{hint}</p> : null}
            <TextArea
              id={`pb-${key}`}
              value={sections[key] ?? ''}
              readOnly={readOnly}
              rows={
                key === 'voicemail' || key === 'nextStep'
                  ? 4
                  : key === 'opening' || key === 'context' || key === 'valueProp'
                    ? 3
                    : 6
              }
              className={
                key === 'voicemail' || key === 'followUpEmail' ? 'font-mono text-sm' : undefined
              }
              onChange={(e) => onChange({ ...sections, [key]: e.target.value })}
              placeholder={placeholderFor(key)}
            />
          </div>
        )
      })}
    </div>
  )
}

export function PlaybookKindSelect({
  value,
  readOnly,
  label,
  options,
  onChange,
}: {
  value: string
  readOnly: boolean
  label: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div className="studio-field-stack">
      <StudioFieldHeader label={label} showAi={false} />
      <Select
        value={value}
        disabled={readOnly}
        onChange={onChange}
        options={options}
        aria-label={label}
      />
    </div>
  )
}
