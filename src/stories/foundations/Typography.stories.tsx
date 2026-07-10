import type { ElementType } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs'

function TypographyRow({
  element,
  className,
  label,
  specs,
}: {
  element: string
  className: string
  label: string
  specs: string
}) {
  const Tag = element as ElementType
  return (
    <div className="flex flex-col gap-1 border-b border-border pb-4">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span className="text-xs text-muted">{specs}</span>
      </div>
      <Tag className={className}>The quick brown fox jumps over the lazy dog</Tag>
    </div>
  )
}

function TypographyPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <section>
        <h2 className="mb-1 text-lg font-semibold">Font Family</h2>
        <p className="mb-4 text-sm text-muted">
          Inter (variable weight) -- loaded from Google Fonts.
        </p>
        <p className="text-base">
          ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
        </p>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Headings</h2>
        <p className="mb-6 text-sm text-muted">
          Strict hierarchy: one H1 per page, descending H2-H6. Font weights: 600-700 for headings.
        </p>

        <div className="flex flex-col gap-4">
          <TypographyRow
            element="h1"
            className="text-4xl font-bold tracking-tight"
            label="H1 -- Page Title"
            specs="text-4xl / 700 / tracking-tight"
          />
          <TypographyRow
            element="h2"
            className="text-2xl font-semibold tracking-tight"
            label="H2 -- Section Title"
            specs="text-2xl / 600 / tracking-tight"
          />
          <TypographyRow
            element="h3"
            className="text-xl font-semibold"
            label="H3 -- Subsection"
            specs="text-xl / 600"
          />
          <TypographyRow
            element="h4"
            className="text-lg font-medium"
            label="H4 -- Group Header"
            specs="text-lg / 500"
          />
          <TypographyRow
            element="h5"
            className="text-base font-medium"
            label="H5"
            specs="text-base / 500"
          />
          <TypographyRow
            element="h6"
            className="text-sm font-medium"
            label="H6"
            specs="text-sm / 500"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Body Text</h2>
        <p className="mb-6 text-sm text-muted">Regular body text, small text, and captions.</p>

        <div className="flex flex-col gap-4">
          <TypographyRow
            element="p"
            className="text-base"
            label="Body -- Default"
            specs="text-base / 400"
          />
          <TypographyRow
            element="p"
            className="text-sm"
            label="Body -- Small"
            specs="text-sm / 400"
          />
          <TypographyRow
            element="p"
            className="text-xs text-muted"
            label="Caption"
            specs="text-xs / 400 / muted"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Font Weights</h2>
        <p className="mb-6 text-sm text-muted">
          Allowed weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold -- headings only).
        </p>

        <div className="flex flex-col gap-3">
          <p className="text-base font-normal">Regular (400) -- body text, descriptions</p>
          <p className="text-base font-medium">Medium (500) -- labels, subtle emphasis</p>
          <p className="text-base font-semibold">Semibold (600) -- headings, key UI elements</p>
          <p className="text-base font-bold">Bold (700) -- primary page heading only</p>
        </div>
      </section>
    </div>
  )
}

const meta: Meta = {
  title: 'Foundations/Typography',
  parameters: { layout: 'padded' },
}

export default meta

type Story = StoryObj

export const TypeScale: Story = {
  render: () => <TypographyPage />,
}
