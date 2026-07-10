import type { Meta, StoryObj } from '@storybook/nextjs'

const spacingScale = [
  { name: '1 (0.25rem)', value: '0.25rem', px: '4px' },
  { name: '2 (0.5rem)', value: '0.5rem', px: '8px' },
  { name: '3 (0.75rem)', value: '0.75rem', px: '12px' },
  { name: '4 (1rem)', value: '1rem', px: '16px' },
  { name: '6 (1.5rem)', value: '1.5rem', px: '24px' },
  { name: '8 (2rem)', value: '2rem', px: '32px' },
  { name: '12 (3rem)', value: '3rem', px: '48px' },
  { name: '16 (4rem)', value: '4rem', px: '64px' },
]

function SpacingBar({ name, value, px }: { name: string; value: string; px: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-28 shrink-0 text-xs text-muted">{name}</span>
      <div
        className="h-4 rounded-[1px] bg-primary"
        style={{ width: value }}
      />
      <span className="text-xs text-muted">{px}</span>
    </div>
  )
}

function SpacingPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <section>
        <h2 className="mb-1 text-lg font-semibold">Spacing Scale</h2>
        <p className="mb-6 text-sm text-muted">
          rem-based, consistent scale. Use Tailwind spacing utilities (p-1, m-2, gap-4, etc.).
        </p>

        <div className="flex flex-col gap-3">
          {spacingScale.map((s) => (
            <SpacingBar key={s.name} {...s} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Spacing Guidelines</h2>
        <div className="flex flex-col gap-2 text-sm">
          <p>-- Generous whitespace between sections (gap-8, gap-12).</p>
          <p>-- Consistent padding within cards and containers (p-4, p-6).</p>
          <p>-- Tight spacing for inline elements (gap-1, gap-2).</p>
          <p>-- Vertical rhythm: uniform gaps between blocks on a page.</p>
        </div>
      </section>
    </div>
  )
}

const meta: Meta = {
  title: 'Foundations/Spacing',
  parameters: { layout: 'padded' },
}

export default meta

type Story = StoryObj

export const Scale: Story = {
  render: () => <SpacingPage />,
}
